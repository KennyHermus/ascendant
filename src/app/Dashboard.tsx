import { useEffect, useMemo, useState } from 'react'

import { UNLOCK_DEFINITIONS } from '@/data/unlocks'
import { QUEST_DEFINITIONS } from '@/data/quests'
import { DevToolsLazy } from '@/dev/DevToolsLazy'
import { AchievementPanel } from '@/features/achievements/AchievementPanel'
import { AchievementUnlockedPopup } from '@/features/achievements/AchievementUnlockedPopup'
import { ACHIEVEMENT_DEFINITIONS } from '@/features/achievements/achievementDefinitions'
import { useAchievementUnlockPopups } from '@/features/achievements/useAchievementUnlockPopups'
import { ActiveObjectives } from '@/features/dashboard/ActiveObjectives'
import { getActiveObjectives } from '@/features/dashboard/activeObjectivesLogic'
import { getNextObjective } from '@/features/dashboard/nextObjectiveLogic'
import { AnalyticsDashboard } from '@/features/analytics/AnalyticsDashboard'
import { getRecentEvents } from '@/features/events/eventLogic'
import { RecentProgress } from '@/features/events/RecentProgress'
import { HeroBanner } from '@/features/hero/HeroBanner'
import { getHeroStatus } from '@/features/hero/heroPresentation'
import { StatsPanel } from '@/features/hero/StatsPanel'
import { getActiveQuestDayKey } from '@/features/quests/questDay'
import { getNonNegotiableStatusBreakdown } from '@/features/quests/questLogic'
import { getTodaysJourneyProgress } from '@/features/quests/questProgress'
import { QuestList } from '@/features/quests/QuestList'
import { TodaysJourney } from '@/features/quests/TodaysJourney'
import { DailySummaryBanner } from '@/features/summary/DailySummaryBanner'
import { isDailySummaryDisplayable } from '@/features/summary/dailySummaryLogic'
import { DailySummaryModal } from '@/features/summary/DailySummaryModal'
import { UnlockList } from '@/features/unlocks/UnlockList'
import { useGameTime } from '@/lib/useGameTime'
import { useGameStore } from '@/store/gameStore'

export function Dashboard() {
  const hero = useGameStore((s) => s.hero)
  const quests = useGameStore((s) => s.quests)
  const events = useGameStore((s) => s.events)
  const currentStreak = useGameStore((s) => s.currentStreak)
  const achievements = useGameStore((s) => s.achievements)
  const dailySummary = useGameStore((s) => s.dailySummary)
  const dailySummaryViewed = useGameStore((s) => s.dailySummaryViewed)
  const completeQuest = useGameStore((s) => s.completeQuest)
  const applyPeriodResets = useGameStore((s) => s.applyPeriodResets)
  const evaluateTimedQuests = useGameStore((s) => s.evaluateTimedQuests)
  const evaluateUnlocks = useGameStore((s) => s.evaluateUnlocks)
  const syncDailySummary = useGameStore((s) => s.syncDailySummary)
  const viewDailySummary = useGameStore((s) => s.viewDailySummary)

  const [isSummaryOpen, setSummaryOpen] = useState(false)
  const now = useGameTime()
  const activeQuestDayKey = getActiveQuestDayKey(QUEST_DEFINITIONS, now)

  const progress = useMemo(
    () => getTodaysJourneyProgress(quests, QUEST_DEFINITIONS, now),
    [quests, now],
  )

  const heroStatus = useMemo(() => {
    const breakdown = getNonNegotiableStatusBreakdown(
      quests,
      QUEST_DEFINITIONS,
      now,
    )
    return getHeroStatus(breakdown)
  }, [quests, now])

  const nextObjective = useMemo(
    () => getNextObjective(quests, QUEST_DEFINITIONS, now),
    [quests, now],
  )

  const objectives = useMemo(
    () => getActiveObjectives(quests, QUEST_DEFINITIONS, UNLOCK_DEFINITIONS, now),
    [quests, now],
  )

  const recentEvents = useMemo(() => getRecentEvents(events, 5), [events])

  const achievementContext = useMemo(
    () => ({
      hero,
      quests,
      questDefinitions: QUEST_DEFINITIONS,
      currentStreak,
      now,
    }),
    [hero, quests, currentStreak, now],
  )

  const { current: achievementPopup, dismissCurrent: dismissAchievementPopup } =
    useAchievementUnlockPopups(ACHIEVEMENT_DEFINITIONS, achievements)

  useEffect(() => {
    applyPeriodResets()
    evaluateTimedQuests()
    evaluateUnlocks()
    syncDailySummary()
  }, [applyPeriodResets, evaluateTimedQuests, evaluateUnlocks, syncDailySummary])

  // No background timers — re-evaluate timed quests only when the tab
  // regains focus (app "resumes after being inactive").
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        applyPeriodResets()
        evaluateTimedQuests()
        evaluateUnlocks()
        syncDailySummary()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [applyPeriodResets, evaluateTimedQuests, evaluateUnlocks, syncDailySummary])

  function handleViewDailySummary() {
    setSummaryOpen(true)
  }

  function handleCloseDailySummary() {
    setSummaryOpen(false)
    viewDailySummary()
  }

  return (
    <main className="mx-auto min-h-svh max-w-2xl px-4 py-6">
      <header className="mb-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-500/70">
          Ascendant
        </p>
        <p className="mt-1 text-sm text-stone-500">Walk the Path of Resolve</p>
      </header>

      <div className="space-y-5">
        {dailySummary && isDailySummaryDisplayable(dailySummary, now) && (
          <DailySummaryBanner
            onView={handleViewDailySummary}
            isPreviousDay={dailySummary.periodKey !== activeQuestDayKey}
            viewed={dailySummaryViewed}
          />
        )}
        <HeroBanner
          hero={hero}
          currentStreak={currentStreak}
          status={heroStatus}
          nextObjective={nextObjective}
        />
        <TodaysJourney progress={progress} />
        <UnlockList quests={quests} />
        <ActiveObjectives objectives={objectives} />
        <QuestList quests={quests} onComplete={completeQuest} />
        <RecentProgress events={recentEvents} />
        <AchievementPanel states={achievements} context={achievementContext} />
        <AnalyticsDashboard />
        <StatsPanel stats={hero.stats} />

        {import.meta.env.DEV && <DevToolsLazy />}
      </div>

      {isSummaryOpen && dailySummary && (
        <DailySummaryModal summary={dailySummary} onClose={handleCloseDailySummary} />
      )}

      {achievementPopup && (
        <AchievementUnlockedPopup achievement={achievementPopup} onDismiss={dismissAchievementPopup} />
      )}
    </main>
  )
}
