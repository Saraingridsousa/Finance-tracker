# Finance Tracker — technical case study

## Context and problem

Personal finance data is fragmented across accounts, cards and investment products. A useful analytics application must classify movements consistently, avoid double-counting transfers or card payments, and make the resulting information understandable. This portfolio edition demonstrates those engineering problems with deterministic fictional data only.

## Solution and architecture

A static React/TypeScript application built with Vite and Tailwind CSS. Recharts presents shared financial selectors. Synthetic fixture adapters produce stable records; a session-only state layer supports edits, synchronization and resets. Domain modules calculate analytics, budget metrics, card bills, investment allocations and sync reports. No external banking service or backend is needed.

## Decisions and trade-offs

- Consistent BRL results exclude pending, non-BRL and neutral transactions; a Pix alone is not proof of own-account transfer.
- Integer cents are used for synthetic financial data. A category correction overrides inference.
- Synchronization merges stable identifiers, preserves manual edits and hidden records, and records simulated failures without changing the existing ledger.
- Cards and investments are independent illustrative ledgers, not balances reconciled to the transaction history. Portfolio variation against cost is not time-weighted return.
- Budget targets apply across the six fictional months. CSV downloads use UTF-8, semicolons, localized decimals and formula-injection protection.
- Session-only data and explicit reset make the demo safe to explore. No real bank account, persistent data or private configuration is included.
- Lazy loading reduces the initial application module surface; shared libraries may still dominate bundle size.

## Validation and delivery

Domain regression tests cover financial reconciliation, duplicate handling, credit and investment metrics, budgets and CSV escaping. The browser smoke workflow exercises interactions in Chromium, tests 390/768/1440-pixel viewports, checks theme, keyboard, downloads, unexpected external requests and storage, and produces screenshots. The privacy guard checks tracked paths and selected source markers. Dependency audit covers known npm advisories, not all possible vulnerabilities. GitHub Actions builds and deploys the static demo.

## Limits

The demonstration is not a banking application, investment recommendation or accounting product. It has no live prices, real synchronization, durable persistence, reconciliation between the independent ledgers, authentication or multi-user accounts. Browser smoke coverage does not establish full WCAG conformance, visual perfection, or compatibility with every browser and spreadsheet application.
