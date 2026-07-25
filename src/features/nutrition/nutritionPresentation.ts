import type { MealType } from '@/types/nutrition'

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

export const MEAL_TYPE_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '🥗',
  dinner: '🍽️',
  snack: '🍎',
}

export function formatGrams(value: number): string {
  return `${Math.round(value)}g`
}

export function formatCalories(value: number): string {
  return `${Math.round(value)} kcal`
}

/** `percent` is a raw ratio (1 = 100%), not pre-multiplied. */
export function formatTargetPercent(percent: number | null): string {
  if (percent === null) return '—'
  return `${Math.round(percent * 100)}%`
}

/** Minutes after midnight → `h:mm AM/PM`. */
export function formatClockMinutes(minutes: number): string {
  const hours24 = Math.floor(minutes / 60) % 24
  const mins = minutes % 60
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  return `${hours12}:${String(mins).padStart(2, '0')} ${period}`
}

export function formatMealTime(completedAt: string): string {
  const date = new Date(completedAt)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}
