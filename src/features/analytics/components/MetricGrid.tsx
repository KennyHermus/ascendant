import type { ReactNode } from 'react'

interface MetricGridProps {
  children: ReactNode
  columns?: 2 | 3
}

/** Responsive metric tile grid. */
export function MetricGrid({ children, columns = 2 }: MetricGridProps) {
  return (
    <div
      className={
        columns === 3
          ? 'grid grid-cols-2 gap-2 sm:grid-cols-3'
          : 'grid grid-cols-2 gap-2'
      }
    >
      {children}
    </div>
  )
}
