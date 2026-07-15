# Quest System

Version: 0.1

---

# Purpose

Quests represent real-life actions.

A quest is:

An action that improves the player.

---

# Quest Categories

## Daily Quests

Completed every day.

Examples:

- Wake up on time

- Workout

- Rehab

- Walk

- Core work

- Reading

---

## Daily Unlock Quests

These control access to distractions.

The player earns the ability to use entertainment.

Examples:

Before:

- YouTube

- Gaming

- Social media

- Messages

After:

- Required quests completed

---

# Unlock Philosophy

Entertainment is not forbidden.

It is unlocked.

The player proves discipline before accessing rewards.

---

# Example Unlock Chain

## Messages

Requirement:

Complete:

- Core

- Rehab

- Walk

Restriction:

Do Not Disturb active during:

- Work hours

- Until noon on weekends

---

## YouTube

Requirement:

Workout complete

---

## Gaming

Requirement:

Learning or Work complete

---

## Social Media

Requirement:

Duolingo complete

---

## Netflix

Requirement:

All daily core quests complete

---

# Timed Quests

Certain quests have deadlines.

Examples:

Wake Up:

Target:

Before 7:00 AM

Sleep:

Target:

Before midnight

Meals:

Within one hour of planned meal time

---

# Grace Periods

Life is unpredictable.

Timed quests may include:

- Small buffer windows

- Emergency rescheduling

However:

Repeated rescheduling reduces discipline.

---

# Quest Types

## Core

Essential daily improvement.

Reward:

Small XP

---

## Bonus

Optional growth quests.

Examples:

- Bible reading

- Journal

- Extra learning

Reward:

Higher XP

---

## Weekly

Maintenance quests.

Examples:

- Cooking

- Grocery shopping

- Cleaning

- Grooming

- Laundry

---

## Special

Rare achievements.

Examples:

- Personal records

- Major goals

- Milestones

---

# Initial Quest Template

Quest {  
id  
name  
category  
description  
frequency  
deadline  
xpReward  
currencyReward  
statRewards  
completed  
}



---

# Initial Philosophy

Quests should improve:

Body

Mind

Character

Environment

Relationships

Skills

---

# v0.0.1 Streak Qualification

In v0.0.1, the streak increases only when **all daily core quests** (`daily` category) are completed for the day.

- Daily bonus quests are tracked separately and do not affect streak.
- Weekly and special quests do not affect streak.
- Completing individual core quests before the full set is done does not advance the streak.