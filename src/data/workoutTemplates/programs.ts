import type {
  ExercisePrescription,
  WorkoutTemplate,
  WorkoutTemplateExercise,
  WorkoutTemplateSection,
} from '@/types/workout'

function slot(
  exerciseId: string,
  sortOrder: number,
  prescription?: ExercisePrescription,
  notes?: string,
): WorkoutTemplateExercise {
  return { exerciseId, sortOrder, prescription, notes }
}

function section(
  id: string,
  name: string,
  sortOrder: number,
  exercises: WorkoutTemplateExercise[],
  options?: Pick<
    WorkoutTemplateSection,
    'setCount' | 'repsLabel' | 'notes' | 'blocks'
  >,
): WorkoutTemplateSection {
  return { id, name, sortOrder, exercises, ...options }
}

const upperBodySections: WorkoutTemplateSection[] = [
  section(
    'arms',
    'Arms',
    0,
    [
      slot('push-ups', 0, { targetLabel: '10 reps', sets: [{ reps: 10, weight: 0 }] }),
      slot('bicep-curl', 1, { targetLabel: '10 reps', sets: [{ reps: 10, weight: 20 }] }),
      slot('archer-push-ups', 2, { targetLabel: '10 reps', sets: [{ reps: 10, weight: 0 }] }),
      slot('hammer-curl', 3, { targetLabel: '10 reps', sets: [{ reps: 10, weight: 20 }] }),
      slot('diamond-push-ups', 4, { targetLabel: '10 reps', sets: [{ reps: 10, weight: 0 }] }),
      slot('side-curl', 5, { targetLabel: '10 reps', sets: [{ reps: 10, weight: 20 }] }),
      slot('clap-push-ups', 6, { targetLabel: '10 reps', sets: [{ reps: 10, weight: 0 }] }),
      slot('dumbbell-overhead-press', 7, { targetLabel: '10 reps', sets: [{ reps: 10, weight: 20 }] }),
      slot('wide-push-ups', 8, { targetLabel: '10 reps', sets: [{ reps: 10, weight: 0 }] }),
      slot('tricep-extension', 9, { targetLabel: '10 reps', sets: [{ reps: 10, weight: 20 }] }),
      slot('weighted-push-ups', 10, { targetLabel: '10 reps', sets: [{ reps: 10, weight: 10 }] }),
      slot('overhead-stick-swings', 11, { targetLabel: '10 reps', sets: [{ reps: 10, weight: 10 }] }),
      slot('high-plank', 12, {
        targetLabel: '1 minute hold',
        sets: [{ durationSeconds: 60 }],
        notes: 'Scapula protracted · knuckles',
      }),
      slot('side-to-side-stick-swings', 13, { targetLabel: '10 reps', sets: [{ reps: 10, weight: 10 }] }),
    ],
    { setCount: 1, repsLabel: '10 reps each' },
  ),
  section(
    'back',
    'Back',
    1,
    [
      slot('dead-row', 0, { targetLabel: '10 reps', bothArms: true, sets: [{ reps: 10, weight: 20 }] }),
      slot('pullover', 1, { targetLabel: '10 reps', sets: [{ reps: 10, weight: 20 }] }),
      slot('chest-supported-row', 2, { targetLabel: '10 reps', sets: [{ reps: 10, weight: 20 }] }),
      slot('w-raise', 3, { targetLabel: '10 reps', sets: [{ reps: 10, weight: 20 }] }),
      slot('superman-raises', 4, { targetLabel: '10 reps', sets: [{ reps: 10, weight: 0 }] }),
    ],
    { setCount: 1, repsLabel: '10 reps each' },
  ),
  section(
    'stretching',
    'Stretching',
    2,
    [
      slot('shoulder-stretch', 0, { setCount: 1 }),
      slot('spine-stretch', 1, { setCount: 1 }),
      slot('splits-stretch', 2, { setCount: 1 }),
    ],
  ),
]

export const UPPER_BODY_TEMPLATE: WorkoutTemplate = {
  id: 'upper-body',
  name: 'Upper Body',
  description: 'Arms, back, and stretching.',
  estimatedDurationMinutes: 45,
  sections: upperBodySections,
}

