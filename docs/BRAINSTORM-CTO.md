# Architecture Brainstorm — CTO

> "Everything fails, all the time." Ship fast, plan for failure, keep it simple.

This document covers architecture decisions, implementation order, risks, and type changes for the planned Lua features. Reference: Flo screenshots IMG_8321 (calendar date picker), IMG_8324 (dot-bar + cycle dynamics chart), IMG_8326 (cycle history with filters).

---

## 1. Implementation Order

Dependency graph drives the order. Ship value early, unblock complex features later.

### Phase 0 — Quick Fixes (independent, 0.5 day)

| Task | Why First | Blocked By |
|------|-----------|------------|
| **Fix stale cycle status** | "Day 800 of ~29" is embarrassing. Simple guard in `getDayOfCycle`. | Nothing |
| **Extract seed data to JSON** | Move 37 hardcoded periods to `data/seed.json`, import via Settings. Reduces bundle, enables user data portability. | Nothing |

These two are independent of each other and of everything else. Ship them as a standalone patch.

### Phase 1 — Fertility Calculation (0.5 day)

| Task | Why Now | Blocked By |
|------|---------|------------|
| **Fertility window + ovulation markers** | Required data for dot-bar colors. Must exist in the prediction pipeline before any visualization consumes it. | Phase 0 (clean predictions needed) |

The dot-bar visualization (Phase 3) needs fertility/ovulation data per cycle. Calendar also needs it (fertility markers on dates). This is pure logic — no UI, easy to test, low risk.

### Phase 2 — Calendar Date Picker (1-1.5 days)

| Task | Why Now | Blocked By |
|------|---------|------------|
| **Calendar date picker for period logging** | Replaces native `<input type="date">` with a Flo-style scrolling calendar. Independent of history features. High-impact UX improvement. | Nothing (but benefits from Phase 1 for fertility markers) |

This is the single highest-impact UX change. The current `<input type="date">` is ugly and non-discoverable. The Flo calendar (IMG_8321) is the reference: full-screen scrolling months, tappable circle per day, selected days turn pink with checkmarks, predicted days shown as dashed circles.

### Phase 3 — Cycle History: Dot-Bar + Filters (1-1.5 days)

| Task | Why Now | Blocked By |
|------|---------|------------|
| **Dot-bar visualization** | Replaces text-only history. Each cycle rendered as a row of colored dots. | Phase 1 (fertility data) |
| **Filter pills (All / Last 3 / Last 6)** | Simple state filter on the same component. | Dot-bar |

The dot-bar (IMG_8324, IMG_8326) is the visual centerpiece of cycle history. Each cycle is one row of N dots (N = cycle length), where colors indicate: period days (red), fertility window (teal), ovulation day (dark teal), and luteal phase (gray). Year grouping stays, filters added above.

### Phase 4 — Cycle Dynamics Chart (1-1.5 days)

| Task | Why Now | Blocked By |
|------|---------|------------|
| **Line chart of cycle lengths over time** | Complex but self-contained. Reads the same cycle length data already computed. | Phase 1 (for normal range band) |

The chart (IMG_8324) shows cycle lengths over time with a "normal range" band (21-35 days). Each dot is one cycle. Line connects them. Gray band behind shows the healthy range. This is the most technically complex feature (SVG rendering, axis layout, responsive sizing).

### Phase 5 — Month/Year View Toggle (1 day)

| Task | Why Now | Blocked By |
|------|---------|------------|
| **Month view** (current, already exists) | No work needed | — |
| **Year view** (12 mini-calendars) | Nice-to-have, lower priority than chart/dot-bar. | Nothing technically, but queue after Phase 4 |

Year view is lower priority than the data visualization features. It's useful but not as impactful as dot-bar or chart. Can be deferred if schedule is tight.

### Phase 6 — Navigation Restructure (0.5 day)

| Task | Why Now | Blocked By |
|------|---------|------------|
| **Wire everything together** | Tab bar changes, routing, new views into App.tsx | Phases 2-5 |

