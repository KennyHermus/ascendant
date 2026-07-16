import { getCurrentGameTime } from '@/lib/gameTime'
import type { QuestDefinition, QuestState, QuestTiming } from '@/types/quest'

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
 * Resolves the target Date for "today" relative to `reference`.
 * A target of 00:00 represents "end of day" and is pushed to the next
 * calendar day so "before midnight" quests behave intuitively all day long.
 */
function getTargetDateTime(timing: QuestTiming, reference: Date): Date {
  const [hours, minutes] = timing.targetTime.split(':').map(Number)
  const target = new Date(reference)
  target.setHours(hours, minutes, 0, 0)

  if (hours === 0 && minutes === 0) {
    target.setDate(target.getDate() + 1)
  }

  return target
}

/**
 * Evaluates timing independent of quest status. A quest can be `available`
 * and `expired` for a brief moment before the next sweep marks it `missed`.
 */
export function evaluateQuestTiming(
  timing: QuestTiming,
  now: Date = getCurrentGameTime(),
): TimingEvaluation {
  const target = getTargetDateTime(timing, now)
  const deadline = new Date(target.getTime() + timing.graceMinutes * 60_000)

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
 * Reconciles `available`/`missed` timed-quest status against the current
 * timing evaluation, in *both* directions:
 *  - `available` quests whose deadline has passed become `missed`.
 *  - `missed` quests whose deadline is no longer passed become `available`
 *    again.
 *
 * The second direction can't happen from real time passing (time only moves
 * forward), but it's reachable through the dev time-simulation tool moving
 * the clock backward — e.g. rewinding past a quest's deadline after it was
 * already swept to `missed`. `missed` isn't independent state; it's a pure
 * function of "is this quest, right now, past its deadline and not yet
 * completed" — this sweep IS the only thing that ever sets or clears it, so
 * treating it as re-derivable rather than sticky keeps displayed state
 * always consistent with the current clock. `completed` quests are never
 * touched, timing or not.
 *
 * Pure and side-effect free; callers persist the result if it differs.
 * Called on app load, tab resume, refresh, quest completion, and every dev
 * time-simulation action — never on a background timer.
 */
export function reconcileTimedQuestStatuses(
  quests: QuestState[],
  definitions: QuestDefinition[],
  now: Date = getCurrentGameTime(),
): QuestState[] {
  const definitionMap = new Map(definitions.map((d) => [d.id, d]))

  const reconciled = quests.map((quest) => {
    if (quest.status === 'completed') return quest

    const definition = definitionMap.get(quest.id)
    if (!definition?.timing) return quest

    const timing = evaluateQuestTiming(definition.timing, now)
    const shouldBeMissed = timing.phase === 'expired'

    if (shouldBeMissed && quest.status !== 'missed') {
      return { ...quest, status: 'missed' as const }
    }
    if (!shouldBeMissed && quest.status === 'missed') {
      return { ...quest, status: 'available' as const }
    }

    return quest
  })

  return questsEqual(reconciled, quests) ? quests : reconciled
}

export function formatTargetTime(targetTime: string): string {
  const [hours, minutes] = targetTime.split(':').map(Number)
  const d = new Date()
  d.setHours(hours, minutes, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function formatGraceLabel(graceMinutes: number): string {
  return `${graceMinutes} min grace`
}

export function formatTimingStatusLabel(
  phase: TimingPhase,
  minutesUntilTarget: number | null,
  minutesUntilDeadline: number | null,
): string {
  switch (phase) {
    case 'onTime':
      return minutesUntilTarget !== null
        ? `Due in ${minutesUntilTarget} min`
        : 'On time'
    case 'inGracePeriod':
      return minutesUntilDeadline !== null
        ? `Grace period — ${minutesUntilDeadline} min left`
        : 'Grace period'
    case 'expired':
      return 'Expired'
  }
}
