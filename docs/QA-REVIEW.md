# QA Review: Period Tracker Feature Batch

**Date:** 2026-02-16
**Reviewer:** QA Specialist (James Bach style - exploratory testing)
**Scope:** 8 new features + all modified files

---

## Critical (must fix before release)

### C1. `predictNextPeriod` calls `predictNextPeriod` recursively on every `buildCycleHistory` cycle — O(n^2) performance

**File:** `src/services/predictions.ts:162-163`

`buildCycleHistory` calls `predictNextPeriod(periods)` inside the loop at line 163, but only for the *last* cycle (`i === completed.length - 1`). However, `predictNextPeriod` re-sorts and re-computes the full cycle array each time. With 37 seed periods this is fine, but the real issue is that `buildCycleHistory` is called on every render of both `CycleHistory` and `CycleDynamicsChart` (via `useMemo` keyed on `periods`). This means the expensive `predictNextPeriod` runs redundantly inside `buildCycleHistory` when the store already has `prediction` available.

**Impact:** Wasted CPU on every tab switch. Mild now, worse with more data.
**Fix:** Pass the prediction from the store as a parameter to `buildCycleHistory` instead of recomputing it.

### C2. CalendarPicker `handleDayTap` compares dates without normalizing time — `isAfter(date, today)` may block today's date

**File:** `src/components/CalendarPicker.tsx:104-105`

```ts
const today = new Date(); // has hours, minutes, seconds
if (isAfter(date, today)) return;
```

`parseISO(dateStr)` returns midnight (00:00:00). `new Date()` returns the current time. If it is, say, 3 PM, then `isAfter('2026-02-16T00:00:00', '2026-02-16T15:00:00')` is false, so today is *not* blocked. However, this is fragile — the intent is to block future dates but the comparison depends on the current time of day. The same pattern appears at line 253 (`isFuture` check in `PickerMonth`), where a date rendered as "future" could flicker from disabled to enabled as the day progresses.

**Impact:** Not a current blocker, but the logic is brittle and could produce inconsistent behavior during the day.
**Fix:** Compare against `startOfDay(new Date())` or use `isAfter(date, endOfDay(new Date()))` consistently.

### C3. CalendarPicker `existingPeriodDates` treats ongoing periods as ending "today" — date set grows unboundedly for old ongoing periods

**File:** `src/components/CalendarPicker.tsx:56`

```ts
const end = p.endDate ? parseISO(p.endDate) : new Date();
```

If there is an ongoing period that started 2 years ago (forgotten/stale), `eachDayOfInterval` generates 730+ Date objects and marks all those days as "existing period" in the picker. Same pattern at `Calendar.tsx:30` and `YearView.tsx:30`.

**Impact:** Excessive memory allocation and confusing visual (entire calendar painted as "period").
**Fix:** Cap the end date for ongoing periods, e.g., `min(today, addDays(start, 14))` or similar heuristic.

### C4. `buildCycleHistory` last cycle uses predicted avgCycleLength as its *actual* cycleLength — misleading display

**File:** `src/services/predictions.ts:161-164`

For the last (most recent) cycle, the code sets `cycleLen = prediction?.avgCycleLength ?? 28`. This means the last cycle in `CycleHistory` displays "28 days" (or the average) even though that cycle hasn't ended yet. The dot-bar then renders 28 dots for an incomplete cycle.

**Impact:** User sees fabricated cycle length for their most recent cycle. Misleading.
**Fix:** Mark the last cycle distinctly (e.g., `cycleLength: -1` or add an `estimated: boolean` field), and display "Ongoing" or "~28 days (est.)" in the UI.

---

## Major (should fix)

### M1. No error feedback to user on CalendarPicker save failure

**File:** `src/components/CalendarPicker.tsx:146-148`

```ts
} catch {
  setSaving(false);
}
```

If `addPeriod` or `updatePeriod` throws, the user sees the "Save" button re-enable but has no idea what went wrong. No error message is shown.

**Fix:** Add an `error` state and display it in the picker UI, similar to how Settings shows `message`.

