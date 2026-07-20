import { useMemo, useState } from 'react'

import {
  BENCHMARK_ASSESSMENT_DEFINITIONS,
  BENCHMARK_ASSESSMENT_BY_ID,
} from '@/data/benchmarkAssessments'
import { Panel } from '@/components/Panel'
import { getBenchmarkExerciseName } from '@/features/performance/exerciseFamilyLogic'
import {
  formatOfficialPrSummary,
  formatPrTypeLabel,
} from '@/features/performance/prPresentation'
import { metricLabel } from '@/features/performance/prLogic'
import { useGameStore } from '@/store/gameStore'
import type { AssessmentSessionEntry } from '@/types/performance'

function AssessmentEntryForm({
  entry,
  onSave,
}: {
  entry: AssessmentSessionEntry
  onSave: (values: {
    weight?: number
    reps?: number
    durationSeconds?: number
    distanceMeters?: number
    notes?: string
  }) => void
}) {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [durationSeconds, setDurationSeconds] = useState('')
  const [distanceMeters, setDistanceMeters] = useState('')
  const [notes, setNotes] = useState('')

  function parseOptionalNumber(value: string): number | undefined {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  function handleSave() {
    onSave({
      ...(entry.metric === 'weight_and_reps' || entry.metric === 'reps'
        ? { reps: parseOptionalNumber(reps) }
        : {}),
      ...(entry.metric === 'weight_and_reps' ? { weight: parseOptionalNumber(weight) } : {}),
      ...(entry.metric === 'duration_seconds'
        ? { durationSeconds: parseOptionalNumber(durationSeconds) }
        : {}),
      ...(entry.metric === 'distance_meters'
        ? { distanceMeters: parseOptionalNumber(distanceMeters) }
        : {}),
      notes: notes.trim() || undefined,
    })
  }

  return (
    <div className="rounded-lg border border-stone-700/50 bg-stone-950/40 p-4">
      <h3 className="text-sm font-medium text-stone-100">
        {getBenchmarkExerciseName(entry.benchmarkExerciseId)}
      </h3>
      <p className="mt-0.5 text-xs text-stone-500">{entry.label}</p>
      <p className="mt-1 text-xs text-amber-400/80">
        {formatPrTypeLabel(entry.prType)} · {metricLabel(entry.metric)}
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {(entry.metric === 'reps' || entry.metric === 'weight_and_reps') && (
          <label className="flex items-center gap-1 text-stone-500">
            Reps
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-16 rounded border border-stone-700/50 bg-stone-950/60 px-2 py-1 text-stone-200"
            />
          </label>
        )}
        {entry.metric === 'weight_and_reps' && (
          <label className="flex items-center gap-1 text-stone-500">
            Weight (lb)
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-16 rounded border border-stone-700/50 bg-stone-950/60 px-2 py-1 text-stone-200"
            />
          </label>
        )}
        {entry.metric === 'duration_seconds' && (
          <label className="flex items-center gap-1 text-stone-500">
            Seconds
            <input
              type="number"
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(e.target.value)}
              className="w-20 rounded border border-stone-700/50 bg-stone-950/60 px-2 py-1 text-stone-200"
            />
          </label>
        )}
        {entry.metric === 'distance_meters' && (
          <label className="flex items-center gap-1 text-stone-500">
            Meters
            <input
              type="number"
              value={distanceMeters}
              onChange={(e) => setDistanceMeters(e.target.value)}
              className="w-20 rounded border border-stone-700/50 bg-stone-950/60 px-2 py-1 text-stone-200"
            />
          </label>
        )}
      </div>

      <label className="mt-3 block text-xs text-stone-500">
        Notes (optional)
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded border border-stone-700/50 bg-stone-950/60 px-2 py-1 text-stone-200"
        />
      </label>

      <button
        type="button"
        onClick={handleSave}
        className="mt-3 rounded-md border border-emerald-700/50 bg-emerald-900/40 px-3 py-1.5 text-xs text-emerald-100"
      >
        {entry.completed ? 'Update result' : 'Log result'}
      </button>
    </div>
  )
}

