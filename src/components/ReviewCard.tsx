import { useState } from "react";
import { Check, RotateCcw, TrendingDown, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/useI18n";
import type { Review } from "@/types";
import { ReviewRating } from "@/types";

type ReviewCardProps = {
  review: Review;
  entryTitle?: string;
  entryContent?: string;
  onRate: (reviewId: string, rating: ReviewRating) => Promise<void> | void;
  disabled?: boolean;
  leaving?: boolean;
};

export default function ReviewCard({ review, entryTitle, entryContent, onRate, disabled, leaving }: ReviewCardProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const ratingActions: Array<{ label: string; rating: ReviewRating; className: string; Icon: typeof RotateCcw }> = [
    {
      label: t("reviewRatingAgain"),
      rating: ReviewRating.Again,
      className: "bg-rose-600 hover:bg-rose-700",
      Icon: RotateCcw,
    },
    {
      label: t("reviewRatingHard"),
      rating: ReviewRating.Hard,
      className: "bg-amber-600 hover:bg-amber-700",
      Icon: TrendingDown,
    },
    {
      label: t("reviewRatingGood"),
      rating: ReviewRating.Good,
      className: "bg-sky-600 hover:bg-sky-700",
      Icon: Check,
    },
    {
      label: t("reviewRatingEasy"),
      rating: ReviewRating.Easy,
      className: "bg-emerald-600 hover:bg-emerald-700",
      Icon: Zap,
    },
  ];

  const hasContent = Boolean(entryContent && entryContent.trim());

  return (
    <article className={`rounded-xl border bg-card p-4 shadow-sm transition-opacity duration-300 ${leaving ? "opacity-0" : ""}`}>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{entryTitle ?? t("reviewCardUntitledEntry")}</h3>
        <p className="text-xs text-muted-foreground">
          {t("reviewCardEntryId")}: {review.entry_id}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("reviewCardScheduledAt")}: {new Date(review.scheduled_date).toLocaleString()}
        </p>
        {hasContent ? (
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? t("reviewCardCollapsePreview") : t("reviewCardExpandPreview")}
          </button>
        ) : null}
      </div>

      {hasContent ? (
        <div
          className={`overflow-hidden transition-all duration-200 ${expanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
        >
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground line-clamp-3">
            {entryContent!.trim().slice(0, 300)}
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ratingActions.map((action) => {
          const IconComponent = action.Icon;
          return (
            <Button
              key={action.label}
              className={action.className}
              disabled={disabled || leaving}
              onClick={() => {
                void onRate(review.id, action.rating);
              }}
            >
              <IconComponent className="mr-1.5 h-3.5 w-3.5" />
              <span>{action.label}</span>
            </Button>
          );
        })}
      </div>
    </article>
  );
}
