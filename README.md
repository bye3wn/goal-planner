# Waypoint — Goal Planner

A long-term goal planner with a daily calendar. Long-term goals break down into
milestones (short-term goals), which connect to daily tasks/events you can
drag to reschedule.

## Why it's organized this way

Everything used to live in one file. That's fine for a quick preview, but
painful to change later — a small tweak meant scrolling through everything.
This version splits things by **responsibility**, so you always know where to
look:

```
src/
  constants/theme.js       ← colors, fonts, palette, hour range. Change the
                              look of the whole app from one file.
  utils/                   ← small pure functions (dates, ids). No UI, no state.
  data/seed.js             ← starter/demo data. Swap this out once you add a
                              real backend — nothing else needs to change.
  hooks/
    useGoals.js             ← all goal + milestone state and logic
    usePlanner.js           ← all task/calendar state and logic (incl. drag & drop)
  components/
    Header.jsx               ← top bar + date navigation
    sidebar/                 ← the goal "trail" (left panel)
    planner/                 ← the day view (right panel)
  App.jsx                   ← wires hooks + components together. Should stay thin.
```

### Rule of thumb for future changes

- **Changing how something looks** → `constants/theme.js` or the specific
  component's JSX/styles. You shouldn't need to touch hooks.
- **Changing how something behaves** (e.g. "tasks should support multi-day
  drag") → the relevant hook (`useGoals.js` / `usePlanner.js`). Components
  just call the functions the hooks give them; they don't hold logic.
- **Adding a new feature** (e.g. week view, reminders, persistence) → usually
  a new hook + a new component, without editing existing ones much.
- **Swapping in a real database** → only `data/seed.js` and the two hooks
  need to change (replace `useState` with your data-fetching of choice). No
  component should need to change.

## Getting started

```bash
npm install
npm run dev
```

## Adding persistence (next natural step)

Right now `useGoals` and `usePlanner` hold state in memory with `useState`.
When you're ready to persist data:
1. Pick a backend (Supabase and Firebase are both fast to wire up for this
   shape of data).
2. Replace the `useState` initial values in those two hooks with a fetch on
   mount, and add a save call inside each setter function.
3. Nothing in `components/` needs to know this happened.
