import { QUEST_DEFINITIONS } from '@/data/quests'
import { isPlayerVisibleQuestFailedEvent, questSupportsPlayerMiss } from '@/features/quests/questMissPolicy'
import { getBenchmarkExerciseName } from '@/features/performance/exerciseFamilyLogic'
import type { StreakState } from '@/features/quests/questLogic'
import { getCurrentGameTime } from '@/lib/gameTime'
import { getActiveHeroDayKey } from '@/lib/timeService'
import type { AchievementDefinition } from '@/types/achievement'
import type { CompletionGrade } from '@/types/completion'
import type { GameEvent } from '@/types/event'
import type { QuestDefinition, QuestState } from '@/types/quest'
import type { UnlockDefinition, UnlockState } from '@/types/unlock'
import type { WorkoutActivity } from '@/types/workout'
import type { PersonalRecordHistoryEntry } from '@/types/performance'

/** Keeps persisted history bounded — this is a lightweight foundation, not a full log. */
const MAX_STORED_EVENTS = 50

function makeEventBase(now: Date): { id: string; timestamp: string } {
  return { id: crypto.randomUUID(), timestamp: now.toISOString() }
}

export interface QuestCompletedEventInput {
  definition: QuestDefinition
  heroDayKey: string
  completedAt: string
  grade: Exclude<CompletionGrade, 'missed'>
  minutesOffset: number
  now?: Date
}

export function recordQuestCompleted(
  input: QuestCompletedEventInput,
): GameEvent
export function recordQuestCompleted(
  definition: QuestDefinition,
  now?: Date,
): GameEvent
export function recordQuestCompleted(
  definitionOrInput: QuestDefinition | QuestCompletedEventInput,
  now: Date = getCurrentGameTime(),
): GameEvent {
  if ('heroDayKey' in definitionOrInput) {
    const input = definitionOrInput
    return {
      id: crypto.randomUUID(),
      timestamp: input.now?.toISOString() ?? input.completedAt,
      type: 'QUEST_COMPLETED',
      questId: input.definition.id,
      questName: input.definition.name,
      heroDayKey: input.heroDayKey,
      completedAt: input.completedAt,
      grade: input.grade,
      minutesOffset: input.minutesOffset,
    }
  }

  const definition = definitionOrInput
  const completedAt = now.toISOString()
  return {
    id: crypto.randomUUID(),
    timestamp: completedAt,
    type: 'QUEST_COMPLETED',
    questId: definition.id,
    questName: definition.name,
    heroDayKey: getActiveHeroDayKey(now),
    completedAt,
    grade: 'completed',
    minutesOffset: 0,
  }
}

export function recordQuestFailed(
  definition: QuestDefinition,
  now: Date = getCurrentGameTime(),
  heroDayKey?: string,
): GameEvent {
  const key = heroDayKey ?? getActiveHeroDayKey(now)
  return {
    ...makeEventBase(now),
    type: 'QUEST_FAILED',
    questId: definition.id,
    questName: definition.name,
    heroDayKey: key,
    periodKey: key,
  }
}

export function recordLevelUp(level: number, now: Date = getCurrentGameTime()): GameEvent {
  return { ...makeEventBase(now), type: 'LEVEL_UP', level }
}

export function recordStreakIncreased(
  streak: number,
  now: Date = getCurrentGameTime(),
): GameEvent {
  return { ...makeEventBase(now), type: 'STREAK_INCREASED', streak }
}

export function recordStreakBroken(
  previousStreak: number,
  now: Date = getCurrentGameTime(),
): GameEvent {
  return { ...makeEventBase(now), type: 'STREAK_BROKEN', previousStreak }
}

export function recordUnlockEarned(
  definition: UnlockDefinition,
  now: Date = getCurrentGameTime(),
): GameEvent {
  return {
    ...makeEventBase(now),
    type: 'UNLOCK_EARNED',
    unlockId: definition.id,
    unlockName: definition.name,
  }
}

export function recordAchievementUnlocked(
  definition: AchievementDefinition,
  now: Date = getCurrentGameTime(),
): GameEvent {
  return {
    ...makeEventBase(now),
    type: 'ACHIEVEMENT_UNLOCKED',
    achievementId: definition.id,
    achievementName: definition.name,
  }
}

export interface WorkoutCompletedEventInput {
  activity: WorkoutActivity
  now?: Date
}

