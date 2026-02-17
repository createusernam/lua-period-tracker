# CLAUDE.md

## Project

Lua — Private period tracker PWA. Works in all modern browsers (Chrome, Safari, Firefox, Edge). Installable on iOS (Safari → Share → Add to Home Screen) and Android (Chrome → Install).

## Commands

```bash
npm run dev        # Start dev server (Vite)
npm run build      # Production build (tsc -b && vite build)
npm test           # Run all tests (vitest)
npm run test:watch # Watch mode tests
npm run preview    # Preview production build
```

## Architecture

### Stack
- React 19 + TypeScript 5.9 + Vite 7
- Zustand 5 for state management
- Dexie.js 4 for IndexedDB (structured local storage)
- date-fns 4 for date math (tree-shakeable)
- vite-plugin-pwa (Workbox service worker)

### Source Layout (`src/`)

**Components** (`components/`):
- `Calendar.tsx` — Monthly calendar grid. Props: `currentMonth`, `onMonthChange` (state lifted to App for persistence across tab switches)
- `CalendarPicker.tsx` — Full-screen scrolling calendar for period date range selection (16 months, tap-to-select, overlap validation)
- `CycleStatus.tsx` — "Day X of ~Y" display, next period estimate, avg stats, stale data handling
- `CycleHistory.tsx` — Year-grouped cycle list with dot-bar visualization, filter pills (All/Last 3/Last 6), estimated cycle labels
- `CycleDynamicsChart.tsx` — Hand-rolled SVG line chart of cycle lengths (last 12 cycles, normal range band)
- `HistoryView.tsx` — History tab wrapper with Cycles/Year mode toggle
- `LogPeriodButton.tsx` — Transforms between "+ Log Period" and "End Period: Day N", opens CalendarPicker
- `YearView.tsx` — 12 mini-calendars in 3-column grid with year navigation, period/predicted/fertility markers
- `TabBar.tsx` — Calendar / History tabs
- `Settings.tsx` — Export/import JSON, delete all

**Services** (`services/`):
- `predictions.ts` — Weighted moving average cycle prediction, fertility window estimation, cycle history builder. Functions accept pre-computed prediction to avoid redundant computation.
- `importExport.ts` — JSON export/import with validation, data clearing

**Store** (`stores/`):
- `periodStore.ts` — Zustand: periods CRUD, prediction, cycleDay. Load-dedup to prevent race conditions.

**Data** (`data/`):
- `seedPeriods.ts` — Synthetic demo periods (2022-2025), used in tests. Runtime import via `public/flo-history.json`.

**Styles** (`styles/`):
- `index.css` — ALL styles (no inline `<style>` tags in components). CSS custom properties for theming. Design system: Arutyunov IDS + Birman/Bureau Gorbunov typography.

### Key Patterns

- **No inline styles in components.** All CSS lives in `styles/index.css`. Inline `<style>` tags cause reflows on re-render.
- **Lift UI state that must survive unmount.** Calendar month lives in App, not Calendar.
- **Store load dedup.** `periodStore.loadPeriods()` deduplicates concurrent calls via a module-level promise.
- **Error handling in store.** All DB mutations wrapped in try/catch, errors exposed via `error` state and re-thrown.
- **Date validation everywhere.** `max={todayStr}` on inputs, `endDate >= startDate` in handlers, regex validation on import.
- **Double-click prevention.** `saving` state disables submit buttons during async operations.
- **Stale data handling.** Cycle status and predictions must be sensible when last period was months/years ago.

### Colors
| Element | Hex |
|---------|-----|
| Period (logged) | `#FF6B8A` (coral) |
| Predicted | `#FFB6C8` (light pink) |
| Today ring | `#4A90D9` (blue) |
| Background | `#FFFFFF` |
| Text | `#2D2D2D` |
| Secondary | `#8E8E93` |

### Design System

