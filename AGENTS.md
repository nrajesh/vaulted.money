# Agent instructions

This file points to where the project rules live. Read them before reviewing or changing code.

- [documentation/CLAUDE.md](documentation/CLAUDE.md): rules for AI agents (architecture, coding, accessibility, security, data integrity, Local API, translations, releases)
- [documentation/CODE_REVIEW.md](documentation/CODE_REVIEW.md): code review checklist
- [documentation/UI_UX_STANDARDS.md](documentation/UI_UX_STANDARDS.md): UI, contrast and layout standards
- [documentation/IOS_RULES.md](documentation/IOS_RULES.md) and [documentation/ANDROID_RULES.md](documentation/ANDROID_RULES.md): mobile rules
- [documentation/I18N.md](documentation/I18N.md): translations
- [documentation/API.md](documentation/API.md): the Local API contract

## Review guidelines

Review against the rules in [documentation/CLAUDE.md](documentation/CLAUDE.md) and the checklist in [documentation/CODE_REVIEW.md](documentation/CODE_REVIEW.md).

Changes move feature branch → `pre-prod` → `main`, and the same code is reviewed at each step. Keep reviews focused so one change does not produce findings three times:

- **Feature branch → `pre-prod`:** this is the main review. Report bugs that change how the app behaves, security problems, data loss and accessibility failures (P1 and P2). Report documentation wording only when it is factually wrong about privacy, security or what the app does.
- **`pre-prod` → `main` (promotion):** the code was already reviewed on its way into `pre-prod`. Report only P1 problems: data loss, security, a crash, or a broken build or release. Do not repeat findings already raised on the earlier PR.
- **PRs into any other branch:** report only P1 problems; the change is reviewed again when it goes into `pre-prod`.
- **Skip** style, naming, refactoring ideas and wording preferences. Prettier, ESLint and the tests already cover formatting and conventions.
- **Do not re-raise** a finding that already has a reply on an earlier PR saying why it doesn't apply or where it is tracked (`documentation/BACKLOG.md`).
