import {
  TIMELINE_FILTER_LABELS,
} from '@/features/history/historyPresentation'
import type { TimelineFilterCategory } from '@/types/historyUi'

interface TimelineFilterBarProps {
  filter: TimelineFilterCategory
  onFilterChange: (filter: TimelineFilterCategory) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function TimelineFilterBar({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: TimelineFilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(TIMELINE_FILTER_LABELS) as TimelineFilterCategory[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onFilterChange(key)}
            className={`rounded-full border px-2.5 py-1 text-xs transition ${
              filter === key
                ? 'border-amber-600/60 bg-amber-950/50 text-amber-200'
                : 'border-stone-700/50 bg-stone-950/40 text-stone-400 hover:text-stone-200'
            }`}
          >
            {TIMELINE_FILTER_LABELS[key]}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="sr-only">Search timeline</span>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search events or quests…"
          className="w-full rounded-md border border-stone-700/50 bg-stone-950/60 px-3 py-2 text-sm text-stone-200 placeholder:text-stone-600"
        />
      </label>
    </div>
  )
}
