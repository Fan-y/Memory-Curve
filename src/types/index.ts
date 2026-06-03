import type { Tables } from "@/types/database";

export type Profile = Tables<"profiles">;
export type Entry = Tables<"entries">;
export type Tag = Tables<"tags">;
export type EntryTag = Tables<"entry_tags">;
export type Review = Tables<"reviews">;

export enum ReviewRating {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4,
}

export enum ReviewState {
  New = 0,
  Learning = 1,
  Review = 2,
  Relearning = 3,
}

export type EntryWithRelations = Entry & {
  tags: Tag[];
  reviews: Review[];
};
