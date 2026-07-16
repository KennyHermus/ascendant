import type { ReactNode } from 'react'

interface PanelProps {
  title?: ReactNode
  /** Optional element rendered to the right of the title (e.g. a count badge). */
  titleAside?: ReactNode
  children: ReactNode
  className?: string
  titleClassName?: string
}

/**
 * Generic "RPG menu panel" wrapper used by every top-level Dashboard section,
 * so spacing/borders/typography stay consistent without each section
 * re-declaring the same chrome. Not quest/hero/unlock-specific — reusable by
 * any future section (inventory, skills, story).
 */
export function Panel({ title, titleAside, children, className, titleClassName }: PanelProps) {
  return (
    <section
      className={`rounded-xl border border-stone-700/50 bg-stone-900/60 p-5 ${className ?? ''}`}
    >
      {title && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2
            className={`text-sm font-semibold uppercase tracking-widest ${
              titleClassName ?? 'text-amber-400/90'
            }`}
          >
            {title}
          </h2>
          {titleAside}
        </div>
      )}
      {children}
    </section>
  )
}
