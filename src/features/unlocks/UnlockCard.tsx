import type { UnlockStatus } from '@/features/unlocks/unlockLogic'

interface UnlockCardProps {
  status: UnlockStatus
}

export function UnlockCard({ status }: UnlockCardProps) {
  const { definition, unlocked, requirements } = status

  return (
    <article
      className={`rounded-lg border p-4 transition-colors ${
        unlocked
          ? 'border-emerald-800/50 bg-emerald-950/30'
          : 'border-stone-700/50 bg-stone-950/40'
      }`}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden="true">{unlocked ? '🔓' : '🔒'}</span>
        <h3
          className={`font-medium ${
            unlocked ? 'text-emerald-300' : 'text-stone-100'
          }`}
        >
          {definition.name}
        </h3>
      </div>
      <p className="mt-1 text-sm text-stone-400">{definition.description}</p>

      {unlocked ? (
        <p className="mt-2 text-xs text-emerald-400/80">
          Requirements completed.
        </p>
      ) : (
        <ul className="mt-2 space-y-0.5 text-xs text-stone-500">
          {requirements.map((requirement, index) => (
            <li
              key={index}
              className={requirement.met ? 'text-emerald-400/80' : undefined}
            >
              {requirement.label}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
