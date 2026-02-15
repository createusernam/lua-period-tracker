# Product Brainstorm: Lua Period Tracker

**Author:** Product Manager (Marty Cagan mode)
**Date:** 2026-02-16
**Status:** Research / Pre-spec

---

## 1. Feature Prioritization (Value x Feasibility)

Ranked by impact on the user's daily experience multiplied by build confidence.

| Rank | Feature | Value | Feasibility | Score | Rationale |
|------|---------|-------|-------------|-------|-----------|
| **1** | Fix stale cycle status | 10 | 10 | **100** | App is broken without this. "Day 365 of 36" destroys trust. 30-minute fix in `getDayOfCycle()` — the `stale` flag already exists but the UI ignores it. |
| **2** | Extract seed data to importable JSON | 8 | 10 | **80** | Prerequisite for real usage. Hardcoded 2020-2023 seed data means every new user sees someone else's history. Must ship before any other feature makes sense. |
| **3** | Make period logging more convenient | 9 | 7 | **63** | The #1 daily action is logging. Current flow: tap button -> bottom sheet -> native date picker -> save. 4 steps. Flo does it in 2 taps on the calendar. This is the difference between "I use it daily" and "I forget to log." |
| **4** | Cycle history with dot-bar + filters | 8 | 7 | **56** | The signature Flo visualization the user explicitly wants replicated. Each cycle as a row of colored dots (coral = period, teal = fertile, dark teal = ovulation, gray = other days). Filter pills (All / Last 3 / Last 6) control scope. High information density in small space. |
| **5** | Fertility window calculation | 7 | 8 | **56** | Enables the teal/dark-teal dots in the dot-bar and calendar markers. Pure math — estimated ovulation at cycleLength - 14 days, fertile window = ovulation +/- 5 days. No external data needed. Required by features #4 and #6. |
| **6** | Calendar date picker (Flo-style) | 7 | 5 | **35** | Scrolling calendar with tappable circles for period date selection (IMG_8321). Beautiful UX but highest technical risk — smooth infinite scroll in Safari PWA, touch handling, performance with years of data. Depends on #3 (logging convenience) for full value. |
| **7** | Month/Year history view | 6 | 6 | **36** | Toggle between scrolling month view (IMG_8323) and compact year grid (IMG_8322). Nice for reviewing patterns at a glance. Medium complexity — year view needs compact 3-column grid with color-coded dates. |
| **8** | Cycle dynamics chart | 5 | 4 | **20** | Line chart showing cycle length variation over time (IMG_8324). Looks polished in Flo but lowest feasibility — needs canvas/SVG rendering, responsive sizing, axis labels, shaded "normal range" band. Highest technical risk for a PWA with no charting library. |

### Priority Tiers

**Tier 1 — Fix what's broken (do first, no spec needed):**
1. Fix stale cycle status
2. Extract seed data to importable JSON

**Tier 2 — Core value (spec, then build):**
3. Make period logging more convenient
4. Fertility window calculation
5. Cycle history with dot-bar + filters

**Tier 3 — Polish (build after Tier 2 ships):**
6. Calendar date picker
7. Month/Year history view
8. Cycle dynamics chart

---

## 2. User Journey Analysis

### Journey A: First Launch (No Data)

**Current state (broken):** App loads seed data of someone else's 37 periods from 2020-2023. User sees "Day 780 of ~28." Confusing and wrong.

**After all features:**
1. App opens with empty state: "Welcome to Lua" + illustration
2. Two clear paths: "Import from Flo" (JSON) or "Log your first period"
3. If import: user picks a JSON file exported from Flo -> data loads -> calendar populates -> cycle status shows current day
4. If manual: tap "+ Log Period" -> calendar date picker appears -> tap period days -> save -> one cycle logged, predictions say "Log one more period for predictions"
5. Home screen shows: cycle status, next period estimate (after 2+ periods), dot-bar snippet of recent cycles

**Key UX decision:** No onboarding wizard. The app should be self-evident. Two buttons, two paths.

### Journey B: Import 4 Years of Flo History

1. User exports data from Flo (Flo provides JSON/CSV export in Settings > My Data)
2. In Lua: Settings > Import > pick file
3. Validation: dates parsed, duplicates detected, out-of-range dates flagged
4. Progress: "Imported 37 periods (2020-2023)" confirmation
5. App immediately calculates predictions, fertility windows, dot-bars for all historical cycles
6. Calendar shows all historical period days in coral
7. Cycle history shows 37 cycles with dot-bar visualization
8. Cycle dynamics chart renders 36 data points (cycle lengths over 4 years)

