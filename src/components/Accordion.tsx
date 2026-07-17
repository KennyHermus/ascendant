import { useState, type ReactNode } from 'react'

interface AccordionProps {
  title: ReactNode
  /** Optional summary shown beside the title (e.g. event count, metric count). */
  meta?: ReactNode
  /** Secondary control in the header — does not toggle expansion (e.g. Overview link). */
  headerAction?: ReactNode
  children: ReactNode
  defaultExpanded?: boolean
  /**
   * Unique id used to remember this accordion's expanded/collapsed state
   * across refreshes. UI preference only — separate from game save data.
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
    // localStorage unavailable — state just won't persist.
  }
}

/**
 * Generic collapsible section with optional persisted state and header actions.
 */
export function Accordion({
  title,
  meta,
  headerAction,
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
      <div className="flex w-full items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          className={`flex min-w-0 flex-1 items-center gap-2 text-left transition ${
            isCategory
              ? 'text-sm font-semibold uppercase tracking-widest text-amber-400/90'
              : 'text-xs font-semibold uppercase tracking-wider text-stone-500'
          }`}
        >
          <span
            className={`inline-block shrink-0 transition-transform duration-200 ${
              expanded ? 'rotate-90' : ''
            }`}
            aria-hidden="true"
          >
            ▸
          </span>
          <span className="truncate">{title}</span>
        </button>
        {meta !== undefined && (
          <span className="shrink-0 text-xs font-normal tracking-normal text-stone-500">
            {meta}
          </span>
        )}
        {headerAction}
      </div>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
          isCategory ? 'mt-3' : 'mt-2'
        }`}
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div>{children}</div>
        </div>
      </div>
    </div>
  )
}
