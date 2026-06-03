import { describe, expect, it } from "vitest";

import {
  FsrsScheduler,
  cardToReviewState,
  createEmptyCard,
  getNextReviewDate,
  reviewToFsrsCard,
} from "@/lib/fsrs";
import { ReviewRating, ReviewState, type Review } from "@/types";

describe("fsrs adapter", () => {
  it("creates card and next review date", () => {
    const card = createEmptyCard(new Date("2026-06-03T00:00:00.000Z"));
    const isoDate = getNextReviewDate(card);

    expect(typeof isoDate).toBe("string");
    expect(isoDate.endsWith("Z")).toBe(true);
  });

  it("maps review row to fsrs card", () => {
    const review: Review = {
      id: "review-1",
      entry_id: "entry-1",
      user_id: "user-1",
      state: ReviewState.New,
      scheduled_date: "2026-06-04T00:00:00.000Z",
      stability: 0.8,
      difficulty: 4.2,
      elapsed_days: 0,
      reps: 1,
      lapses: 0,
      last_rating: 3,
      completed_at: "2026-06-03T00:00:00.000Z",
      duration_ms: 1500,
      created_at: "2026-06-03T00:00:00.000Z",
      updated_at: "2026-06-03T00:00:00.000Z",
    };

    const card = reviewToFsrsCard(review);
    expect(card.reps).toBe(1);
    expect(card.lapses).toBe(0);
  });

  it("schedules next review based on rating", () => {
    const scheduler = new FsrsScheduler();
    const card = createEmptyCard(new Date("2026-06-03T00:00:00.000Z"));

    const scheduled = scheduler.scheduleReview(
      card,
      ReviewRating.Good,
      new Date("2026-06-03T12:00:00.000Z")
    );

    expect(scheduled.nextScheduledDate.endsWith("Z")).toBe(true);
    expect(Object.values(ReviewState)).toContain(scheduled.nextState);
    expect(cardToReviewState(scheduled.nextCard.state)).toBe(scheduled.nextState);
  });
});
