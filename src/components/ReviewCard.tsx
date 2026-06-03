import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/useI18n";
import type { Review } from "@/types";
import { ReviewRating } from "@/types";

type ReviewCardProps = {
  review: Review;
  entryTitle?: string;
  onRate: (reviewId: string, rating: ReviewRating) => Promise<void> | void;
  disabled?: boolean;
};

export default function ReviewCard({ review, entryTitle, onRate, disabled }: ReviewCardProps) {
  const { t } = useI18n();
  const ratingActions: Array<{ label: string; rating: ReviewRating; className: string }> = [
    {
      label: t("reviewRatingAgain"),
      rating: ReviewRating.Again,
      className: "bg-rose-600 hover:bg-rose-700",
    },
    {
      label: t("reviewRatingHard"),
      rating: ReviewRating.Hard,
      className: "bg-amber-600 hover:bg-amber-700",
    },
    {
      label: t("reviewRatingGood"),
      rating: ReviewRating.Good,
      className: "bg-sky-600 hover:bg-sky-700",
    },
    {
      label: t("reviewRatingEasy"),
      rating: ReviewRating.Easy,
      className: "bg-emerald-600 hover:bg-emerald-700",
    },
  ];

  return (
    <article className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{entryTitle ?? t("reviewCardUntitledEntry")}</h3>
        <p className="text-xs text-muted-foreground">
          {t("reviewCardEntryId")}: {review.entry_id}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("reviewCardScheduledAt")}: {new Date(review.scheduled_date).toLocaleString()}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ratingActions.map((action) => (
          <Button
            key={action.label}
            className={action.className}
            disabled={disabled}
            onClick={() => {
              void onRate(review.id, action.rating);
            }}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </article>
  );
}
