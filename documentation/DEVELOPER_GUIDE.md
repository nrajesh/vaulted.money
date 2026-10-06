# Developer Guide

This page keeps contributor and codebase details out of the README.

## Project Shape

Vaulted Money is a React, TypeScript, Vite, Tailwind, Electron, and Capacitor app. The web app is the shared renderer. Electron packages it for desktop, and Capacitor packages it for iOS and Android.

For a detailed system view, read [Architecture](ARCHITECTURE.md).

## Public Homepage

The root route (`/`) is a public landing page that runs without an active ledger. It covers the privacy-first, local-first, and open-source positioning.

The authenticated app lives under `/ledgers` and the app routes behind the main layout.

The homepage is implemented in `src/pages/HomePage.tsx` and is kept outside the authenticated `Layout` route so it does not trigger active-ledger redirects.

## Project Structure

```text
vaulted.money/
├── electron/                  # Electron main and preload code (incl. Local API server)
├── src/
│   ├── api/                   # Local API: route table, compute, OpenAPI, bridge
│   ├── components/            # Reusable and feature UI
│   ├── contexts/              # React context providers
│   ├── hooks/                 # Custom hooks
│   ├── pages/                 # Route-level pages
│   ├── providers/             # Data provider implementations
│   ├── types/                 # Shared TypeScript types
│   └── utils/                 # Helpers and domain utilities
├── android/                   # Capacitor Android project
├── ios/                       # Capacitor iOS project
├── documentation/             # Project docs
├── specs/                     # Feature specifications
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Quality Checks

| Check | Command | Purpose |
| --- | --- | --- |
| Lint | `pnpm lint` | ESLint checks. |
| Type safety | `tsc --noEmit` | TypeScript verification. |
| Formatting | `pnpm format:check` | Prettier verification for source files. |
| Tests | `pnpm test:coverage` | Vitest with coverage. |
| Build | `pnpm build` | Production compile check. |

Run the combined local validation with:

```bash
pnpm validate
```

`package.json` includes `pnpm.overrides` for patched transitive dependencies pulled in by tooling. Run `pnpm audit` when checking dependency security.

## Main Documentation

| File | Purpose |
| --- | --- |
| [API.md](API.md) | Local API reference (desktop app). |
| [API_COOKBOOK.md](API_COOKBOOK.md) | Recipes and client examples for the Local API. |
| [postman/README.md](postman/README.md) | Postman collection, setup and test suite. |
| [DESIGN.md](DESIGN.md) | Brand identity, logo geometry, and color strategy. |
| [WHY_VAULTED_MONEY.md](WHY_VAULTED_MONEY.md) | Motivation and privacy philosophy. |
| [SUPPORT.md](SUPPORT.md) | How to get help. |
| [UI_UX_STANDARDS.md](UI_UX_STANDARDS.md) | UI and UX expectations. |

## Local API

The desktop app exposes an opt-in REST API (`src/api/`, `electron/apiServer.ts`). It is a public contract: any change to an API entity must update the route, `src/api/api.test.ts`, [API.md](API.md) and the Postman collection together. `pnpm test` fails if a route has no Postman request or if a Postman assertion fails. The full checklist is in [CLAUDE.md](CLAUDE.md#local-api-changes); the design is in [ARCHITECTURE.md](ARCHITECTURE.md).

## AI Provider Configuration

Vaulted Money supports bring-your-own-key categorization. Users manage providers inside the app under Management > AI Providers and select a default provider in Settings.

Provider types include Gemini, OpenAI, Anthropic, Mistral, Perplexity, and Custom OpenAI-compatible endpoints.

API keys are stored locally and are never included in exports.

## Content Security Policy

Vaulted Money blocks outgoing network requests by default. If you add a new AI API domain, add it to the `aiDomains` list in `vite.config.ts`.

Example:

```typescript
const aiDomains = [
  "https://generativelanguage.googleapis.com",
  "https://api.openai.com",
  "https://api.anthropic.com",
  "https://api.mistral.ai",
  "https://api.perplexity.ai",
  "https://api.your-custom-ai-provider.com",
];
```

Restart the development server or rebuild the app after changing CSP domains.

## Component Guidelines

- Put generic UI primitives in `src/components/ui/`.
- Put feature-specific components in `src/components/<feature>/`.
- Use functional React components with TypeScript interfaces.
- Style with Tailwind utilities and existing local patterns.
- Keep responsive behavior mobile-first.
- Add comments only where they clarify non-obvious logic.

## State And Data

- Global financial data comes through `useTransactions()`.
- Ledger state comes through `useLedger()`.
- UI-only state should usually stay local with `useState`.
- Async data loading uses TanStack Query where appropriate.
- Local persistence is implemented through Dexie and IndexedDB.

## Deployment

The web build is a static SPA in `dist/`. Any static host can serve it.

Cloudflare Pages works well:

1. Connect the Git repository.
2. Set the build command to `pnpm run build`.
3. Set the output directory to `dist`.
4. Use Node 20+ for the build environment.

The included `public/_redirects` file supports client-side routing on Cloudflare Pages.

Manual deploy example:

```bash
pnpm run build
npx wrangler pages deploy dist
```
