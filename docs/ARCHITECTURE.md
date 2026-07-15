# Ascendant Technical Architecture

Version: 0.1

---

# Overview

Ascendant is a React + TypeScript application built as a modular game system.

The architecture separates:

- Presentation
- Game logic
- Data
- State
- Configuration

The goal is to allow the game to expand for years without becoming difficult to maintain.

---

# Technology Stack

## Frontend

- React
- TypeScript
- Vite

---

## Styling

Primary:

- Tailwind CSS

Future:

- Component libraries where appropriate

---

## State Management

Zustand

Used for:

- Player state
- Progression state
- Quest state
- Settings

---



## Persistence

Initial:

Browser local storage

Future:

Cloud database synchronization

---

## v0.0.1 Implementation Notes

Stats use a `StatState` wrapper (`{ value: number }`) per attribute so future per-stat XP fields can be added without restructuring `HeroStats`.

Quest completion is one-way: rewards apply once and quests stay completed until daily or weekly reset.

Streak tracking requires all daily core quests (`dailyCore` category) to be completed. Daily bonus quests are tracked separately and do not affect streak.

Category completion bonuses are defined in `src/data/completionRewards.ts` and granted once per period via `completionRewardClaims` in persisted state.

---



# Folder Structure

src/

├── app/

│

├── features/

│   ├── hero/

│   ├── quests/

│   └── progression/

│

├── components/

│

├── data/

│

├── store/

│

├── types/

│

├── lib/

│

└── utils/

---



# Feature-Based Architecture

Features contain related functionality.

Example:

features/

└── hero/

    ├── components/

    │   └── HeroCard.tsx

    │

    ├── heroStore.ts

    │

    ├── heroTypes.ts

    │

    └── heroLogic.ts

---



# Core Features

Initial:

features/

├── hero/

│

├── quests/

│

├── progression/

│

├── combat/

│

├── inventory/

│

├── story/

│

├── skills/

│

└── achievements/

---



# Feature Responsibilities



## Hero

Responsible for:

- Player identity
- Stats
- Level
- Experience

---



## Quests

Responsible for:

- Quest definitions
- Completion
- Rewards

---



## Progression

Responsible for:

- XP calculations
- Level ups
- Unlocks

---



# Data Flow

Preferred:

User Action

↓

Feature Logic

↓

State Update

↓

UI Refresh

↓

Persistence

---



# Example

Completing a workout:

Quest Button Click

↓

Quest Engine

↓

Reward Calculation

↓

Hero XP Update

↓

Strength XP Update

↓

Save State

↓

Display Progress

---



# Rules



## Keep Components Dumb

Components display information.

Logic belongs elsewhere.

---



## Avoid Global State Abuse

Only store true application state globally.

---



## Prefer Data-Driven Systems

Avoid:

if quest === workout  

Prefer:

quest.statRewards.strength += 5

---



# Future Architecture Goals

Eventually:

packages/

game-engine/

shared-types/

ui/

mobile/

web/

The game logic should eventually be portable across platforms.