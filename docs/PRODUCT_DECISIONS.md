# Ascendant Product Decisions

**Long-term product decision log** — records *why* important choices were made, not how they were implemented.

For current behavior and architecture, see [PROJECT_STATE.md](PROJECT_STATE.md) and feature docs. For enduring product philosophy, see [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md). For implementation detail, see [ARCHITECTURE.md](ARCHITECTURE.md) and subsystem documentation.

---

# How to Use This Document

Add an entry when a **significant, durable product decision** is made — one that future contributors or AI assistants should understand before proposing changes.

Each entry follows this structure:

| Field | Purpose |
|-------|---------|
| **Decision** | What was decided |
| **Version** | When it was established or formalized |
| **Context** | Problem or situation that prompted the decision |
| **Reasoning** | Why this choice fits Ascendant's goals |
| **Alternatives Considered** | Other options and why they were rejected |
| **Final Outcome** | What shipped or was adopted |
| **Future Revisit Conditions** | When to reconsider (if applicable) |

Do not duplicate implementation specs here — link to feature docs instead.

---

# Decisions

## Hero Day boundary at 5:00 AM (not midnight)

| | |
|---|---|
| **Decision** | The game's "day" (quest reset, streaks, unlocks, history, analytics) uses a **Hero Day** boundary at **5:00 AM local time**, not calendar midnight. |
| **Version** | v0.0.3 |
| **Context** | Ascendant tracks daily habits, morning routines, and evening rituals. Calendar midnight splits the player's lived experience awkwardly — late-night activity and early-morning routines belong to different calendar dates but the same waking cycle. |
| **Reasoning** | Real-life discipline does not reset at midnight. A 5:00 AM boundary aligns the game day with a typical wake/sleep rhythm: evening work counts toward the day the player is still living, and morning Non-Negotiables belong to the new Hero Day. The "Hero Day" framing supports the RPG identity — the day begins when the Hero rises, not when the clock strikes twelve. |
| **Alternatives Considered** | **Calendar midnight** — simple but punishes night-owl schedules and misaligns morning quest design. **User-configurable boundary** — more flexible but adds settings complexity before the core loop was proven. **Rolling 24-hour windows** — harder to reason about streaks, unlocks, and calendar UI. |
| **Final Outcome** | Centralized Time Service (`timeService.ts`); all daily systems consume Hero Day keys. Documented in [TIME.md](TIME.md). |
| **Future Revisit Conditions** | If player research shows the fixed 5:00 AM boundary fails for a significant audience, consider configurable Hero Day start in Fitness Settings — without breaking history or analytics consistency. |

---

## Late timed-quest completions count toward progression with reduced rewards

| | |
|---|---|
| **Decision** | Timed quests completed **after the grace period** still award full base rewards (1.00× multiplier), count toward streaks, unlocks, analytics, and history — but receive **lower multipliers** than Perfect or On Time completions. Only quests left incomplete when the Hero Day ends are marked **Missed**. |
| **Version** | v0.0.3 |
| **Context** | Timed quests introduce punctuality as a skill. The product needed to incentivize on-time behavior without turning late completion into total failure — which would discourage the real behavior (doing the quest at all). |
| **Reasoning** | Ascendant should motivate discipline, not shame. Completing a quest late is still real-world progress and should be celebrated — with smaller RPG rewards reflecting reduced punctuality. Streaks and unlocks represent consistency of *doing* the work, not perfection of timing. Graded multipliers (1.15× / 1.05× / 1.00×) create incentive without binary pass/fail punishment. |
| **Alternatives Considered** | **Binary pass/fail after grace** — late = miss; rejected as too punitive and demotivating. **No reward reduction for lateness** — removes incentive for punctuality and weakens timed-quest design. **Separate streak for punctuality only** — considered; partially addressed via punctuality analytics and Quest Explorer instead. |
| **Final Outcome** | Completion grades (`perfect`, `onTime`, `completed`) with reward multipliers; late completions fully integrated into progression pipelines. Documented in [TIME.md](TIME.md), [QUESTS.md](QUESTS.md). |
| **Future Revisit Conditions** | If analytics show late completions dominate and punctuality incentives are ineffective, revisit multiplier spread or add optional "punctuality streak" — without revoking credit for completed work. |

