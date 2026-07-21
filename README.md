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

## Web and phone, from one codebase

This project is set up as a **PWA (Progressive Web App)**. That means:

- On desktop/laptop, it's just a normal website.
- On a phone, opening the site and choosing **"Add to Home Screen"**
  (Safari: Share → Add to Home Screen; Chrome: menu → Install app) puts a
  real app icon on the home screen. It opens full-screen, no browser bar,
  with its own splash color — no App Store submission needed.

No separate phone codebase to maintain — one set of components, one set of
hooks, both surfaces.

**What's already wired up:**
- `vite-plugin-pwa` (in `vite.config.js`) — generates the manifest + service
  worker automatically on build.
- `public/icons/` — the home-screen icons (192px, 512px, and the iOS
  touch-icon).
- Meta tags in `index.html` for iOS-specific "add to home screen" behavior
  and the status bar color.
- `env(safe-area-inset-*)` padding in `index.css` so content doesn't sit
  under a phone's notch or home indicator once installed.

To see the installed-app behavior, run a production build and open it —
`npm run dev` doesn't register the service worker:
```bash
npm run build
npm run preview
```
Then open the preview URL on your phone (same wifi network) and add it to
your home screen.

### If you later want actual App Store / Play Store listings

A PWA covers "installable app icon" well, but doesn't get you into the
app stores. When you're ready for that, the standard next step is
**Capacitor** — it wraps this same React app in a native shell so you can
ship it to both stores with very little code change (you're not rewriting
components, just adding a thin native wrapper). Worth doing once the app
is further along; not needed to start.

## Adding persistence (next natural step)

Right now `useGoals` and `usePlanner` hold state in memory with `useState`.
When you're ready to persist data:
1. Pick a backend (Supabase and Firebase are both fast to wire up for this
   shape of data).
2. Replace the `useState` initial values in those two hooks with a fetch on
   mount, and add a save call inside each setter function.
3. Nothing in `components/` needs to know this happened.
