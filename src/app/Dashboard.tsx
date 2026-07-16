import { useEffect, useMemo } from 'react'

import { ProgressSummary } from '@/components/ProgressSummary'
import { QUEST_DEFINITIONS } from '@/data/quests'
import { DevToolsLazy } from '@/dev/DevToolsLazy'
import { HeroCard } from '@/features/hero/HeroCard'
import { StatsPanel } from '@/features/hero/StatsPanel'
import { getQuestProgressSummary } from '@/features/quests/questLogic'
import { QuestList } from '@/features/quests/QuestList'
import { UnlockList } from '@/features/unlocks/UnlockList'
import { getCurrentGameTime } from '@/lib/gameTime'
import { useGameStore } from '@/store/gameStore'

export function Dashboard() {
  const hero = useGameStore((s) => s.hero)
  const quests = useGameStore((s) => s.quests)
  const currentStreak = useGameStore((s) => s.currentStreak)
  const completeQuest = useGameStore((s) => s.completeQuest)
  const applyPeriodResets = useGameStore((s) => s.applyPeriodResets)
  const evaluateTimedQuests = useGameStore((s) => s.evaluateTimedQuests)
  const evaluateUnlocks = useGameStore((s) => s.evaluateUnlocks)

  const progress = useMemo(
    () => getQuestProgressSummary(quests, QUEST_DEFINITIONS, getCurrentGameTime()),
    [quests],
  )

  useEffect(() => {
    applyPeriodResets()
    evaluateTimedQuests()
    evaluateUnlocks()
  }, [applyPeriodResets, evaluateTimedQuests, evaluateUnlocks])

  // No background timers — re-evaluate timed quests only when the tab
  // regains focus (app "resumes after being inactive").
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        applyPeriodResets()
        evaluateTimedQuests()
        evaluateUnlocks()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [applyPeriodResets, evaluateTimedQuests, evaluateUnlocks])

  return (
    <main className="mx-auto min-h-svh max-w-2xl px-4 py-6">
      <header className="mb-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-500/70">
          Ascendant
        </p>
        <p className="mt-1 text-sm text-stone-500">Walk the Path of Resolve</p>
      </header>

      <div className="space-y-5">
        <HeroCard hero={hero} currentStreak={currentStreak} />
        <ProgressSummary progress={progress} />
        <UnlockList quests={quests} />
        <QuestList quests={quests} onComplete={completeQuest} />
        <StatsPanel stats={hero.stats} />

        {import.meta.env.DEV && <DevToolsLazy />}
      </div>
    </main>
  )
}
