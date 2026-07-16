/**
 * Manual verification for timed-quest availability under simulated time.
 * Run: npx vite-node scripts/verify-timed-quests.mts
 *
 * Rules: available until target+grace; missed after; rewind restores available
 * while QUEST_FAILED history remains; re-expire does not duplicate the event.
 */
import { QUEST_DEFINITIONS } from '../src/data/quests.ts'
import { findNewlyMissedQuestEvents } from '../src/features/events/eventLogic.ts'
import { getActiveQuestDayKey } from '../src/features/quests/questDay.ts'
import { createQuestStates } from '../src/features/quests/questLogic.ts'
import {
  evaluateQuestTiming,
  evaluateQuestTimingForDay,
  getEffectiveQuestStatus,
  reconcileTimedQuestStatuses,
  reconcileTimedQuestStatusesForDay,
} from '../src/features/quests/questTiming.ts'
import {
  clearSimulatedGameTime,
  setSimulatedGameTime,
} from '../src/lib/gameTime.ts'
import type { GameEvent } from '../src/types/event.ts'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error('FAIL:', message)
    process.exitCode = 1
  } else {
    console.log('OK:', message)
  }
}

const wake = QUEST_DEFINITIONS.find((d) => d.id === 'wake-up')!
const sleep = QUEST_DEFINITIONS.find((d) => d.id === 'sleep')!

// Scenario A: Wake Up expire → event → rewind → available; event kept; re-expire no dup
{
  const day = '2026-07-16'
  let quests = createQuestStates(QUEST_DEFINITIONS)
  let events: GameEvent[] = []

  const at0600 = new Date(2026, 6, 16, 6, 0, 0)
  setSimulatedGameTime(at0600)
  quests = reconcileTimedQuestStatuses(quests, QUEST_DEFINITIONS, at0600, day)
  assert(
    getEffectiveQuestStatus(
      quests.find((q) => q.id === 'wake-up')!.status,
      wake,
      at0600,
      day,
    ) === 'available',
    '06:00: Wake Up available',
  )

  const at0800 = new Date(2026, 6, 16, 8, 0, 0)
  setSimulatedGameTime(at0800)
  const beforeExpire = quests
  quests = reconcileTimedQuestStatuses(quests, QUEST_DEFINITIONS, at0800, day)
  const firstMiss = findNewlyMissedQuestEvents(
    beforeExpire,
    quests,
    QUEST_DEFINITIONS,
    at0800,
    { periodKey: day, existingEvents: events },
  )
  events = [...events, ...firstMiss]
  assert(quests.find((q) => q.id === 'wake-up')?.status === 'missed', '08:00: missed')
  assert(firstMiss.length === 1, '08:00: QUEST_FAILED emitted once')
  assert(events.length === 1, 'history has one miss event')

  const at0700 = new Date(2026, 6, 16, 7, 0, 0)
  setSimulatedGameTime(at0700)
  quests = reconcileTimedQuestStatuses(quests, QUEST_DEFINITIONS, at0700, day)
  assert(
    getEffectiveQuestStatus(
      quests.find((q) => q.id === 'wake-up')!.status,
      wake,
      at0700,
      day,
    ) === 'available',
    '07:00 rewind: available again',
  )
  assert(events.length === 1, '07:00 rewind: miss event still in history')

  const beforeReExpire = quests
  quests = reconcileTimedQuestStatuses(quests, QUEST_DEFINITIONS, at0800, day)
  const secondMiss = findNewlyMissedQuestEvents(
    beforeReExpire,
    quests,
    QUEST_DEFINITIONS,
    at0800,
    { periodKey: day, existingEvents: events },
  )
  events = [...events, ...secondMiss]
  assert(quests.find((q) => q.id === 'wake-up')?.status === 'missed', '08:00 again: missed')
  assert(secondMiss.length === 0, '08:00 again: no duplicate QUEST_FAILED')
  assert(events.length === 1, 'history still has exactly one miss event')
}

// Scenario B: Sleep overnight pin + ending-day sweep
{
  const monGrace = new Date(2026, 6, 16, 23, 50, 0)
  const tueAfter = new Date(2026, 6, 17, 0, 20, 0)
  const monRewind = new Date(2026, 6, 16, 22, 30, 0)

  assert(
    evaluateQuestTiming(sleep.timing!, monGrace).phase === 'inGracePeriod',
    'Sleep: Thu 23:50 in grace',
  )
  assert(
    getActiveQuestDayKey(QUEST_DEFINITIONS, monGrace) === '2026-07-16',
    'Sleep: Thu 23:50 still Thursday quest day',
  )
  assert(
    evaluateQuestTimingForDay(
      sleep.timing!,
      '2026-07-16',
      new Date(2026, 6, 17, 0, 10, 0),
    ).phase === 'inGracePeriod',
    'Sleep: Fri 00:10 still Thursday grace',
  )

  let quests = createQuestStates(QUEST_DEFINITIONS)
  let events: GameEvent[] = []
  quests = reconcileTimedQuestStatuses(
    quests,
    QUEST_DEFINITIONS,
    monGrace,
    '2026-07-16',
  )

  const beforeSweep = quests
  quests = reconcileTimedQuestStatusesForDay(
    quests,
    QUEST_DEFINITIONS,
    '2026-07-16',
    tueAfter,
  )
  const missEvents = findNewlyMissedQuestEvents(
    beforeSweep,
    quests,
    QUEST_DEFINITIONS,
    tueAfter,
    { periodKey: '2026-07-16', existingEvents: events },
  )
  events = [...events, ...missEvents]
  assert(
    quests.find((q) => q.id === 'sleep')?.status === 'missed',
    'Sleep: ending-day sweep marks missed',
  )
  assert(missEvents.length === 1, 'Sleep: one QUEST_FAILED for Thursday')

  quests = reconcileTimedQuestStatuses(
    quests,
    QUEST_DEFINITIONS,
    monRewind,
    '2026-07-16',
  )
  assert(
    getEffectiveQuestStatus(
      quests.find((q) => q.id === 'sleep')!.status,
      sleep,
      monRewind,
      '2026-07-16',
    ) === 'available',
    'Sleep: rewind to 22:30 → available',
  )
  assert(events.length === 1, 'Sleep: miss event remains in history')

  const beforeAgain = quests
  quests = reconcileTimedQuestStatusesForDay(
    quests,
    QUEST_DEFINITIONS,
    '2026-07-16',
    tueAfter,
  )
  const missAgain = findNewlyMissedQuestEvents(
    beforeAgain,
    quests,
    QUEST_DEFINITIONS,
    tueAfter,
    { periodKey: '2026-07-16', existingEvents: events },
  )
  assert(missAgain.length === 0, 'Sleep: re-expire same window → no duplicate event')
}

clearSimulatedGameTime()

if (process.exitCode) {
  console.error('\nTimed quest verification failed.')
} else {
  console.log('\nAll timed quest scenarios passed.')
}
