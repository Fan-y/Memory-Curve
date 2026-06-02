import Dexie, { type EntityTable } from 'dexie'
import { type Tag, type Entry, type Review } from '../types'
import { getReviewSchedule } from '../utils/memoryCurve'
import { today } from '../utils/dates'

export class MemoryCurveDB extends Dexie {
  tags!: EntityTable<Tag, 'name'>
  entries!: EntityTable<Entry, 'id'>
  reviews!: EntityTable<Review, 'id'>

  constructor() {
    super('MemoryCurveDB')
    this.version(1).stores({
      tags: 'name',
      entries: '++id',
      reviews: '++id, entryId, scheduledDate, completed',
    })
  }

  async addTag(name: string, color: string) {
    await this.tags.put({ name, color })
  }

  async getAllTags(): Promise<Tag[]> {
    return this.tags.toArray()
  }

  async addEntry(data: { title: string; description?: string; tags?: string[]; source?: string }): Promise<number> {
    const now = new Date().toISOString()
    const entry: Entry = {
      title: data.title,
      description: data.description ?? '',
      tags: data.tags ?? [],
      source: data.source ?? '',
      createdAt: now,
    }
    const entryId = await this.entries.add(entry)

    const schedule = getReviewSchedule(now)
    const reviews: Review[] = schedule.map((date, i) => ({
      entryId,
      reviewNumber: i + 1,
      scheduledDate: date,
      completed: false,
      completedAt: null,
    }))
    await this.reviews.bulkAdd(reviews)
    return entryId
  }

  async completeReview(reviewId: number) {
    await this.reviews.update(reviewId, {
      completed: true,
      completedAt: new Date().toISOString(),
    })
  }

  async getTodayReviews(): Promise<(Review & { entry: Entry })[]> {
    const reviews = await this.reviews
      .where('scheduledDate')
      .equals(today())
      .toArray()
    return this.attachEntries(reviews)
  }

  async getOverdueReviews(): Promise<(Review & { entry: Entry })[]> {
    const reviews = await this.reviews
      .where('scheduledDate')
      .below(today())
      .filter((r) => !r.completed)
      .toArray()
    return this.attachEntries(reviews)
  }

  async getUpcomingReviews(days: number = 7): Promise<(Review & { entry: Entry })[]> {
    const start = today()
    const end = new Date()
    end.setDate(end.getDate() + days)
    const endStr = end.toISOString().slice(0, 10)

    const reviews = await this.reviews
      .where('scheduledDate')
      .between(start, endStr, true, true)
      .filter((r) => !r.completed)
      .toArray()
    return this.attachEntries(reviews)
  }

  private async attachEntries(reviews: Review[]): Promise<(Review & { entry: Entry })[]> {
    if (reviews.length === 0) return []
    const entryIds = [...new Set(reviews.map((r) => r.entryId))]
    const entries = await this.entries.bulkGet(entryIds)
    const entryMap = new Map<number, Entry>()
    entryIds.forEach((id, i) => {
      const e = entries[i]
      if (e) entryMap.set(id, e)
    })
    return reviews
      .map((r) => ({ ...r, entry: entryMap.get(r.entryId)! }))
      .filter((r) => r.entry)
  }

  async getAllEntriesWithReviews(): Promise<(Entry & { reviews: Review[] })[]> {
    const entries = await this.entries.toArray()
    const result: (Entry & { reviews: Review[] })[] = []
    for (const e of entries) {
      const reviews = await this.reviews.where('entryId').equals(e.id!).toArray()
      result.push({ ...e, reviews })
    }
    return result
  }

  async getEntriesByDate(date: string): Promise<(Entry & { reviews: Review[] })[]> {
    const reviews = await this.reviews
      .where('scheduledDate')
      .equals(date)
      .toArray()
    const entryIds = [...new Set(reviews.map((r) => r.entryId))]
    const entries = await this.entries.bulkGet(entryIds)
    return entries
      .filter((e): e is Entry => e != null)
      .map((e) => ({
        ...e,
        reviews: reviews.filter((r) => r.entryId === e.id),
      }))
  }

  async getStats() {
    const totalEntries = await this.entries.count()
    const allReviews = await this.reviews.toArray()
    const totalReviews = allReviews.length
    const completedReviews = allReviews.filter((r) => r.completed).length
    const completionRate = totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0

    const todayCount = allReviews.filter((r) => r.scheduledDate === today()).length
    const todayDone = allReviews.filter((r) => r.scheduledDate === today() && r.completed).length

    const overdueCount = allReviews.filter((r) => r.scheduledDate < today() && !r.completed).length

    const upcomingCount = allReviews.filter((r) => r.scheduledDate > today() && !r.completed).length

    return {
      totalEntries,
      totalReviews,
      completedReviews,
      completionRate,
      todayCount,
      todayDone,
      overdueCount,
      upcomingCount,
    }
  }
}

export const db = new MemoryCurveDB()
