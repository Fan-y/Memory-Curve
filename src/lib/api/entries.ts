import { getSupabaseClient } from "@/lib/supabase";
import { apiFailure, apiSuccess, normalizeApiError, type ApiResult } from "./shared.ts";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type EntryRow = Tables<"entries">;
export type EntryInsert = TablesInsert<"entries">;
export type EntryUpdate = TablesUpdate<"entries">;

export async function createEntry(input: EntryInsert): Promise<ApiResult<EntryRow>> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("entries")
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

export async function getEntry(entryId: string, userId: string): Promise<ApiResult<EntryRow>> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .eq("id", entryId)
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

export async function getUserEntries(userId: string): Promise<ApiResult<EntryRow[]>> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return apiFailure(normalizeApiError(error));
    }

    return apiSuccess(data ?? []);
  } catch (error) {
    return apiFailure(normalizeApiError(error));
  }
}

export async function updateEntry(
  entryId: string,
  userId: string,
  input: EntryUpdate
): Promise<ApiResult<EntryRow>> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("entries")
      .update(input)
      .eq("id", entryId)
      .eq("user_id", userId)
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

export async function deleteEntry(entryId: string, userId: string): Promise<ApiResult<boolean>> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("entries")
      .delete()
      .eq("id", entryId)
      .eq("user_id", userId);

    if (error) {
      return apiFailure(normalizeApiError(error));
    }

    return apiSuccess(true);
  } catch (error) {
    return apiFailure(normalizeApiError(error));
  }
}

export async function searchEntries(
  userId: string,
  keyword: string
): Promise<ApiResult<EntryRow[]>> {
  try {
    const supabase = getSupabaseClient();
    const query = keyword.trim();

    if (!query) {
      return getUserEntries(userId);
    }

    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .eq("user_id", userId)
      .or(`title.ilike.%${query}%,content_md.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) {
      return apiFailure(normalizeApiError(error));
    }

    return apiSuccess(data ?? []);
  } catch (error) {
    return apiFailure(normalizeApiError(error));
  }
}
