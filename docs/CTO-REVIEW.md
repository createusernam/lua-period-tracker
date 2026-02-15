# CTO Architecture Review — Post-Sprint

**Reviewer:** CTO (Werner Vogels mode)
**Date:** 2026-02-16
**Scope:** All 8 features from the implementation sprint
**Verdict:** Ship-ready with minor cleanup. No blockers.

---

## Architecture Assessment

### Component Decomposition: Good

The component tree is clean and well-organized:

```
App
  ├── CycleStatus
  ├── Calendar (monthly grid, display-only)
  ├── LogPeriodButton
  │     └── CalendarPicker (full-screen date range picker)
  ├── HistoryView (mode toggle wrapper)
  │     ├── CycleDynamicsChart (SVG line chart)
  │     ├── CycleHistory (dot-bar list with filters)
  │     └── YearView (12 mini-calendars)
  │           └── MiniCalendar (per-month)
  ├── Settings
  └── TabBar
```

**Strengths:**

- Single responsibility is well-maintained. Each component does one thing.
- `HistoryView` as a mode-toggle wrapper (`src/components/HistoryView.tsx:1-44`) is the right pattern -- it composes children without mixing logic.
- State lifting is correct: `calendarMonth` lives in `App.tsx:15` so it survives tab switches. The `handleMonthSelect` callback (`App.tsx:23-26`) correctly wires YearView month taps back to the Calendar tab.
- `CalendarPicker` (`src/components/CalendarPicker.tsx`) is cleanly separated from the display `Calendar` -- they share zero state and no coupling beyond shared date utilities.
- `PickerMonth` is extracted as a separate sub-component within `CalendarPicker.tsx:210-287`, which is fine for a component that won't be reused elsewhere.

**Minor observations:**

- `CycleDynamicsChart.tsx` and `CycleHistory.tsx` both independently call `buildCycleHistory(periods)`. They're always rendered together inside `HistoryView` when `mode === 'cycles'`. The data could be computed once and passed down, but since `useMemo` memoizes each call against the same `periods` reference, the practical cost is negligible. Not a problem.

### Data Flow: Correct

Store-to-component flow is straightforward:

1. `periodStore.ts` is the single source of truth. All mutations go through `addPeriod`, `updatePeriod`, `deletePeriod`.
2. Each mutation writes to IndexedDB first, then calls `loadPeriods()` to re-derive `prediction` and `cycleDay` from the full dataset (`periodStore.ts:57-84`).
3. The load-dedup pattern (`periodStore.ts:20,31-54`) correctly prevents concurrent loads from racing.
4. Components subscribe to the store via `usePeriodStore()` and derive view-specific data with `useMemo`.

**No stale closures detected.** The `handleDayTap` callback in `CalendarPicker.tsx:101-130` correctly depends on `[startDate, endDate]`. The `handleMonthSelect` in `App.tsx:23-26` has an empty dep array because it only uses setters, which is correct.

**No race conditions.** The `loadingPromise` guard in `periodStore.ts:31` ensures that rapid-fire mutations (e.g., import then immediate UI action) won't produce inconsistent state.

### Responsibility Separation: Clean

| Layer | Files | Responsibility |
|-------|-------|---------------|
| Data | `db.ts`, `types.ts` | Schema, DB access |
| Logic | `services/predictions.ts`, `utils.ts` | Pure computation |
| State | `stores/periodStore.ts` | CRUD + derived state |
| Services | `services/importExport.ts` | I/O (file read/write) |
| View | `components/*` | Rendering only |
| Style | `styles/index.css` | All visual presentation |

This is the correct separation. No component touches IndexedDB directly. No service layer has React imports. The store doesn't know about rendering.

---

## Performance Concerns

### 1. Redundant `predictNextPeriod` call inside `getDayOfCycle`

**Severity: Low**
**File:** `src/services/predictions.ts:94`

`getDayOfCycle` internally calls `predictNextPeriod(periods)` to compute `total` and `daysUntilNext`. But the store *also* calls `predictNextPeriod(sorted)` separately at `periodStore.ts:40`, then calls `getDayOfCycle(sorted)` at line 41. This means `predictNextPeriod` runs **twice** on every `loadPeriods()` call.

The dataset is small (37 periods, growing slowly), and `loadPeriods` is called infrequently (on mutations), so the actual performance impact is near zero. But architecturally, `getDayOfCycle` should accept a pre-computed prediction as an optional parameter to avoid the redundancy.

### 2. `buildCycleHistory` also calls `predictNextPeriod` internally

