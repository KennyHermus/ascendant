import { lazy, Suspense, type ComponentType } from 'react'

const LazyDevTools: ComponentType =
  import.meta.env.DEV
    ? lazy(() =>
        import('@/dev/DevTools').then((module) => ({
          default: module.DevTools,
        })),
      )
    : () => null

/** Dev-only entry point. Lazy-loads DevTools in a separate chunk. */
export function DevToolsLazy() {
  if (!import.meta.env.DEV) return null

  return (
    <Suspense fallback={null}>
      <LazyDevTools />
    </Suspense>
  )
}
