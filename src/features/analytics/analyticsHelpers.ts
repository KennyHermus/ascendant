import type { AttemptStats } from '@/types/analytics'
import type {
  NonNegotiableSubcategory,
  QuestCategory,
} from '@/types/quest'
import {
  NON_NEGOTIABLE_SUBCATEGORIES,
  QUEST_CATEGORIES,
} from '@/types/quest'

/** Safe completion rate in [0, 1], or null when there were no attempts. */
export function completionRate(
  completed: number,
  missed: number,
): number | null {
  const attempts = completed + missed
  if (attempts <= 0) return null
  return completed / attempts
}

export function toAttemptStats(completed: number, missed: number): AttemptStats {
  return {
    completed,
    missed,
    rate: completionRate(completed, missed),
  }
}

export function emptyAttemptStats(): AttemptStats {
  return toAttemptStats(0, 0)
}

export function emptyCategoryAttemptMap(): Record<QuestCategory, AttemptStats> {
  return Object.fromEntries(
    QUEST_CATEGORIES.map((category) => [category, emptyAttemptStats()]),
  ) as Record<QuestCategory, AttemptStats>
}

export function emptySubcategoryAttemptMap(): Record<
  NonNegotiableSubcategory,
  AttemptStats
> {
  return Object.fromEntries(
    NON_NEGOTIABLE_SUBCATEGORIES.map((subcategory) => [
      subcategory,
      emptyAttemptStats(),
    ]),
  ) as Record<NonNegotiableSubcategory, AttemptStats>
}

export function average(total: number, count: number): number | null {
  if (count <= 0) return null
  return total / count
}

export function sumField<T>(
  items: readonly T[],
  field: (item: T) => number,
): number {
  let total = 0
  for (const item of items) {
    total += field(item)
  }
  return total
}