**Severity: Low**
**File:** `src/services/predictions.ts:163`

Inside `buildCycleHistory`, the last cycle's length falls back to `predictNextPeriod(periods)?.avgCycleLength`. So when `CycleHistory` and `CycleDynamicsChart` each call `buildCycleHistory`, `predictNextPeriod` runs yet again. With 37 periods, the sort + arithmetic is trivially fast, but this is worth noting for a future refactor if the dataset ever grows large.

### 3. `eachDayOfInterval` expansion for period date sets

**Severity: Low**
**Files:** `Calendar.tsx:27-34`, `CalendarPicker.tsx:50-60`, `YearView.tsx:26-36`

Three separate components expand every period into individual day strings and store them in a `Set<string>`. For 37 periods averaging 3 days each, that's ~111 strings -- trivial. But if a user has years of data with long periods, this could grow. All three expansions are memoized via `useMemo` with `[periods]` as dependency, so they only recompute on actual data changes.

The real concern is that `Calendar.tsx`, `CalendarPicker.tsx`, and `YearView.tsx` each independently build identical `periodDates` and `predictedDates` sets with identical logic (lines are nearly copy-paste). This is a DRY violation and a candidate for a shared hook -- see Improvement Suggestions.

### 4. No virtualization for CalendarPicker scroll

**Severity: Low**
**File:** `src/components/CalendarPicker.tsx:40-47`

The picker renders 16 months (12 back + current + 3 forward) simultaneously in a scrolling container. Each month renders ~35-42 day cells. Total: ~560-672 DOM nodes. This is well within acceptable limits for mobile Safari. Virtualization would add complexity without meaningful benefit here.

### 5. SVG chart renders all points

**Severity: None**
**File:** `src/components/CycleDynamicsChart.tsx:29-35`

The chart caps at 12 data points (`.slice(-12)`), so SVG complexity is bounded. No concern.

---

## Dead Code / Cleanup

### Files to remove

| File | Status | Evidence |
|------|--------|----------|
| `src/components/HistoryList.tsx` | **Dead code -- delete** | Not imported anywhere. Was the original history view, replaced by `CycleHistory.tsx`. Only references are its own exports (`HistoryList.tsx:6`). |
| `src/components/LogPeriodSheet.tsx` | **Dead code -- delete** | Not imported anywhere. Was the original bottom-sheet log form, replaced by `CalendarPicker.tsx`. Only references are its own exports (`LogPeriodSheet.tsx:9`). |

### Files to audit

| File | Status | Notes |
|------|--------|-------|
| `src/data/seedPeriods.ts` | **Test-only** | Only imported in `src/test/db.test.ts:3`. Not imported by any runtime code. The CLAUDE.md still says "auto-imported on first launch" but `db.ts:22-26` no longer seeds data. Either (a) delete the file and move the test data inline, or (b) keep it as a convenient import fixture. Either is fine, but update the CLAUDE.md description. |

### CLAUDE.md stale descriptions

- `components/LogPeriodSheet.tsx` is listed in the "Components" section but the component is dead.
- `components/HistoryList.tsx` is listed but dead.
- `data/seedPeriods.ts` description says "auto-imported on first launch" which is no longer true.
- Missing entries for new components: `CalendarPicker.tsx`, `CycleDynamicsChart.tsx`, `CycleHistory.tsx`, `HistoryView.tsx`, `YearView.tsx`.

### CSS cleanup

The CSS in `src/styles/index.css` contains styles for the dead `LogPeriodSheet` form fields (`.field`, `.checkbox-label`, etc. at lines 344-393). These classes are still used by LogPeriodSheet but since that component is dead code, these styles are unreachable at runtime. However, the `.field` and `.checkbox-label` styles are generic enough that they might be reused later, so this is informational, not blocking.

---

## Code Quality

### Naming consistency: Good

- Components use PascalCase (`CycleHistory`, `CalendarPicker`).
- Functions use camelCase (`buildCycleHistory`, `estimateFertilityWindow`).
- CSS uses BEM-like kebab-case (`cycle-item-header`, `picker-selection-info`).
- Types use PascalCase (`CyclePrediction`, `FertilityWindow`).

No naming inconsistencies found.

### DRY violations

**1. Period date set construction** (repeated 3 times)

Identical logic appears in:
- `Calendar.tsx:26-35`
- `CalendarPicker.tsx:50-61`
- `YearView.tsx:26-36`

