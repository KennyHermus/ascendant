import type { UnlockDefinition } from '@/types/unlock'

export const UNLOCK_DEFINITIONS: UnlockDefinition[] = [
  {
    id: 'messages',
    name: 'Messages',
    description: 'Stay reachable once the morning routine is underway.',
    target: 'Messages',
    requirements: [
      { type: 'questCompletion', questId: 'morning-walk' },
      { type: 'questCompletion', questId: 'core' },
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Earned after taking care of recovery.',
    target: 'YouTube',
    requirements: [{ type: 'questCompletion', questId: 'rehab' }],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: "Unlocked once today's learning or work is done.",
    target: 'Gaming',
    requirements: [{ type: 'questCompletion', questId: 'learning-work' }],
  },
  {
    id: 'social-media',
    name: 'Social Media',
    description: 'Unlocked after training.',
    target: 'Social Media',
    requirements: [{ type: 'questCompletion', questId: 'workout' }],
  },
  {
    id: 'netflix',
    name: 'Netflix',
    description: 'Unlocked once the entire morning routine is complete.',
    target: 'Netflix',
    requirements: [{ type: 'groupCompletion', group: 'morningRoutine' }],
  },
]