**Key UX decision:** Import should be a one-shot action that "just works." No field mapping, no format selection. Auto-detect Flo JSON format and Lua JSON format.

### Journey C: Daily Check-in (95% of Usage)

This is the journey that matters most. The user opens the app once a day (or doesn't, and that's fine too).

**After all features:**
1. Open app (< 1 second load from home screen icon)
2. See immediately: "Day 14 of ~27" + "Next period in ~13 days" + current phase indicator
3. If on period: coral glow on today's date in calendar, "End Period: Day 3" button visible
4. If fertile window: teal highlight on today in calendar, subtle fertility indicator
5. Below status: dot-bar snippet showing last 2-3 cycles for context
6. Scroll down or tap History tab: full cycle history with dot-bars
7. Close app. Total time: 5-10 seconds.

**Key UX decision:** The home screen must answer all three questions without any taps:
- "What day of my cycle am I on?"
- "When is my next period?"
- "Am I in my fertile window?"

### Journey D: Log a New Period

**Current state:** Tap "Log Period" -> bottom sheet -> type/pick start date in native date picker -> toggle ongoing checkbox -> save. Clunky — native date pickers are slow and don't show cycle context.

**After all features (two paths):**

**Quick path (recommended, 2 taps):**
1. Period starts -> user opens app
2. Tap "Log Period" -> calendar date picker opens, scrolled to today
3. Today is pre-selected (most common: period started today). Tap "Save."
4. Done. Period is ongoing. When it ends, tap "End Period" on home screen.

**Backdate path (if user forgot to log):**
1. Tap "Log Period" -> calendar opens
2. Scroll back to the actual start date -> tap the day
3. Optionally tap end date if period already ended
4. Tap "Save"

**Key UX decision:** Default to "period started today" — optimize for the 80% case. Backdating should be possible but not the primary path.

### Journey E: Review Cycle Patterns Over Time

1. Tap History tab
2. See cycle history: each cycle as a dot-bar row, grouped by year, newest first
3. Filter pills at top: All (default) / Last 3 / Last 6
4. Each row shows: cycle length in days, date range, dot-bar (coral=period, teal=fertile, dark-teal=ovulation, gray=other)
5. Scroll down to see 4 years of history
6. Below cycle list: Cycle Dynamics section — line chart of cycle lengths over time
7. Shaded band shows "normal range" (21-35 days)
8. User can see if cycles are regular, trending longer/shorter, or have outliers
9. Optional: tap "Month" or "Year" toggle to switch to calendar-based history view
10. Year view: 12 mini-calendars with period days highlighted in coral, fertile in teal

**Key UX decision:** Dot-bar is the primary history visualization. It's more information-dense than a calendar. Calendar views (Month/Year) are secondary — accessible from a toggle but not the default.

### Journey F: Check Fertility Window

1. Open app -> home screen already shows if user is in fertile window
2. Calendar view: fertile days marked with teal dots, ovulation day with dark teal
3. Cycle status includes phase: "Follicular phase" / "Fertile window" / "Luteal phase"
4. Dot-bar on home screen snippet shows teal/dark-teal dots for fertile window position within cycle

**Key UX decision:** Fertility data is informational only. Lua must include a disclaimer: "Fertility estimates are not reliable for contraception. Consult a healthcare provider." This is not a fertility planning app — it's a period tracker that happens to estimate fertile windows based on the calendar method.

---

## 3. Scope Decisions

### 3.1 Fix Stale Cycle Status

**Include (MVP):**
- When `stale === true` (cycle day > 2x predicted length), show alternative UI: "Last period: Dec 27, 2023 (X months ago)" instead of "Day 780 of ~28"
- Hide "next period in N days" when prediction is clearly stale (> 90 days overdue)
- Show prompt: "Log a recent period to update predictions"

**Exclude:**
- Detecting pregnancy/menopause/medical conditions
- Auto-archiving old data
- Push notifications to remind logging

**Acceptance criteria:**
- [ ] With seed data only (last period Dec 2023), status shows "Last period: Dec 27, 2023" not "Day 780"
- [ ] "Days until next" is hidden when stale
- [ ] Prompt to log period is visible when stale
- [ ] Non-stale cycles still show "Day X of ~Y" normally
- [ ] Unit test covers stale threshold (>2x cycle length)

