import { useEffect, useMemo, useState } from "react";

import {
  getCompletedReviewsByRange,
  getReviewsByScheduledRange,
  getReviewStats,
  type ReviewRow,
  type ReviewStats,
} from "@/lib/api/reviews";
import { addDays, endOfDay, formatMinutes, startOfDay, toDateKey } from "@/lib/dates";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useI18n } from "@/hooks/useI18n";
import { useAuthStore } from "@/stores/authStore";

type DayMetric = {
  dateKey: string;
  label: string;
  dueCount: number;
  completedCount: number;
  durationMs: number;
};

type HeatmapCell = {
  dateKey: string;
  label: string;
  day: number;
  count: number;
};

function buildRecentDays(days: number, locale: string): DayMetric[] {
  const list: DayMetric[] = [];
  const today = startOfDay(new Date());
  const formatter = new Intl.DateTimeFormat(locale, {
    month: "numeric",
    day: "numeric",
  });

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = addDays(today, -offset);

    list.push({
      dateKey: toDateKey(date),
      label: formatter.format(date),
      dueCount: 0,
      completedCount: 0,
      durationMs: 0,
    });
  }

  return list;
}

function getHeatmapCellClass(count: number, maxCount: number): string {
  if (maxCount === 0 || count === 0) {
    return "bg-muted";
  }

  const ratio = count / maxCount;
  if (ratio >= 0.8) {
    return "bg-emerald-600";
  }

  if (ratio >= 0.55) {
    return "bg-emerald-500";
  }

  if (ratio >= 0.3) {
    return "bg-emerald-400";
  }

  return "bg-emerald-300";
}

function StatsCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

