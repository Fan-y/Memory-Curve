export interface Tag {
  name: string
  color: string
}

export interface Entry {
  id?: number
  title: string
  description: string
  tags: string[]
  source: string
  createdAt: string
}

export interface Review {
  id?: number
  entryId: number
  reviewNumber: number
  scheduledDate: string
  completed: boolean
  completedAt: string | null
}

export const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30]
