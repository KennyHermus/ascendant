import { useState } from 'react'

import { useGameStore } from '@/store/gameStore'

const actionClass =
  'rounded-md border border-violet-700/50 bg-violet-900/30 px-2.5 py-1 text-xs text-violet-100 transition hover:bg-violet-900/50'

const resetClass =
  'rounded-md border border-red-700/50 bg-red-900/30 px-2.5 py-1 text-xs text-red-200 transition hover:bg-red-900/50'

export function NutritionTestingTools() {
  const devLogSampleMeal = useGameStore((s) => s.devLogSampleMeal)
  const devGenerateNutritionHistory = useGameStore((s) => s.devGenerateNutritionHistory)
  const devClearNutritionData = useGameStore((s) => s.devClearNutritionData)
  const devDumpNutritionState = useGameStore((s) => s.devDumpNutritionState)

  const [dump, setDump] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  function handleDump() {
    setDump(JSON.stringify(devDumpNutritionState(), null, 2))
  }

  function handleGenerateHistory() {
    const added = devGenerateNutritionHistory(14)
    setNote(`Added ${added} meal activit${added === 1 ? 'y' : 'ies'}.`)
  }

  return (
    <div className="mt-4 border-t border-red-800/30 pt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-red-300/80">
        Nutrition Testing
      </p>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => devLogSampleMeal()} className={actionClass}>
          Log Sample Meal
        </button>
        <button type="button" onClick={handleGenerateHistory} className={actionClass}>
          Generate Nutrition History
        </button>
        <button type="button" onClick={() => devClearNutritionData()} className={resetClass}>
          Clear Nutrition Data
        </button>
        <button type="button" onClick={handleDump} className={actionClass}>
          Dump Nutrition State
        </button>
      </div>

      {note && <p className="mt-2 text-xs text-stone-400">{note}</p>}

      {dump && (
        <pre className="mt-3 max-h-48 overflow-auto rounded-md border border-stone-800/60 bg-stone-950/60 p-2 text-left text-[10px] text-stone-400">
          {dump}
        </pre>
      )}
    </div>
  )
}
