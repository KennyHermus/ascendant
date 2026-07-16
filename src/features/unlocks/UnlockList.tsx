import { Accordion } from '@/components/Accordion'
import { Panel } from '@/components/Panel'
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
  const statuses = UNLOCK_DEFINITIONS.map((definition) =>
    getUnlockStatus(definition, quests, QUEST_DEFINITIONS, now),
  )

  const unlocked = statuses.filter((status) => status.unlocked)
  const locked = statuses.filter((status) => !status.unlocked)

  return (
    <Panel title="Unlocks">
      <div className="space-y-4">
        {unlocked.length > 0 && (
          <Accordion
            title="Unlocked"
            meta={`${unlocked.length}`}
            defaultExpanded={false}
            persistKey="unlocks:unlocked"
          >
            <div className="space-y-3">
              {unlocked.map((status) => (
                <UnlockCard key={status.definition.id} status={status} />
              ))}
            </div>
          </Accordion>
        )}

        {locked.length > 0 && (
          <Accordion
            title="Locked"
            meta={`${locked.length}`}
            defaultExpanded={false}
            persistKey="unlocks:locked"
          >
            <div className="space-y-3">
              {locked.map((status) => (
                <UnlockCard key={status.definition.id} status={status} />
              ))}
            </div>
          </Accordion>
        )}
      </div>
    </Panel>
  )
}