Final integration pass. May happen incrementally as features land.

**Total estimated effort: ~5-6 days of focused agent work.**

---

## 2. Architecture Decisions

### 2a. Calendar Date Picker

**Decision: Full-screen modal (not bottom sheet).**

Rationale:
- The Flo reference (IMG_8321) is a full-screen view with months scrolling vertically
- A bottom sheet would be too cramped for multi-month scrolling — you need the full viewport
- Cancel/Save buttons pinned at the bottom (like Flo's "Отмена" / "Сохранить")

**Scrolling approach: CSS `overflow-y: auto` with pre-rendered months, NOT virtual scrolling.**

Rationale:
- We only need ~24 months of scrollable history (2 years back + a few forward for predictions). That's ~24 month grids of 42 cells each = ~1,008 DOM nodes. Trivial for any modern browser.
- Virtual scrolling (react-window, etc.) adds a new dependency and complexity for scroll position restoration, initial scroll-to-today, and iOS momentum scrolling bugs.
- Flo only shows a limited range too. No infinite scroll needed.
- If performance becomes an issue on very old devices, we can add `content-visibility: auto` on off-screen months as a CSS-only optimization (no JS needed).

**Month range:**
- Past: 12 months back from today (or first period date, whichever is earlier)
- Future: 3 months ahead (for showing predictions)
- Auto-scroll to current month on open

**Selection model: Tap individual days, NOT drag.**

Rationale:
- Flo uses individual taps (each day is a tappable circle with checkmark toggle)
- Drag-to-select is complex (touch events, scroll vs drag disambiguation, cross-week selection) and error-prone on mobile
- Users tap start day, then tap end day. Or tap multiple individual days.
- For period logging: user taps first day of period, then last day. We infer the range between them as the period. Show selected range as filled circles.

**Selection UX flow:**
1. User taps "Log Period" (or a day on the main calendar)
2. Full-screen calendar opens, scrolled to current month
3. User taps period start day (fills with pink + checkmark)
4. User taps period end day (range fills between start and end)
5. User can tap individual days to toggle them (for irregular tracking)
6. "Save" button at bottom, "Cancel" at top-left or bottom

**Component structure:**
```
CalendarPicker.tsx (full-screen modal)
├── CalendarPickerMonth.tsx (single month grid, memoized)
└── Uses existing calendar-day styling + new selected/tappable states
```

**State:** Local to CalendarPicker. On save, calls `addPeriod()` from the store.

**Key CSS additions:** `.calendar-picker-overlay`, `.calendar-day.selected`, `.calendar-day.tappable` (gray circle outline like Flo), `.calendar-day.predicted-dashed` (dashed circle for predicted period days).

### 2b. Cycle History Dot-Bar

**Decision: Flat component, CSS flexbox, no canvas.**

**How the dot-bar works (from Flo IMG_8324, IMG_8326):**

Each cycle is rendered as a single horizontal row of dots. One dot per day of the cycle. Colors:
- **Red dots** (first ~5): period days (filled red circles)
- **Light teal dots** (~day 8-13): fertility window
- **Dark teal dot** (1 dot, ~day 14): ovulation day
- **Gray dots** (remaining): luteal phase / non-fertile days

The dot count equals the cycle length (e.g., 27 dots for a 27-day cycle).

**Component structure:**
```
CycleHistoryList.tsx
├── FilterPills.tsx (All / Last 3 / Last 6)
├── DotBarLegend.tsx (color legend: Period / Fertile / Ovulation)
└── CycleHistoryItem.tsx (one cycle: title + date range + dot-bar)
    └── DotBar.tsx (the row of colored dots)
```

**Dot color calculation (in a pure function, NOT in the component):**

```ts
// services/cycleAnalysis.ts
interface CycleDayInfo {
  day: number;       // 1-based day within cycle
  phase: 'period' | 'fertile' | 'ovulation' | 'luteal' | 'other';
}

function analyzeCycle(
  periodDuration: number,
  cycleLength: number,
  ovulationDay: number  // from fertility calculation
): CycleDayInfo[]
```

Each dot gets its color from the phase. The function is pure, testable, and reusable.

**Performance with 37+ cycles:**

37 cycles x ~28 dots = ~1,036 dot elements. Each dot is a small `<span>` with a background color. This is well within DOM performance limits. No virtualization needed.

If we ever need optimization: `React.memo` on `CycleHistoryItem` (keyed by cycle start date) prevents re-render when filters change other items.

**Dot sizing:** Each dot is 8-10px diameter, 2px gap. For a 28-day cycle that's ~336px wide — fits comfortably in the 430px max-width container. For longer cycles (35+ days), dots might need to be slightly smaller (6px) or wrap. Decision: **clamp dot size to fit within container, minimum 6px.** Flo appears to use fixed-size dots that always fit in one row.

### 2c. Cycle Dynamics Chart

**Decision: SVG (not Canvas).**

Rationale:
- SVG is declarative, works natively in React, is accessible (add `<title>` and `aria-label`), and supports CSS transitions
- Canvas is imperative, harder to maintain, no built-in accessibility, requires manual hit testing
- The chart is simple: 6-12 data points, one line, one band, axis labels. SVG handles this trivially.
- No need for a charting library (Recharts, Victory, etc.). Hand-rolled SVG keeps the bundle at zero new dependencies.

**Chart anatomy (from IMG_8324):**

```
┌─────────────────────────────────────┐
│  "Cycle Dynamics"          (i) icon │
│  "Last 6 cycles were in the normal  │
│   range."                           │
│                                     │
│  40 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  35 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  ← normal range band (21-35)
│  30 ─ 27 ─ 28 ─ 27 ─ 28 ─ 27 ─ 27 │  ← data line with dots
│  25 ████████████████████████████████ │  ← band shading
│  20 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  15 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│     Aug  Sep  Oct  Nov  Dec  Jan    │  ← x-axis: cycle start dates
│                                     │
│  █ Normal range (21-35 days)        │  ← legend
└─────────────────────────────────────┘
```

**Data structure:**

```ts
interface ChartDataPoint {
  cycleStart: string;    // ISO date (x-axis label)
  cycleLength: number;   // y-axis value
}
```

Already computable from existing `cycleLengths` calculation in predictions.ts. No new data needed.

**SVG component structure:**
```
CycleDynamicsChart.tsx
├── Renders <svg> with viewBox for responsive scaling
├── <rect> for normal range band (y: 21-35, gray fill)
├── <polyline> for the data line (connects dots)
├── <circle> for each data point (with value label above)
├── <text> for axis labels
└── Pure data transformation in a useMemo
```

**Responsive:** Use `viewBox="0 0 350 200"` with `width="100%"` and `preserveAspectRatio="xMidYMid meet"`. SVG scales perfectly to any container width. No resize observers needed.

**Normal range band:** `<rect>` from y=21 to y=35 in data coordinates, mapped to SVG coordinates. Fill: `rgba(var(--surface-rgb), 0.6)`.

**Number of cycles shown:** Default to last 6 (matching Flo). If filter pills are "All", show all. If more than ~12 data points, the chart gets crowded — consider horizontal scrolling or just clamping to last 12.

### 2d. Month/Year View

**Decision: Reuse existing Calendar component for months. New YearView component for the 12-mini-calendar grid.**

**Month view:** Already exists. No changes needed except adding fertility markers (teal dots on fertile days, if Phase 1 is done).

**Year view architecture:**

```
YearView.tsx
├── Renders 12 MiniCalendar instances (one per month of the selected year)
├── Year navigation: < 2025 > arrows
└── MiniCalendar.tsx (compact month grid, ~150px wide)
    ├── Month name header
    ├── 7-column grid of tiny day cells (no interactivity, display only)
    └── Period/predicted/fertility coloring (smaller dots, no text)
```

**Key constraint:** MiniCalendar must be display-only (no tap targets, no navigation). It's a visual summary. Tapping a mini-calendar could zoom into that month (switching to month view), but that's a nice-to-have.

**Performance:** 12 months x 42 cells = 504 cells. Trivial. No virtualization needed.

**How to integrate with existing Calendar:**

Do NOT put year view inside the Calendar component. Keep Calendar as the month-view component. Add a toggle button (month/year) somewhere in the calendar nav or tab bar area. App.tsx manages which view is shown.

### 2e. Fertility Window Calculation

**Decision: Add to `services/predictions.ts` as a new exported function. Do NOT create a new service file.**

Rationale:
- Fertility calculation is a direct extension of the prediction pipeline (it needs cycle length and period duration, which `predictNextPeriod` already computes)
- Keeping it in the same file avoids import sprawl and keeps related logic together
- It's a pure function, easily testable

**Algorithm (standard calendar method):**

```
ovulationDay = cycleLength - 14
fertileWindowStart = ovulationDay - 5
fertileWindowEnd = ovulationDay + 1  (day after ovulation)
```

This is the simplest medically-accepted estimate. It assumes a 14-day luteal phase (which is remarkably consistent across women, even when cycle lengths vary).

**Interface:**

```ts
export interface FertilityWindow {
  ovulationDay: number;       // day of cycle (1-based)
  fertileStart: number;       // day of cycle
  fertileEnd: number;         // day of cycle
}

export function estimateFertilityWindow(
  avgCycleLength: number
): FertilityWindow
```

**Where it gets consumed:**
1. **CyclePrediction** type gains optional `fertility: FertilityWindow` field
2. **Calendar** uses it to mark fertile days on the month grid
3. **DotBar** uses it to color dots (period, fertile, ovulation, luteal)
4. **CycleStatus** could show "Fertile window in X days" (optional, lower priority)

**Important:** The fertility estimate is based on the *average* cycle length, not the actual cycle being displayed. For historical cycles, we'd compute it per-cycle using that cycle's actual length. For future predictions, use the predicted cycle length.

---

## 3. Risks and Mitigations

### 3.1 Performance on Older iPhones (Safari PWA)

**Risk:** Safari on iPhone SE (2016), iPhone 7, iPhone 8 — lower memory, slower JS, WebKit rendering quirks.

**Mitigations:**
- **No new dependencies.** Every feature is hand-rolled with existing React + date-fns. Bundle stays small.
- **CSS `content-visibility: auto`** on off-screen calendar months in the picker. This tells the browser to skip layout/paint for non-visible months. Safari 17+ supports it.
- **`React.memo`** on month grids, dot-bar items, and chart. Prevent re-renders when parent state changes.
- **No `will-change` abuse.** Only use it on actively animating elements (sheet overlay), remove after animation completes.
- **Test on real device.** Safari DevTools in Simulator is not representative. Use Xcode Instruments or real iPhone for scrolling framerate testing.

**Worst case:** If calendar picker scrolling is janky with 24+ months rendered, add `IntersectionObserver` to lazy-render month grids (render placeholder divs first, swap in real content when intersecting). This is simpler than full virtual scrolling.

### 3.2 Scrolling Calendar Performance

**Risk:** Rendering 24 months of calendar grids simultaneously could cause initial layout jank.

**Mitigations:**
- Start with CSS-only: `content-visibility: auto` + `contain-intrinsic-size: 0 300px` on each month block. Browser handles the rest.
- Each month is ~42 `<div>` elements. 24 months = ~1,008 divs. This is well under the ~10,000 DOM node threshold where browsers start struggling.
- If needed: render only +-3 months from scroll position, with placeholder `<div>`s maintaining scroll height for others. But this is almost certainly premature optimization.

**Concrete measurement plan:** After implementing Phase 2, test on an iPhone SE (2020) in Safari. If first contentful paint > 300ms or scroll framerate < 50fps, apply IntersectionObserver lazy rendering. Otherwise, ship as-is.

### 3.3 Chart Rendering in PWA

**Risk:** SVG charts can be slow with many elements or complex paths.

**Mitigations:**
- Our chart has at most 12 data points, 1 polyline, 1 rect, ~12 circles, ~20 text labels. This is trivially fast in SVG.
- SVG is rendered by the browser's native engine, not JavaScript. No performance concern.
- `viewBox` scaling means zero JavaScript resize handling.

**Non-risk:** Unlike a stock chart with 1,000+ data points and real-time updates, our chart is static data rendered once. SVG is the obviously correct choice here. Canvas would be over-engineering.

### 3.4 Touch Event Conflicts

**Risk:** Calendar picker scrolling could conflict with day-tap detection on mobile (especially swipe-to-navigate-back gesture on iOS).

**Mitigations:**
- Use `onClick` on day elements (not `onTouchStart/End`). The browser handles tap vs scroll disambiguation correctly with `onClick`.
- Set `touch-action: pan-y` on the scroll container to allow vertical scrolling but prevent horizontal gesture conflicts.
- The full-screen modal prevents the iOS back-swipe gesture conflict entirely.

### 3.5 Data Integrity During Feature Rollout

**Risk:** New fertility fields or type changes could break existing stored data.

**Mitigations:**
- **Fertility data is computed, not stored.** It's derived from cycle length at render time. No DB schema change needed.
- **No Dexie version bump needed** for Phases 0-5. The `Period` type stays unchanged. All new data (fertility, dot colors, chart points) is computed from existing period records.
- If we later add stored fertility tracking (user-confirmed ovulation dates), that would require a Dexie version 2 migration. But that's not in scope.

---

## 4. Type Changes Needed

### New types (add to `types.ts`)

```ts
// Fertility window estimation
export interface FertilityWindow {
  ovulationDay: number;       // 1-based day of cycle
  fertileStart: number;       // 1-based day of cycle
  fertileEnd: number;         // 1-based day of cycle
}

// Cycle phase for dot-bar coloring
export type CyclePhase = 'period' | 'fertile' | 'ovulation' | 'luteal';

// Single dot in the dot-bar
export interface CycleDotInfo {
  day: number;                // 1-based
  phase: CyclePhase;
}

// Analyzed cycle for history display
export interface AnalyzedCycle {
  startDate: string;
  endDate: string;            // end of cycle (= next period start - 1 day)
  cycleLength: number;
  periodDuration: number;
  dots: CycleDotInfo[];
  fertility: FertilityWindow;
}

// Chart data point
export interface CycleChartPoint {
  cycleStart: string;         // ISO date
  cycleLength: number;
}

// Filter options for cycle history
export type CycleFilter = 'all' | 'last3' | 'last6';

// Calendar picker selection
export interface DateSelection {
  start: string | null;       // ISO date
  end: string | null;         // ISO date
}
```

### Modified types

```ts
// Extend CyclePrediction
export interface CyclePrediction {
  // ... existing fields ...
  fertility: FertilityWindow | null;  // NEW: add fertility estimate
}

// Extend Tab type (if adding more tabs, or switch to string union)
export type Tab = 'calendar' | 'history' | 'insights';
// OR keep 2 tabs and put chart + dot-bar on the history view
```

### Types that stay unchanged

- `Period` — no changes. All new data is derived, not stored.
- `StepEntry` — not in scope.
- `AppMeta` — no changes.

---

## 5. Tab / Navigation Changes

### Current: 2 tabs (Calendar | History)

### Recommendation: Keep 2 tabs, restructure History content.

**Why NOT 3 tabs:**
- Flo has 4 tabs (Today, Tips, Messages, Partner) but their navigation model is very different — they have a much richer feature set. Adding a 3rd tab for "Insights" with only a chart in it feels empty.
- The dot-bar and chart are both "history/analysis" content. They belong together.

**Proposed History tab structure:**

```
History tab
├── Summary stats (existing: avg cycle, avg period, total logged)
├── Filter pills: [All] [Last 3] [Last 6]
├── Cycle Dynamics Chart (collapsible? always visible?)
│   └── Line chart of cycle lengths with normal range band
├── Cycle History List (with dot-bars)
│   ├── 2026
│   │   └── Current cycle: 29 days (started Jan 19) ●●●○○○○○...
│   ├── 2025
│   │   └── 27 days (Dec 23 - Jan 18) ●●●●●○○●●●●●●●○○○○...
│   │   └── 27 days (Nov 26 - Dec 22) ●●●●●○○●●●●●●●○○○○...
│   └── ... (grouped by year)
│
│
```

**Key questions:**

1. **Should the chart be above or below the list?**
   - Above (like Flo IMG_8324). The chart is a summary view; the list is detail. Summary first, details below. This matches the existing pattern where summary stats are already at the top.

2. **Should the chart be collapsible?**
   - No. It's small (~200px tall) and always relevant. Collapsing adds interaction complexity for no gain. If the user wants to focus on the list, they scroll past it.

3. **Should filters affect both chart and list?**
   - Yes. "Last 6" shows last 6 cycles in both the chart and the dot-bar list. "All" shows everything. Simple, consistent.

### Calendar tab: No structural changes

The calendar tab stays as-is: CycleStatus + Calendar + LogPeriodButton. The calendar date picker is launched from LogPeriodButton (or by tapping a day on the calendar) and opens as a full-screen modal overlay — it doesn't change the tab structure.

**One possible addition:** Tapping a day on the main Calendar could show a small popover or bottom sheet with that day's details (period day, fertility status, etc.). But this is a nice-to-have for later.

### Year view: Toggle within Calendar tab

Add a small "Month | Year" toggle in the calendar navigation bar (next to the month/year title). This switches between the existing month grid and the new YearView. It's a view toggle, not a new tab.

```
Calendar tab (Month mode)          Calendar tab (Year mode)
┌─────────────────────────┐        ┌─────────────────────────┐
│ Day 14 of ~28           │        │ Day 14 of ~28           │
│ Next period in ~14 days │        │ Next period in ~14 days │
├─────────────────────────┤        ├─────────────────────────┤
│ < February 2026 >       │        │ <    2026    > [Month]  │
│ Mo Tu We Th Fr Sa Su    │        │ ┌─────┐ ┌─────┐ ┌─────┐│
│  ...calendar grid...    │        │ │ Jan │ │ Feb │ │ Mar ││
│                         │        │ │ ... │ │ ... │ │ ... ││
│ [+ Log Period]          │        │ ├─────┤ ├─────┤ ├─────┤│
└─────────────────────────┘        │ │ Apr │ │ May │ │ Jun ││
                                   │ │ ... │ │ ... │ │ ... ││
                                   │ ... 12 mini calendars  │
                                   └─────────────────────────┘
```

---

## Summary of Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Calendar picker | Full-screen modal | Need full viewport for multi-month scroll |
| Scroll strategy | Native scroll, 24 months | ~1K DOM nodes, trivially fast |
| Virtual scrolling | No | Premature optimization, adds dependency |
| Day selection | Tap individual days | Drag is too complex on mobile |
| Chart rendering | Hand-rolled SVG | Simple data, zero dependencies, accessible |
| Charting library | None | 6-12 data points doesn't justify a library |
| Dot-bar rendering | CSS flexbox + spans | ~1K dots total, trivially fast |
| Fertility calc | In predictions.ts | Extends existing pipeline, no new service |
| DB schema | No changes | All new data is derived at render time |
| Tab structure | Keep 2 tabs | Chart + dot-bar both live in History |
| Year view | Toggle in Calendar nav | Not a separate tab |
| New dependencies | Zero | Everything hand-rolled |

---

*Next step: Pass this to the tech-spec and ui-spec writers for detailed specifications of each phase, then to the frontend developer for implementation.*