All three build `periodDates: Set<string>` by iterating periods, expanding with `eachDayOfInterval`, and adding to a Set. A `usePeriodDates()` hook would eliminate this.

**2. Predicted date set construction** (repeated 3 times)

Identical logic appears in:
- `Calendar.tsx:37-49`
- `CalendarPicker.tsx:64-72`
- `YearView.tsx:39-50`

Same pattern. Could be consolidated into the same hook.

**3. Week grid generation** (repeated 3 times)

Nearly identical code to generate `weeks: Date[][]` from a month:
- `Calendar.tsx:51-63`
- `CalendarPicker.tsx:221-232` (inside `PickerMonth`)
- `YearView.tsx:125-131` (inside `MiniCalendar`, uses flat array instead of weeks)

**4. Day classification logic**

Both `Calendar.tsx:98-109` and `CalendarPicker.tsx:250-268` classify days with nearly identical `isPeriod`, `isPredicted`, `isToday` checks and build className strings. The CalendarPicker version is more complex (adds `selected`, `range-start`, `range-end`, `existing-period`, `future`), so this isn't a pure DRY violation but there's overlap.

### Import hygiene: Clean

All imports across all files are used. No unused imports detected.

### Error handling: Adequate

- Store mutations wrap IndexedDB calls in try/catch (`periodStore.ts:57-65, 67-75, 77-85`).
- Import validation is thorough (`importExport.ts:33-44`) -- checks date format, ordering, existence.
- `CalendarPicker` has save error handling (`CalendarPicker.tsx:146-148`).
- `Settings` has error display for import/export (`Settings.tsx:19-21, 37-38`).

**Minor gap:** `Settings.handleClearAll` (`Settings.tsx:43-48`) doesn't wrap `clearAllData()` in try/catch. If IndexedDB clearing fails, the error is unhandled. Low risk since `clear()` rarely fails, but inconsistent with the pattern used elsewhere.

### TypeScript strictness: Good

- `Period.id` is typed as `id?: number` (optional for new records, populated by Dexie auto-increment). Correct.
- `endDate: string | null` is consistent everywhere.
- `CyclePrediction.confidence` uses a union literal type rather than a plain string. Good.
- The `dayNumber` helper in `CycleHistory.tsx:162-166` uses `getTime()` math instead of `differenceInDays` from date-fns -- this works but is stylistically inconsistent with the rest of the codebase. Minor.

---

## Bundle Size

### Dependencies: Lean

| Package | Size (gzip) | Assessment |
|---------|-------------|------------|
| `react` + `react-dom` | ~42 KB | Required |
| `zustand` | ~1.5 KB | Excellent choice, tiny |
| `dexie` | ~20 KB | Necessary for IndexedDB |
| `date-fns` | Tree-shakeable | Only imported functions are bundled |
| `vite-plugin-pwa` | Build-only | Zero runtime |

**No heavy dependencies.** No charting libraries (SVG is hand-rolled). No CSS framework. No icon library (inline SVGs). This is a minimal, focused dependency set.

`date-fns` v4 is tree-shakeable and the imports across the codebase use individual function imports (`import { format, parseISO } from 'date-fns'`), so only ~8-10 functions will be bundled. Estimated date-fns contribution: ~5 KB gzip.

**Total estimated bundle: ~70-75 KB gzipped.** Excellent for a PWA.

---

## PWA Readiness

### Service Worker: Configured

`vite.config.ts:9-15` configures `vite-plugin-pwa` with:
- `registerType: 'autoUpdate'` -- service worker auto-updates on new deployments
- `globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']` -- caches all static assets
- `manifest: false` -- uses the external `public/manifest.json` file

### Manifest: Present

`public/manifest.json` declares `"display": "standalone"`, correct `start_url`, theme color, and icon references.

**Potential issue:** The manifest references `/icons/icon-192.png` and `/icons/icon-512.png` but I cannot verify these files exist in `public/icons/`. If missing, PWA install will fail on iOS.

### Offline capability: Strong

All data is in IndexedDB via Dexie. The app computes everything client-side. No API calls anywhere in the codebase. Once the service worker caches the shell, the app is fully offline-capable.

### iOS Safari specifics

- `env(safe-area-inset-bottom)` is used correctly in `index.css:55` for the tab bar and bottom sheet.
- `env(safe-area-inset-top)` is used in the header (`index.css:148`).
- `-webkit-overflow-scrolling: touch` is set on scrollable areas (`index.css:174, 811`).
- `-webkit-tap-highlight-color: transparent` is in the reset (`index.css:69`).
- `-webkit-font-smoothing: antialiased` is set (`index.css:84`).

