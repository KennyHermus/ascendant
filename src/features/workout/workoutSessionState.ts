import { isDurationSession } from '@/features/workout/durationActivityLogic'
import type { WorkoutSession, WorkoutSessionStatus } from '@/types/workout'

/** User-facing workout session phases — mapped to persisted `WorkoutSessionStatus`. */
export const WORKOUT_SESSION_PHASES = [
  'not_started',
  'active',
  'paused',
  'ready_for_review',
  'reviewing',
  'completed',
  'cancelled',
] as const

export type WorkoutSessionPhase = (typeof WORKOUT_SESSION_PHASES)[number]

export type WorkoutSessionAction =
  | 'start'
  | 'pause'
  | 'resume'
  | 'review'
  | 'back'
  | 'finish'
  | 'cancel'

const STATUS_TO_PHASE: Record<WorkoutSessionStatus, WorkoutSessionPhase> = {
  draft: 'not_started',
  in_progress: 'active',
  paused: 'paused',
  ready_for_review: 'ready_for_review',
  review: 'reviewing',
  completed: 'completed',
  cancelled: 'cancelled',
}

const VALID_TRANSITIONS: Record<WorkoutSessionStatus, WorkoutSessionAction[]> = {
  draft: ['start', 'cancel'],
  in_progress: ['pause', 'cancel'],
  paused: ['resume', 'cancel'],
  ready_for_review: ['review', 'pause', 'cancel'],
  review: ['back', 'finish', 'cancel'],
  completed: [],
  cancelled: [],
}

export function getSessionPhase(status: WorkoutSessionStatus): WorkoutSessionPhase {
  return STATUS_TO_PHASE[status]
}

export function canPerformSessionAction(
  status: WorkoutSessionStatus,
  action: WorkoutSessionAction,
): boolean {
  if (action === 'review' && status === 'in_progress') {
    return false
  }
  if (action === 'review' && status === 'paused') {
    return false
  }
  return VALID_TRANSITIONS[status]?.includes(action) ?? false
}

/** View 2 — summary, finish, cancel, back. */
export function isSessionInReviewScreen(session: WorkoutSession): boolean {
  return session.status === 'review'
}

/** View 1 — logging, timers, review workout button when ready. */
export function isSessionInLoggingScreen(session: WorkoutSession): boolean {
  return (
    session.status === 'in_progress' ||
    session.status === 'paused' ||
    session.status === 'ready_for_review'
  )
}

export function isSessionReadyForReview(session: WorkoutSession): boolean {
  return session.status === 'ready_for_review'
}

export function shouldShowReviewWorkoutButton(session: WorkoutSession): boolean {
  return (
    session.status === 'ready_for_review' ||
    (session.status === 'paused' && session.resumeTargetStatus === 'ready_for_review')
  )
}

/** Duration activities enter review directly from active/paused via Stop. */
export function canEnterWorkoutReview(session: WorkoutSession): boolean {
  if (session.status === 'ready_for_review') return true
  if (
    session.status === 'paused' &&
    session.resumeTargetStatus === 'ready_for_review'
  ) {
    return true
  }
  if (isDurationSession(session) && (session.status === 'in_progress' || session.status === 'paused')) {
    return true
  }
  return false
}

export function isSessionTimerRunning(session: WorkoutSession): boolean {
  return session.status === 'in_progress' || session.status === 'ready_for_review'
}

export function isSessionEditable(session: WorkoutSession): boolean {
  return (
    session.status === 'draft' ||
    session.status === 'in_progress' ||
    session.status === 'paused' ||
    session.status === 'ready_for_review' ||
    session.status === 'review'
  )
}

export function sessionPhaseLabel(status: WorkoutSessionStatus): string {
  switch (status) {
    case 'draft':
      return 'Not started'
    case 'in_progress':
      return 'Active'
    case 'paused':
      return 'Paused'
    case 'ready_for_review':
      return 'Ready for review'
    case 'review':
      return 'Reviewing'
    case 'completed':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
  }
}