### M2. `CycleDynamicsChart` x-axis labels show month abbreviation only — ambiguous across year boundaries

**File:** `src/components/CycleDynamicsChart.tsx:33`

```ts
label: format(parseISO(c.startDate), 'MMM'),
```

If data spans Dec 2024 to Feb 2025, the chart shows "Dec, Jan, Feb" with no year indicator. The user cannot tell which year.

**Fix:** Show `'MMM yy'` format (e.g., "Dec 24") when data spans multiple years, or always show the year for January.

### M3. `YearView` `fertilityDates` depends on `prediction` but not `periodDates` — stale memo

**File:** `src/components/YearView.tsx:53-66`

The `useMemo` for `fertilityDates` has `[prediction]` in its deps array, but the computation inside calls `estimateFertilityWindow(prediction.predictedStart, prediction.avgCycleLength)` which only depends on prediction. This is actually correct for the *predicted* cycle. However, the year view only shows fertility for the *next predicted* cycle, not for historical cycles. This is inconsistent with `CycleHistory` which shows fertility for every cycle. Users may wonder why only one month shows green dots.

**Impact:** UX inconsistency. Not a bug, but confusing.
**Fix:** Either show fertility for all past cycles in the year view too, or add a note explaining the green dots are for the next predicted cycle only.

### M4. CalendarPicker allows overlapping periods — no validation against existing periods

**File:** `src/components/CalendarPicker.tsx:132-148`

The save handler does not check whether the selected date range overlaps with an existing period. The `existingPeriodDates` set is used only for *display* (coloring), not for validation. A user could log a period that overlaps another, creating corrupt data.

**Impact:** Data integrity issue. Overlapping periods break cycle length calculations.
**Fix:** Before saving, check if the selected range overlaps any existing period (excluding the one being edited). Show an error if it does.

### M5. `dayNumber` helper in CycleHistory uses `Math.round` instead of `Math.floor` — off-by-one risk

**File:** `src/components/CycleHistory.tsx:163-165`

```ts
return Math.round((date - start) / 86400000) + 1;
```

`86400000` is milliseconds in a day, but DST transitions can make a day 23 or 25 hours. `Math.round` mitigates this for most cases, but `differenceInDays` from date-fns is already imported and handles this correctly.

**Fix:** Replace with `differenceInDays(parseISO(dateStr), parseISO(cycleStart)) + 1`.

### M6. `DotBar` renders potentially hundreds of dots for long cycles — no cap or virtualization

**File:** `src/components/CycleHistory.tsx:132`

If `cycleLength` is 89 (just under the 90-day filter), the dot-bar renders 89 tiny 8px dots. On a narrow phone screen (375px), minus padding, that's ~345px of available width. At 8px + 2px gap = 10px per dot, that's only ~34 dots per row. 89 dots would wrap to nearly 3 rows of dots, which is likely not the intended design.

**Impact:** Broken layout for longer cycles.
**Fix:** Cap dots at a reasonable maximum (e.g., 45) and use a proportional representation, or collapse middle dots.

### M7. `HistoryView` does not pass `onSwitchToCalendar` behavior from year view — clicking a month in year view while already on the history tab works, but there is no visual feedback

**File:** `src/components/HistoryView.tsx:40`

When a user taps a mini-calendar in year view, the app switches to the Calendar tab and navigates to that month. However, there is no transition animation or visual feedback — the view just snaps. This could be disorienting.

**Impact:** Minor UX issue, but could confuse users.
**Fix:** Consider adding a brief transition or highlight effect on the target month.

### M8. `useEffect` in `App.tsx` has empty deps but uses `loadPeriods` — ESLint exhaustive-deps warning

**File:** `src/App.tsx:18-20`

```ts
useEffect(() => {
  initializeDatabase().then(() => loadPeriods());
}, []);
```

`loadPeriods` is a stable function from zustand, so this is functionally correct. However, ESLint's `react-hooks/exhaustive-deps` rule would flag this. It should either include `loadPeriods` in the dep array or use `usePeriodStore.getState().loadPeriods` to avoid the lint warning.

