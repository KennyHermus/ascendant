import { isQuestActiveOn } from '@/features/quests/questSchedule'
import { questSupportsPlayerMiss } from '@/features/quests/questMissPolicy'
import { getCurrentGameTime } from '@/lib/gameTime'
import { parseCalendarDateKey, formatCalendarDateKey } from '@/lib/timeService'
import type { QuestDefinition, QuestState, QuestStatus, QuestTiming } from '@/types/quest'

export const TIMING_PHASES = ['onTime', 'inGracePeriod', 'expired'] as const

export type TimingPhase = (typeof TIMING_PHASES)[number]

export interface TimingEvaluation {
  phase: TimingPhase
  /** The moment the quest becomes Missed if not yet completed. */
  deadline: Date
  /** Minutes until targetTime, only meaningful while phase is 'onTime'. */
  minutesUntilTarget: number | null
  /** Minutes until the grace deadline, meaningful while not yet expired. */
  minutesUntilDeadline: number | null
}

/**
 * Builds the target Date for a specific calendar day.
 * A target of 00:00 represents "end of day" and is pushed to the next
 * calendar day so "before midnight" quests behave intuitively all day long.
 */
function buildTargetOnDay(timing: QuestTiming, day: Date): Date {
  const [hours, minutes] = timing.targetTime.split(':').map(Number)
  const target = new Date(day)
  target.setHours(hours, minutes, 0, 0)

  if (hours === 0 && minutes === 0) {
    target.setDate(target.getDate() + 1)
  }

  return target
}

/**
 * Resolves which occurrence of `targetTime` applies at `reference`.
 *
 * Grace windows that cross midnight (e.g. Sleep 23:45 + 30m → 00:15) must
 * keep evaluating against the *previous* calendar day's target during those
 * early-morning minutes — otherwise 00:10 snaps to *tonight's* 23:45 and the
 * quest never appears expired/in-grace for the night that just ended.
 */
function getTargetDateTime(timing: QuestTiming, reference: Date): Date {
  const todayTarget = buildTargetOnDay(timing, reference)
  const todayDeadline = new Date(
    todayTarget.getTime() + timing.graceMinutes * 60_000,
  )

  // Inside today's completable window (at/after target, through grace).
  if (
    reference.getTime() >= todayTarget.getTime() &&
    reference.getTime() <= todayDeadline.getTime()
  ) {
    return todayTarget
  }

  // Before today's target — may still be inside yesterday's grace window.
  if (reference.getTime() < todayTarget.getTime()) {
    const yesterday = new Date(reference)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayTarget = buildTargetOnDay(timing, yesterday)
    const yesterdayDeadline = new Date(
      yesterdayTarget.getTime() + timing.graceMinutes * 60_000,
    )
    if (reference.getTime() <= yesterdayDeadline.getTime()) {
      return yesterdayTarget
    }
  }

  return todayTarget
}

/**
 * Target/deadline for a specific quest-day key (not "whichever occurrence
 * is live right now"). Used when sweeping the day that's about to reset so
 * a jumped simulated clock still marks that day's timed quests missed.
 */
export function evaluateQuestTimingForDay(
  timing: QuestTiming,
  dayKey: string,
  now: Date = getCurrentGameTime(),
): TimingEvaluation {
  const target = buildTargetOnDay(timing, parseCalendarDateKey(dayKey))
  return buildTimingEvaluation(target, timing.graceMinutes, now)
}

/**
 * Evaluates timing independent of quest status. A quest can be `available`
 * and `expired` for a brief moment before the next sweep marks it `missed`.
 *
 * Overnight-aware: during a grace window that crosses midnight, keeps using
 * the previous calendar day's target. Prefer `evaluateQuestTimingForDay`
 * when the active quest-day key is already known (daily reset / UI).
 */
export function evaluateQuestTiming(
  timing: QuestTiming,
  now: Date = getCurrentGameTime(),
): TimingEvaluation {
  const target = getTargetDateTime(timing, now)
  return buildTimingEvaluation(target, timing.graceMinutes, now)
}

function buildTimingEvaluation(
  target: Date,
  graceMinutes: number,
  now: Date,
): TimingEvaluation {
  const deadline = new Date(target.getTime() + graceMinutes * 60_000)

  const msUntilTarget = target.getTime() - now.getTime()
  const msUntilDeadline = deadline.getTime() - now.getTime()

  let phase: TimingPhase
  if (msUntilTarget > 0) {
    phase = 'onTime'
  } else if (msUntilDeadline > 0) {
    phase = 'inGracePeriod'
  } else {
    phase = 'expired'
  }

  return {
    phase,
    deadline,
    minutesUntilTarget:
      phase === 'onTime' ? Math.ceil(msUntilTarget / 60_000) : null,
    minutesUntilDeadline:
      phase !== 'expired' ? Math.ceil(msUntilDeadline / 60_000) : null,
  }
}

