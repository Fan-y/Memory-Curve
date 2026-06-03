import { useEffect, useMemo, useState } from "react";

import ReviewCard from "@/components/ReviewCard";
import MiniSparkline from "@/components/sparklines/MiniSparkline";
import TourGuide from "@/components/tour/TourGuide";
import { getCompletedReviewsByRange } from "@/lib/api/reviews";
import { addDays, endOfDay, startOfDay, toDateKey } from "@/lib/dates";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useI18n } from "@/hooks/useI18n";
import { useTour } from "@/hooks/useTour";
import { useAuthStore } from "@/stores/authStore";
import { useReviewStore } from "@/stores/reviewStore";
import { useEntryCacheStore } from "@/stores/entryCacheStore";
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

  const [leavingReviewId, setLeavingReviewId] = useState<string | null>(null);
  const [entryTitles, setEntryTitles] = useState<Record<string, string>>({});
  const [entryContents, setEntryContents] = useState<Record<string, string>>({});
  const [yesterdayCompleted, setYesterdayCompleted] = useState<number | null>(null);
  const [recent7Completed, setRecent7Completed] = useState<number[]>([]);

  const sparklineData = useMemo(() => {
    if (recent7Completed.length === 0) return null;
    const hasAny = recent7Completed.some((v) => v > 0);
    if (!hasAny) return null;
    return recent7Completed;
  }, [recent7Completed]);

  const entryCache = useEntryCacheStore((s) => s.fetch);

  useDocumentTitle(`${t("dashboardTitle")} - Memory Curve`);

  useEffect(() => {
    if (!user) {
      return;
    }

    const load = async () => {
      await refresh(user.id);
      await entryCache(user.id);

      const { entries } = useEntryCacheStore.getState();
      const titleById: Record<string, string> = {};
      const contentById: Record<string, string> = {};
      if (entries) {
        for (const entry of entries) {
          titleById[entry.id] = entry.title;
          if (entry.content_md) {
            contentById[entry.id] = entry.content_md;
          }
        }
      }
      setEntryTitles(titleById);
      setEntryContents(contentById);

      const today = new Date();
      const days35Start = startOfDay(addDays(today, -34));
      const days35End = endOfDay(today);

      const completedResult = await getCompletedReviewsByRange(user.id, days35Start.toISOString(), days35End.toISOString());

      if (!completedResult.error) {
        const yesterday = toDateKey(addDays(today, -1));
        const countsByDay: Record<string, number> = {};
        let yesterdayCount = 0;
        for (const review of completedResult.data ?? []) {
          if (!review.completed_at) continue;
          const key = toDateKey(review.completed_at);
          countsByDay[key] = (countsByDay[key] ?? 0) + 1;
          if (key === yesterday) {
            yesterdayCount += 1;
          }
        }
        setYesterdayCompleted(yesterdayCount);

        const daily: number[] = [];
        for (let offset = 6; offset >= 0; offset -= 1) {
          const dayKey = toDateKey(addDays(today, -offset));
          daily.push(countsByDay[dayKey] ?? 0);
        }
        setRecent7Completed(daily);
      }
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

  const completedChange = useMemo(() => {
    if (yesterdayCompleted === null) return null;
    return (stats?.completed ?? 0) - yesterdayCompleted;
  }, [stats?.completed, yesterdayCompleted]);

  const onRate = async (reviewId: string, rating: ReviewRating) => {
    if (!user) {
      return;
    }

    setLeavingReviewId(reviewId);
    await submitReview(reviewId, user.id, rating, 0);
    setLeavingReviewId(null);
  };

  const { shouldRun, steps, completeTour, skipTour } = useTour({
    todayEmpty: todayReviews.length === 0,
  });

  return (
    <section className="space-y-6" data-tour="dashboard-done">
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
          {completedChange !== null ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("dashboardChangeYesterday").replace("{change}", `${completedChange >= 0 ? "+" : ""}${completedChange}`)}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">{t("dashboardChangeNoData")}</p>
          )}
          {sparklineData ? (
            <div className="mt-2">
              <MiniSparkline data={sparklineData} width={72} height={22} />
            </div>
          ) : null}
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{t("dashboardMetricOverdue")}</p>
          <p className="mt-2 text-2xl font-semibold">{counts.overdue}</p>
          {sparklineData ? (
            <div className="mt-2">
              <MiniSparkline data={sparklineData} width={72} height={22} />
            </div>
          ) : null}
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{t("dashboardMetricCompleted")}</p>
          <p className="mt-2 text-2xl font-semibold">{counts.completed}</p>
          {completedChange !== null ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("dashboardChangeYesterday").replace("{change}", `${completedChange >= 0 ? "+" : ""}${completedChange}`)}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">{t("dashboardChangeNoData")}</p>
          )}
          {sparklineData ? (
            <div className="mt-2">
              <MiniSparkline data={sparklineData} width={72} height={22} />
            </div>
          ) : null}
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{t("dashboardMetricTotal")}</p>
          <p className="mt-2 text-2xl font-semibold">{counts.total}</p>
          {sparklineData ? (
            <div className="mt-2">
              <MiniSparkline data={sparklineData} width={72} height={22} />
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="space-y-3" data-tour="dashboard-section-today">
        <h3 className="text-lg font-medium">{t("dashboardSectionToday")}</h3>
        {todayReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("dashboardSectionTodayEmpty")}</p>
        ) : (
          <div className="space-y-3" data-tour="dashboard-review-card">
            {todayReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                entryTitle={entryTitles[review.entry_id]}
                entryContent={entryContents[review.entry_id]}
                disabled={leavingReviewId === review.id}
                leaving={leavingReviewId === review.id}
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
                entryContent={entryContents[review.entry_id]}
                disabled={leavingReviewId === review.id}
                leaving={leavingReviewId === review.id}
                onRate={onRate}
              />
            ))}
          </div>
        )}
      </div>

      {shouldRun && (
        <TourGuide
          steps={steps}
          run={shouldRun}
          onFinish={completeTour}
          onSkip={skipTour}
        />
      )}
    </section>
  );
}