export default function StatsPage() {
  const { t, locale } = useI18n();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [scheduledWindowReviews, setScheduledWindowReviews] = useState<ReviewRow[]>([]);
  const [completedWindowReviews, setCompletedWindowReviews] = useState<ReviewRow[]>([]);
  const [upcomingReviews, setUpcomingReviews] = useState<ReviewRow[]>([]);

  useDocumentTitle(`${t("statsTitle")} - Memory Curve`);

  useEffect(() => {
    if (!user) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      const today = new Date();
      const start35 = startOfDay(addDays(today, -34));
      const endToday = endOfDay(today);
      const futureEnd = endOfDay(addDays(today, 14));
      const todayStart = startOfDay(today);

      const [
        statsResult,
        scheduledResult,
        completedResult,
        upcomingResult,
      ] = await Promise.all([
        getReviewStats(user.id),
        getReviewsByScheduledRange(user.id, start35.toISOString(), endToday.toISOString()),
        getCompletedReviewsByRange(user.id, start35.toISOString(), endToday.toISOString()),
        getReviewsByScheduledRange(user.id, todayStart.toISOString(), futureEnd.toISOString()),
      ]);

      const firstError =
        statsResult.error ??
        scheduledResult.error ??
        completedResult.error ??
        upcomingResult.error;
      if (firstError) {
        setLoading(false);
        setError(firstError);
        return;
      }

      setStats(statsResult.data);
      setScheduledWindowReviews(scheduledResult.data ?? []);
      setCompletedWindowReviews(completedResult.data ?? []);
      setUpcomingReviews(upcomingResult.data ?? []);
      setLoading(false);
    };

    void load();
  }, [user]);

  const completionRate = useMemo(() => {
    if (!stats || stats.total === 0) {
      return 0;
    }

    return (stats.completed / stats.total) * 100;
  }, [stats]);

  const averageDurationMs = useMemo(() => {
    if (!stats || stats.completed === 0) {
      return 0;
    }

    return stats.totalDurationMs / stats.completed;
  }, [stats]);

  const recentDayMetrics = useMemo(() => {
    const rows = buildRecentDays(7, locale);
    const indexByDate: Record<string, number> = {};

    rows.forEach((row, index) => {
      indexByDate[row.dateKey] = index;
    });

    for (const review of scheduledWindowReviews) {
      const dateKey = toDateKey(review.scheduled_date);
      const rowIndex = indexByDate[dateKey];
      if (rowIndex !== undefined) {
        rows[rowIndex].dueCount += 1;
      }
    }

    for (const review of completedWindowReviews) {
      if (!review.completed_at) {
        continue;
      }

      const dateKey = toDateKey(review.completed_at);
      const rowIndex = indexByDate[dateKey];
      if (rowIndex !== undefined) {
        rows[rowIndex].completedCount += 1;
        rows[rowIndex].durationMs += review.duration_ms ?? 0;
      }
    }

    return rows;
  }, [completedWindowReviews, locale, scheduledWindowReviews]);

  const heatmapCells = useMemo<HeatmapCell[]>(() => {
    const rows: HeatmapCell[] = [];
    const today = startOfDay(new Date());
    const completedByDate: Record<string, number> = {};

    for (const review of completedWindowReviews) {
      if (!review.completed_at) {
        continue;
      }

      const dateKey = toDateKey(review.completed_at);
      completedByDate[dateKey] = (completedByDate[dateKey] ?? 0) + 1;
    }

    for (let offset = 34; offset >= 0; offset -= 1) {
      const date = addDays(today, -offset);
      const dateKey = toDateKey(date);
      rows.push({
        dateKey,
        label: new Intl.DateTimeFormat(locale, { month: "numeric", day: "numeric" }).format(date),
        day: date.getDate(),
        count: completedByDate[dateKey] ?? 0,
      });
    }

    return rows;
  }, [completedWindowReviews, locale]);

  const heatmapMax = useMemo(() => {
    return heatmapCells.reduce((max, cell) => Math.max(max, cell.count), 0);
  }, [heatmapCells]);

  const forgettingCurvePoints = useMemo(() => {
    const cards = upcomingReviews.filter((review) => (review.stability ?? 0) > 0);

    if (cards.length === 0) {
      return Array.from({ length: 15 }, (_, day) => ({ day, retention: 0 }));
    }

    return Array.from({ length: 15 }, (_, day) => {
      const total = cards.reduce((sum, review) => {
        const stability = Math.max(review.stability ?? 0.1, 0.1);
        const retention = Math.exp(Math.log(0.9) * day / stability);
        return sum + retention;
      }, 0);

      return {
        day,
        retention: total / cards.length,
      };
    });
  }, [upcomingReviews]);

  const forgettingCurvePath = useMemo(() => {
    if (forgettingCurvePoints.length === 0) {
      return "";
    }

    return forgettingCurvePoints
      .map((point, index) => {
        const x = (index / (forgettingCurvePoints.length - 1)) * 100;
        const y = 100 - point.retention * 100;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [forgettingCurvePoints]);

  const retentionNow = forgettingCurvePoints[0]?.retention ?? 0;
  const retentionDay7 = forgettingCurvePoints[7]?.retention ?? 0;
  const retentionDay14 = forgettingCurvePoints[14]?.retention ?? 0;

  const stateDistribution = useMemo(() => {
    const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };

    for (const review of scheduledWindowReviews) {
      counts[review.state] = (counts[review.state] ?? 0) + 1;
    }

    return counts;
  }, [scheduledWindowReviews]);

  const maxMetric = useMemo(() => {
    return recentDayMetrics.reduce((max, row) => {
      return Math.max(max, row.dueCount, row.completedCount);
    }, 0);
  }, [recentDayMetrics]);

  const reviewStateLabels = useMemo<Record<number, string>>(
    () => ({
      0: t("reviewStateNew"),
      1: t("reviewStateLearning"),
      2: t("reviewStateReview"),
      3: t("reviewStateRelearning"),
    }),
    [t]
  );

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold">{t("statsTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("statsSubtitle")}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label={t("statsMetricTotal")} value={String(stats?.total ?? 0)} />
        <StatsCard
          label={t("statsMetricCompletion")}
          value={`${completionRate.toFixed(1)}%`}
          helper={`${stats?.completed ?? 0} / ${stats?.total ?? 0}`}
        />
        <StatsCard
          label={t("statsMetricPendingToday")}
          value={String((stats?.dueToday ?? 0) + (stats?.overdue ?? 0))}
          helper={
            locale === "zh-CN"
              ? `今日 ${stats?.dueToday ?? 0} · 逾期 ${stats?.overdue ?? 0}`
              : `Today ${stats?.dueToday ?? 0} · Overdue ${stats?.overdue ?? 0}`
          }
        />
        <StatsCard
          label={t("statsMetricAverageDuration")}
          value={formatMinutes(averageDurationMs)}
          helper={`${t("statsMetricCumulative")} ${formatMinutes(stats?.totalDurationMs ?? 0)}`}
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="text-lg font-medium">{t("statsSectionTrend7d")}</h3>
        {loading ? <p className="text-sm text-muted-foreground">{t("calendarLoading")}</p> : null}

        <div className="space-y-3">
          {recentDayMetrics.map((row) => {
            const dueWidth = maxMetric > 0 ? (row.dueCount / maxMetric) * 100 : 0;
            const completedWidth = maxMetric > 0 ? (row.completedCount / maxMetric) * 100 : 0;

            return (
              <div key={row.dateKey} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{row.label}</span>
                  <span>
                    {t("globalDue")} {row.dueCount} · {t("globalDone")} {row.completedCount} · {t("globalDuration")} {formatMinutes(row.durationMs)}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="h-2 rounded bg-primary/20">
                    <div
                      className="h-2 rounded bg-primary"
                      style={{ width: `${dueWidth}%` }}
                    />
                  </div>
                  <div className="h-2 rounded bg-emerald-500/20">
                    <div
                      className="h-2 rounded bg-emerald-500"
                      style={{ width: `${completedWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="text-lg font-medium">{t("statsSectionHeatmap")}</h3>
        <p className="text-xs text-muted-foreground">{t("statsHeatmapHint")}</p>

        <div className="grid grid-cols-7 gap-1">
          {heatmapCells.map((cell) => (
            <div
              key={cell.dateKey}
              className={`flex h-9 items-center justify-center rounded text-[10px] text-foreground ${getHeatmapCellClass(
                cell.count,
                heatmapMax
              )}`}
              title={`${cell.dateKey}: ${cell.count}`}
            >
              {cell.day}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="text-lg font-medium">{t("statsSectionCurve")}</h3>
        <p className="text-xs text-muted-foreground">{t("statsCurveHint")}</p>

        <div className="rounded-lg border bg-background p-3">
          <svg viewBox="0 0 100 100" className="h-44 w-full">
            <defs>
              <linearGradient id="curveFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.03" />
              </linearGradient>
            </defs>
            <line
              x1="0"
              y1="90"
              x2="100"
              y2="90"
              stroke="hsl(var(--muted-foreground))"
              strokeOpacity="0.45"
              strokeWidth="0.4"
            />
            <line
              x1="0"
              y1="50"
              x2="100"
              y2="50"
              stroke="hsl(var(--border))"
              strokeWidth="0.3"
            />
            <line
              x1="0"
              y1="10"
              x2="100"
              y2="10"
              stroke="hsl(var(--border))"
              strokeWidth="0.3"
            />

            {forgettingCurvePath ? (
              <>
                <path
                  d={`${forgettingCurvePath} L 100 100 L 0 100 Z`}
                  fill="url(#curveFill)"
                  stroke="none"
                />
                <path
                  d={forgettingCurvePath}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="1.2"
                />
              </>
            ) : null}
          </svg>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">{t("statsRetentionD0")}</p>
            <p className="mt-1 text-lg font-semibold">{(retentionNow * 100).toFixed(1)}%</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">{t("statsRetentionD7")}</p>
            <p className="mt-1 text-lg font-semibold">{(retentionDay7 * 100).toFixed(1)}%</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">{t("statsRetentionD14")}</p>
            <p className="mt-1 text-lg font-semibold">{(retentionDay14 * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="text-lg font-medium">{t("statsSectionStateDistribution")}</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[0, 1, 2, 3].map((state) => (
            <div key={state} className="rounded-lg border bg-background p-3">
              <p className="text-xs text-muted-foreground">{reviewStateLabels[state]}</p>
              <p className="mt-1 text-xl font-semibold">{stateDistribution[state] ?? 0}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