**Fix:** Either add `loadPeriods` to deps (safe since it is referentially stable) or call via `usePeriodStore.getState()`.

---

## Minor (nice to fix)

### m1. Hard-coded weekday labels assume Monday-start weeks globally

**Files:** `src/components/CalendarPicker.tsx:240`, `src/components/Calendar.tsx:90`

Both components hard-code `['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']` and use `weekStartsOn: 1`. This is fine for most of the world but not for US/Canada/Japan users who expect Sunday-first weeks.

**Fix:** Make `weekStartsOn` configurable via settings (low priority).

### m2. `CycleDynamicsChart` uses hard-coded SVG dimensions — may look odd on very wide screens

**File:** `src/components/CycleDynamicsChart.tsx:6-7`

```ts
const CHART_W = 350;
const CHART_H = 180;
```

The SVG uses `viewBox` so it scales, but the aspect ratio is fixed at ~1.94:1. On a wide tablet in landscape, the chart may appear disproportionately tall.

**Fix:** Consider a more responsive aspect ratio or use a container query.

### m3. Duplicate month label ("MMM") across adjacent years in chart x-axis

**File:** `src/components/CycleDynamicsChart.tsx:33`

If two cycles start in January of different years, the x-axis shows two "Jan" labels side by side with no way to distinguish them.

**Fix:** Append year suffix when labels repeat: "Jan 24", "Jan 25".

### m4. `MiniCalendar` in `YearView` renders as a `<button>` — entire calendar grid is one click target

**File:** `src/components/YearView.tsx:134`

The entire mini-calendar is a single `<button>`, which is correct for click handling, but screen readers will announce it as just "button" with no accessible name. Add `aria-label={format(month, 'MMMM yyyy')}`.

**Fix:** Add `aria-label` to the `<button>`.

### m5. CSS uses `rgba(var(--text-rgb), 0.1)` — this is invalid CSS

**File:** `src/styles/index.css:38`

```css
--color-border: rgba(var(--text-rgb), 0.1);
```

`rgba()` with CSS custom properties containing comma-separated values is a common pattern in some preprocessors, but in standard CSS this is technically valid because `var()` performs textual substitution, resulting in `rgba(34, 34, 34, 0.1)`. This works in all modern browsers. However, the newer `color()` or `rgb()` with `/` separator syntax would be more future-proof.

**Impact:** None currently. Just a maintenance note.

### m6. `CycleHistory` empty state says "Log at least 2 periods" but actually 1 completed period shows a cycle

**File:** `src/components/CycleHistory.tsx:42`

The empty message says "Log at least 2 periods to see cycle history" but `buildCycleHistory` returns data even with a single completed period. The empty state only shows when `allCycles.length === 0`, which happens when there are no completed periods at all (only ongoing).

**Fix:** Change text to "Log at least one completed period to see cycle history."

### m7. `CalendarPicker` body scroll lock may conflict with other overlays

**File:** `src/components/CalendarPicker.tsx:94-99`

Setting `document.body.style.overflow = 'hidden'` directly is a simple approach, but if another modal or overlay is also managing body scroll, the cleanup could restore scrolling prematurely.

**Fix:** Use a counter-based scroll lock or a library like `body-scroll-lock` (low priority for a simple app).

### m8. No keyboard accessibility for CalendarPicker date navigation

**File:** `src/components/CalendarPicker.tsx:270-279`

Each day is a `<button>`, which is good for basic accessibility. However, there is no arrow key navigation between days, which is expected for calendar widgets per ARIA authoring practices (grid pattern).

**Impact:** Power users and screen reader users cannot efficiently navigate.
**Fix:** Low priority for an iOS PWA, but would be needed for broader accessibility compliance.

### m9. Settings uses `confirm()` for destructive action — blocks UI thread

**File:** `src/components/Settings.tsx:44`

```ts
if (!confirm('Delete ALL data? This cannot be undone.')) return;
```

`window.confirm()` is a blocking synchronous dialog. On iOS Safari in PWA mode, it works but looks out of place. A custom confirmation sheet would be more consistent with the app's design language.

