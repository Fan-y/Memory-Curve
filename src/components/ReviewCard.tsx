import { Button } from "@/components/ui/button";
import type { Review } from "@/types";
import { ReviewRating } from "@/types";

type ReviewCardProps = {
  review: Review;
  onRate: (reviewId: string, rating: ReviewRating) => Promise<void> | void;
  disabled?: boolean;
};

const ratingActions: Array<{ label: string; rating: ReviewRating; className: string }> = [
  { label: "Again", rating: ReviewRating.Again, className: "bg-rose-600 hover:bg-rose-700" },
  { label: "Hard", rating: ReviewRating.Hard, className: "bg-amber-600 hover:bg-amber-700" },
  { label: "Good", rating: ReviewRating.Good, className: "bg-sky-600 hover:bg-sky-700" },
  { label: "Easy", rating: ReviewRating.Easy, className: "bg-emerald-600 hover:bg-emerald-700" },
];

export default function ReviewCard({ review, onRate, disabled }: ReviewCardProps) {
  return (
    <article className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="space-y-1">
        <h3 className="font-medium">复习记录 {review.id.slice(0, 8)}</h3>
        <p className="text-xs text-muted-foreground">条目 ID：{review.entry_id}</p>
        <p className="text-xs text-muted-foreground">
          计划时间：{new Date(review.scheduled_date).toLocaleString()}
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
