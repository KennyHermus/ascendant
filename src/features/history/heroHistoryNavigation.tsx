import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export interface HeroHistoryNavigation {
  selectedDate: string | null
  openDay: (date: string) => void
  closeDay: () => void
}

const HeroHistoryNavigationContext = createContext<HeroHistoryNavigation | null>(null)

export function HeroHistoryNavigationProvider({
  children,
  value,
}: {
  children: ReactNode
  value: HeroHistoryNavigation
}) {
  return (
    <HeroHistoryNavigationContext.Provider value={value}>
      {children}
    </HeroHistoryNavigationContext.Provider>
  )
}

export function useHeroHistoryNavigation(): HeroHistoryNavigation | null {
  return useContext(HeroHistoryNavigationContext)
}

/** Dashboard-level hook — owns selected day state for cross-navigation. */
export function useHeroHistoryNavigationState(): HeroHistoryNavigation {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  return useMemo(
    () => ({
      selectedDate,
      openDay: setSelectedDate,
      closeDay: () => setSelectedDate(null),
    }),
    [selectedDate],
  )
}
