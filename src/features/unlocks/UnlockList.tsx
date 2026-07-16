import { QUEST_DEFINITIONS } from '@/data/quests'
import { UNLOCK_DEFINITIONS } from '@/data/unlocks'
import { getUnlockStatus } from '@/features/unlocks/unlockLogic'
import { UnlockCard } from '@/features/unlocks/UnlockCard'
import { getCurrentGameTime } from '@/lib/gameTime'
import type { QuestState } from '@/types/quest'

interface UnlockListProps {
  quests: QuestState[]
}

export function UnlockList({ quests }: UnlockListProps) {
  const now = getCurrentGameTime()

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-400/90">
        Unlocks
      </h2>
      <div className="space-y-3">
        {UNLOCK_DEFINITIONS.map((definition) => (
          <UnlockCard
            key={definition.id}
            status={getUnlockStatus(definition, quests, QUEST_DEFINITIONS, now)}
          />
        ))}
      </div>
    </section>
  )
}
