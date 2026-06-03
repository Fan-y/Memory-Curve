import { getSupabaseClient } from "@/lib/supabase";
import { trackEvent } from "@/lib/api/analytics";
import { apiFailure, apiSuccess, normalizeApiError, type ApiResult } from "./shared.ts";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type ReviewRow = Tables<"reviews">;
export type ReviewInsert = TablesInsert<"reviews">;
export type ReviewUpdate = TablesUpdate<"reviews">;

export type ReviewStats = {
  total: number;
  dueToday: number;
  overdue: number;
  completed: number;
  totalDurationMs: number;
};

export async function createReview(input: ReviewInsert): Promise<ApiResult<ReviewRow>> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("reviews")
      .insert(input)
      .select("*")
      .single();

    if (error) {
      return apiFailure(normalizeApiError(error));
    }

    return apiSuccess(data);
  } catch (error) {
    return apiFailure(normalizeApiError(error));
  }
}

export async function getReview(reviewId: string, userId: string): Promise<ApiResult<ReviewRow>> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", reviewId)
      .eq("user_id", userId)
      .single();

    if (error) {
      return apiFailure(normalizeApiError(error));
    }

    return apiSuccess(data);
  } catch (error) {
    return apiFailure(normalizeApiError(error));
  }
}

export async function getPendingReviews(userId: string): Promise<ApiResult<ReviewRow[]>> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .is("completed_at", null)
      .lte("scheduled_date", new Date().toISOString())
      .order("scheduled_date", { ascending: true });

    if (error) {
      return apiFailure(normalizeApiError(error));
    }

    return apiSuccess(data ?? []);
  } catch (error) {
    return apiFailure(normalizeApiError(error));
  }
}

export async function getTodayReviews(userId: string): Promise<ApiResult<ReviewRow[]>> {
  try {
    const supabase = getSupabaseClient();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .is("completed_at", null)
      .lte("scheduled_date", endOfToday.toISOString())
      .order("scheduled_date", { ascending: true });

    if (error) {
      return apiFailure(normalizeApiError(error));
    }

    return apiSuccess(data ?? []);
  } catch (error) {
    return apiFailure(normalizeApiError(error));
  }
}

export async function getOverdueReviews(userId: string): Promise<ApiResult<ReviewRow[]>> {
  try {
    const supabase = getSupabaseClient();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .is("completed_at", null)
      .lt("scheduled_date", startOfToday.toISOString())
      .order("scheduled_date", { ascending: true });

    if (error) {
      return apiFailure(normalizeApiError(error));
    }

    return apiSuccess(data ?? []);
  } catch (error) {
    return apiFailure(normalizeApiError(error));
  }
}

export async function getReviewsByScheduledRange(
  userId: string,
  startIso: string,
  endIso: string
): Promise<ApiResult<ReviewRow[]>> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .gte("scheduled_date", startIso)
      .lte("scheduled_date", endIso)
      .order("scheduled_date", { ascending: true });

    if (error) {
      return apiFailure(normalizeApiError(error));
    }

    return apiSuccess(data ?? []);
  } catch (error) {
    return apiFailure(normalizeApiError(error));
  }
}

export async function getCompletedReviewsByRange(
  userId: string,
  startIso: string,
  endIso: string
): Promise<ApiResult<ReviewRow[]>> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .gte("completed_at", startIso)
      .lte("completed_at", endIso)
      .order("completed_at", { ascending: true });

    if (error) {
      return apiFailure(normalizeApiError(error));
    }

    return apiSuccess(data ?? []);
  } catch (error) {
    return apiFailure(normalizeApiError(error));
  }
}

export async function deleteReviewsByEntryId(entryId: string, userId: string): Promise<ApiResult<boolean>> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("entry_id", entryId)
      .eq("user_id", userId);

    if (error) {
      return apiFailure(normalizeApiError(error));
    }

    return apiSuccess(true);
  } catch (error) {
    return apiFailure(normalizeApiError(error));
  }
}

export async function completeReview(
  reviewId: string,
  userId: string,
  patch: Pick<
    ReviewUpdate,
    | "state"
    | "scheduled_date"
    | "stability"
    | "difficulty"
    | "elapsed_days"
    | "reps"
    | "lapses"
    | "last_rating"
    | "duration_ms"
    | "completed_at"
  >
): Promise<ApiResult<ReviewRow>> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("reviews")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", reviewId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      return apiFailure(normalizeApiError(error));
    }

    void trackEvent(userId, "first_review_complete", {
      review_id: reviewId,
      entry_id: data.entry_id,
      rating: patch.last_rating,
    });

    return apiSuccess(data);
  } catch (error) {
    return apiFailure(normalizeApiError(error));
  }
}

export async function getReviewStats(userId: string): Promise<ApiResult<ReviewStats>> {
  try {
    const supabase = getSupabaseClient();
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const [totalResult, dueTodayResult, overdueResult, completedResult, durationResult] = await Promise.all([
      supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", userId).is("completed_at", null).gte("scheduled_date", startOfToday.toISOString()).lte("scheduled_date", endOfToday.toISOString()),
      supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", userId).is("completed_at", null).lt("scheduled_date", startOfToday.toISOString()),
      supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", userId).not("completed_at", "is", null),
      supabase.from("reviews").select("duration_ms").eq("user_id", userId).not("duration_ms", "is", null),
    ]);

    const firstError = totalResult.error ?? dueTodayResult.error ?? overdueResult.error ?? completedResult.error ?? durationResult.error;
    if (firstError) return apiFailure(normalizeApiError(firstError));

    const totalDurationMs = (durationResult.data ?? []).reduce<number>((sum, item) => sum + (item.duration_ms ?? 0), 0);

    return apiSuccess({
      total: totalResult.count ?? 0,
      dueToday: dueTodayResult.count ?? 0,
      overdue: overdueResult.count ?? 0,
      completed: completedResult.count ?? 0,
      totalDurationMs,
    });
  } catch (error) {
    return apiFailure(normalizeApiError(error));
  }
}

export async function getReviewAggregates(userId: string): Promise<ApiResult<{ total: number; completed: number; totalDurationMs: number }>> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("reviews")
      .select("completed_at, duration_ms")
      .eq("user_id", userId);

    if (error) {
      return apiFailure(normalizeApiError(error));
    }

    const rows = data ?? [];
    const total = rows.length;
    let completed = 0;
    let totalDurationMs = 0;
    for (const row of rows) {
      if (row.completed_at) completed += 1;
      if (row.duration_ms) totalDurationMs += row.duration_ms;
    }

    return apiSuccess({ total, completed, totalDurationMs });
  } catch (error) {
    return apiFailure(normalizeApiError(error));
  }
}
