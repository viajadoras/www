# ARCHITECTURE

## Metadata

- Owner: repository maintainers
- Last reviewed: 2026-02-28
- Status: active

## Context

- What this system does: marketing website and waitlist capture flow for Viajadoras.
- Scope: static pages, UI components, and client-side form submission to an external API.
- Non-goals: backend API, authentication, and user account management.

## System Overview

- High-level shape (1-3 bullets):
  - Astro-based static site generation for content pages.
  - Tailwind CSS for styling and reusable UI sections/components.
  - Client-side lead form posts to external API configured by environment variable.
- Primary user flows (happy path):
  - User lands on `/`, navigates sections, and reads product/value content.
  - User submits waitlist form with email; browser posts to `${PUBLIC_API_BASE}/leads`.
  - On success (or duplicate with HTTP 409), user is redirected to `/obrigada`.

## Runtime Entry Points

- HTTP/API: Astro page routes under `src/pages` (e.g. `/`, `/privacidade`, `/termos`, `/obrigada`).
- Workers/cron/jobs: none.
- CLI/scripts:
  - `npm run dev` (local development server)
  - `npm run build` (production build)
  - `npm run preview` (serve built output)
  - `node scripts/optimize-images.mjs` (image optimization utility)

## Code Map

- `src/pages`: route-level pages.
- `src/layouts`: shared layout wrappers.
- `src/components`: reusable content and UI components.
- `src/styles`: global stylesheet.
- `src/assets/images`: source image assets imported by Astro components.
- `public`: static assets served as-is.
- `scripts`: utility scripts (image optimization).

## Boundaries & Invariants

- Boundary summary:
  - Browser/frontend boundary handles user input and API request construction.
  - External lead API is a hard dependency for successful waitlist submission.
- Invariants:
  - INV-001: Lead form requires `email` and consent checkbox before submit.
  - INV-002: Lead submission endpoint is `${PUBLIC_API_BASE}/leads`.
  - INV-003: Form success redirect target is `/obrigada`.
- Input validation boundaries:
  - Client validates required fields at form level.
  - API response status determines success/failure UI path.

## Data

- Data stores:
  - DS-001: no local database; content is file-based in repository.
- Ownership model:
  - Website content/assets owned by this repo.
  - Lead records owned by external API service.
- Consistency model:
  - Static content consistency via build artifacts.
  - Lead write consistency delegated to external API.
- Migration/backfill notes:
  - Not applicable for local data stores.

## External Integrations

- INT-001:
  - Purpose: receive waitlist lead submissions.
  - Auth: not defined in current frontend implementation.
  - Contracts: `POST /leads` with JSON payload `{ name?, email, phone? }`.
  - Retry/timeout: browser default fetch behavior; no custom retry/timeout.
  - Failure modes + user impact: non-2xx (except 409) shows inline error and no redirect.

## Security & Privacy

- AuthN/AuthZ: public website; no authenticated areas.
- Secrets management: runtime configuration via environment variables (`PUBLIC_API_BASE`).
- PII handling:
  - Captures personal data (email, optional name/phone) in browser.
  - Data is transmitted to external API over network.

## Non-Functional Requirements

- Performance: static-first rendering, optimized assets, minimal JS for form handling.
- Availability: site availability depends on static hosting; lead capture depends on external API uptime.
- Cost: low hosting/runtime cost for static site architecture.

## Deploy & Operations

- Environments: local dev (`astro dev`) and production static hosting.
- CI/CD: not defined in repository at time of review.
- Observability: no built-in app telemetry except optional `window.plausible` event call.
- Runbooks:
  - Build failure: run `npm install` then `npm run build` and inspect Astro errors.
  - Lead form issue: verify `PUBLIC_API_BASE` and external API `/leads` contract.

## Risks & Tech Debt

- RISK-001: missing/incorrect `PUBLIC_API_BASE` breaks lead submission flow.
- RISK-002: no automated tests increases regression risk on form behavior.
- RISK-003: no explicit request timeout/retry may degrade UX during API instability.

## ADR Index (Optional)

- None yet.

## Architecture Changelog

- 2026-02-28: created.
