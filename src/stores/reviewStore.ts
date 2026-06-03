import { create } from "zustand";

import {
  completeReview,
  createReview,
  getOverdueReviews,
  getReview,
  getReviewStats,
  getTodayReviews,
  type ReviewStats,
} from "@/lib/api/reviews";
import {
  apiFailure,
  apiSuccess,
  type ApiResult,
} from "@/lib/api/shared.ts";
import {
  FsrsScheduler,
  cardToReviewState,
  createEmptyCard,
  getNextReviewDate,
  reviewToFsrsCard,
} from "@/lib/fsrs";
import type { Review } from "@/types";
import { ReviewRating } from "@/types";

type ReviewStoreState = {
  todayReviews: Review[];
  overdueReviews: Review[];
  stats: ReviewStats | null;
  loading: boolean;
  error: string | null;
  loadTodayReviews: (userId: string) => Promise<ApiResult<Review[]>>;
  loadOverdueReviews: (userId: string) => Promise<ApiResult<Review[]>>;
  loadStats: (userId: string) => Promise<ApiResult<ReviewStats>>;
  refresh: (userId: string) => Promise<ApiResult<boolean>>;
  createInitialReviewForEntry: (entryId: string, userId: string) => Promise<ApiResult<Review>>;
  submitReview: (
    reviewId: string,
    userId: string,
    rating: ReviewRating,
    durationMs: number
  ) => Promise<ApiResult<Review>>;
};

const fsrsScheduler = new FsrsScheduler();

export const useReviewStore = create<ReviewStoreState>((set, get) => ({
  todayReviews: [],
  overdueReviews: [],
  stats: null,
  loading: false,
  error: null,

  loadTodayReviews: async (userId) => {
    set({ loading: true, error: null });

    const result = await getTodayReviews(userId);
    if (result.error) {
      set({ loading: false, error: result.error });
      return apiFailure(result.error);
    }

    set({
      loading: false,
      error: null,
      todayReviews: result.data ?? [],
    });

    return apiSuccess(result.data ?? []);
  },

  loadOverdueReviews: async (userId) => {
    set({ loading: true, error: null });

    const result = await getOverdueReviews(userId);
    if (result.error) {
      set({ loading: false, error: result.error });
      return apiFailure(result.error);
    }

    set({
      loading: false,
      error: null,
      overdueReviews: result.data ?? [],
    });

    return apiSuccess(result.data ?? []);
  },

  loadStats: async (userId) => {
    set({ loading: true, error: null });

    const result = await getReviewStats(userId);
    if (result.error) {
      set({ loading: false, error: result.error });
      return apiFailure(result.error);
    }

    const stats = result.data;
    if (!stats) {
      const error = "统计数据为空，请稍后重试。";
      set({ loading: false, error });
      return apiFailure(error);
    }

    set({
      loading: false,
      error: null,
      stats,
    });

    return apiSuccess(stats);
  },

  refresh: async (userId) => {
    set({ loading: true, error: null });

    const [todayResult, overdueResult, statsResult] = await Promise.all([
      getTodayReviews(userId),
      getOverdueReviews(userId),
      getReviewStats(userId),
    ]);

    const error = todayResult.error ?? overdueResult.error ?? statsResult.error;
    if (error) {
      set({ loading: false, error });
      return apiFailure(error);
    }

    set({
      loading: false,
      error: null,
      todayReviews: todayResult.data ?? [],
      overdueReviews: overdueResult.data ?? [],
      stats: statsResult.data,
    });

    return apiSuccess(true);
  },

  createInitialReviewForEntry: async (entryId, userId) => {
    set({ loading: true, error: null });

    const initialCard = createEmptyCard();

    const result = await createReview({
      entry_id: entryId,
      user_id: userId,
      state: cardToReviewState(initialCard.state),
      scheduled_date: getNextReviewDate(initialCard),
      stability: initialCard.stability,
      difficulty: initialCard.difficulty,
      elapsed_days: initialCard.elapsed_days,
      reps: initialCard.reps,
      lapses: initialCard.lapses,
      last_rating: null,
      completed_at: null,
      duration_ms: null,
    });

    if (result.error) {
      set({ loading: false, error: result.error });
      return apiFailure(result.error);
    }

    const createdReview = result.data;
    if (!createdReview) {
      const error = "创建首条复习记录失败。";
      set({ loading: false, error });
      return apiFailure(error);
    }

    await get().refresh(userId);
    set({ loading: false, error: null });

    return apiSuccess(createdReview);
  },

  submitReview: async (reviewId, userId, rating, durationMs) => {
    set({ loading: true, error: null });

    const currentReviewResult = await getReview(reviewId, userId);
    if (currentReviewResult.error || !currentReviewResult.data) {
      const error = currentReviewResult.error ?? "找不到要提交的复习记录。";
      set({ loading: false, error });
      return apiFailure(error);
    }

    const currentCard = reviewToFsrsCard(currentReviewResult.data);
    const scheduleResult = fsrsScheduler.scheduleReview(currentCard, rating);

    const updateResult = await completeReview(reviewId, userId, {
      state: scheduleResult.nextState,
      scheduled_date: scheduleResult.nextScheduledDate,
      stability: scheduleResult.nextCard.stability,
      difficulty: scheduleResult.nextCard.difficulty,
      elapsed_days: scheduleResult.nextCard.elapsed_days,
      reps: scheduleResult.nextCard.reps,
      lapses: scheduleResult.nextCard.lapses,
      last_rating: rating,
      duration_ms: durationMs,
      completed_at: new Date().toISOString(),
    });

    if (updateResult.error) {
      set({ loading: false, error: updateResult.error });
      return apiFailure(updateResult.error);
    }

    const updatedReview = updateResult.data;
    if (!updatedReview) {
      const error = "复习提交失败。";
      set({ loading: false, error });
      return apiFailure(error);
    }

    await get().refresh(userId);
    set({ loading: false, error: null });

    return apiSuccess(updatedReview);
  },
}));
