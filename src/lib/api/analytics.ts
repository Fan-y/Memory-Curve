import { getSupabaseClient } from "@/lib/supabase";

export type AnalyticsEventName =
  | "register"
  | "first_content_create"
  | "first_review_complete";

export type AnalyticsEventMetadata = Record<string, unknown>;

const FIRST_EVENTS = new Set<AnalyticsEventName>([
  "first_content_create",
  "first_review_complete",
]);

export async function trackEvent(
  userId: string,
  eventName: AnalyticsEventName,
  metadata?: AnalyticsEventMetadata,
): Promise<void> {
  try {
    if (FIRST_EVENTS.has(eventName)) {
      const { data: existing } = await getSupabaseClient()
        .from("analytics_events")
        .select("id")
        .eq("user_id", userId)
        .eq("event_name", eventName)
        .maybeSingle();
      if (existing) return;
    }

    await getSupabaseClient()
      .from("analytics_events")
      .insert({
        user_id: userId,
        event_name: eventName,
        metadata: metadata ?? {},
      });
  } catch {
    console.warn(`[analytics] trackEvent "${eventName}" failed, ignored`);
  }
}