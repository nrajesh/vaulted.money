# Feature Specification: Local API for the Desktop App

**Feature Branch**: `033-local-api`
**Status**: Implemented
**Input**: Users want to manage Vaulted Money without the GUI, script it, or build their own interface on top of it, without any data leaving the machine.

## Goals

- Opt-in REST API served by the Electron app on `127.0.0.1` (default port 47821, base path `/api/v1`).
- Cover ledgers, accounts, vendors, categories and sub-categories, transactions, recurring transactions, budgets, currencies, AI providers, languages, backups and app settings.
- Generate analytics, insights, reports and backups on demand (JSON, CSV or file download).
- Mirror the app's maintenance buttons (detect transfers, cleanup duplicates, categorize missing, reconcile balance, de-duplicate and cleanup unused) and its CSV import and export.
- Publish a generated OpenAPI 3.1 spec at `/api/v1/openapi.json`.

## Non-goals

- Web and mobile apps (they cannot host a local server).
- Cross-Device Continuity and creating backup schedules (they need an OS folder grant).
- Remote access, accounts, or any cloud service.

## Security requirements

- Off by default; bearer token stored in `api-config.json` (mode `0600`), constant-time comparison.
- Loopback Host only; requests with an `Origin` header are refused; 64 MiB body cap.
- AI keys and backup password hashes are never returned.
- Deletions need `confirm_delete`, restores need `confirm_replace`, bulk operations support `dry_run`, AI use is opt-in per request.

## Design

See [ARCHITECTURE.md](../../documentation/ARCHITECTURE.md#local-api-architecture-electron-only), [API.md](../../documentation/API.md) and [API_COOKBOOK.md](../../documentation/API_COOKBOOK.md).

## Testing

- `src/api/api.test.ts` (routes), `electron/apiServer.test.ts` (auth and server), `src/api/httpIntegration.test.ts`.
- `src/api/postmanCoverage.test.ts` and `src/api/postmanRun.test.ts` keep the Postman collection in step with the route table and run it with Newman.