export function recordWorkoutCompleted(
  input: WorkoutCompletedEventInput,
): GameEvent {
  const now = input.now ?? getCurrentGameTime()
  return {
    ...makeEventBase(now),
    type: 'WORKOUT_COMPLETED',
    questId: input.activity.questId,
    activityId: input.activity.id,
    templateId: input.activity.templateId,
    templateName: input.activity.templateName,
    heroDayKey: input.activity.heroDayKey,
    completedAt: input.activity.completedAt,
    durationMinutes: input.activity.durationMinutes,
    exerciseCount: input.activity.exerciseCount,
    setCount: input.activity.setCount,
    completedSetCount: input.activity.completedSetCount,
    totalReps: input.activity.totalReps,
    totalVolume: input.activity.totalVolume,
  }
}

export interface PersonalRecordAchievedEventInput {
  heroDayKey: string
  assessmentId: string
  assessmentKind: 'baseline' | 'performance'
  exerciseId: string
  exerciseFamilyId: string
  prType: PersonalRecordHistoryEntry['prType']
  previousDisplayValue: string | null
  newDisplayValue: string
  previousValue: number | null
  newValue: number
  now?: Date
}

export function recordPersonalRecordAchieved(
  input: PersonalRecordAchievedEventInput,
): GameEvent {
  const now = input.now ?? getCurrentGameTime()
  return {
    ...makeEventBase(now),
    type: 'PERSONAL_RECORD_ACHIEVED',
    heroDayKey: input.heroDayKey,
    assessmentId: input.assessmentId,
    assessmentKind: input.assessmentKind,
    exerciseId: input.exerciseId,
    exerciseFamilyId: input.exerciseFamilyId,
    prType: input.prType,
    previousDisplayValue: input.previousDisplayValue,
    newDisplayValue: input.newDisplayValue,
    previousValue: input.previousValue,
    newValue: input.newValue,
  }
}

/**
 * Diffs quest status before/after a reconcile pass and returns one
 * `QUEST_FAILED` event per quest that just transitioned into `missed`.
 *
 * Historical only — never consulted for current availability. Pass
 * `periodKey` + `existingEvents` so re-entering the same missed window
 * after a simulated-time rewind does not emit a duplicate.
 */
export function findNewlyMissedQuestEvents(
  before: QuestState[],
  after: QuestState[],
  definitions: QuestDefinition[],
  now: Date = getCurrentGameTime(),
  options?: {
    periodKey: string
    existingEvents: GameEvent[]
  },
): GameEvent[] {
  const beforeStatus = new Map(before.map((q) => [q.id, q.status]))
  const definitionMap = new Map(definitions.map((d) => [d.id, d]))
  const periodKey = options?.periodKey
  const existingEvents = options?.existingEvents ?? []
  const events: GameEvent[] = []

  for (const quest of after) {
    if (quest.status === 'missed' && beforeStatus.get(quest.id) !== 'missed') {
      if (periodKey && hasQuestFailedEventForPeriod(existingEvents, quest.id, periodKey)) {
        continue
      }

      const definition = definitionMap.get(quest.id)
      if (definition && questSupportsPlayerMiss(definition)) {
        events.push(recordQuestFailed(definition, now, periodKey))
      }
    }
  }

  return events
}

/** True when history already recorded a miss for this quest on this quest-day. */
export function hasQuestFailedEventForPeriod(
  events: GameEvent[],
  questId: string,
  periodKey: string,
): boolean {
  return events.some(
    (event) =>
      event.type === 'QUEST_FAILED' &&
      event.questId === questId &&
      (event.heroDayKey === periodKey || event.periodKey === periodKey),
  )
}

export function getEventHeroDayKey(event: GameEvent): string | null {
  if (event.type === 'QUEST_FAILED') {
    return event.heroDayKey ?? event.periodKey ?? null
  }
  if (event.type === 'QUEST_COMPLETED') {
    return event.heroDayKey
  }
  if (event.type === 'WORKOUT_COMPLETED') {
    return event.heroDayKey
  }
  if (event.type === 'PERSONAL_RECORD_ACHIEVED') {
    return event.heroDayKey
  }
  return null
}

/** Diffs unlock state before/after and returns one `UNLOCK_EARNED` event per newly-unlocked entry. */
export function findNewlyUnlockedEvents(
  before: UnlockState[],
  after: UnlockState[],
  definitions: UnlockDefinition[],
  now: Date = getCurrentGameTime(),
): GameEvent[] {
  const beforeUnlocked = new Map(before.map((u) => [u.id, u.unlocked]))
  const definitionMap = new Map(definitions.map((d) => [d.id, d]))
  const events: GameEvent[] = []

  for (const unlock of after) {
    if (unlock.unlocked && !beforeUnlocked.get(unlock.id)) {
      const definition = definitionMap.get(unlock.id)
      if (definition) events.push(recordUnlockEarned(definition, now))
    }
  }

  return events
}

