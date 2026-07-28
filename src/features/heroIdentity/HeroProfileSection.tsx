import { useMemo } from 'react'

import { Accordion } from '@/components/Accordion'
import { QUEST_DEFINITIONS } from '@/data/quests'
import { selectAnalyticsInput } from '@/features/analytics/analyticsSelectors'
import { selectHeroProfile } from '@/features/heroIdentity/heroProfileSelectors'
import { HeroProfilePanel } from '@/features/heroIdentity/HeroProfilePanel'
import { useGameTime } from '@/lib/useGameTime'
import { useGameStore } from '@/store/gameStore'

export function HeroProfileSection() {
  const hero = useGameStore((s) => s.hero)
  const currentStreak = useGameStore((s) => s.currentStreak)
  const history = useGameStore((s) => s.history)
  const workout = useGameStore((s) => s.workout)
  const performance = useGameStore((s) => s.performance)
  const heroIdentity = useGameStore((s) => s.heroIdentity)
  const quests = useGameStore((s) => s.quests)
  const events = useGameStore((s) => s.events)
  const achievements = useGameStore((s) => s.achievements)
  const dayStartHeroSnapshot = useGameStore((s) => s.dayStartHeroSnapshot)
  const questHistory = useGameStore((s) => s.questHistory)
  const coaching = useGameStore((s) => s.coaching)
  const nutrition = useGameStore((s) => s.nutrition)
  const now = useGameTime()

  const profile = useMemo(() => {
    const analytics = selectAnalyticsInput(
      {
        hero,
        currentStreak,
        history,
        events,
        quests,
        achievements,
        dayStartHeroSnapshot,
        questHistory,
        workout,
        performance,
        coaching,
        nutrition,
        heroIdentity,
      },
      now,
    )

    return selectHeroProfile({
      hero,
      currentStreak,
      history,
      workoutActivities: workout.activities,
      performance,
      questDefinitions: QUEST_DEFINITIONS,
      now,
      analytics,
      heroIdentity,
    })
  }, [
    hero,
    currentStreak,
    history,
    workout.activities,
    performance,
    heroIdentity,
    quests,
    events,
    achievements,
    dayStartHeroSnapshot,
    questHistory,
    coaching,
    nutrition,
    now,
  ])

  const meta = [
    profile.heroTitle ?? profile.currentRank,
    `${profile.unlockedAccomplishments.length} milestone${profile.unlockedAccomplishments.length === 1 ? '' : 's'}`,
  ].join(' · ')

  return (
    <Accordion
      title="Hero Profile"
      meta={meta}
      defaultExpanded
      persistKey="hero:profile"
      variant="subcategory"
    >
      <HeroProfilePanel profile={profile} />
    </Accordion>
  )
}