---

## Hero-first product philosophy

| | |
|---|---|
| **Decision** | Every new feature must answer **"How does this make the Hero feel more alive?"** Identity, timeline, biography, and journey integration take priority over isolated mechanics or raw metric display. |
| **Version** | v0.0.5 (formalized); roots in v0.0.2+ dashboard and identity work |
| **Context** | Ascendant risked becoming a capable habit tracker with RPG chrome — stats and checkboxes without a sense of character. v0.0.5 Hero Identity made the gap explicit: mechanics existed, but the Hero did not feel like a persistent character. |
| **Reasoning** | The product vision is a **real-life progression RPG**, not a productivity app. Players should feel they are guiding someone through a journey earned by real action. Features that do not connect to Profile, Timeline, Journey, History, or Analytics should be questioned — infrastructure excepted. |
| **Alternatives Considered** | **Feature-first roadmap** — ship capabilities independently, integrate later; rejected after integration debt accumulated across fitness systems. **Pure gamification** — maximize points and streaks; conflicts with anti-grinding and agency principles. **Narrative-first without mechanics** — story without real-life action; rejected as not the core loop. |
| **Final Outcome** | Hero Identity (profile, biography, titles, lifetime accomplishments); Hero-first design codified in [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) and development workflow. |
| **Future Revisit Conditions** | Revisit if a major new phase (e.g. v0.1.x combat/world) requires mechanics that are intentionally decoupled from identity — document the exception explicitly. |

---

## Exercise progression expands repertoire; foundational exercises are never replaced

| | |
|---|---|
| **Decision** | Training progression **introduces** advanced exercises when prerequisites are met — it does not **replace** or retire foundational exercises from the player's program. |
| **Version** | v0.0.4 |
| **Context** | The fitness system needed structured progression beyond "add weight." Advanced bodyweight skills (one-arm push-ups, planche progressions) require readiness gates without discarding the exercises that built that readiness. |
| **Reasoning** | Real training builds on foundations — push-ups remain valuable even after introducing tiger bends or one-arm variants. Replacing exercises would misrepresent how strength develops and would punish players for "outgrowing" basics. Prerequisites mean **ready to begin practicing**, not **done with fundamentals**. This aligns with expanding opportunity rather than removing it ([PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) — preserve user agency). |
| **Alternatives Considered** | **Linear progression paths that swap exercises** — simpler UX but implies abandonment of earlier work. **Auto-modifying workout templates** — rejected; coaching stays informational. **No gating** — all exercises available immediately; removes meaningful progression and safety signaling. |
| **Final Outcome** | Exercise roles (`foundation`, `variation`, `skill`, …), families, and prerequisite system; Progression Engine recommends introduction — never auto-edits templates. Documented in [COACHING.md](COACHING.md). |
| **Future Revisit Conditions** | If program periodization or deload phases require temporary exercise substitution, model it as explicit coaching recommendations — not silent removal from catalogs. |

---

## Analytics-first design (derive from history; do not reconstruct)

| | |
|---|---|
| **Decision** | Long-term statistics, charts, and insights are **derived read-only** from append-only history (`DailySnapshot`, `questHistory`, `lifetimeStats`) — not recomputed by scanning ephemeral daily quest state or unbounded event logs. |
| **Version** | v0.0.3 (History + Analytics); reinforced v0.0.4 integration pass |
| **Context** | Quest state resets daily. Events are capped for UI performance. Dashboards needed multi-day and multi-month views without corrupting gameplay state or duplicating counters in components. |
| **Reasoning** | Analytics should reflect **what actually happened**, preserved at the time it happened. Reconstructing history from current quest checkboxes is impossible after day advance. A dedicated History layer plus read-only Analytics Engine keeps presentation dumb, prevents drift between UI calculations, and supports Insights and Quest Explorer from one source. Hero Profile consistency rates delegate to analytics rather than bespoke logic. |
| **Alternatives Considered** | **Compute stats in React components** — fast to ship, impossible to maintain consistently. **Unlimited event log as analytics source** — storage and performance cost; events remain a recent buffer only. **Daily Summary as analytics input** — rejected; Summary is player-facing presentation, not a data warehouse ([HISTORY.md](HISTORY.md)). |
| **Final Outcome** | Three-layer history model (events / snapshots / quest history); Analytics Engine + metric registry + Analytics Domain pattern (Workout Analytics, nutrition charts). Documented in [HISTORY.md](HISTORY.md), [ANALYTICS.md](ANALYTICS.md). |
| **Future Revisit Conditions** | Cloud sync or export may require snapshot rollup strategies — extend the history layer, do not bypass it with ad-hoc recomputation. |