### 3.2 Extract Seed Data to Importable JSON

**Include (MVP):**
- Create `flo-export-example.json` with current seed data in Lua's import format
- Remove auto-import of `seedPeriods.ts` on first launch
- First launch shows empty state instead of someone else's data
- Settings > Import can load the example file (or any Lua-format JSON)

**Exclude:**
- Flo's native export format parsing (different JSON structure)
- CSV import
- Migration wizard
- Automatic Flo-to-Lua format conversion

**Acceptance criteria:**
- [ ] Fresh install shows empty state with "No periods logged"
- [ ] `seedPeriods.ts` is deleted or unused
- [ ] Example JSON file exists at known path in repo
- [ ] Import of example JSON loads all 37 periods correctly
- [ ] Existing users who already have data are unaffected

### 3.3 Make Period Logging More Convenient

**Include (MVP):**
- "Log Period" opens a simplified flow defaulting to "started today"
- One-tap confirmation for "period started today"
- "End Period" button on home screen when a period is ongoing (already exists)
- Ability to backdate start date via date picker

**Exclude:**
- Full Flo-style scrolling calendar date picker (that's feature #6, separate scope)
- Period symptom tracking
- Flow intensity logging
- Notifications/reminders

**Acceptance criteria:**
- [ ] "Period started today" can be logged in 2 taps (button + confirm)
- [ ] Backdating is possible but not the default path
- [ ] End date can be set later (ongoing period pattern works)
- [ ] No regression in existing validation (start <= today, end >= start)

### 3.4 Fertility Window Calculation

**Include (MVP):**
- Estimated ovulation day: cycle start + (avg cycle length - 14) days
- Fertile window: ovulation day -5 to ovulation day (6-day window)
- Calendar markers: teal dots on fertile days, dark teal on ovulation day
- Computation in `predictions.ts`, no new service file

**Exclude:**
- Basal body temperature integration
- Cervical mucus tracking
- LH surge prediction
- Multiple ovulation detection
- Contraception reliability claims

**Acceptance criteria:**
- [ ] Fertility window calculated for current cycle and predictions
- [ ] Calendar shows teal/dark-teal markers on appropriate days
- [ ] Fertile window does not appear if fewer than 2 periods logged
- [ ] Disclaimer text present: "Estimates only, not for contraception"
- [ ] Dot-bar includes teal/dark-teal segments for fertile/ovulation days
- [ ] Unit tests for edge cases: short cycles (<21d), long cycles (>35d), irregular cycles

### 3.5 Cycle History with Dot-Bar + Filters

**Include (MVP):**
- Replace current HistoryList with dot-bar visualization
- Each cycle row: cycle length (bold), date range (subtitle), dot-bar below
- Dot-bar: one dot per day of cycle — coral (period), light teal (fertile), dark teal (ovulation), gray (other)
- Year grouping with year headers
- Current cycle at top with "Current cycle: X days" label
- Filter pills: All / Last 3 / Last 6

**Exclude:**
- Tap-to-expand cycle details
- Cycle comparison (side-by-side)
- Export individual cycles
- Symptom overlay on dots

**Acceptance criteria:**
- [ ] Matches Flo's layout (IMG_8326-8328) in structure
- [ ] Dot-bar colors: coral (#FF6B8A), light teal (new), dark teal (new), gray
- [ ] Filter pills work: All shows full history, Last 3/6 limit displayed cycles
- [ ] Active filter pill is highlighted (coral background, white text)
- [ ] Current cycle shows as first entry with "Current cycle" label
- [ ] Year headers separate groups
- [ ] Legend at top: "Period", "Fertile window", "Ovulation"
- [ ] Scrolls smoothly with 37+ cycles
- [ ] Empty state when no periods logged

### 3.6 Calendar Date Picker

**Include (MVP):**
- Full-screen scrolling calendar (vertical scroll, month sections)
- Tappable circle on each day
- Period days: coral filled circle with checkmark
- Predicted period days: coral dashed circle
- Fertile window days: teal text
- Ovulation day: teal dashed circle
- Today marker: "Today" label + highlighted
- Cancel / Save buttons at bottom
- Opens from "Log Period" or "Edit dates" actions

**Exclude:**
- Horizontal swipe between months (vertical scroll only)
- Pinch-to-zoom
- Multi-period selection in one session
- Drag-to-select date ranges

**Acceptance criteria:**
- [ ] Matches Flo's date picker layout (IMG_8321)
- [ ] Smooth scroll through 12+ months of calendar
- [ ] Tapping a day toggles selection (circle fills coral with check)
- [ ] Can select multiple consecutive days (period range)
- [ ] Save creates/updates period with selected date range
- [ ] Cancel returns to previous screen without changes
- [ ] Today is clearly marked
- [ ] Historical period days shown as filled circles
- [ ] Performance: renders without jank on iPhone SE (oldest supported)

### 3.7 Month/Year History View

**Include (MVP):**
- Toggle between "Month" and "Year" views (segmented control at top, like IMG_8322/8323)
- Month view: scrolling calendar months, each showing period days (coral), predicted (pink), fertile (teal), ovulation (dark teal), today marker
- Year view: compact 12-month grid per year showing just period days highlighted
- "Edit period dates" button in month view (links to calendar date picker)
- Accessible from History tab or calendar icon in header

**Exclude:**
- Jump-to-month dropdown
- Animated transitions between month/year
- Landscape mode
- Custom date range selection

**Acceptance criteria:**
- [ ] Month/Year segmented control toggles views
- [ ] Month view matches IMG_8323 layout (continuous scrolling months)
- [ ] Year view matches IMG_8322 layout (compact 3-column month grid per year)
- [ ] Color coding consistent with calendar and dot-bar
- [ ] Scrolling is smooth
- [ ] Current month/today clearly marked

### 3.8 Cycle Dynamics Chart

**Include (MVP):**
- Line chart: X-axis = cycle start dates, Y-axis = cycle length in days
- Data points labeled with cycle length value
- Shaded "normal range" band (21-35 days)
- Text summary: "Length of last N complete cycles was in [normal/irregular] range"
- Last 6 cycles shown by default
- Pure SVG rendering (no charting library)

**Exclude:**
- Interactive tooltips on data points
- Zoom/pan
- Period duration overlay
- Multiple metrics (just cycle length)
- Canvas rendering (SVG is simpler for this scale)

**Acceptance criteria:**
- [ ] Matches Flo's chart layout (IMG_8324/8325)
- [ ] SVG renders correctly on iOS Safari 17+
- [ ] Data points labeled with cycle length values
- [ ] Normal range band (21-35 days) shaded in background
- [ ] Summary text categorizes cycle regularity
- [ ] Handles edge cases: fewer than 3 cycles (show what's available), all same length (flat line), wide variation
- [ ] Responsive: fits mobile viewport without horizontal scroll

---

## 4. UX Improvements Beyond Flo

Lua should not be a Flo clone. It should be better in ways that matter to the user.

### 4.1 Period Logging Convenience

**Flo's problem:** Even in Flo, logging requires multiple taps. The user said "I can forget to log." Flo relies on notifications to remind — Lua can't push notifications as a PWA (well, it can on iOS 16.4+, but setup is complex).

**Lua's opportunity:**
- **"Started today" one-tap:** When user taps "Log Period," show a prominent "Started today" button that logs immediately with one tap. The date picker is secondary, for backdating.
- **Smart defaults:** If the predicted period window is now, pre-fill the start date. "Your period was expected today. Did it start?"
- **End-period nudge:** When an ongoing period is 3-7 days old, the home screen status can gently remind: "Still on your period? Tap to end it."
- **Tolerance for imprecision:** Flo forces exact dates. Lua could accept "around Jan 19" with a +/- 1 day margin, computing the average. (Future iteration — too complex for MVP.)

### 4.2 Information Hierarchy

**Flo's problem:** Flo's home screen is cluttered with ads ("Your subscription is ending"), tips, partner features, messages. The actual cycle status is buried.

**Lua's opportunity:**
- **Zero noise.** No ads. No tips. No social features. The home screen is ONLY: cycle status + calendar + dot-bar snippet.
- **Glanceable answer.** The three most important facts are visible without scrolling: (1) cycle day, (2) days until next period, (3) current phase (period / fertile / luteal / follicular).
- **Progressive disclosure.** Home = summary. History tab = detail. Settings = admin. Three levels, never mixed.

### 4.3 Navigation Simplicity

**Flo's problem:** Flo has 4 bottom tabs (Today, Tips, Messages, Partner) + calendar icon in header + history drilldown. The cycle history is buried behind "See all" link on the home screen.

**Lua's opportunity:**
- **Two tabs only.** Calendar (home) + History. Everything the user needs in 2 taps max.
- **Calendar icon** in header opens the Month/Year history view (same as Flo). This is the ONLY header action besides Settings.
- **No "See all" link.** The dot-bar snippet on the home screen shows last 2-3 cycles. Tapping History tab shows everything. No intermediate step.
- **Flat navigation.** No nested drilldowns. Filter pills change the data in-place, never navigate away.

### 4.4 Data Ownership and Transparency

**Flo's problem:** Flo shared data with Meta and Google. The entire reason Lua exists. Flo's "privacy" features are a PR response, not architecture.

**Lua's opportunity:**
- **Zero network calls.** The app never makes any HTTP request. Period. This is verifiable — user can check the Network tab.
- **Visible data.** Settings shows "Your data: 37 periods, 4 years of history, stored in IndexedDB on this device."
- **One-tap export.** Export all data as JSON anytime. The file is human-readable.
- **No account.** No signup, no email, no login. The app works the moment you open it.
- **Source available.** User can read every line of code. Lua has nothing to hide.

### 4.5 Design Language

**Flo's problem:** Flo uses a soft, rounded, "wellness app" aesthetic. It's pretty but generic. The mascot bear is patronizing.

**Lua's opportunity:**
- **Arutyunov IDS + Birman typography.** Density-based spacing, professional type hierarchy, no emoji, no mascots.
- **Information-dense but calm.** Think "Bloomberg terminal for one person's body" — every pixel carries data, but the layout breathes.
- **No purple/teal gradient headers.** Clean white background, coral for period, teal for fertility, gray for structure. Three colors. Done.

---

## 5. Risk Assessment (Cagan's 4 Risks)

### 5.1 Fix Stale Cycle Status

| Risk | Level | Assessment |
|------|-------|------------|
| Value | None | User literally cannot use the app without this fix. |
| Usability | None | Replacing "Day 780" with "Last period: Dec 27" is self-explanatory. |
| Feasibility | None | `stale` flag already computed in `getDayOfCycle()`. UI just needs to check it. |
| Viability | None | Zero maintenance burden. Pure logic. |

**Verdict:** No risk. Do it first.

### 5.2 Extract Seed Data to Importable JSON

| Risk | Level | Assessment |
|------|-------|------------|
| Value | None | Without this, every user sees fake data. |
| Usability | Low | Import flow already exists in Settings. Just need clear empty state. |
| Feasibility | None | Move array to JSON file. Delete auto-import code. |
| Viability | None | Reduces code complexity. |

**Verdict:** No risk. Do it alongside #5.1.

### 5.3 Make Period Logging More Convenient

| Risk | Level | Assessment |
|------|-------|------------|
| Value | Low | The user explicitly said "I can forget to log." This directly addresses it. |
| Usability | Medium | "Started today" must be instantly obvious. If user has to think, we failed. One-tap path must be the visually dominant action. |
| Feasibility | Low | Minor UI changes to LogPeriodSheet. No new tech. |
| Viability | None | Simpler code than current sheet. |

**Verdict:** Low risk overall. Usability risk mitigated by making "Started today" the largest button.

### 5.4 Fertility Window Calculation

| Risk | Level | Assessment |
|------|-------|------------|
| Value | Medium | User hasn't explicitly asked for fertility tracking. But Flo shows it, and it enables the full dot-bar visualization. Value is conditional on dot-bar shipping. |
| Usability | Medium | Fertility estimates based on calendar method are unreliable (up to 25% failure rate for contraception). Must clearly communicate this is informational, not medical advice. |
| Feasibility | Low | Pure math: ovulation = cycleStart + (avgLength - 14). Fertile window = ovulation -5 to ovulation. Well-defined algorithm. |
| Viability | Low | Legal/medical disclaimer needed. "Not for contraception" must be visible. |

**Verdict:** Medium risk due to medical implications. Mitigate with clear disclaimers and "informational only" framing.

### 5.5 Cycle History with Dot-Bar + Filters

| Risk | Level | Assessment |
|------|-------|------------|
| Value | High (positive) | This is the feature the user wants most — visual cycle history like Flo. |
| Usability | Medium | Dot colors must be immediately understandable. Legend is required. Color-blind users need pattern alternatives (future iteration). |
| Feasibility | Medium | Rendering 30+ dots per row for 37+ cycles needs efficient rendering. Not technically hard but needs care with layout. Pure CSS/HTML dots (not SVG/canvas). |
| Viability | Low | Static rendering, no external dependencies. |

**Verdict:** Medium risk on usability (legend + color clarity). Feasibility is manageable with CSS-only dots.

### 5.6 Calendar Date Picker

| Risk | Level | Assessment |
|------|-------|------------|
| Value | Medium | Nice UX but current date inputs work. This is "delight" not "function." |
| Usability | Low | Flo's calendar picker is well-understood. Users know how to tap dates. |
| Feasibility | **High** | Smooth infinite vertical scroll in Safari PWA is the #1 technical risk. Safari has momentum scrolling quirks, viewport height issues, and performance cliffs with many DOM nodes. Needs virtualization or windowing. |
| Viability | Medium | Complex component = more code to maintain. |

**Verdict:** High feasibility risk. Recommend a spike/PoC before committing. Test: can we render 24 months of calendar in Safari with smooth scroll?

### 5.7 Month/Year History View

| Risk | Level | Assessment |
|------|-------|------------|
| Value | Low-Medium | Nice for reviewing long-term patterns but dot-bar already serves this need better. |
| Usability | Low | Month/Year toggle is standard (Flo, Apple Calendar, Google Calendar all use it). |
| Feasibility | Medium | Year view needs 12 mini-calendars per year in a compact grid. Layout is fiddly but no advanced tech needed. |
| Viability | Low | Static rendering. |

**Verdict:** Low-medium risk. Deprioritize below dot-bar and cycle dynamics.

### 5.8 Cycle Dynamics Chart

| Risk | Level | Assessment |
|------|-------|------------|
| Value | Medium | Shows if cycles are regular. Useful for doctor visits. But the user can also see this from the dot-bar lengths. |
| Usability | Low | Line chart is universal. Users understand it. |
| Feasibility | **High** | SVG chart in a PWA: responsive sizing, axis labels, data point labels, shaded band. No charting library means hand-rolling SVG paths. Edge cases: 1-2 data points, flat lines, wide Y-axis range. Safari SVG text rendering can be quirky. |
| Viability | Medium | Hand-rolled SVG chart is harder to maintain than a library. But adding a library (Chart.js, Recharts) adds bundle size. |

**Verdict:** High feasibility risk. Recommend SVG spike first. If SVG is too complex, consider a minimal charting micro-library or skip for V1.

---

## 6. Recommended Build Order

```
Phase 1: Foundation (no spec needed, 1-2 sessions)
  [1] Fix stale cycle status
  [2] Extract seed data to importable JSON

Phase 2: Core Value (needs spec, 3-4 sessions)
  [3] Fertility window calculation (math only, enables #4)
  [4] Make period logging more convenient
  [5] Cycle history with dot-bar + filters

Phase 3: Polish (needs spec + spike, 3-4 sessions)
  [6] Calendar date picker (spike first)
  [7] Month/Year history view
  [8] Cycle dynamics chart (spike first)
```

**Critical path:** Phase 1 -> Fertility calc -> Dot-bar (the dot-bar needs fertility data to show teal/dark-teal dots).

**Parallelizable:** Once fertility calc ships, logging convenience and dot-bar can be built in parallel by different agents.

---

## 7. Open Questions for Head of Product

1. **Fertility window: include or defer?** It's needed for full dot-bar fidelity (Flo shows teal/dark-teal dots). But it adds medical liability risk. Ship dot-bar with period-only dots first, add fertility later?

2. **Calendar date picker: how critical?** Current native date inputs work. The Flo-style picker is beautiful but is the highest technical risk. Accept native pickers for V1?

3. **Cycle dynamics chart: SVG or library?** Hand-rolled SVG keeps bundle small but is harder to build. A micro-library (e.g., uPlot at 35KB) would be faster to build. Preference?

4. **Import format: Lua-only or Flo-compatible?** Current import only reads Lua's JSON format. Should we parse Flo's native export format too? (Increases scope but is the real user journey.)

5. **Localization: English or Russian?** Flo screenshots are in Russian. The user is Russian-speaking. Should Lua default to Russian? Or English with Russian as option? (Affects all text strings.)

---

*"Fall in love with the problem, not the solution. The problem is: a woman wants to understand her body's patterns without surrendering her privacy. Everything we build must serve that."*
