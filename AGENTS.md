# Agent handoff — Mik Manager

Use this file when **picking up the repo** (human or AI). It complements `BACKLOG.md` (what’s shipped vs planned).

## What this is

**Mik Manager** is a **local-first** React (Vite) SPA for **daily work as a “flight plan”**: hourly schedule, departure-board UI, wellbeing (stress log), 1:1 prep (alignment + issues), route bells, leg guidance, etc. **No backend** — data stays in the browser (`localStorage`) unless the user copies text out.

## Commands

```bash
npm install
npm run dev      # dev server
npm run lint     # ESLint (must pass before considering work done)
npm run build    # production bundle
npm run preview  # serve dist locally
```

## Layout

| Path | Role |
|------|------|
| `src/App.jsx` | Root layout, sidebar tabs, Hourly Focus wiring, global state (time, schedule, checks, bells, stress session, …) |
| `src/main.jsx` | React entry; imports `index.css` only |
| `src/index.css` | Global + FIDS styling (large file) |
| `src/components/*.jsx` | UI by feature |
| `src/lib/*.js` | Logic, storage, metrics (no React) |

**Schedule source**: `MOCK_SCHEDULE` in `App.jsx` (blocks get `startTime`/`endTime` for “today”). Task/work-queue data may come from `taskStore.js` + Task Builder.

## Sidebar tabs (IDs)

`hourly` · `dashboard` · `taskbuilder` · `workqueue` · `learn` · `stress` · `issues` · `alignment` · `calendar` · `settings`

## `localStorage` keys (non-exhaustive)

| Key | Purpose |
|-----|---------|
| `mik_stress_v1` | StressOmeter events |
| `mik_work_context_v1` | 1:1 alignment fields |
| `mik_issues_log_v1` | Issues + “raise in” (team / 1:1 / both) |
| `mik_route_bells_v1` | Per-day per-block bell check-ins |
| `mik_leg_guidance_v1` | Leg guidance text per block id |
| `mik_flight_disruptions_v1` | Per-day delay/standby/cancelled flags |
| `mik_day_checks_v1` | Airport ACK checkboxes |
| `mik_task_timing` | Timer state |
| `mik_snooze_until` | Procrastination break |
| … | Search `localStorage.setItem` / `STORAGE_KEY` in `src/lib` |

## Custom DOM events

Several modules `dispatchEvent(new Event('mik-…'))` so UI refreshes: e.g. `mik-stress-updated`, `mik-issues-updated`, `mik-bells-updated`, `mik-leg-guidance-updated`, `mik-work-context-updated`, `mik-disruptions-updated` (verify in code).

## Conventions worth preserving

- **Minimal, focused diffs** — don’t refactor unrelated files.
- **React Compiler / ESLint** — avoid impure render (`Date.now()` in render), synchronous `setState` in effects where rules forbid it; use `key=` remount patterns when switching entity ids.
- **Privacy copy** — stress/alignment/issues are sensitive; keep “stays on device” messaging where relevant.
- **Theme** — airport / FIDS (amber on dark, `Barlow Semi Condensed` + `Share Tech Mono`).

## Product language

- **Flight plan** / **departure board** / **legs** / **blocks**
- **Off the clock** → no active block → **Cocktails & rest** on the strip (`flightPlan.js`)
- **Route bell** = check-in at current leg (`routeBell.js`)

## Where to look next

- **`BACKLOG.md`** — shipped table + future work (HA LEDs, kiosk/wall mode, work-queue guidance, …)
- **`src/lib/flightPlan.js`** — `FLIGHT_STEPS`, `getFlightPlanState`, `COCKTAILS_FLIGHT_PLAN`
- **`src/lib/airportBoardStatus.js`** — row STATUS codes vs disruptions

## If something is unclear

Prefer **reading call sites** in `App.jsx` and the matching `lib/` module before inventing new patterns.
