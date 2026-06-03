import {
  createEmptyCard as createTsFsrsEmptyCard,
  fsrs,
  Rating,
  State,
  type Card,
  type FSRSParameters,
  type Grade,
  type IFSRS,
} from "ts-fsrs";

import type { Review } from "@/types";
import { ReviewRating, ReviewState } from "@/types";

export type FsrsScheduleResult = {
  nextState: ReviewState;
  nextCard: Card;
  nextScheduledDate: string;
};

function toGrade(rating: ReviewRating): Grade {
  switch (rating) {
    case ReviewRating.Again:
      return Rating.Again;
    case ReviewRating.Hard:
      return Rating.Hard;
    case ReviewRating.Good:
      return Rating.Good;
    case ReviewRating.Easy:
      return Rating.Easy;
    default:
      return Rating.Good;
  }
}

function toFsrsState(state: number): State {
  switch (state) {
    case ReviewState.New:
      return State.New;
    case ReviewState.Learning:
      return State.Learning;
    case ReviewState.Review:
      return State.Review;
    case ReviewState.Relearning:
      return State.Relearning;
    default:
      return State.New;
  }
}

export function createEmptyCard(now: Date = new Date()): Card {
  return createTsFsrsEmptyCard(now);
}

export function initScheduler(userParams?: Partial<FSRSParameters>): IFSRS {
  return fsrs(userParams);
}

export function getNextReviewDate(nextCard: Pick<Card, "due">): string {
  return nextCard.due.toISOString();
}

export function cardToReviewState(state: State | number): ReviewState {
  switch (state) {
    case State.New:
      return ReviewState.New;
    case State.Learning:
      return ReviewState.Learning;
    case State.Review:
      return ReviewState.Review;
    case State.Relearning:
      return ReviewState.Relearning;
    default:
      return ReviewState.New;
  }
}

export function reviewToFsrsCard(review: Review): Card {
  const empty = createTsFsrsEmptyCard(review.created_at);
  const due = new Date(review.scheduled_date);
  const lastReview = review.completed_at ? new Date(review.completed_at) : undefined;

  return {
    ...empty,
    due,
    stability: review.stability ?? empty.stability,
    difficulty: review.difficulty ?? empty.difficulty,
    elapsed_days: review.elapsed_days ?? empty.elapsed_days,
    reps: review.reps,
    lapses: review.lapses,
    state: toFsrsState(review.state),
    last_review: lastReview,
  };
}

export class FsrsScheduler {
  readonly scheduler: IFSRS;

  constructor(userParams?: Partial<FSRSParameters>) {
    this.scheduler = initScheduler(userParams);
  }

  scheduleReview(card: Card, rating: ReviewRating, now: Date = new Date()): FsrsScheduleResult {
    const grade = toGrade(rating);
    const { card: nextCard } = this.scheduler.next(card, now, grade);

    return {
      nextState: cardToReviewState(nextCard.state),
      nextCard,
      nextScheduledDate: getNextReviewDate(nextCard),
    };
  }
}
