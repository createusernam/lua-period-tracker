# Lua — The Story Behind the App

## What is Lua?

Lua is a private period tracker that runs entirely in your browser. No accounts, no servers storing your data, no ads, no tracking. Your menstrual health data stays on your device in IndexedDB, with optional backup to your own Google Drive.

**Disclaimer:** Lua is not a medical device. Cycle predictions, fertility windows, and ovulation estimates are informational only — based on statistical averages of your past data. Do not use them for contraception or medical decisions without consulting a healthcare provider.

The name "Lua" comes from the Portuguese/Spanish word for "moon" — a nod to the lunar cycle and its historical connection to menstrual cycles.

## Why Build Another Period Tracker?

### The Problem

Every popular period tracker (Flo, Clue, Ovia) requires:
- Account creation with email/phone
- Cloud storage of intimate health data on company servers
- Acceptance of privacy policies that allow data sharing with "partners"
- In-app purchases for basic features like predictions

After the 2022 US Supreme Court decision on reproductive rights, period tracking data became a legal liability. Users couldn't trust that their cycle data — which can indicate pregnancy — wouldn't be subpoenaed or sold.

### The ДКЦП Analysis

We used the ДКЦП methodology (Дворец Культуры Ценностного Предложения / Value Proposition Palace) to identify the core conflict:

**Segment:** Women who track their cycles for health awareness and planning.

**Motivational conflict:**
- **Drive:** "I want to understand my body and plan my life around my cycle"
- **Fear:** "I don't want my most intimate data on someone else's server"

**Resolution:** A period tracker that gives Flo-level predictions and visualizations while keeping data entirely local. The value proposition is not "we're a better Flo" — it's "we're a Flo that physically cannot leak your data because we never have it."

### User Interview Insights

Our primary user (UX researcher interview, Feb 2026):

> "I open the app **proactively**, before my period arrives — to check predictions and plan my week. The most important thing is seeing **which phase I'm in** (ovulation, premenstrual, etc.) because it explains how I'm feeling."

Key findings:
1. **Phase awareness is the core value** — not just "Day X of Y" but "premenstrual phase, period in ~3 days"
2. **Predictions drive real decisions** — she adjusts daily routines and plans trips based on cycle predictions
3. **12 months of forward predictions** needed — not just the next cycle
4. **Visual calendar is essential** — Flo's scrolling month view with colored dots is the mental model

## Design Principles

### Arutyunov IDS (Interface Design System)

The visual design follows Ilya Arutyunov's Interface Design System:

- **Design in code, not mockups.** Every screen was prototyped as working HTML/CSS before specs were written. Stakeholders reviewed real screens in a browser, not static images. This eliminates the mockup-to-code translation gap.
- **Density-based spacing.** A single `--density: 1.35` CSS variable controls all vertical rhythm. Change one number, the entire app breathes differently.
- **RGB triplets for color flexibility.** Colors defined as `--period-rgb: 255, 107, 138` allow `rgba(var(--period-rgb), 0.15)` for transparent variants without defining separate tokens.

### Birman/Bureau Gorbunov Typography

Following Ilya Birman and Artyom Gorbunov's typography principles:

