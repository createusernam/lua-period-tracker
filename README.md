# Lua — Private Period Tracker

A period tracker that runs entirely in your browser. No accounts, no servers, no ads, no tracking. Your data stays on your device.

**[Try it now](https://createusernam.github.io/lua-period-tracker/)** | [Privacy Policy](https://createusernam.github.io/lua-period-tracker/privacy.html) | [Deployment Guide](docs/DEPLOY.md)

## Why Lua?

Every popular period tracker (Flo, Clue, Ovia) stores your intimate health data on company servers. After the 2022 US Supreme Court decision on reproductive rights, that data became a legal liability.

Lua takes a different approach: **it physically cannot leak your data because it never has it.** All data lives in your browser's IndexedDB. The optional Google Drive backup goes to *your* account — Lua has no server to breach.

The name comes from the Portuguese/Spanish word for "moon."

## Features

- **Cycle predictions** — weighted moving average with confidence levels, 12 months forward
- **Phase awareness** — menstrual, follicular, ovulation, luteal, premenstrual
- **Fertility window** and ovulation estimates
- **Monthly calendar** with color-coded period, predicted, fertile, and ovulation days
- **Scrolling calendar** with tap-to-edit period dates
- **Year view** — 12 mini-calendars at a glance
- **Cycle history** — dot-bar visualization grouped by year
- **Cycle dynamics chart** — SVG line chart of cycle length trends
- **Statistics** — average cycle length, fluctuation range, previous cycle/period duration
- **Import/Export** — JSON backup/restore with validation
- **Google Drive sync** — optional cloud backup to your own Drive
- **Offline-first** — full functionality without internet (service worker caches all assets)
- **Installable** — works as a native-like app on iOS and Android
- **Bilingual** — Russian and English, auto-detected from browser

## Privacy

- All data stored locally in IndexedDB
- No analytics, no telemetry, no ads
- No accounts, no email, no phone number
- Google Drive backup is optional and goes to your personal Drive
- Strict Content Security Policy
- Full [Privacy Policy](https://createusernam.github.io/lua-period-tracker/privacy.html)

**Medical disclaimer:** Lua is not a medical device. Predictions are informational estimates based on your past data. Do not use them for contraception or medical decisions without consulting a healthcare provider.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (TypeScript + Vite)
npm test             # Run 88 tests
npm run test:watch   # Watch mode
npm run preview      # Preview production build
```

## Tech Stack

| Technology | Why |
|-----------|-----|
| **React 19** | Stable, TypeScript-first. Client-only — no Next.js/Remix needed. |
| **TypeScript 5.9** (strict) | Compile-time safety from day one. |
| **Vite 7** | Fast dev server, optimal production builds, native PWA plugin. |
| **Zustand 5** | Minimal state management. Atomic selectors prevent re-renders. |
| **Dexie.js 4** | Clean IndexedDB API with transactions and type safety. |
| **date-fns 4** | Tree-shakeable. Only imports what's used. |
| **vite-plugin-pwa** | Workbox service worker for offline support. |

No Tailwind. No Bootstrap. No MUI. All CSS is hand-crafted with CSS custom properties following the Arutyunov Interface Design System.

## Browser Support

Works in all modern browsers:

| Browser | Install as PWA |
|---------|---------------|
| Chrome (desktop + Android) | Yes |
| Safari (iOS 17+ / macOS) | Yes (Share > Add to Home Screen) |
| Firefox (desktop + Android) | Limited PWA support |
| Edge (desktop) | Yes |
| Samsung Internet | Yes |

## Project Structure

```
src/
  components/     # React components (calendar, history, settings, etc.)
  services/       # Business logic (predictions, import/export, sync, calendar sets)
  stores/         # Zustand stores (periods, sync state)
  i18n/           # Translations (ru, en)
  styles/         # Single CSS file with design system
  data/           # Synthetic demo data for testing
  test/           # 88 tests (Vitest + Testing Library + fake-indexeddb)
public/
  manifest.json   # PWA manifest
  privacy.html    # Standalone privacy policy
docs/
  ABOUT.md        # Full project story and design principles
  DEPLOY.md       # Deployment guide (GitHub Pages + VPS)
```

## Deployment

### GitHub Pages

```bash
npm run build
npx gh-pages -d dist
```

### Self-Hosting

See [DEPLOY.md](docs/DEPLOY.md) for full VPS setup with nginx, SSL, and custom domains.

## Architecture Highlights

- **Store-level derived state** — predictions, cycles, date sets computed once per data load, not per render
- **Atomic Zustand selectors** — components subscribe to individual fields to prevent cascade re-renders
- **Load deduplication** — concurrent IndexedDB reads are collapsed into a single promise
- **Atomic import** — clear + bulkAdd wrapped in a Dexie transaction
- **Error boundary** — prevents white-screen crashes from corrupted data
- **14-day ongoing period cap** — prevents unbounded date expansion in calendar views

## License

[MIT](LICENSE)