**Fix:** Replace with a custom confirmation dialog (similar to the "End period?" sheet in LogPeriodButton).

### m10. `picker-overlay` max-width constraint but no centering on wider-than-430px screens

**File:** `src/styles/index.css:744-753`

```css
.picker-overlay {
  max-width: var(--content-max);
  margin: 0 auto;
}
```

On desktop browsers wider than 430px, the picker overlay covers the full viewport height but only 430px wide, centered. However, the semi-transparent background only covers the 430px column, not the full screen. This means the background behind the picker (outside 430px) appears unmasked.

**Fix:** Remove `max-width` from the overlay (keep it on `.picker` child), or set `.picker-overlay` to full width with a separate backdrop.

---

## Test Gaps

### T1. No tests for CalendarPicker component

**Missing:** `src/test/components.test.tsx` has no tests for `CalendarPicker`. This is a complex interactive component with date selection, range building, save logic, and editing mode.

**Should test:**
- Rendering months (12 back + current + 3 forward)
- Tapping a day sets start date
- Tapping a second day sets end date
- Tapping before start date swaps start/end
- Save calls `addPeriod` with correct dates
- Edit mode pre-fills dates and calls `updatePeriod`
- Future dates are disabled
- Saving state disables button

### T2. No tests for CycleDynamicsChart

**Missing:** No tests for the SVG chart component.

**Should test:**
- Returns null with fewer than 2 data points
- Renders SVG with correct number of data points
- Normal range band is present
- Filters out cycles >= 90 days
- Handles exactly 2 cycles (minimum for chart)

### T3. No tests for YearView

**Missing:** No tests for the year navigation or mini-calendars.

**Should test:**
- Renders 12 mini-calendars
- Year navigation buttons change displayed year
- Period dates are highlighted
- Month click calls `onMonthSelect`

### T4. No tests for HistoryView

**Missing:** No tests for the Cycles/Year toggle.

**Should test:**
- Default tab is "Cycles"
- Toggling to "Year" renders YearView
- `onSwitchToCalendar` prop is forwarded to YearView

### T5. No edge case tests for CycleHistory with single period

**Missing:** `components.test.tsx:95-103` tests single period rendering but doesn't verify the dot-bar output or cycle length display.

**Should test:**
- Single period shows period dots but no fertile/ovulation markers
- Cycle length shows as the estimated value with visual distinction

### T6. No tests for `estimateFertilityWindow` edge case: cycle length exactly 18

**Missing:** Tests cover `< 18` (returns null) and normal values, but not the boundary value 18 itself.

**Should test:**
- `estimateFertilityWindow('2023-01-01', 18)` returns a valid result (ovulation day 4, which passes the `>= 5` check... actually this would return null because `18 - 14 = 4 < 5`). This reveals an off-by-one in the boundary: cycles of length 18 return null even though 18 is accepted by the `cycleLength >= 18` check.

### T7. No tests for LogPeriodButton "End Period" flow

**Missing:** No tests verify the ongoing period detection, day count display, or end period confirmation flow.

**Should test:**
- Shows "End Period: Day N" when ongoing period exists
- Confirmation sheet appears on button click
- Confirming calls `updatePeriod` with today's date
- Cancel dismisses sheet

### T8. No integration test for the full App data flow

**Missing:** No test verifies that `App` initializes the database, loads periods, and renders the correct tab content.

**Should test:**
- App shows loading state initially
- After load, shows calendar tab by default
- Switching tabs works
- Settings screen opens and closes

### T9. `buildCycleHistory` not tested with unsorted input

**Missing:** `predictions.test.ts` always passes sorted periods. The function sorts internally, but this isn't verified.

**Should test:**
- Pass periods in reverse order and verify output is still correct.

### T10. No test for stale CycleStatus with prediction stats

**Missing:** `components.test.tsx:41-48` tests stale state but doesn't set `prediction`, so the avg stats line is not rendered/tested.

**Should test:**
- Stale state with prediction shows "Avg cycle: Xd" stats.
