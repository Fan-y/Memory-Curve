import { useEffect, useMemo, useState } from "react";

import ReviewCard from "@/components/ReviewCard";
import { getUserEntries } from "@/lib/api/entries";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useI18n } from "@/hooks/useI18n";
import { useAuthStore } from "@/stores/authStore";
import { useReviewStore } from "@/stores/reviewStore";
import { ReviewRating } from "@/types";

export default function Dashboard() {
  const { t } = useI18n();
  const user = useAuthStore((state) => state.user);
  const {
    loading,
    error,
    todayReviews,
    overdueReviews,
    stats,
    refresh,
    submitReview,
  } = useReviewStore((state) => state);

  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [entryTitles, setEntryTitles] = useState<Record<string, string>>({});

  useDocumentTitle(`${t("dashboardTitle")} - Memory Curve`);

  useEffect(() => {
    if (!user) {
      return;
    }

    const load = async () => {
      await refresh(user.id);

      const entriesResult = await getUserEntries(user.id);
      if (entriesResult.error) {
        return;
      }

      const titleById: Record<string, string> = {};
      for (const entry of entriesResult.data ?? []) {
        titleById[entry.id] = entry.title;
      }

      setEntryTitles(titleById);
    };

    void load();
  }, [refresh, user]);

  const counts = useMemo(() => {
    return {
      today: todayReviews.length,
      overdue: overdueReviews.length,
      completed: stats?.completed ?? 0,
      total: stats?.total ?? 0,
    };
  }, [overdueReviews.length, stats?.completed, stats?.total, todayReviews.length]);

  const onRate = async (reviewId: string, rating: ReviewRating) => {
    if (!user) {
      return;
    }

    setActiveReviewId(reviewId);
    await submitReview(reviewId, user.id, rating, 0);
    setActiveReviewId(null);
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">{t("dashboardTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("dashboardSubtitle")}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{t("dashboardMetricToday")}</p>
          <p className="mt-2 text-2xl font-semibold">{counts.today}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{t("dashboardMetricOverdue")}</p>
          <p className="mt-2 text-2xl font-semibold">{counts.overdue}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{t("dashboardMetricCompleted")}</p>
          <p className="mt-2 text-2xl font-semibold">{counts.completed}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{t("dashboardMetricTotal")}</p>
          <p className="mt-2 text-2xl font-semibold">{counts.total}</p>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-lg font-medium">{t("dashboardSectionToday")}</h3>
        {todayReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("dashboardSectionTodayEmpty")}</p>
        ) : (
          <div className="space-y-3">
            {todayReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                entryTitle={entryTitles[review.entry_id]}
                disabled={loading && activeReviewId === review.id}
                onRate={onRate}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-medium">{t("dashboardSectionOverdue")}</h3>
        {overdueReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("dashboardSectionOverdueEmpty")}</p>
        ) : (
          <div className="space-y-3">
            {overdueReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                entryTitle={entryTitles[review.entry_id]}
                disabled={loading && activeReviewId === review.id}
                onRate={onRate}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
