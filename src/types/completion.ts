/** Timed-quest completion quality; untimed quests always use `completed`. */
export const COMPLETION_GRADES = [
  'perfect',
  'onTime',
  'completed',
  'missed',
] as const

export type CompletionGrade = (typeof COMPLETION_GRADES)[number]

/** Reward multipliers applied to XP, gold, and stat rewards at completion time. */
export const COMPLETION_GRADE_MULTIPLIERS: Record<
  Exclude<CompletionGrade, 'missed'>,
  number
> = {
  perfect: 1.15,
  onTime: 1.05,
  completed: 1.0,
}

export const COMPLETION_GRADE_LABELS: Record<CompletionGrade, string> = {
  perfect: 'Perfect',
  onTime: 'On Time',
  completed: 'Completed',
  missed: 'Missed',
}
