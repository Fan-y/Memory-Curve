import { apiFailure, apiSuccess, normalizeApiError, type ApiResult } from "./shared.ts";
import { getSupabaseClient } from "@/lib/supabase";
import type { Tables, TablesUpdate } from "@/types/database";

export type ProfileRow = Tables<"profiles">;
export type ProfileUpdate = Omit<TablesUpdate<"profiles">, "id">;

export async function getProfile(userId: string): Promise<ApiResult<ProfileRow>> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      return apiFailure(normalizeApiError(error));
    }

    return apiSuccess(data);
  } catch (error) {
    return apiFailure(normalizeApiError(error));
  }
}

export async function updateProfile(
  userId: string,
  patch: ProfileUpdate
): Promise<ApiResult<ProfileRow>> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", userId)
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