export const LOWER_BODY_TEMPLATE: WorkoutTemplate = {
  id: 'lower-body',
  name: 'Lower Body',
  description: 'Lower body strength with 30s rest between sets and exercises.',
  estimatedDurationMinutes: 45,
  restBetweenSetsSeconds: 30,
  restBetweenExercisesSeconds: 30,
  sections: [
    section('main', 'Main', 0, [
      slot('hip-thrust', 0, {
        targetLabel: '25 / 10 / 5 / 5 reps',
        sets: [
          { reps: 25, weight: 0 },
          { reps: 10, weight: 10 },
          { reps: 5, weight: 20 },
          { reps: 5, weight: 30 },
        ],
      }),
      slot('squat', 1, {
        targetLabel: '5 / 5 / 10 / 25 reps',
        sets: [
          { reps: 5, weight: 20 },
          { reps: 5, weight: 30 },
          { reps: 10, weight: 10 },
          { reps: 25, weight: 0 },
        ],
      }),
      slot('bulgarian-split-squat', 2, {
        targetLabel: '2 × 10–12 each leg',
        setCount: 2,
        sets: [
          { reps: 10, weight: 20 },
          { reps: 10, weight: 20 },
        ],
        perLeg: true,
      }),
      slot('explosive-plyo-hops', 3, {
        targetLabel: '1 set to failure each leg',
        setCount: 2,
        toFailure: true,
        perLeg: true,
      }),
      slot('explosive-drop-lunge', 4, {
        targetLabel: '2 × 10–12 each leg',
        setCount: 2,
        sets: [
          { reps: 10, weight: 20 },
          { reps: 10, weight: 20 },
        ],
        perLeg: true,
      }),
      slot('seated-banded-leg-adduction', 5, {
        targetLabel: '2 × 10–12 each leg',
        setCount: 2,
        sets: [{ reps: 10 }, { reps: 10 }],
        perLeg: true,
      }),
      slot('seated-banded-leg-abduction', 6, {
        targetLabel: '2 × 10 each leg',
        setCount: 2,
        sets: [{ reps: 10 }, { reps: 10 }],
        perLeg: true,
      }),
      slot('seated-leg-raises', 7, {
        targetLabel: '2 × 10 each leg',
        setCount: 2,
        sets: [{ reps: 10 }, { reps: 10 }],
        perLeg: true,
        notes: 'Over a bottle/weight',
      }),
    ]),
    section('stretching', 'Stretching', 1, [
      slot('hip-stretch', 0, { setCount: 1 }),
      slot('hamstring-stretch', 1, { setCount: 1 }),
    ]),
  ],
}

export const CORE_TEMPLATE: WorkoutTemplate = {
  id: 'core',
  name: 'Core',
  description: 'Repeat the full circuit twice with 30s rest between rounds.',
  estimatedDurationMinutes: 10,
  sections: [
    section('circuit', 'Circuit', 0, [], {
      blocks: [
        {
          type: 'circuit',
          id: 'core-circuit',
          sortOrder: 0,
          name: 'Core Circuit',
          repeatCount: 2,
          restAfterCircuitSeconds: 30,
          exercises: [
            slot('knee-to-elbow-crunch', 0, { targetLabel: '12 reps', sets: [{ reps: 12, weight: 0 }] }),
            slot('scissors', 1, { targetLabel: '12 reps', sets: [{ reps: 12, weight: 0 }] }),
            slot('reverse-crunch', 2, { targetLabel: '12 reps', sets: [{ reps: 12, weight: 0 }] }),
            slot('push-up-plank', 3, { targetLabel: '12 reps', sets: [{ reps: 12, weight: 0 }] }),
            slot('oblique-plank', 5, { targetLabel: '12 reps', sets: [{ reps: 12, weight: 0 }] }),
            slot('mountain-climbers', 6, { targetLabel: '12 reps', sets: [{ reps: 12, weight: 0 }] }),
            slot('plank', 7, { targetLabel: '40 seconds', sets: [{ durationSeconds: 40 }] }),
          ],
        },
      ],
    }),
  ],
}

export const REHABILITATION_TEMPLATE: WorkoutTemplate = {
  id: 'rehabilitation',
  name: 'Rehabilitation',
  description: 'Mobility and rehab sequence.',
  estimatedDurationMinutes: 40,
  sections: [
    section('main', 'Exercises', 0, [
      slot('sit-on-balls-of-feet', 1, { targetLabel: '10 x 10s', setCount: 10, sets: [
        { durationSeconds: 10 }, { durationSeconds: 10 }, { durationSeconds: 10 }, 
        { durationSeconds: 10 }, { durationSeconds: 10 }, { durationSeconds: 10 }, 
        { durationSeconds: 10 }, { durationSeconds: 10 }, { durationSeconds: 10 }, { durationSeconds: 10 }] }),
      slot('calf-stretch', 2, { targetLabel: '10 x 10s each leg', setCount: 10, sets: [
        { durationSeconds: 10 }, { durationSeconds: 10 }, { durationSeconds: 10 }, 
        { durationSeconds: 10 }, { durationSeconds: 10 }, { durationSeconds: 10 }, 
        { durationSeconds: 10 }, { durationSeconds: 10 }, { durationSeconds: 10 }, { durationSeconds: 10 }] }),
      slot('band-stretches', 3, { targetLabel: '4 x 30', setCount: 4, sets: [
        { reps: 30, weight: 0 }, { reps: 30, weight: 0 }, { reps: 30, weight: 0 }, { reps: 30, weight: 0 }]}),
      slot('calf-raises', 4, { targetLabel: '2 x 10', setCount: 2, sets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }] }),
      slot('steamboats', 5, { targetLabel: '4 x 30', setCount: 4, sets: [
        { reps: 30, weight: 0 }, { reps: 30, weight: 0 }, { reps: 30, weight: 0 }, { reps: 30, weight: 0 }]}),
      slot('chair-squats', 6, { targetLabel: '3 x 10', setCount: 3, sets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 10, weight: 0 }] }),
      slot('step-ups', 7, { targetLabel: '2 x 10', setCount: 2, notes: 'Forward · Lateral', sets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }] }),
      slot('single-leg-stand', 8, { targetLabel: '3 x 30s', setCount: 3, 
        sets: [{ durationSeconds: 30 }, { durationSeconds: 30 }, { durationSeconds: 30 }] }),
      slot('deep-squat-to-kneel', 9, { targetLabel: '2 x 10', setCount: 2, sets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }] }),
    ]),
  ],
}