/**
 * Derives streak-related events purely by observing a before/after
 * `StreakState` snapshot — does not change `resolveStreakState` itself.
 *
 * Breaks are detected when `currentStreak` drops to 0 after a positive
 * streak (day-end expiry). A legacy "broken and restarted at 1" transition
 * is still recognized for older saves that never went through 0.
 */
export function deriveStreakEvents(
  before: StreakState,
  after: StreakState,
  now: Date = getCurrentGameTime(),
): GameEvent[] {
  if (after.currentStreak > before.currentStreak) {
    return [recordStreakIncreased(after.currentStreak, now)]
  }

  if (before.currentStreak > 0 && after.currentStreak === 0) {
    return [recordStreakBroken(before.currentStreak, now)]
  }

  const brokenAndRestarted =
    after.currentStreak === 1 &&
    before.currentStreak > 1 &&
    before.lastNonNegotiableCompleteDate !== null &&
    after.lastNonNegotiableCompleteDate !== before.lastNonNegotiableCompleteDate

  if (brokenAndRestarted) {
    return [recordStreakBroken(before.currentStreak, now)]
  }

  return []
}

/** Appends new events, keeping the persisted history bounded to the most recent `MAX_STORED_EVENTS`. */
export function appendEvents(events: GameEvent[], newEvents: GameEvent[]): GameEvent[] {
  if (newEvents.length === 0) return events

  const combined = [...events, ...newEvents]
  return combined.length > MAX_STORED_EVENTS
    ? combined.slice(combined.length - MAX_STORED_EVENTS)
    : combined
}

/** Most recent player-visible events first, capped to `limit`. */
export function getRecentEvents(events: GameEvent[], limit = 5): GameEvent[] {
  return events
    .filter((event) => isPlayerVisibleQuestFailedEvent(event, QUEST_DEFINITIONS))
    .slice(-limit)
    .reverse()
}

export function getEventIcon(event: GameEvent): string {
  switch (event.type) {
    case 'QUEST_COMPLETED':
      return '✅'
    case 'QUEST_FAILED':
      return '❌'
    case 'LEVEL_UP':
      return '⭐'
    case 'STREAK_INCREASED':
      return '🔥'
    case 'STREAK_BROKEN':
      return '💔'
    case 'UNLOCK_EARNED':
      return '🔓'
    case 'ACHIEVEMENT_UNLOCKED':
      return '🏆'
    case 'WORKOUT_COMPLETED':
      return '🏋️'
    case 'PERSONAL_RECORD_ACHIEVED':
      return '🏆'
  }
}

export function formatEventLabel(event: GameEvent): string {
  switch (event.type) {
    case 'QUEST_COMPLETED':
      return `Completed "${event.questName}"`
    case 'QUEST_FAILED':
      return `Missed "${event.questName}"`
    case 'LEVEL_UP':
      return `Reached Level ${event.level}`
    case 'STREAK_INCREASED':
      return `Streak reached ${event.streak} ${event.streak === 1 ? 'day' : 'days'}`
    case 'STREAK_BROKEN':
      return `Streak broken (was ${event.previousStreak} ${event.previousStreak === 1 ? 'day' : 'days'})`
    case 'UNLOCK_EARNED':
      return `Unlocked ${event.unlockName}`
    case 'ACHIEVEMENT_UNLOCKED':
      return `Achievement unlocked: "${event.achievementName}"`
    case 'WORKOUT_COMPLETED': {
      const duration =
        event.durationMinutes != null ? `${event.durationMinutes} min` : '—'
      const sets = event.completedSetCount ?? event.setCount
      return `${event.templateName} Workout · ${duration} · ${event.exerciseCount} exercises · ${sets} sets`
    }
    case 'PERSONAL_RECORD_ACHIEVED': {
      const name = getBenchmarkExerciseName(event.exerciseId)
      const from = event.previousDisplayValue ?? '—'
      return `New Personal Record · ${name} · ${from} → ${event.newDisplayValue}`
    }
  }
}

export function formatRelativeTime(
  timestamp: string,
  now: Date = getCurrentGameTime(),
): string {
  const diffMs = now.getTime() - new Date(timestamp).getTime()
  const minutes = Math.max(0, Math.round(diffMs / 60_000))

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
