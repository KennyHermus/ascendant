import type { GameEvent } from '@/types/event'
import type { QuestDefinition } from '@/types/quest'

/**
 * Only required Non-Negotiable quests may surface as "missed" in player-facing UI
 * (badges, timeline, summary, visible analytics). Bonus / weekly quests stay
 * neutral when incomplete.
 */
export function questSupportsPlayerMiss(definition: QuestDefinition): boolean {
  return definition.category === 'nonNegotiable' && !definition.optional
}

export function isPlayerVisibleQuestFailedEvent(
  event: GameEvent,
  definitions: readonly QuestDefinition[],
): boolean {
  if (event.type !== 'QUEST_FAILED') return true
  const definition = definitions.find((d) => d.id === event.questId)
  if (!definition) return false
  return questSupportsPlayerMiss(definition)
}
