import { useMemo, useState } from 'react'

import { Accordion } from '@/components/Accordion'
import { QUEST_DEFINITIONS } from '@/data/quests'
import { UNLOCK_DEFINITIONS } from '@/data/unlocks'
import { SectionPanel } from '@/features/analytics/components/SectionPanel'
import { ACHIEVEMENT_DEFINITIONS } from '@/features/achievements/achievementDefinitions'
import {
  buildContributionCalendar,
  getCalendarMonthLabels,
} from '@/features/history/historyCalendar'
import { buildDailyHistoryDetail } from '@/features/history/historyDaily'
import { buildTimelineGroups } from '@/features/history/historyTimeline'
import { getActiveQuestDayKey } from '@/features/quests/questDay'
import { useGameTime } from '@/lib/useGameTime'
import { useGameStore } from '@/store/gameStore'
import type { TimelineFilterCategory } from '@/types/historyUi'

import { ContributionCalendar } from './components/ContributionCalendar'
import { DailyHistoryView } from './components/DailyHistoryView'
import { HeroTimeline } from './components/HeroTimeline'
import { TimelineFilterBar } from './components/TimelineFilterBar'
import { useHeroHistoryNavigation } from './heroHistoryNavigation'

export function HeroHistoryPanel() {
  const history = useGameStore((s) => s.history)
  const events = useGameStore((s) => s.events)
  const dailySummary = useGameStore((s) => s.dailySummary)
  const navigation = useHeroHistoryNavigation()
  const now = useGameTime()
  const todayKey = getActiveQuestDayKey(QUEST_DEFINITIONS, now)

  const [filter, setFilter] = useState<TimelineFilterCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const calendarColumns = useMemo(
    () => buildContributionCalendar({ history, todayKey }),
    [history, todayKey],
  )
  const monthLabels = useMemo(
    () => getCalendarMonthLabels(calendarColumns),
    [calendarColumns],
  )

  const timelineGroups = useMemo(
    () => buildTimelineGroups({ history, events, filter, searchQuery }),
    [history, events, filter, searchQuery],
  )

  const selectedDetail = useMemo(() => {
    if (!navigation?.selectedDate) return null
    return buildDailyHistoryDetail({
      date: navigation.selectedDate,
      todayKey,
      history,
      events,
      dailySummary,
      achievementDefinitions: ACHIEVEMENT_DEFINITIONS,
      unlockDefinitions: UNLOCK_DEFINITIONS,
    })
  }, [navigation?.selectedDate, todayKey, history, events, dailySummary])

  function handleSelectDay(date: string) {
    navigation?.openDay(date)
  }

  return (
    <>
      <SectionPanel
        title="Hero History"
        titleClassName="text-violet-400/90"
        titleAside={
          <span className="text-[10px] font-normal tracking-normal text-stone-500">
            Timeline · Calendar · Daily
          </span>
        }
      >
        <Accordion
          title="Contribution Calendar"
          defaultExpanded
          persistKey="history:calendar"
          variant="subcategory"
        >
          <p className="mb-3 text-xs text-stone-500">
            Intensity reflects daily quest completion. Select a day for details.
          </p>
          <ContributionCalendar
            columns={calendarColumns}
            monthLabels={monthLabels}
            selectedDate={navigation?.selectedDate ?? null}
            onSelectDay={handleSelectDay}
          />
        </Accordion>

        <Accordion
          title="Hero Timeline"
          defaultExpanded
          persistKey="history:timeline"
          variant="subcategory"
        >
          <TimelineFilterBar
            filter={filter}
            onFilterChange={setFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <div className="mt-4">
            <HeroTimeline
              groups={timelineGroups}
              todayKey={todayKey}
              onOpenDayOverview={handleSelectDay}
            />
          </div>
        </Accordion>
      </SectionPanel>

      {selectedDetail && navigation && (
        <DailyHistoryView detail={selectedDetail} onClose={navigation.closeDay} />
      )}
    </>
  )
}