function questsEqual(a: QuestState[], b: QuestState[]): boolean {
  if (a.length !== b.length) return false
  const bMap = new Map(b.map((q) => [q.id, q.status]))
  return a.every((q) => bMap.get(q.id) === q.status)
}

/**
 * Current timed-quest availability.
 *
 * After the grace window, timed quests remain completable (late / `completed`
 * grade) until Hero Day ends — they are not auto-marked `missed` mid-day.
 * Misses are finalized at Hero Day advance only.
 */
export function getEffectiveQuestStatus(
  persisted: QuestStatus,
  definition: QuestDefinition | undefined,
  _now: Date,
  _dayKey: string,
): QuestStatus {
  if (persisted === 'missed' && definition && !questSupportsPlayerMiss(definition)) {
    return 'available'
  }
  if (persisted === 'completed') return 'completed'
  if (persisted === 'missed') return 'missed'
  return 'available'
}

/**
 * During live play, do not auto-mark timed quests missed when grace expires.
 * Only clears erroneous `missed` on rewind. Day-end sweep handles misses.
 */
export function reconcileTimedQuestStatuses(
  quests: QuestState[],
  definitions: QuestDefinition[],
  _now: Date = getCurrentGameTime(),
  _dayKey?: string,
): QuestState[] {
  void definitions
  void _now
  void _dayKey

  const reconciled = quests.map((quest) => {
    if (quest.status === 'missed') {
      return { ...quest, status: 'available' as const }
    }
    return quest
  })

  return questsEqual(reconciled, quests) ? quests : reconciled
}

/**
 * At Hero Day advance: mark still-`available` **required Non-Negotiable** quests
 * that were active on `dayKey` as `missed`. Bonus / weekly quests reset without
 * a visible miss state.
 */
export function reconcileTimedQuestStatusesForDay(
  quests: QuestState[],
  definitions: QuestDefinition[],
  dayKey: string,
  _now: Date = getCurrentGameTime(),
): QuestState[] {
  const dayReference = parseCalendarDateKey(dayKey)
  const definitionMap = new Map(definitions.map((d) => [d.id, d]))

  const reconciled = quests.map((quest) => {
    if (quest.status !== 'available') return quest
    const definition = definitionMap.get(quest.id)
    if (!definition || !isQuestActiveOn(definition, dayReference)) {
      return quest
    }
    if (!questSupportsPlayerMiss(definition)) {
      return quest
    }
    return { ...quest, status: 'missed' as const }
  })

  return questsEqual(reconciled, quests) ? quests : reconciled
}

export interface NextTimedQuest {
  definition: QuestDefinition
  timing: TimingEvaluation
}

/**
 * The single soonest-deadline `available` timed quest active today, if any.
 * Shared by every "what's next" consumer (Active Objectives, the Hero
 * Card's Next Objective) so the "which timed quest is next" rule is defined
 * once. Excludes a quest whose timing is `expired` but not yet reconciled
 * to `missed` — a stale-state guard, not a new mechanic.
 */
export function findNextTimedQuest(
  quests: QuestState[],
  definitions: QuestDefinition[],
  now: Date = getCurrentGameTime(),
  /** Calendar day used for weekday/weekend schedule checks. Defaults to `now`. */
  scheduleDate: Date = now,
  /** Active quest-day key for timing evaluation. Defaults to `scheduleDate`'s key. */
  dayKey: string = formatCalendarDateKey(scheduleDate),
): NextTimedQuest | undefined {
  const questStatus = new Map(quests.map((q) => [q.id, q.status]))

  return definitions
    .filter((d) => {
      if (d.timing === undefined) return false
      if (!isQuestActiveOn(d, scheduleDate)) return false
      const persisted = questStatus.get(d.id) ?? 'available'
      return getEffectiveQuestStatus(persisted, d, now, dayKey) === 'available'
    })
    .map((definition) => ({
      definition,
      timing: evaluateQuestTimingForDay(definition.timing!, dayKey, now),
    }))
    .sort((a, b) => a.timing.deadline.getTime() - b.timing.deadline.getTime())[0]
}

export function formatTargetTime(targetTime: string): string {
  const [hours, minutes] = targetTime.split(':').map(Number)
  const d = getCurrentGameTime()
  d.setHours(hours, minutes, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function formatGraceLabel(graceMinutes: number): string {
  return `${graceMinutes} min grace`
}

/** "45 min" under an hour, "2h" / "2h 15m" once it crosses an hour — avoids showing raw 3-digit minute counts. */
export function formatRemainingMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`
}

export function formatTimingStatusLabel(
  phase: TimingPhase,
  minutesUntilTarget: number | null,
  minutesUntilDeadline: number | null,
): string {
  switch (phase) {
    case 'onTime':
      return minutesUntilTarget !== null
        ? `Due in ${formatRemainingMinutes(minutesUntilTarget)}`
        : 'On time'
    case 'inGracePeriod':
      return minutesUntilDeadline !== null
        ? `Grace period — ${formatRemainingMinutes(minutesUntilDeadline)} left`
        : 'Grace period'
    case 'expired':
      return 'Expired'
  }
}