export function PerformancePanel() {
  const performance = useGameStore((s) => s.performance)
  const needsBaseline = useGameStore((s) => s.needsBaselineAssessment())
  const startBaselineAssessment = useGameStore((s) => s.startBaselineAssessment)
  const startPerformanceAssessment = useGameStore((s) => s.startPerformanceAssessment)
  const beginAssessment = useGameStore((s) => s.beginAssessment)
  const logAssessmentEntry = useGameStore((s) => s.logAssessmentEntry)
  const completeAssessment = useGameStore((s) => s.completeAssessment)
  const cancelAssessment = useGameStore((s) => s.cancelAssessment)

  const [selectedDefinitionId, setSelectedDefinitionId] = useState(
    BENCHMARK_ASSESSMENT_DEFINITIONS[0]?.id ?? 'push-up-test',
  )

  const activeSession = useMemo(() => {
    if (!performance.activeSessionId) return null
    return performance.sessions.find((session) => session.id === performance.activeSessionId) ?? null
  }, [performance])

  const currentEntry = useMemo(() => {
    if (!activeSession) return null
    return activeSession.entries.find((entry) => !entry.completed) ?? activeSession.entries[0] ?? null
  }, [activeSession])

  const officialRecords = performance.officialRecords

  if (activeSession) {
    const allComplete = activeSession.entries.every((entry) => entry.completed)

    return (
      <Panel title="Performance Assessment">
        <div className="space-y-4">
          <div>
            <p className="font-medium text-stone-100">{activeSession.name}</p>
            <p className="text-xs text-stone-500">
              {activeSession.assessmentKind === 'baseline'
                ? 'Baseline Assessment · establishes official benchmarks'
                : 'Performance Assessment · updates official PRs when improved'}
            </p>
          </div>

          <div className="space-y-2">
            {activeSession.entries.map((entry) => (
              <div
                key={entry.definitionId}
                className={`rounded-md border px-3 py-2 text-sm ${
                  entry.completed
                    ? 'border-emerald-800/40 bg-emerald-950/20 text-emerald-200'
                    : entry.definitionId === currentEntry?.definitionId
                      ? 'border-amber-700/50 bg-amber-950/20 text-amber-100'
                      : 'border-stone-700/40 text-stone-400'
                }`}
              >
                {getBenchmarkExerciseName(entry.benchmarkExerciseId)}
                {entry.completed && <span className="text-emerald-400/80"> · logged</span>}
              </div>
            ))}
          </div>

          {currentEntry && (
            <AssessmentEntryForm
              entry={currentEntry}
              onSave={(values) => logAssessmentEntry(currentEntry.definitionId, values)}
            />
          )}

          <div className="flex flex-wrap gap-2">
            {activeSession.status === 'draft' && (
              <button
                type="button"
                onClick={() => beginAssessment()}
                className="rounded-md border border-sky-700/50 bg-sky-900/40 px-3 py-1.5 text-sm text-sky-100"
              >
                Start Assessment
              </button>
            )}
            {activeSession.status === 'in_progress' && allComplete && (
              <button
                type="button"
                onClick={() => completeAssessment()}
                className="rounded-md border border-emerald-700/50 bg-emerald-900/40 px-3 py-1.5 text-sm text-emerald-100"
              >
                Complete Assessment
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Cancel this assessment? Progress will be discarded.')) {
                  cancelAssessment()
                }
              }}
              className="rounded-md border border-red-800/50 bg-red-950/30 px-3 py-1.5 text-sm text-red-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </Panel>
    )
  }

  return (
    <Panel title="Performance">
      <div className="space-y-4">
        <p className="text-sm text-stone-400">
          Training builds strength. Performance Assessments establish and update official Personal
          Records — normal workouts never overwrite them.
        </p>

        {needsBaseline ? (
          <div className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-4">
            <p className="text-sm font-medium text-amber-100">Baseline Assessment recommended</p>
            <p className="mt-1 text-xs text-amber-200/70">
              Establish initial benchmarks for push-ups, plank, squats, curls, and walking endurance.
            </p>
            <button
              type="button"
              onClick={() => startBaselineAssessment()}
              className="mt-3 rounded-md border border-amber-700/50 bg-amber-900/40 px-3 py-1.5 text-sm text-amber-100"
            >
              Start Baseline Assessment
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-xs text-stone-500">
              Performance Assessment
              <select
                value={selectedDefinitionId}
                onChange={(e) => setSelectedDefinitionId(e.target.value)}
                className="mt-1 w-full rounded-md border border-stone-700/50 bg-stone-950/60 px-3 py-2 text-sm text-stone-200"
              >
                {BENCHMARK_ASSESSMENT_DEFINITIONS.map((def) => (
                  <option key={def.id} value={def.id}>
                    {def.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => startPerformanceAssessment(selectedDefinitionId)}
              disabled={!BENCHMARK_ASSESSMENT_BY_ID.has(selectedDefinitionId)}
              className="rounded-md border border-emerald-700/50 bg-emerald-900/40 px-3 py-1.5 text-sm text-emerald-100 disabled:opacity-40"
            >
              Start {BENCHMARK_ASSESSMENT_BY_ID.get(selectedDefinitionId)?.name ?? 'Assessment'}
            </button>
          </div>
        )}

        {officialRecords.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-stone-500">
              Official Personal Records
            </p>
            <ul className="space-y-1.5">
              {officialRecords.map((record) => (
                <li
                  key={record.id}
                  className="rounded-md border border-stone-700/40 bg-stone-950/30 px-3 py-2 text-sm text-stone-300"
                >
                  {formatOfficialPrSummary(record)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Panel>
  )
}
