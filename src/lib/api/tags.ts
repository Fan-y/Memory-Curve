import { apiFailure, apiSuccess, normalizeApiError, type ApiResult } from "./shared.ts";
import { getSupabaseClient } from "@/lib/supabase";
import type { Tables, TablesInsert } from "@/types/database";

export type TagRow = Tables<"tags">;
export type TagInsert = TablesInsert<"tags">;
export type EntryTagRow = Tables<"entry_tags">;

export async function createTag(input: TagInsert): Promise<ApiResult<TagRow>> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("tags")
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

export async function getUserTags(userId: string): Promise<ApiResult<TagRow[]>> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (error) {
      return apiFailure(normalizeApiError(error));
    }

    return apiSuccess(data ?? []);
  } catch (error) {
    return apiFailure(normalizeApiError(error));
  }
}

export async function deleteTag(tagId: string, userId: string): Promise<ApiResult<boolean>> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("tags")
      .delete()
      .eq("id", tagId)
      .eq("user_id", userId);

    if (error) {
      return apiFailure(normalizeApiError(error));
    }

    return apiSuccess(true);
  } catch (error) {
    return apiFailure(normalizeApiError(error));
  }
}

export async function setEntryTags(
  entryId: string,
  userId: string,
  tagIds: string[]
): Promise<ApiResult<EntryTagRow[]>> {
  try {
    const supabase = getSupabaseClient();

    if (tagIds.length > 0) {
      const { data: ownTags, error: ownTagsError } = await supabase
        .from("tags")
        .select("id")
        .eq("user_id", userId)
        .in("id", tagIds);

      if (ownTagsError) {
        return apiFailure(normalizeApiError(ownTagsError));
      }

      const ownTagSet = new Set((ownTags ?? []).map((item) => item.id));
      const hasForeignTag = tagIds.some((tagId) => !ownTagSet.has(tagId));

      if (hasForeignTag) {
        return apiFailure("存在不属于当前用户的标签，无法绑定。");
      }
    }

    const { error: deleteError } = await supabase
      .from("entry_tags")
      .delete()
      .eq("entry_id", entryId);

    if (deleteError) {
      return apiFailure(normalizeApiError(deleteError));
    }

    if (tagIds.length === 0) {
      return apiSuccess([]);
    }

    const payload = tagIds.map((tagId) => ({
      entry_id: entryId,
      tag_id: tagId,
    }));

    const { data, error } = await supabase
      .from("entry_tags")
      .insert(payload)
      .select("*");

    if (error) {
      return apiFailure(normalizeApiError(error));
    }

    return apiSuccess(data ?? []);
  } catch (error) {
    return apiFailure(normalizeApiError(error));
  }
}

export async function getEntryTags(entryId: string, userId: string): Promise<ApiResult<TagRow[]>> {
  try {
    const supabase = getSupabaseClient();

    const { data: linkRows, error: linkError } = await supabase
      .from("entry_tags")
      .select("tag_id")
      .eq("entry_id", entryId);

    if (linkError) {
      return apiFailure(normalizeApiError(linkError));
    }

    const tagIds = (linkRows ?? []).map((row) => row.tag_id);
    if (tagIds.length === 0) {
      return apiSuccess([]);
    }

    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", userId)
      .in("id", tagIds)
      .order("name", { ascending: true });

    if (error) {
      return apiFailure(normalizeApiError(error));
    }

    return apiSuccess(data ?? []);
  } catch (error) {
    return apiFailure(normalizeApiError(error));
  }
}
