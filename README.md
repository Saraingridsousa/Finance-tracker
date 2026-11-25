<h1 align="center">Finance Tracker</h1>
<p align="center">Personal finance analytics • Automated classification • Simulated banking integration</p>
<p align="center"><img src="https://skillicons.dev/icons?i=react,ts,vite,tailwind" alt="React, TypeScript, Vite and Tailwind CSS"/></p>

## Overview

An independent, static portfolio demonstration adapted from a personal finance application. It uses deterministic fictional transactions to showcase automated categorization, financial analytics, interactive visualization and idempotent synchronization.

**Live demo:** [Finance Tracker](https://saraingridsousa.github.io/Finance-tracker/) — synthetic data only. The project uses GitHub Actions for validation and static deployment. No live banking connection is available.

## Features

- Income, expenses, period result and investment contributions in BRL.
- Monthly and category charts driven by shared financial selectors.
- Search, filters, pagination and manual transaction/category corrections.
- Simulated synchronization with stable transaction identifiers and reset.
- Credit-card analytics: limits, open bills, six-month bill history, category distribution and detailed purchases by card and month; light/dark theme.
- Connection dashboard with per-source synchronization, duplicate counts, attempt history and simulated failure recovery.
- Investment portfolio with six fictional assets, consolidated metrics, allocation by class, six-month valuation history, per-asset gains/losses and sortable positions.

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

The demo excludes pending and non-BRL transactions from BRL consumption totals, and treats confirmed own-account transfers, recognized investment allocations and credit-card bill payments separately. A Pix payment alone is not evidence of a self-transfer. The investment and card panels contain independent illustrative snapshots, not reconciled balances. Investment variation is calculated against position cost and is not time-weighted performance; historical values are synthetic. No market prices are fetched.

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
- [x] Activate Pages and verify successful publication.

## Author

Sara Ingrid — software development, process automation and data analytics.
