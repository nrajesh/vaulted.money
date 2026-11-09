# Vaulted Money UI/UX Standards

These standards keep screens predictable across financial modules. When a page needs an exception, prefer creating a named variant instead of one-off spacing, borders, or action layouts.

For the core brand philosophy, logo geometry, and color strategy, refer to the [**Brand Identity Manual (DESIGN.md)**](./DESIGN.md).

## Page Structure

Every standard module should follow this order:

1. Page title block with `app-page-header`, `app-gradient-title`, and `app-page-title`.
2. Page action panel with `app-action-panel` when actions are available.
3. Search and filters in a dedicated filter area, directly above the data surface.
4. Content surface or table/list shell with `app-table-shell`.
5. Pagination, totals, or secondary table metadata at the bottom of the same surface.

The title/tagline must not share a row with dense action groups on mobile. Keep the title aligned to the same left edge as the filter and table shell.

## AI & Agents Pages

AI Providers and Connect agent are one section under the sidebar entry "AI & agents". They share `AiHubLayout`: the tab switcher, then the master **AI features** switch, then the page. That frame sits at the same place on both pages, so switching tabs never moves it. With AI off only the switch and a "Turn on AI" button show. Where a tab cannot work (Connect agent on the web) show it greyed with a one-line reason instead of hiding it.

## Action Buttons

Use this order for module actions:

1. Maintenance actions, such as reconcile, detect transfers, clean up, de-duplicate, or auto-categorize.
2. Import.
3. Export.
4. Primary create action, such as Add Transaction or Add Account.
5. Refresh as an icon-only utility at the end when present.

Desktop actions may use icon plus label. Mobile secondary actions should be icon-first or icon-only with `title`, `aria-label`, and screen-reader text. The primary create action should keep its label because it is the main task entry point.

Import/export should stay local to the module when the data type is module-specific. Global backup, restore, and full-data import/export belong under Data or Settings.

## Search And Filters

Search belongs above the table/list surface, not inside the table header, card body, or page action panel.

Use one search/filter area per screen:

- Transactions, Dashboard, Analytics, Reports, and Scheduled: the shared `TransactionSearchBox` (the search box, its "Understood as" suggestions, and the chips for what is applied). Scheduled passes its own filter state and a placeholder; nothing else differs.
- Management modules: `app-filter-panel` with the module search input. The Accounts list reads its query with the same parser (`filterAccounts` in `src/utils/searchFilters.ts`).

The applied-filters row sits **directly above** the search box and is always there: it reads "No filters applied" when empty, so nothing shifts when the first filter is added (only a long list wrapping onto more rows moves the page). It goes above the box, not below, so a pick shows where the eyes already are and the suggestion list opening under the box never covers it. Every applied filter (date, accounts, categories, vendors, amount, income/expense, top-N, text) has a chip that removes it.

The suggestion list never applies anything on its own. Picking a piece applies only that piece and keeps the rest on offer; **Apply all** takes what is left and **Clear** / **Done** end the interaction. Say how filters combine in the interface (every kind must match; several of one kind match either).

## Text Contrast

Every piece of text meets WCAG AA (4.5:1, or 3:1 for large text) in **both** themes.

- Pair every light-mode text colour with a `dark:` colour. A colour that is fine on white (`text-green-500`) can be unreadable on a dark card, and the dark theme's `destructive` red is far too dark to use as text on a dark surface (use `text-red-600 dark:text-red-400`).
- Use `-700` for green, emerald and amber text on light surfaces, and `-600` for red, rose, blue and indigo. `text-slate-400` is not body text in light mode.
- Do not fade rows or text with `opacity-*` to mean "inactive" or "future": it drops text below 4.5:1. Use italics, a tint or a dashed border (as future transactions and ended schedules do).
- Pale brand colours are for fills and icons. For text on a tint use `--brand-accent-text`.
- Chart legends use the foreground colour, not the series colour.

Boundaries need contrast too (WCAG 1.4.11): the outline of an input, select, search box or outline button, and the off state of a switch, reach **3:1** against the page. They use `--input`, which is deliberately separate from the quieter `--border` used for cards and table rules. Measure both text and outlines when checking a theme; in dark mode `--input` was once 1.05:1, so the search box had no visible edge.

## Tables And Lists

Every selectable data surface should include:

- A visible outer shell using `app-table-shell`.
- A persistent selection toolbar using `app-table-toolbar`, even when zero rows are selected.
- Disabled bulk actions at zero selections.
- Icon-first bulk actions on mobile, with labels returning on wider screens.
- Consistent selected-row styling with `app-row-selected`.

Desktop tables can use table rows. Mobile tables should render cards, but selection behavior must remain visually equivalent: the selected state should outline all edges of the row/card. Avoid dashed borders for normal data rows because they read like inconsistent selection or incomplete data.

## Section Cards

Section cards should use a visible header divider through `app-section-header`. Section titles should use `app-section-title`, which is intentionally smaller than `app-page-title`.

Use card titles for section names, not page-scale headings. Reserve gradient titles for page headers and major report headers only.

## Borders And Surfaces

Use these shared classes before adding new surface styles:

- `app-action-panel` for page actions.
- `app-filter-panel` for search and filters.
- `app-table-shell` for bordered data surfaces.
- `app-mobile-row` for mobile row cards.
- `app-row-selected` for selected row/card state.
- `app-section-header` and `app-section-title` for section cards.

Avoid local combinations of `rounded-xl border bg-white/50 dark:bg-black/20` when one of the shared classes fits. This keeps light and dark mode borders from drifting independently.

## Implementation Checklist

Before shipping a module screen, check:

- The title, action panel, search/filter area, and table shell are vertically ordered.
- Import appears before export, and both sit after maintenance actions.
- Search is above the data shell.
- Text passes 4.5:1 in light and dark mode (see Text Contrast), including empty and "inactive" states.
- Selectable tables show a zero-selection toolbar.
- Mobile bulk actions do not create horizontal scrolling.
- Selected mobile rows/cards have a full perimeter highlight.
- Section headings are smaller than page headings.
- Section headers use the same border treatment.

## Public Landing Page

The root homepage (`/`) is the only page that does not follow the standard module structure. It is designed for conversion and trust:

1. **Hero Section**: Must clearly state the "Privacy-first, Data local, Open sourced" mission.
2. **Social Proof/Trust**: Use badges (MIT, CircleCI) and feature previews to build credibility.
3. **Action Orientation**: Primary CTA should always lead to `/ledgers`. Secondary CTA for local installation.
4. **Theme Consistency**: Must support both light and dark modes, using the same semantic colors as the app but with more expressive typography and spacing.
5. **Guidance**: Explicitly mention the importance of backups and CSV imports to set clear expectations for local-first users.