- System font stack: `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif` — native feel, zero font loading
- Body text at 16-20px with line-height matching the density variable
- Near-black text (#222), never pure black — reduces eye strain
- Letter-spacing: -0.01em on headings, 0.05em on uppercase labels

### Interaction Design

- **Instant hover-in, slow hover-out** (0s in, 0.5s ease out) — the Birman school of transitions
- **44px minimum touch targets** — Apple HIG compliance for PWA-as-native experience
- **Respect `prefers-reduced-motion`** — all transitions gated
- **Single breakpoint at 768px** — mobile-first, resize to see both

### No Framework CSS

No Tailwind, no Bootstrap, no MUI. All CSS is hand-crafted in a single `styles/index.css` file using CSS custom properties. This gives:
- Zero CSS framework overhead in the bundle
- Complete control over the design system
- No class name pollution or specificity wars
- Easy theming via CSS variables

## Development Principles

### Ship Fast, Ship Simple (Werner Vogels)

> "Everything fails, all the time."

The CTO persona (inspired by Werner Vogels) enforced these priorities:

1. **Working software over perfect architecture** — ship the MVP, iterate
2. **Easy to delete, easy to understand** — flat file structure, no over-abstraction
3. **Low cost** — zero infrastructure cost (static hosting), zero API cost (local-first)
4. **No regressions** — 88 tests, TypeScript strict mode, Zustand selector stability

### Discovery Before Delivery (Marty Cagan)

The PM persona enforced the pipeline:

1. **Validate the problem first** — user interview confirmed the privacy conflict
2. **Mockup approval gate** — stakeholder reviews HTML mockups in browser before any spec is written
3. **Spec review before implementation** — QA reviews specs for edge cases before dev starts
4. **Pipeline, don't serialize** — spec writing overlaps with development

### Exploratory Testing (James Bach)

The QA persona ran full-codebase reviews checking:
- Data integrity (import validation, date semantics, overlap detection)
- State management (stale data, reconnect, concurrent operations)
- Edge cases (zero periods, 1000 periods, ongoing period, far-future dates)

## The Agent Team

Lua was built with a team of 10 AI agent personas, each bringing a specific methodology:

| Role | Persona | Methodology |
|------|---------|-------------|
| **CTO** | Werner Vogels | "Everything fails, all the time." Architecture, coordination, code review. Enforces simplicity and failure resilience. |
| **Product Manager** | Marty Cagan | "Fall in love with the problem, not the solution." Scope control, prioritization via Cagan's 4 risks (value, usability, feasibility, viability). |
| **UX Researcher** | Экселенц (ДКЦП) | Value Proposition Palace methodology. Customer segment modeling, motivational conflict analysis, user interviews. |
| **CJM Analyst** | CJM + ДКЦП | Customer Journey Mapping integrated with ДКЦП. Maps user touchpoints to screens, identifies pain points and opportunities. |
| **Design Prototyper** | "Design With Code" | HTML/CSS mockups served on localhost. No Figma. Stakeholders discuss real screens. Mandatory approval gate. |
| **Tech Spec Writer** | Joel Spolsky | Painless functional specs. Scenarios, data flow, API contracts, non-goals, file changes. |
| **UI Spec Writer** | Steve Krug | "Don't make me think." Wireframes, interactions, responsive behavior, empty/loading/error states. |
| **UX Designer** | Dieter Rams | "Less, but better." Component design in code, CSS system, responsive layout. |
| **Frontend Developer** | Dan Abramov | React mental model. Pure components, lifted state, Zustand selectors, hooks discipline. |
| **QA Specialist** | James Bach | Exploratory testing. Edge case categorization (data integrity, state management, mobile, auth, temporal). |

### The Workflow

```
Brainstorm (CTO + PM + UX Researcher)
  → User Interview (UX Researcher)
    → CJM Mapping (CJM Analyst)
      → HTML Mockups (Design Prototyper) — reviewed in browser
        → Mockup Approval Gate (Stakeholder)
          → Tech Spec + UI Spec (Spec Writers) — QA reviews before dev
            → Implementation (Frontend Developer)
              → Code Review (QA + CTO)
                → Fix → Deploy
```

The key insight: **mockup approval is mandatory before specs**. This catches UX issues at the cheapest possible stage. No spec is written for an unapproved design. No code is written for an unreviewed spec.

## Technical Architecture

### Stack Choices and Why

| Technology | Why |
|-----------|-----|
| **React 19** | Familiar, stable, excellent TypeScript support. No need for Next.js/Remix — this is a client-only app. |
| **TypeScript 5.9** (strict) | Catches bugs at compile time. Strict mode enforced from day one. |
| **Vite 7** | Fast dev server, optimal production builds, native PWA plugin support. |
| **Zustand 5** | Minimal state management. No boilerplate, no providers, selector-based subscriptions prevent unnecessary re-renders. |
| **Dexie.js 4** | Clean API over IndexedDB. Transactions, versioning, type safety. Better than raw IndexedDB or localStorage. |
| **date-fns 4** | Tree-shakeable date library. Only imports what's used. No Moment.js bloat. |
| **vite-plugin-pwa** | Workbox service worker for offline support. Auto-update strategy. |

### What We Didn't Use (and Why)

| Rejected | Why |
|----------|-----|
| **Tailwind** | Violates the Arutyunov IDS principle of semantic, density-based CSS. Class pollution. |
| **MUI/Chakra** | Opinionated design systems that fight custom design. Bundle bloat. |
| **Redux** | Overkill. Zustand does everything Redux does in 1/10th the code. |
| **Chart.js/Recharts** | Bundle cost. The cycle dynamics chart is 80 lines of hand-rolled SVG. |
| **Docker** | No server to containerize. It's a static site. |
| **Backend/Database** | Privacy by architecture. No server = no data breach possible. |

### Key Engineering Patterns

1. **Store-level derived state.** Predictions, cycle phases, fertility windows, date sets, and cycle history are all computed once in `loadPeriods()` and stored in Zustand. Components read derived state, never compute it.

2. **Load deduplication.** `periodStore.loadPeriods()` uses a module-level promise to prevent concurrent IndexedDB reads from racing.

3. **Atomic Zustand selectors.** Components subscribe to individual fields (`usePeriodStore(s => s.cycles)`) instead of destructuring the whole store. This prevents cascade re-renders.

4. **Atomic import/export.** `importData()` wraps clear + bulkAdd in a Dexie transaction. Either all data is replaced or none is.

5. **Error boundary.** A React error boundary at the root prevents white-screen crashes from corrupted data.

6. **14-day ongoing period cap.** Ongoing periods are capped at 14 days in calendar displays to prevent unbounded date expansion across the entire calendar.

## Privacy Architecture

| Concern | How It's Addressed |
|---------|-------------------|
| **Data storage** | IndexedDB only. Never leaves the browser unless user explicitly enables Google Drive backup. |
| **Google Drive sync** | OAuth `drive.file` scope — can only access files the app created. Data stored as JSON in your Drive. Token stored in localStorage with 1-hour expiry. |
| **No analytics** | No Google Analytics, no Mixpanel, no telemetry of any kind. |
| **No accounts** | No email, no phone, no password. No server to hack. |
| **Content Security Policy** | Strict CSP in `<meta>` tag — only allows scripts from self and Google's OAuth library. |
| **Offline-first** | Full functionality without internet. Service worker caches all assets. |

## Future Directions

- **Apple Shortcuts bridge** for step count integration (HealthKit is blocked in PWAs)
- **Code splitting** with React.lazy for faster initial load
- **Type-safe translation keys** for compile-time i18n safety
- **Dark mode** via CSS custom property layer
- **Shared cycles** — anonymous sharing between partners
