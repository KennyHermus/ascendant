import { getBenchmarkExerciseName } from '@/features/performance/exerciseFamilyLogic'
import type { GameEvent, GameEventType } from '@/types/event'
import type { TimelineFilterCategory } from '@/types/historyUi'

export const TIMELINE_FILTER_LABELS: Record<TimelineFilterCategory, string> = {
  all: 'All',
  progress: 'Progress',
  quests: 'Quests',
  achievements: 'Achievements',
  unlocks: 'Unlocks',
}

const PROGRESS_TYPES = new Set<GameEventType>([
  'LEVEL_UP',
  'STREAK_INCREASED',
  'STREAK_BROKEN',
  'PERSONAL_RECORD_ACHIEVED',
])
const QUEST_TYPES = new Set<GameEventType>([
  'QUEST_COMPLETED',
  'QUEST_FAILED',
  'WORKOUT_COMPLETED',
])
const ACHIEVEMENT_TYPES = new Set<GameEventType>(['ACHIEVEMENT_UNLOCKED'])
const UNLOCK_TYPES = new Set<GameEventType>(['UNLOCK_EARNED'])

export function eventMatchesTimelineCategory(
  event: GameEvent,
  category: TimelineFilterCategory,
): boolean {
  if (category === 'all') return true
  if (category === 'progress') return PROGRESS_TYPES.has(event.type)
  if (category === 'quests') return QUEST_TYPES.has(event.type)
  if (category === 'achievements') return ACHIEVEMENT_TYPES.has(event.type)
  if (category === 'unlocks') return UNLOCK_TYPES.has(event.type)
  return true
}

export function eventMatchesSearch(event: GameEvent, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  switch (event.type) {
    case 'QUEST_COMPLETED':
    case 'QUEST_FAILED':
      return event.questName.toLowerCase().includes(normalized)
    case 'ACHIEVEMENT_UNLOCKED':
      return event.achievementName.toLowerCase().includes(normalized)
    case 'UNLOCK_EARNED':
      return event.unlockName.toLowerCase().includes(normalized)
    case 'LEVEL_UP':
      return `level ${event.level}`.includes(normalized) || 'level up'.includes(normalized)
    case 'STREAK_INCREASED':
      return 'streak'.includes(normalized)
    case 'STREAK_BROKEN':
      return 'streak broken'.includes(normalized)
    case 'WORKOUT_COMPLETED':
      return (
        event.templateName.toLowerCase().includes(normalized) ||
        'workout'.includes(normalized)
      )
    case 'PERSONAL_RECORD_ACHIEVED':
      return (
        'personal record'.includes(normalized) ||
        'pr'.includes(normalized) ||
        getBenchmarkExerciseName(event.exerciseId).toLowerCase().includes(normalized)
      )
  }
}

/** Heatmap intensity bucket 0–4 from completion rate [0, 1] or null. */
export function completionHeatLevel(
  rate: number | null,
  hasSnapshot: boolean,
): 0 | 1 | 2 | 3 | 4 {
  if (!hasSnapshot || rate === null) return 0
  if (rate <= 0) return 1
  if (rate < 0.5) return 2
  if (rate < 0.85) return 3
  return 4
}

export const HEAT_LEVEL_CLASSES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-stone-800/40 border-stone-700/30',
  1: 'bg-rose-950/70 border-rose-900/40',
  2: 'bg-emerald-950/80 border-emerald-900/40',
  3: 'bg-emerald-800/80 border-emerald-700/50',
  4: 'bg-emerald-500/90 border-emerald-400/60',
}
