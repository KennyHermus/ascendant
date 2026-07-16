# Ascendant UI/UX Guidelines

Version: 0.1

---

# Design Philosophy

The application should feel like:

- An RPG menu

- A character progression screen

- A personal training system

It should not feel like:

- A spreadsheet

- A corporate dashboard

- A boring habit tracker

---

# Visual Identity

Theme:

Fantasy + modern progression system

Inspirations:

- Character menus

- Training interfaces

- Adventure logs

---

# Main Screens

## Hero Dashboard

Purpose:

Show the player's current state.

Contains:

- Character name

- Level

- XP bar

- Stats

- Current streak

- Currency

---

## Quest Screen

Purpose:

Daily action management.

Contains:

- Today's quests

- Completion status

- Rewards

- Unlock status

---

## Progress Screen

Purpose:

Show improvement.

Contains:

- Stat growth

- Achievements

- Milestones

---

# UX Principles

## One Action Should Be Easy

Completing a quest should require:

Minimal taps.

---

## Progress Should Be Visible

The player should always know:

"What am I becoming?"

---

## Rewards Should Feel Meaningful

Use:

- Animations

- Sound

- Visual feedback

Avoid:

- Empty notifications

---

# Mobile First

Although development begins as a browser application:

Design for:

- Phone screens

- Touch interaction

- Short sessions

---

# Color Concepts

Future palette:

Power:

Gold

Growth:

Green

Danger:

Red

Knowledge:

Blue

Mystery:

Purple

---

# Animation Philosophy

Use animation for:

- Level ups

- Rewards

- Unlocks

Avoid excessive motion.

---

# Accessibility

Support:

- Keyboard navigation

- Clear contrast

- Readable text

- Reduced motion settings

---

# Implementation Notes (v0.0.2 Polish Pass)

The dashboard follows a fixed top-to-bottom flow, closest-to-character-identity first:

1. Hero Summary (name, level, XP, gold, streak)
2. Today's Progress (subcategory completion badges)
3. Unlocks (earned access, feels like abilities unlocking)
4. Quests — collapsible by category/subcategory, so daily use doesn't require scrolling past sections you're not touching that day
5. Attributes (deepest character detail, lowest priority to see first)

Quest categories use a generic, reusable `Accordion` component (`src/components/Accordion.tsx`), not a quest-specific one — it's meant to be reused for inventory, skill trees, achievements, and story chapters later. Non-Negotiables (and its subcategories) default to expanded, since that's the daily checklist; everything else defaults to collapsed to reduce clutter. Expanded/collapsed state is remembered across refreshes via its own `localStorage` namespace, kept separate from save data.