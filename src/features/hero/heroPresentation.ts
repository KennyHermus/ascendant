import type { NonNegotiableStatusBreakdown } from '@/features/quests/questLogic'

/**
 * Display-only hero information derived from existing state — no new
 * mechanics, rewards, or persisted fields. Kept separate from
 * `heroLogic.ts` (core stat/XP mechanics) since these are purely
 * presentational rules that the Dashboard can evolve independently.
 * (Hero Title lives in its own `heroTitle.ts` — see that file.)
 */

/** Initials shown in the avatar placeholder until a real portrait exists. */
export function getHeroInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/**
 * Simple, rule-based "how is today going" status for the Hero Card,
 * derived entirely from today's non-negotiable subcategory completion
 * (Morning Routine → Nutrition → Evening Routine, in their natural daily
 * order) — no quest IDs, only the existing category/subcategory structure.
 * Evaluated most-progressed-first so each rule is a distinct, non-
 * overlapping day state:
 *
 *  - All non-negotiables complete            → "Day Complete"
 *  - Morning + Nutrition complete, Evening isn't → "Evening Wind Down"
 *  - Morning complete, Nutrition isn't yet       → "Making Progress"
 *  - Morning complete alone (nothing else touched) → "Morning Routine Complete"
 *  - Morning incomplete, something already done  → "Focused"
 *  - Nothing done yet                            → "Ready for Adventure"
 *
 * Intentionally simple and centralized here so future statuses (e.g. tied
 * to combat, fatigue, buffs, or story progression) can be added as new
 * branches without touching the Dashboard or HeroBanner.
 */
export function getHeroStatus(breakdown: NonNegotiableStatusBreakdown): string {
  const { overall, subcategories } = breakdown
  const { morningRoutine, nutrition, eveningRoutine } = subcategories

  if (overall.allComplete) return 'Day Complete'

  if (morningRoutine.allComplete) {
    // Nutrition and Evening Routine can't *both* be complete here — that
    // combination, together with Morning, would already be `overall.allComplete`.
    if (nutrition.allComplete) return 'Evening Wind Down'
    if (nutrition.completed > 0 || eveningRoutine.completed > 0) return 'Making Progress'
    return 'Morning Routine Complete'
  }

  return overall.completed > 0 ? 'Focused' : 'Ready for Adventure'
}
