<h1 align="center">Finance Tracker</h1>
<p align="center">Personal finance analytics • Automated classification • Simulated banking integration</p>
<p align="center"><img src="https://skillicons.dev/icons?i=react,ts,vite,tailwind" alt="React, TypeScript, Vite and Tailwind CSS"/></p>

## Overview

An independent, static portfolio demonstration adapted from a personal finance application. It uses deterministic fictional transactions to showcase automated categorization, financial analytics, interactive visualization and idempotent synchronization.

**Status: initial implementation validated in CI.** The initial pull request passed clean installation, TypeScript checks, automated tests and the production build. GitHub Pages deployment is configured in code, pending activation and successful publication. No live banking connection is available.

## Features

- Income, expenses, period result and investment contributions in BRL.
- Monthly and category charts driven by shared financial selectors.
- Search, filters, pagination and manual transaction/category corrections.
- Simulated synchronization with stable transaction identifiers and reset.
- Illustrative credit-card and investment views; light/dark theme.

## Run locally

Requires Node.js 22.18+ compatible with the locked dependencies.

```bash
npm ci
npm run dev
npm test
npm run build
```

## Architecture

```mermaid
flowchart LR
 A[Fictional fixtures] --> B[In-memory demo adapter]
 B --> C[Classification and financial selectors]
 C --> D[React dashboard and charts]
```

The demo excludes pending and non-BRL transactions from BRL consumption totals, and treats confirmed own-account transfers, recognized investment allocations and credit-card bill payments separately. A Pix payment alone is not evidence of a self-transfer. The investment and card panels contain independent illustrative snapshots, not reconciled balances. No market prices are fetched.

## Privacy

No bank credentials, actual bank API, real data, private configuration, SQLite databases, or personal Git history are included. Edits exist only in the current page session and are discarded when reloaded. Never enter real personal financial data in the demo.

## Roadmap

- [x] Independent portfolio repository.
- [x] Selected reusable React components and financial rules.
- [x] Synthetic transaction adapter and interactive demo.
- [x] Regression test cases for classification, chart consistency and idempotency.
- [x] Verify clean install, typecheck, tests and build.
- [ ] Browser accessibility and responsive acceptance.
- [x] Continuous integration and Pages deployment workflow.
- [ ] Activate Pages and verify successful publication.

## Author

Sara Ingrid — software development, process automation and data analytics.
