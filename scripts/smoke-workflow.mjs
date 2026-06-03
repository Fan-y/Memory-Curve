import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";
import { createEmptyCard, fsrs, Rating } from "ts-fsrs";

function loadDotEnv(path = ".env") {
  if (!existsSync(path)) {
    return;
  }

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalIndex = trimmed.indexOf("=");
    if (equalIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, equalIndex).trim();
    if (!key || key in process.env) {
      continue;
    }

    let value = trimmed.slice(equalIndex + 1).trim();
    const wrappedByDouble = value.startsWith('"') && value.endsWith('"');
    const wrappedBySingle = value.startsWith("'") && value.endsWith("'");
    if (wrappedByDouble || wrappedBySingle) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function dateKey(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function ensureSession(supabase) {
  const email = process.env.SMOKE_TEST_EMAIL;
  const password = process.env.SMOKE_TEST_PASSWORD;

  if (email && password) {
    const signInResult = await supabase.auth.signInWithPassword({ email, password });
    if (signInResult.error || !signInResult.data.user) {
      throw new Error(`Sign-in failed: ${signInResult.error?.message ?? "unknown error"}`);
    }

    return { user: signInResult.data.user, source: "configured" };
  }

  const nonce = randomUUID().replace(/-/g, "").slice(0, 12);
  const generatedEmail = `smoke${nonce}@gmail.com`;
  const generatedPassword = `Smk!${nonce}Aa1`;

  console.log("[INFO] No SMOKE_TEST_EMAIL configured, creating temporary account for smoke run.");

  const signUpResult = await supabase.auth.signUp({
    email: generatedEmail,
    password: generatedPassword,
    options: {
      data: {
        display_name: "Smoke Runner",
      },
    },
  });

  if (signUpResult.error) {
    const rawMessage = signUpResult.error.message;
    if (rawMessage.toLowerCase().includes("rate limit")) {
      throw new Error(
        `${rawMessage}. Configure SMOKE_TEST_EMAIL and SMOKE_TEST_PASSWORD in .env to reuse an existing account.`
      );
    }

    throw new Error(`Sign-up failed: ${rawMessage}`);
  }

  if (!signUpResult.data.session || !signUpResult.data.user) {
    throw new Error(
      "Sign-up succeeded but no session returned. Email confirmation may be required. Set SMOKE_TEST_EMAIL and SMOKE_TEST_PASSWORD in .env and rerun."
    );
  }

  return {
    user: signUpResult.data.user,
    source: "generated",
  };
}

async function run() {
  loadDotEnv();

  const supabaseUrl = requiredEnv("VITE_SUPABASE_URL");
  const supabaseKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    requiredEnv("VITE_SUPABASE_ANON_KEY");

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  let createdEntryId = null;

  try {
    const { user, source } = await ensureSession(supabase);
    console.log(`[PASS] Auth ready (${source}) for user ${user.id}`);

    const marker = Date.now().toString(36);
    const entryTitle = `Smoke Flow ${marker}`;
    const entryContent = `Workflow content ${marker}`;

    const entryResult = await supabase
      .from("entries")
      .insert({
        user_id: user.id,
        title: entryTitle,
        content_md: entryContent,
        source: "smoke-workflow",
      })
      .select("*")
      .single();

    if (entryResult.error || !entryResult.data) {
      throw new Error(`Create entry failed: ${entryResult.error?.message ?? "unknown error"}`);
    }

    const entry = entryResult.data;
    createdEntryId = entry.id;
    console.log(`[PASS] Step 1 create -> entry ${entry.id}`);

    const firstCard = createEmptyCard(new Date());

    const reviewResult = await supabase
      .from("reviews")
      .insert({
        entry_id: entry.id,
        user_id: user.id,
        state: Number(firstCard.state),
        scheduled_date: firstCard.due.toISOString(),
        stability: firstCard.stability,
        difficulty: firstCard.difficulty,
        elapsed_days: firstCard.elapsed_days,
        reps: firstCard.reps,
        lapses: firstCard.lapses,
        last_rating: null,
        completed_at: null,
        duration_ms: null,
      })
      .select("*")
      .single();

    if (reviewResult.error || !reviewResult.data) {
      throw new Error(`Create review failed: ${reviewResult.error?.message ?? "unknown error"}`);
    }

    const currentReview = reviewResult.data;

    const scheduler = fsrs();
    const baseCard = {
      ...createEmptyCard(new Date(currentReview.created_at)),
      due: new Date(currentReview.scheduled_date),
      stability: currentReview.stability ?? firstCard.stability,
      difficulty: currentReview.difficulty ?? firstCard.difficulty,
      elapsed_days: currentReview.elapsed_days ?? firstCard.elapsed_days,
      reps: currentReview.reps,
      lapses: currentReview.lapses,
      state: currentReview.state,
      last_review: currentReview.completed_at ? new Date(currentReview.completed_at) : undefined,
    };

    const now = new Date();
    const { card: nextCard } = scheduler.next(baseCard, now, Rating.Good);

    const completeResult = await supabase
      .from("reviews")
      .update({
        state: Number(nextCard.state),
        scheduled_date: nextCard.due.toISOString(),
        stability: nextCard.stability,
        difficulty: nextCard.difficulty,
        elapsed_days: nextCard.elapsed_days,
        reps: nextCard.reps,
        lapses: nextCard.lapses,
        last_rating: 3,
        duration_ms: 4200,
        completed_at: now.toISOString(),
      })
      .eq("id", currentReview.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (completeResult.error || !completeResult.data) {
      throw new Error(`Complete review failed: ${completeResult.error?.message ?? "unknown error"}`);
    }

    console.log(`[PASS] Step 2 dashboard rate -> review ${completeResult.data.id}`);

    const searchKeyword = marker.slice(-6);
    const searchResult = await supabase
      .from("entries")
      .select("*")
      .eq("user_id", user.id)
      .or(`title.ilike.%${searchKeyword}%,content_md.ilike.%${searchKeyword}%`);

    if (searchResult.error) {
      throw new Error(`Search entries failed: ${searchResult.error.message}`);
    }

    const searched = (searchResult.data ?? []).find((row) => row.id === entry.id);
    if (!searched) {
      throw new Error("Search step failed: created entry not found");
    }

    const editedTitle = `${entryTitle} Edited`;
    const editResult = await supabase
      .from("entries")
      .update({
        title: editedTitle,
        content_md: `${entryContent} updated`,
        source: `smoke-edit-${dateKey(now)}`,
      })
      .eq("id", entry.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (editResult.error || !editResult.data) {
      throw new Error(`Update entry failed: ${editResult.error?.message ?? "unknown error"}`);
    }

    if (editResult.data.title !== editedTitle) {
      throw new Error("Edit verification failed: title mismatch");
    }

    const deleteResult = await supabase
      .from("entries")
      .delete()
      .eq("id", entry.id)
      .eq("user_id", user.id);

    if (deleteResult.error) {
      throw new Error(`Delete entry failed: ${deleteResult.error.message}`);
    }

    const entryVerify = await supabase
      .from("entries")
      .select("id")
      .eq("id", entry.id)
      .eq("user_id", user.id);

    if (entryVerify.error) {
      throw new Error(`Delete verify failed: ${entryVerify.error.message}`);
    }

    if ((entryVerify.data ?? []).length > 0) {
      throw new Error("Delete verify failed: entry still exists");
    }

    const reviewVerify = await supabase
      .from("reviews")
      .select("id")
      .eq("entry_id", entry.id)
      .eq("user_id", user.id);

    if (reviewVerify.error) {
      throw new Error(`Cascade verify failed: ${reviewVerify.error.message}`);
    }

    if ((reviewVerify.data ?? []).length > 0) {
      throw new Error("Cascade verify failed: review rows still exist");
    }

    createdEntryId = null;
    console.log("[PASS] Step 3 history search/edit/delete -> success");
    console.log("[PASS] Workflow smoke test completed.");
  } finally {
    if (createdEntryId) {
      await supabase
        .from("entries")
        .delete()
        .eq("id", createdEntryId)
        .throwOnError();
    }

    await supabase.auth.signOut();
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[FAIL] ${message}`);
  process.exit(1);
});
