import type { ReactNode } from 'react'

import { Panel } from '@/components/Panel'

interface SectionPanelProps {
  title: string
  children: ReactNode
  titleClassName?: string
  titleAside?: ReactNode
}

/**
 * Analytics section chrome — thin wrapper around shared `Panel` so
 * dashboard sections stay visually consistent with the Hero Dashboard.
 */
export function SectionPanel({
  title,
  children,
  titleClassName = 'text-sky-400/90',
  titleAside,
}: SectionPanelProps) {
  return (
    <Panel title={title} titleClassName={titleClassName} titleAside={titleAside}>
      {children}
    </Panel>
  )
}
