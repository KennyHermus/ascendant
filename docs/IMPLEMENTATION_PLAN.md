# Ascendant Implementation Plan

Version: 0.0.1

---

# Purpose

This document defines the first implementation milestone for Ascendant.

The goal of v0.0.1 is not to build the entire RPG.

The goal is to create the first playable foundation:

A user can complete real-life quests, gain experience, improve their hero, and return the next day to continue progressing.

---

# Development Philosophy

Build the smallest version that creates the core gameplay loop.

The first version should prioritize:

1. Functionality
2. Clean architecture
3. Extensibility
4. Enjoyable user experience

Avoid implementing complex systems before the foundation exists.

---

# v0.0.1 Core Gameplay Loop

The player should be able to:



Open Application

↓

View Hero Status

↓

View Available Quests

↓

Complete Quest

↓

Receive Rewards

↓

Gain XP

↓

Increase Progress

↓

Return Later  


---  
  
# Features Included  
  
## 1. Hero System  
  
The application must display:  
  
- Hero name  
- Level  
- Current XP  
- XP required for next level  
- Currency  
- Stats  
  
Initial stats:  


Strength: 1

HP: 1

Defense: 1

Stamina: 1

Speed: 1

Intellect: 1

Willpower: 1

Special Technique: 1  
---  
  
# 2. Quest System  
  
The application must support:  
  
Quest categories:  
  
- Daily  
- Daily Bonus  
- Weekly  
- Special  
  
Each quest contains:  


id

name

description

category

xpReward

currencyReward

statRewards

completed  
---  
  
# Initial Quest Data  
  
Create sample quests:  
  
## Daily  
  
- Wake Up  
- Workout  
- Core  
- Rehab  
- Walk  
- Learning / Work  
  
---  
  
## Daily Bonus  
  
- Journal  
- Bible Reading  
- Extra Learning  
  
---  
  
## Weekly  
  
- Cooking  
- Groceries  
- Cleaning  
- Grooming  
- Laundry  
  
---  
  
# 3. Quest Completion  
  
When a quest is completed:  
  
The player receives:  
  
- XP  
- Currency  
- Stat experience  
  
The quest changes state:  
  
Incomplete:

false  


Completed:

true  


---  
  
# 4. Progression System  
  
Implement:  
  
## XP Tracking  
  
Hero has:  


currentXP

level

xpToNextLevel

  
---  
  
## Level Up  
  
When XP reaches required amount:  
  
Increase:  
  
- Level +1  
- All base stats +1  
  
Reset XP remainder.  
  
---  
  
# 5. Persistence  
  
Progress should survive page refresh.  
  
Use:  
  
Browser localStorage  
  
Store:  
  
- Hero state  
- Quest completion state  
- Settings  
  
---  
  
# 6. Dashboard  
  
Create a main dashboard screen.  
  
Layout:

---

Hero Card

Level  
XP Bar  
Stats

---

Today's Quests

Quest Cards

---

Progress Summary

Currency  
Streak  
---  
  
# Technical Requirements  
  
## Framework  
  
Use:  
  
- React  
- TypeScript  
- Vite  
  
---  
  
## State Management  
  
Use:  
  
Zustand  
  
Global state:  


Hero

Quests

Progression

Settings

  
---  
  
# Folder Structure  
  
The initial source code should follow:  


src/

├── app/

├── features/

│ ├── hero/

│ ├── quests/

│ └── progression/

├── components/

├── data/

├── store/

├── types/

├── lib/

└── utils/  


---  
  
# Initial Files  
  
Create:  


src/

├── app/  
│ └── App.tsx

├── features/

│ ├── hero/  
│ │ ├── HeroCard.tsx  
│ │ ├── heroTypes.ts  
│ │ └── heroLogic.ts  
│  
│ ├── quests/  
│ │ ├── QuestCard.tsx  
│ │ ├── questTypes.ts  
│ │ └── questLogic.ts  
│  
│ └── progression/  
│ └── progressionLogic.ts  
│  
├── data/

│ └── quests.ts

├── store/

│ └── gameStore.ts

├── types/

│ ├── hero.ts  
│ └── quest.ts

├── lib/

│ └── storage.ts

└── main.tsx  
---  
  
# Explicitly NOT Included  
  
Do NOT implement yet:  
  
## Combat  
  
Wait until:  
  
- Hero system is stable  
- Progression is working  
  
---  
  
## Inventory  
  
Wait until:  
  
- Currency exists  
- Rewards are meaningful  
  
---  
  
## Story  
  
Wait until:  
  
- Gameplay loop is enjoyable  
  
---  
  
## AI Features  
  
Wait until:  
  
- Core data model is proven  
  
---  
  
# Future Milestones  
  
---  
  
# v0.0.2  
  
Quality of life:  
  
- Better UI  
- Animations  
- Streak tracking  
- Quest timers  
  
---  
  
# v0.1  
  
RPG Foundation:  
  
- Combat prototype  
- Enemies  
- Equipment  
- Achievements  
  
---  
  
# v0.2  
  
Advanced progression:  
  
- Skills  
- Abilities  
- Story chapters  
- Boss fights  
  
---  
  
# v1.0  
  
Full Ascendant experience:  
  
- Mobile support  
- Cloud saves  
- Advanced RPG systems  
- Long-term progression  
  
---  
  
# Cursor Instructions  
  
Before writing code:  
  
1. Read all documentation.  
2. Follow ARCHITECTURE.md.  
3. Follow CODING_STANDARDS.md.  
4. Implement only v0.0.1.  
5. Do not create future systems.  
6. Prefer simple extensible solutions.  
  
The goal is a clean foundation, not maximum features.