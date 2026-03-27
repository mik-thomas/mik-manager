# Backlog & shipped

Living list for **Mik Manager**. Update this file as features land or new ideas appear (e.g. after each iteration).

**Onboarding:** see **`AGENTS.md`** for stack, layout, `localStorage` keys, and conventions — useful for another developer or AI agent picking up the repo.

---

## Shipped (high level)

| Area | What |
|------|------|
| Wellbeing | StressOmeter on Hourly Focus, stress log, 1:1 text export |
| Flight board | Delay / standby / cancelled per row; route **bell** check-ins + BELL column & stats |
| Flight plan | FIDS-style UI; **Cocktails & rest** when off the clock |
| Work & 1:1 | **1:1 alignment** (business plan, team objectives, role/spec, PDRs, monthly topics); **Issues log** (raise in team vs 1:1 vs both); combined monthly brief + stress |
| Hourly Focus | **Leg guidance** per schedule block (stakeholders, done criteria, links) |
| UI | Compact **schedule timeline**; board flicker animations; airport theme |
| Meta | This `BACKLOG.md` |

---

## Backlog

### Integrations & ambient

- [ ] **Home Assistant — LED “flight mood”**  
  LED strip behind a wall/dashboard reflects current flight segment (boarding, cruise, turbulence, descent, landing, cocktails & rest, …). **Publish flight state** from Mik (MQTT, HTTP, or file watched by HA); browser-only today → needs a small bridge or hook.

### Wall / cockpit display

- [ ] **Kiosk or “wall mode”** — fullscreen, large type, minimal chrome, optional **auto-rotation** through tabs with dwell time and **pause on interaction**  
- [ ] **Audio policy** — which events speak/chime; **quiet hours**; avoid overlapping cues  
- [ ] **Privacy-safe view** — optional layout that hides stress/issues/1:1 text on a shared screen  

### Guidance & tasks

- [ ] **Work queue — per-task guidance** (same idea as leg guidance, keyed by task id)  

### Process (optional)

- [ ] **CHANGELOG.md** — one-line entries when you tag a “stable” daily-driver version  
- [ ] **CONTRIBUTING.md** — only if others contribute or you want a short “how to run / build”  

---

*Last updated: ongoing — bump this note when you edit.*
