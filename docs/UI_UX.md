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

**Current app (v0.0.3):** a single **Dashboard** — no router. Separate Quest / Progress / Inventory screens below are design targets for later, not separate routes today.

## Hero Dashboard (implemented)

Purpose: show the player's current state and let them complete today's work.

Section order:

1. Daily Summary banner (when available)
2. Hero Banner
3. Today's Journey
4. Unlocks
5. Active Objectives
6. Quests
7. Recent Progress
8. Achievements
9. Analytics
10. Hero History
11. Attributes

---

## Quest Screen (future / folded into Dashboard)

Purpose: daily action management.

Today this content lives in the Quests accordion on the Dashboard.

---

## Progress Screen (Analytics Dashboard — implemented)

Purpose: show improvement from History via the Analytics Engine.

Contains:

- Period filters (Today / This Week / This Month / Lifetime)
- Hero / quest / category / subcategory / achievement / history metrics
- Recharts visualizations (level, XP, gold, completion, stats)
- Chart point click → Daily History for that day

---

## Hero History (implemented)

Purpose: explore past progression as a unified adventure log.

Contains:

- **Contribution Calendar** — GitHub-style heatmap (completion intensity)
- **Hero Timeline** — reverse-chronological events with filters and search
- **Daily History Browser** — modal with level, stats, quests, achievements, unlocks, summary

Cross-navigation from Analytics charts, calendar, timeline, and unlocked achievements.

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

# Implementation Notes (Hero Dashboard 2.0)

Superseded the flow above with a more RPG-menu-like order, still top-to-bottom, still no router:

1. Hero Banner — name, title, avatar placeholder (initials), status, XP bar, gold, streak
2. Today's Journey — Non-Negotiables (overall + per-subcategory), Daily Bonus, Weekly, Weekly Bonus, Special progress bars, mirroring the real quest hierarchy (a glanceable summary, not the full checklist)
3. Unlocks — now split into Unlocked / Locked sections
4. Active Objectives — up to 3 fixed-priority "what to do next" entries (soonest timed quest, closest unlock, an incomplete weekly quest), or an empty-state message
5. Quests — unchanged accordion checklist, kept so quest completion still works from the dashboard
6. Recent Progress — up to 5 most recent `GameEvent`s
7. Attributes — same stats, now icon + card styling, moved to the bottom

Every section shares one wrapper, `src/components/Panel.tsx` (title + consistent border/spacing), so visual consistency doesn't depend on each section re-declaring the same classes. Generic completed/total bars use `src/components/ProgressBar.tsx` (distinct from `XpBar`, which stays purpose-built for XP). Hero title/status are derived, display-only functions (`src/features/hero/heroTitle.ts`, `src/features/hero/heroPresentation.ts`) — no new persisted state (except Lifetime Stats, see below).

Collapsible sections (Quests, Unlocks, Achievements, Today's Journey Non-Negotiables) all use the shared `Accordion` component. Expanded/collapsed state persists via `localStorage` under `ascendant-accordion:*` (UI preference, not save data). Unlocks, Achievements, and Today's Journey Non-Negotiables default collapsed; Quests Non-Negotiables still default expanded.

# Implementation Notes (Hero Dashboard 2.0 — finishing pass)

The Hero Card (`HeroBanner.tsx`) itself gained the most:

- **Status** — a small rule-based ladder over today's non-negotiable subcategory completion (Ready for Adventure → Focused → Morning Routine Complete → Making Progress → Evening Wind Down → Day Complete). See `getHeroStatus()` in `docs/ARCHITECTURE.md` for the exact rules.
- **Next Objective** — a single "what to do next" line directly under Status (soonest timed quest → earliest Non-Negotiable → earliest Daily Bonus → a Weekly quest), shown as "Quest Name — 2h 15m remaining" or "Quest Name — Ready".
- **Identity / Progress / Lifetime grouping** — Level + Title stay in the header/XP bar (Identity); Gold + Current Streak stay in the existing two-tile row (Progress); a new, visually separated "Lifetime" block below holds Quests Completed, Total XP Earned, Total Gold Earned, and Longest Streak — kept visually distinct from Current Streak specifically so the two aren't confused.

Today's Journey, Unlocks, Active Objectives, Quests, and Recent Progress are unchanged in this pass — this was a Hero Card and cross-cutting-logic refinement (progress calculations centralized into `src/features/quests/questProgress.ts`; the "next timed quest" search shared between Active Objectives and Next Objective), not a dashboard redesign.

# Implementation Notes (Daily Summary)

A new top-of-dashboard slot, above the Hero Banner, appears when a summary exists and is still within its display window:

1. **`DailySummaryBanner`** — call-to-action shown whenever `dailySummary` exists and `isDailySummaryDisplayable()` is true (visible through the summary's own day and all of the following morning, disappearing at noon the next day). Closing the summary does **not** hide the banner — it stays re-openable until that cutoff. Copy softens after first view: "Today's Summary is ready" becomes "View Today's Summary" (`dailySummaryViewed` only affects wording, not visibility).
2. **`DailySummaryModal`** — centered, scrollable "rewards screen": hero header with XP/Gold earned today, Quest Summary progress bars, Stat Growth chips, Major Events (chronological), Hero Reflection, Tomorrow preview. Dismissible via Continue, backdrop click, or Escape. Renders a generic **`SummarySnapshot`** — the same model is intended for future weekly/monthly summaries without rewriting this UI.

Today's Journey optional-quest display:

- **Subcategories** (Nutrition, etc.): optional quests don't count until every required quest in that subcategory is done. Breakfast + Lunch only → "1 / 3". All required + Breakfast → "4 / 3".
- **Non-Negotiables**: a single accordion (default collapsed, meta shows overall `completed/total`). Expanding reveals the overall progress bar plus the subcategory progress rows (Morning Routine, Nutrition, Evening Routine) indented beneath — not individually collapsible.
- **Non-Negotiables overall fraction**: gated and capped — never shows over-max (stays at e.g. "11 / 11" even if a subcategory beneath reads "4 / 3").

# Implementation Notes (Achievements)

A new dashboard section between Recent Progress and Attributes:

1. **`AchievementPanel`** — trophy case split into Unlocked / Locked top-level accordions, each containing category accordions (Progression, Consistency, etc.) nested beneath — same pattern as Quests. Everything defaults collapsed. Header shows Achievement Points earned vs total and completion %. Locked hidden achievements render as "???" (name, description, icon, progress withheld).
2. **`AchievementCard`** — rarity-colored border/badge (Common → Legendary), reward preview, progress bar for numeric conditions (e.g. "43 / 100 Workouts"), unlock date when earned.
3. **`AchievementUnlockedPopup`** — transient top toast when an achievement unlocks during play ("Achievement Unlocked! · First Quest · +5 XP, +2 Gold"). Rarity determines styling. Auto-dismisses after 5 seconds; tap to dismiss early. Queues multiple unlocks one at a time.

Achievement Points are separate from XP — they represent long-term completion of Ascendant itself, not character power.