**Missing:** No `<meta name="apple-mobile-web-app-capable">` or `<meta name="apple-mobile-web-app-status-bar-style">` tags were verified (they'd be in `index.html`). These are important for iOS PWA appearance.

---

## Maintainability

### Adding new features: Easy

The architecture supports extension well:

- **New tab?** Add to `Tab` type, add case in `App.tsx`, add button to `TabBar`.
- **New history mode?** Add to `HistoryMode` in `HistoryView.tsx`, add button, add component.
- **New data type?** Add Dexie table in `db.ts`, add type in `types.ts`, add store (or extend `periodStore`).
- **New prediction algorithm?** Swap implementation in `predictions.ts`, store interface unchanged.

### Tight coupling: None found

- Components communicate through props and the Zustand store. No prop drilling beyond 2 levels.
- The store is the only module that imports both `db.ts` and `predictions.ts`. Components never touch IndexedDB directly.
- `importExport.ts` is the only service that accesses `db` directly (for bulk operations), which is acceptable.

### Test coverage

46 tests covering:
- Prediction algorithms (weighted average, confidence levels, edge cases)
- Date utilities
- Database operations with fake-indexeddb
- Import/export validation
- Component rendering

**Gap:** No tests for the new components (`CalendarPicker`, `CycleHistory`, `CycleDynamicsChart`, `YearView`, `HistoryView`). The existing `components.test.tsx` likely covers the original components. New feature components should get at least smoke tests (renders without crashing, handles empty data).

---

## Improvement Suggestions

### Priority 1: Delete dead code (5 min)

1. Delete `src/components/HistoryList.tsx`
2. Delete `src/components/LogPeriodSheet.tsx`
3. Update CLAUDE.md to reflect current component list

### Priority 2: Extract shared date hooks (30 min)

Create `src/hooks/usePeriodDates.ts`:

```ts
// Returns { periodDates, predictedDates } memoized from store
export function usePeriodDates() { ... }
```

This eliminates the 3x copy-paste of period/predicted date set construction across Calendar, CalendarPicker, and YearView.

### Priority 3: Pass prediction to `getDayOfCycle` (10 min)

Change `getDayOfCycle` signature in `predictions.ts:73` to accept an optional `prediction` parameter, avoiding the redundant `predictNextPeriod` call. Update `periodStore.ts:41` to pass the already-computed prediction.

### Priority 4: Add smoke tests for new components (1 hour)

At minimum, test that `CycleHistory`, `CycleDynamicsChart`, `YearView`, and `CalendarPicker` render without errors when given:
- Empty periods array
- A few periods (happy path)
- Only one period (edge case for predictions returning null)

### Priority 5: Verify PWA icons and meta tags (10 min)

Confirm `public/icons/icon-192.png` and `public/icons/icon-512.png` exist. Add `apple-mobile-web-app-capable` meta tag to `index.html` if missing.

### Not recommended

- **Do NOT add React.memo to PickerMonth or MiniCalendar.** The parent components already memoize the data they pass down. Adding memo would add comparison overhead without measurable benefit at this scale.
- **Do NOT add a charting library.** The hand-rolled SVG in CycleDynamicsChart is ~145 lines and does exactly what's needed. A library would add 50+ KB for no gain.
- **Do NOT add a CSS-in-JS solution.** The single `index.css` file works well. At 1259 lines it's manageable, well-organized by section, and follows a consistent design system.

---

## Overall Verdict

**Ship it.**

The codebase is clean, well-architected, and maintainable. The sprint delivered 8 features without degrading code quality or introducing technical debt beyond the two dead files (`HistoryList.tsx`, `LogPeriodSheet.tsx`) that are natural artifacts of the replacement pattern used.

Key strengths:
- **Minimal dependencies** -- 70 KB total bundle, no bloat
- **Correct data flow** -- single store, no prop drilling, proper memoization
- **Offline-first** -- all computation is client-side, IndexedDB + service worker
- **Design system discipline** -- all styles in one file, density-based spacing, no inline styles
- **Good separation of concerns** -- components render, services compute, store orchestrates

The suggested improvements are refinements, not corrections. The DRY violations are the kind that naturally emerge during a parallel sprint where features are built independently -- they should be cleaned up but don't indicate an architectural problem.

Priority actions before deploying:
1. Delete the two dead component files
2. Update CLAUDE.md
3. Verify PWA icon assets exist
4. Run full test suite

Everything else can go into a follow-up cleanup PR.