Arutyunov IDS + Birman/Bureau Gorbunov:
- Density-based spacing: `--density: 1.35` controls all vertical rhythm
- RGB color triplets for flexible alpha: `--text-rgb: 34, 34, 34`
- All sizing in em/rem, font stack: `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif`
- Transitions: slow out (0.5s ease), instant in (0s on hover)
- Single breakpoint at 768px (mobile-first)
- See shared memory file `design-guidelines.md` for full reference

### Testing
- Vitest + @testing-library/react + fake-indexeddb
- Setup: `src/test/setup.ts` imports fake-indexeddb/auto
- Tests: `src/test/*.test.ts(x)` — 88 tests across predictions, utils, db, import/export, components
- `beforeEach`: clear all DB tables + reset Zustand via `store.setState()`

### Deployment
Build produces static files in `dist/`. Deploy to GitHub Pages, Vercel, or any static host. See `docs/DEPLOY.md` for GitHub Pages and VPS guides.

### Agent Team

10 agents in `.claude/agents/`:
| Agent | Personality | Role |
|-------|------------|------|
| `cto` | Werner Vogels | Architecture, coordination, code review |
| `product-manager` | Marty Cagan | Scope, prioritization, risk tracking |
| `ux-researcher` | Экселенц (ДКЦП) | Value prop validation, user research |
| `cjm-analyst` | CJM + ДКЦП | Customer journey maps, touchpoint-to-screen mapping |
| `design-prototyper` | Design With Code | Interactive HTML mockups for discussion |
| `tech-spec-writer` | Joel Spolsky | Technical specs (scenarios, data flow, file changes) |
| `ui-spec-writer` | Steve Krug | UI specs (wireframes, interactions, states) |
| `ux-designer` | Dieter Rams | UI design in code, CSS, responsive |
| `frontend-developer` | Dan Abramov | React/TS implementation |
| `qa-specialist` | James Bach | Test strategy, edge cases, exploratory testing |

Full workflow: brainstorm (CTO + PM + UX) → CJM (cjm-analyst) → mockup (design-prototyper) → spec (tech-spec + ui-spec) → implement (frontend-dev) → review (QA + CTO) → fix → verify

### Skills

6 skills in `.claude/skills/`:
| Skill | Command | Description |
|-------|---------|-------------|
| Sprint | `/sprint` | Full brainstorm → implement → review → fix cycle |
| Review | `/review` | QA + CTO review of recent changes |
| Test | `/test` | Run tests + TypeScript build check |
| Deploy | `/deploy` | Build + deploy to GitHub Pages |
| Mockup | `/mockup` | Create interactive HTML prototype |
| CJM | `/cjm` | Map customer journey with ДКЦП integration |

### Implemented Features (from Flo analysis)

Reference screenshots at `/home/natal/projects/Flo/IMG_8321-8328.PNG`.

| Feature | Status | Component |
|---------|--------|-----------|
| Calendar date picker (tap circles on scrolling calendar) | Done | `CalendarPicker.tsx` |
| Month/Year history view toggle | Done | `HistoryView.tsx` + `YearView.tsx` |
| Cycle dynamics chart (line chart of cycle lengths) | Done | `CycleDynamicsChart.tsx` |
| Cycle history with dot-bar visualization | Done | `CycleHistory.tsx` |
| Fertility window + ovulation markers | Done | `predictions.ts` |
| Filter pills (All / Last 3 / Last 6) | Done | `CycleHistory.tsx` |
| Demo data → importable JSON | Done | `public/flo-history.json` |
| Fix stale cycle status | Done | `CycleStatus.tsx` + `predictions.ts` |

### Known Constraints
- PWA cannot access HealthKit — step tracking (P1) requires Apple Shortcuts bridge
- `/home/natal/projects/Flo/` directory is root-owned, project lives in `lua-period-tracker/` instead
- Safari 17+ required for full PWA support (60% storage quota, Persistent Storage API)
- Ongoing periods capped at 14 days in calendar displays to prevent unbounded date expansion
