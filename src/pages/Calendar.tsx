import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { getUserEntries } from "@/lib/api/entries";
import { getReviewsByScheduledRange, type ReviewRow } from "@/lib/api/reviews";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useI18n } from "@/hooks/useI18n";
import { useAuthStore } from "@/stores/authStore";

type CalendarCell = {
  date: Date;
  key: string;
  inCurrentMonth: boolean;
};

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

const REVIEW_STATE_LABELS: Record<number, string> = {
  0: "New",
  1: "Learning",
  2: "Review",
  3: "Relearning",
};

function toDateKey(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCalendarRange(month: Date): { start: Date; end: Date } {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const start = new Date(monthStart);
  start.setDate(monthStart.getDate() - monthStart.getDay());
  start.setHours(0, 0, 0, 0);

  const end = new Date(monthEnd);
  end.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function buildCalendarCells(month: Date): CalendarCell[] {
  const { start, end } = getCalendarRange(month);
  const cells: CalendarCell[] = [];

  const cursor = new Date(start);
  while (cursor <= end) {
    cells.push({
      date: new Date(cursor),
      key: toDateKey(cursor),
      inCurrentMonth: cursor.getMonth() === month.getMonth(),
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return cells;
}

function formatMonthLabel(month: Date): string {
  return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const { t } = useI18n();
  const user = useAuthStore((state) => state.user);

  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [entryTitles, setEntryTitles] = useState<Record<string, string>>({});

  useDocumentTitle(`${t("calendarTitle")} - Memory Curve`);

  const calendarCells = useMemo(() => buildCalendarCells(monthCursor), [monthCursor]);

  const reviewCountByDate = useMemo(() => {
    const result: Record<string, number> = {};

    for (const review of reviews) {
      const dateKey = toDateKey(review.scheduled_date);
      result[dateKey] = (result[dateKey] ?? 0) + 1;
    }

    return result;
  }, [reviews]);

  const selectedDateReviews = useMemo(() => {
    return reviews
      .filter((review) => toDateKey(review.scheduled_date) === selectedDateKey)
      .sort((left, right) => left.scheduled_date.localeCompare(right.scheduled_date));
  }, [reviews, selectedDateKey]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      const { start, end } = getCalendarRange(monthCursor);
      const [reviewsResult, entriesResult] = await Promise.all([
        getReviewsByScheduledRange(user.id, start.toISOString(), end.toISOString()),
        getUserEntries(user.id),
      ]);

      if (reviewsResult.error || entriesResult.error) {
        setLoading(false);
        setError(reviewsResult.error ?? entriesResult.error ?? "日历数据加载失败。");
        return;
      }

      const nextTitles: Record<string, string> = {};
      for (const entry of entriesResult.data ?? []) {
        nextTitles[entry.id] = entry.title;
      }

      setReviews(reviewsResult.data ?? []);
      setEntryTitles(nextTitles);
      setLoading(false);
    };

    void load();
  }, [monthCursor, user]);

  const switchMonth = (delta: number) => {
    const next = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + delta, 1);
    setMonthCursor(next);
    setSelectedDateKey(toDateKey(next));
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold">{t("calendarTitle")}</h2>
        <p className="text-sm text-muted-foreground">按日查看任务量，并查看每日任务明细。</p>
      </header>

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <Button size="sm" variant="outline" onClick={() => switchMonth(-1)}>
            上个月
          </Button>
          <p className="text-sm font-medium">{formatMonthLabel(monthCursor)}</p>
          <Button size="sm" variant="outline" onClick={() => switchMonth(1)}>
            下个月
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {calendarCells.map((cell) => {
            const count = reviewCountByDate[cell.key] ?? 0;
            const isSelected = cell.key === selectedDateKey;

            return (
              <button
                key={cell.key}
                className={cn(
                  "flex min-h-20 flex-col items-start justify-between rounded-lg border p-2 text-left text-xs transition",
                  cell.inCurrentMonth ? "bg-background" : "bg-muted/40 text-muted-foreground",
                  isSelected ? "border-primary ring-2 ring-primary/40" : "hover:bg-muted"
                )}
                onClick={() => setSelectedDateKey(cell.key)}
                type="button"
              >
                <span className="text-sm font-medium">{cell.date.getDate()}</span>
                {count > 0 ? (
                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">
                    {count} 项
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">无</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-lg font-medium">{selectedDateKey} 的任务明细</h3>
        {loading ? <p className="text-sm text-muted-foreground">加载中...</p> : null}
        {!loading && selectedDateReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">当天没有任务。</p>
        ) : null}

        <div className="space-y-2">
          {selectedDateReviews.map((review) => (
            <article key={review.id} className="rounded-lg border bg-card p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium">{entryTitles[review.entry_id] ?? review.entry_id}</h4>
                  <p className="text-xs text-muted-foreground">复习 ID: {review.id.slice(0, 8)}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{new Date(review.scheduled_date).toLocaleTimeString()}</p>
                  <p>{REVIEW_STATE_LABELS[review.state] ?? "Unknown"}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
