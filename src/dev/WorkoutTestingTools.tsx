import { useState } from 'react'

import { useGameStore } from '@/store/gameStore'

const actionClass =
  'rounded-md border border-violet-700/50 bg-violet-900/30 px-2.5 py-1 text-xs text-violet-100 transition hover:bg-violet-900/50'

const resetClass =
  'rounded-md border border-red-700/50 bg-red-900/30 px-2.5 py-1 text-xs text-red-200 transition hover:bg-red-900/50'

export function WorkoutTestingTools() {
  const devCreateSampleWorkout = useGameStore((s) => s.devCreateSampleWorkout)
  const devStartWorkout = useGameStore((s) => s.devStartWorkout)
  const devCompleteWorkout = useGameStore((s) => s.devCompleteWorkout)
  const devGenerateWorkoutHistory = useGameStore((s) => s.devGenerateWorkoutHistory)
  const devClearWorkoutData = useGameStore((s) => s.devClearWorkoutData)
  const devClearWorkoutHistory = useGameStore((s) => s.devClearWorkoutHistory)
  const devDumpWorkoutState = useGameStore((s) => s.devDumpWorkoutState)

  const [dump, setDump] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  function handleDump() {
    setDump(JSON.stringify(devDumpWorkoutState(), null, 2))
  }

  function handleGenerateHistory() {
    const added = devGenerateWorkoutHistory(30)
    setNote(`Added ${added} workout activit${added === 1 ? 'y' : 'ies'}.`)
  }

  return (
    <div className="mt-4 border-t border-red-800/30 pt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-red-300/80">
        Workout Testing
      </p>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => devCreateSampleWorkout()} className={actionClass}>
          Generate Sample Workout
        </button>
        <button
          type="button"
          onClick={() => devStartWorkout('upper-body')}
          className={actionClass}
        >
          Start Upper Body
        </button>
        <button type="button" onClick={() => devCompleteWorkout()} className={actionClass}>
          Complete Sample Workout
        </button>
        <button type="button" onClick={handleGenerateHistory} className={actionClass}>
          Generate Workout History
        </button>
        <button type="button" onClick={() => devClearWorkoutHistory()} className={resetClass}>
          Clear Workout History
        </button>
        <button type="button" onClick={() => devClearWorkoutData()} className={resetClass}>
          Clear Workout Data
        </button>
        <button type="button" onClick={handleDump} className={actionClass}>
          Dump Workout State
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