---

## AI and coaching guide; they do not dictate behavior

| | |
|---|---|
| **Decision** | Coaching recommendations and AI-assisted systems **inform and encourage** — they never auto-modify workouts, auto-complete quests, punish autonomy, or replace player judgment. |
| **Version** | v0.0.4 (Progression Engine); principle formalized v0.0.5 |
| **Context** | Fitness coaching and future AI features could easily slide into autopilot — changing programs, nagging, or optimizing away player choice. Ascendant's audience is improving real life, not outsourcing decisions to an algorithm. |
| **Reasoning** | Agency preserves trust and long-term engagement. Informational coaching respects that the player knows their body and schedule. The same principle extends to future AI planning: suggestions, not commands. This distinguishes Ascendant from punitive habit apps and from fully automated fitness bots. |
| **Alternatives Considered** | **Auto-applied coaching changes** — faster "results" in-app but removes agency and risks unsafe training changes. **Pure data display without coaching** — misses opportunity to help; Insights and Coaching split handles interpretation vs. recommendation. **AI-generated quests without review** — deferred; would require explicit product decision and human approval gate. |
| **Final Outcome** | Progression Engine emits recommendations only; `COACHING_RECOMMENDATION` timeline events; principle 4 in [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md). Future AI Companion phase ([MILESTONES.md](MILESTONES.md)) inherits this constraint. |
| **Future Revisit Conditions** | Opt-in automation (e.g. "apply deload suggestion to template") may be offered if explicitly requested by the player — never as default behavior. |

---

## Separate AI conversations by responsibility

| | |
|---|---|
| **Decision** | AI-assisted development uses **one primary responsibility per conversation** with dedicated phases: Product Planning, Technical Planning, Implementation, Code Review, Documentation, and Implementation Reporting — plus optional Learning Review, Debugging, and Research. |
| **Version** | v0.0.5 workflow formalization |
| **Context** | General-purpose AI threads mixed product design, code changes, bug fixes, and doc edits — causing scope creep, stale context, and inconsistent architecture. |
| **Reasoning** | Separation mirrors disciplined team practice: design before build, one feature per thread, focused fixes, dedicated doc passes. Short-lived Implementation conversations enforce Definition of Done. Long-lived Product Planning preserves vision across milestones. |
| **Alternatives Considered** | **Single persistent AI thread** — convenient but context degrades. **Implementation-only with no planning handoff** — higher rework rate. **Human-only process docs** — insufficient for actual development workflow. |
| **Final Outcome** | [AI_WORKFLOW.md](AI_WORKFLOW.md) as canonical AI workflow; [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) for general lifecycle; [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) for completion criteria. |
| **Future Revisit Conditions** | Add new conversation types only when a distinct output and lifespan is identified. Learning Review documented as optional post-implementation mode in DEFINITION_OF_DONE. |

---

# Related Documents

| Document | Relationship |
|----------|--------------|
| [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) | Enduring *why* — principles derived from and supported by these decisions |
| [PROJECT_STATE.md](PROJECT_STATE.md) | Current implementation baseline |
| [MILESTONES.md](MILESTONES.md) | Phase-level direction |
| [AI_WORKFLOW.md](AI_WORKFLOW.md) | AI development process (decision: separate conversations) |
| [GAME_BIBLE.md](GAME_BIBLE.md) | Game mechanics and fantasy |
| Feature docs | Implementation detail for each decision's outcome |

---

*Decision log established at v0.0.5 workflow formalization. Append entries when significant product choices are made — do not retroactively rewrite shipped decisions without explicit team discussion.*
