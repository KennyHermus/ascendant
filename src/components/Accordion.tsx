import { useState, type ReactNode } from 'react'

interface AccordionProps {
  title: ReactNode
  /** Optional small badge shown next to the title, visible even when collapsed (e.g. "3/5"). */
  meta?: ReactNode
  children: ReactNode
  defaultExpanded?: boolean
  /**
   * Unique id used to remember this accordion's expanded/collapsed state
   * across refreshes. This is a UI display preference, not save data, so
   * it's stored in its own `localStorage` namespace — entirely separate
   * from the game's persisted save (`GameState`) and its migrations.
   * Omit to not persist (state resets to `defaultExpanded` each load).
   */
  persistKey?: string
  /** Visual weight — `category` for top-level sections, `subcategory` for nested ones. */
  variant?: 'category' | 'subcategory'
}

const STORAGE_PREFIX = 'ascendant-accordion:'

function readPersistedExpanded(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    return raw === null ? fallback : raw === 'true'
  } catch {
    return fallback
  }
}

function writePersistedExpanded(key: string, expanded: boolean): void {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, String(expanded))
  } catch {
    // localStorage unavailable (e.g. private browsing) — state just won't persist.
  }
}

/**
 * Generic collapsible section. Not quest-specific — reusable for any future
 * grouped content (inventory, skill trees, achievements, story chapters,
 * combat abilities, etc).
 */
export function Accordion({
  title,
  meta,
  children,
  defaultExpanded = false,
  persistKey,
  variant = 'category',
}: AccordionProps) {
  const [expanded, setExpanded] = useState(() =>
    persistKey ? readPersistedExpanded(persistKey, defaultExpanded) : defaultExpanded,
  )

  function toggle() {
    const next = !expanded
    setExpanded(next)
    if (persistKey) writePersistedExpanded(persistKey, next)
  }

  const isCategory = variant === 'category'

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        className={`flex w-full items-center justify-between gap-2 text-left transition ${
          isCategory
            ? 'text-sm font-semibold uppercase tracking-widest text-amber-400/90'
            : 'text-xs font-semibold uppercase tracking-wider text-stone-500'
        }`}
      >
        <span className="flex items-center gap-2">
          <span
            className={`inline-block transition-transform ${expanded ? 'rotate-90' : ''}`}
            aria-hidden="true"
          >
            ▸
          </span>
          {title}
        </span>
        {meta !== undefined && (
          <span className="text-xs font-normal tracking-normal text-stone-500">
            {meta}
          </span>
        )}
      </button>
      {expanded && (
        <div className={isCategory ? 'mt-3' : 'mt-2'}>{children}</div>
      )}
    </div>
  )
}
