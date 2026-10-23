# Worthline frontend — AGENTS.md



These instructions apply to `frontend/`. Keep the application simple and consistent with the Worthline backend. The Insula frontend conventions are a reference for code organization and reusable UI; its domain behavior, existing component names and brand-specific restrictions are not requirements for Worthline.



## Project context



- Worthline is a single-user personal finance and net-worth application. Its initial workflows cover income and expenses, dynamic categories, accounts, manual month-end balances, instruments and investment operations.

- Use the latest stable Angular version when initializing the project. Keep Angular and its CLI aligned, and choose compatible Node.js and TypeScript versions from Angular's official compatibility table. Do not introduce preview releases or upgrade dependencies as unrelated work.

- Use TypeScript in strict mode, standalone components, Angular Router, HttpClient, signals and Tailwind CSS 4. Use the current Angular CLI defaults for new-project infrastructure, including zoneless operation and Vitest where applicable.

- Code identifiers, filenames, routes and translation keys are English. User-facing text is Italian through the translation catalog.

- Italian (`it`, formatting locale `it-IT`) is the default and only initial language. All monetary values are EUR.

- Authentication and authorization are planned separately by the user. Do not introduce or propose them during ordinary feature implementation.



## Project structure and dependencies



Organize code by feature, keeping related TypeScript, HTML, CSS and test files together:



```text

src/app/

├── core/

│   ├── http/

│   ├── errors/

│   └── i18n/

├── layout/

├── shared/

│   ├── ui/

│   └── utils/

└── features/

    ├── dashboard/

    ├── transactions/

    ├── categories/

    ├── wealth/

    └── portfolio/

```



- Create directories when a feature needs them; do not generate empty scaffolding for future functionality.

- `core` owns application-wide infrastructure: HTTP configuration, error translation and localization. Do not collect every domain's models, API clients or state there.

- `layout` owns the application shell, navigation and responsive page layout.

- `shared/ui` owns reusable presentation components. These components must not fetch domain data or depend on feature services.

- `shared/utils` contains small, pure helpers with an actual shared use case.

- Each feature owns its pages, domain-specific components, API client, DTOs, search criteria and state. Add local subdivisions only when useful.

- Features may depend on shared UI and core contracts. Keep core and shared independent of features; avoid feature-to-feature implementation dependencies.

- Prefer composition and focused functions over generic base components, generic CRUD frameworks or inheritance hierarchies.



## TypeScript and Angular conventions



- Enable strict TypeScript and strict template checking. Avoid `any`; use `unknown` and narrow it when necessary.

- Prefer `const`, `readonly` properties and immutable data transformations. Infer obvious local types; explicitly type public APIs, HTTP contracts and non-obvious values.

- Use kebab-case filenames and descriptive class names without a `Component` suffix, for example `transaction-list.ts` and `TransactionList`.

- Keep components focused on presentation and interaction. Put API access, reusable validation and substantive data transformations in focused services or pure functions.

- Use standalone components. Do not add NgModules for new application features or redundantly declare `standalone: true` when it is already the framework default.

- Use `input()` and `output()` for component contracts, `inject()` for dependencies and the decorator's `host` object for host bindings and listeners.

- Use `OnPush` where an explicit change-detection configuration is needed; keep components compatible with zoneless change detection.

- Load feature routes lazily. Use the router for navigation and meaningful URLs.

- Keep templates simple. Use native `@if`, `@for` and `@switch`; provide stable tracking keys such as UUIDs for repeated entities.

- Prefer class and style bindings to `ngClass` and `ngStyle`. Move complex template calculations into TypeScript, normally a `computed()`.

- Use `protected` for members needed only by the component template and `private` for implementation details. Keep dependencies, inputs, outputs and state grouped before methods.

- Use external HTML and CSS for substantial components; inline templates are appropriate for small components. Keep file references relative to the component.



## State, HTTP and forms



- Use signals for local UI state and `computed()` for derived values. Avoid storing duplicate state that can be calculated from existing values.

- Update signals with `set()` or `update()` and immutable values. Reserve `effect()` for actual side effects, not for propagating derived state between signals.

- Keep feature state scoped to the page or feature unless it genuinely needs application-wide lifetime. Do not introduce a global state library without a concrete need.

- Use typed HttpClient services per domain. Components delegate HTTP access to these services; shared UI components emit events and receive data.

- Use RxJS when it helps coordinate asynchronous work, including debouncing searches and replacing obsolete requests with `switchMap`. Prefer async pipe or signal interop for consuming results; use `takeUntilDestroyed()` for manual subscriptions.

- Keep API base URL configuration centralized. Use the development proxy or deployment configuration instead of hardcoded backend addresses in components. Browser configuration must not contain secrets.

- Choose one primary form approach when initializing the application and document it. Prefer stable Signal Forms for a new signals-based application when the selected UI controls support them; typed Reactive Forms remain a valid compatibility choice. Do not mix approaches arbitrarily between features.

- Keep form validation reusable and explicit. Frontend validation provides immediate feedback; backend validation remains authoritative.

- Prevent duplicate submissions, show saving state, preserve entered values on failure and display errors near the relevant fields.



## API contracts and financial semantics



- Keep frontend request/response types aligned with the backend DTOs. Distinguish API DTOs from form or view models when their representations differ; centralize conversions.

- Use UUID strings as stable entity identifiers. Categories and subcategories come from the backend CRUD; do not hardcode them as frontend enum values.

- Tables use backend filtering, sorting and pagination. Represent reusable searches as typed criteria, reset the page when filters change and preserve useful search state in URL query parameters.

- Consume the backend's `PageResponse<T>` with `content` and `page` metadata. Request `page` is zero-based; response `page.currentPage` is one-based. Handle this difference in one adapter rather than scattering conversions through pages.

- Use the backend page-size limits and allowlisted entity sort fields. Do not fetch all pages merely to implement a normal paginated table.

- Distinguish loading, saving, empty data, no filter matches and request failure. Use the shared Insula-style `EmptyState` and `ErrorState` (both backed by `ResultState`) for content areas; `Notice` is for inline form/mutation feedback. Empty states have a useful action, errors have retry, and `Card` reserves their geometry. An error must not appear as an empty successful result. Use backend `transactionCount` to distinguish missing monthly transactions from a recorded zero net cash flow.

- Format money consistently as EUR with `it-IT`. Keep monetary parsing and any necessary decimal or integer-cent arithmetic in a shared, explicit boundary; do not scatter floating-point financial calculations through templates and components.

- Preserve civil dates as `yyyy-MM-dd` in API and form models. Avoid converting them through UTC timestamps or `toISOString()` and shifting the intended day.

- Transactions do not require an account or card and do not update balances. Investment operations also remain independent from manual wealth snapshots.

- A missing monthly balance is different from a recorded zero. Do not silently fill missing snapshots with zero or carry an earlier balance forward.

- Each dashboard card has its own backend resource and independent loading, error and retry. Keep its layout present before responses arrive using `Card`/`LoadingState`. Financial aggregates and percentages come from the backend; frontend code only formats values and builds chart geometry. Never fetch all CRUD pages to populate dashboard cards, derive global totals from a table page or invent daily values between monthly snapshots. The current-situation and allocation cards use each account's latest snapshot at or before the selected month end, retaining its real date. This does not fill gaps in historical monthly snapshots. Income, expenses and cash flow use the selected month (current by default) and are calculated on demand. The current-situation report explicitly includes all accounts without pagination, as requested by the user; render it with the shared SummaryList and internal scrolling. Keep ordinary CRUD collections paginated.


## Italian translations and errors



- Use one initial translation catalog, `public/i18n/it.json`. Italian is the startup language and fallback language. Do not add English catalogs, other languages or a language selector until requested.

- Initialize localization centrally. Choose one Angular-compatible translation mechanism when bootstrapping and use it consistently throughout the application.

- Put all authored user-facing text in the Italian catalog: navigation, headings, buttons, labels, placeholders, validation, errors, confirmations, empty states, chart labels and accessibility text.

- Use stable English keys with a coherent hierarchy, for example `transactions.actions.create` or `wealth.balances.empty`. Keep translations separate from TypeScript identifiers and API enum values.

- Translate enum labels for display while preserving their English API values. User-entered names, descriptions, notes and other domain data are not translation keys.

- Translate backend `errorCode` values centrally. For example, `category.type.mismatch` resolves to the catalog key `errors.category.type.mismatch`; a nested JSON structure may represent these paths.

- Provide a generic Italian error translation for unknown codes or unavailable responses. Do not expose raw exceptions, SQL, unrecognized keys or backend English fallback messages as ordinary user-facing errors.

- Translate known field errors near their form controls. Do not assume the backend's free-text validation messages are stable translation keys; use local validation keys or a safe generic Italian field message where no machine-readable detail is available.

- Preserve the backend request ID when useful for support. Avoid duplicate notifications from both a global interceptor and the feature handling the same error.

- Use localized date, currency and number formatting centrally. Render translations as text; avoid arbitrary HTML translations and sanitizer bypasses.



## Visual language and CSS ownership



- Follow the supplied financial-dashboard reference: very light neutral background, white surfaces, thin borders, restrained shadows, rounded corners, generous spacing and clear numerical hierarchy. Keep controls, focus rings, loading indicators and surfaces neutral; use the separate chart and semantic chip tokens for color.

- Use `PageHeader` for page headings, with plain section names from the Italian catalog. Do not use slogans, promotional eyebrows or introductory marketing text as page titles. Keep pages, cards and dialogs concise: omit redundant subtitles and explanatory introductions. Preserve field labels, dates, missing-data indicators, prerequisite messages, validation and destructive-action confirmations.

- Prioritize readable financial information, consistent alignment and restrained color. Positive and negative indicators need labels or symbols as well as color.

- Define shared design tokens as CSS custom properties for semantic colors, typography, spacing, border radii, shadows and interaction states. Components consume tokens rather than introducing arbitrary values.

- Use Tailwind CSS 4 for layout, spacing and responsive utilities, with its setup in the global CSS entry point. Use component-local CSS for component details. Add Sass only for a concrete need and keep Tailwind's own CSS processing separate.

- Keep global styles focused on tokens, typography, resets and genuinely shared primitives. Avoid a growing global stylesheet of unrelated page-specific selectors.

- Reuse shared components for buttons, form controls, dialogs, confirmations, tables, pagination, notices, loading indicators and empty states. Expose small, explicit variants instead of copying markup and styling between pages.

- All tables use `DataTable`; paginated list pages use the `list-page` host layout so only rows scroll. Keep title, toolbar, sticky column headers and pagination outside the moving rows. Use `Chip` for status/type labels and `Tabs` for grouped route navigation. Keep loading overlays, errors and pagination in the table component; features own semantic columns and row content. Use `retainTableData()` after query switching to preserve prior rows during refresh, disable their actions while loading, and clear stale data on failure.

- Use the Insula-derived controls in `shared/ui/controls` throughout the application: `UiInput`, `UiSelect` (including search/multiple mode), `UiDatepicker` (including month mode) and `UiDateRangePicker`. Extend these shared controls for new requirements; do not introduce feature-specific alternatives. Keep their styling mapped to Worthline tokens and their labels in the Italian catalog.

- Keep utility classes readable. Extract reusable components or styles when a pattern repeats meaningfully; avoid arbitrary repetition thresholds and excessive `@apply` chains.

- Use one icon family and consistent sizes. Use optimized image handling for suitable image assets; do not apply image-specific requirements indiscriminately to icons or inline SVG.

- Adapt navigation, cards, forms and tables to smaller screens. Keep amounts and actions readable, and use deliberate overflow or alternate layouts for dense tables.

- Keep the application shell at viewport height (`100dvh`) with the navigation header outside the contained main area. Do not add a footer or a personal-finance status label. Dashboard and list pages fit the available height; scroll only card contents and table rows. Dashboard cards use `Card.fill`, responsive chart geometry and compact table/pagination density. On narrow or short screens, use the shared `PanelTabs` to switch dashboard panels while retaining their independent requests and state. Historical chart details open in `DialogFrame` instead of expanding the page. Avoid document/main scrolling.

- Plan token names so future themes are possible, but do not add a dark-mode implementation or theme selector without a requested feature.



## Accessibility and verification



- Use semantic HTML, visible form labels, meaningful button names, keyboard navigation, visible focus and WCAG AA contrast.

- Dialogs must manage focus, support appropriate keyboard dismissal and restore focus when closed. Prefer established accessible primitives for complex interactions rather than recreating keyboard behavior.

- Provide accessible descriptions or tabular alternatives for meaningful charts. Respect reduced-motion preferences. Use `TimeSeriesChart` for time series and `ChartDialog` (with `ChartDataTable`) for all chart detail popups. Keep gradient fills, anchored tooltip positioning and spacious responsive dialog sizing in shared components. Use `MonthSelector` when month navigation needs the current-month shortcut.

- Keep entrance motion centralized in `shared/ui/motion.css` and `UiMotion`, owned by shared components (`DataTable`, `DialogFrame`, select/calendar panels). Reuse their duration/easing tokens and hooks; do not add feature-specific keyframes or artificial loading delays. Table reveals restart when results render, and cancellation must cover refresh, destruction and reduced motion.

- Run automated accessibility checks on relevant screens and manually check keyboard operation. Automated checks alone do not establish accessibility compliance.

- Configure a consistent formatter and Angular/TypeScript linting. Keep formatting and naming decisions automated where possible.

- Test meaningful behavior: form rules, HTTP parameter serialization, pagination conversion, error-code translation, state transitions and complete save workflows. Avoid tests that only reproduce implementation details.

- Use the Angular CLI's supported unit-test setup, normally Vitest for a new project. Add browser workflow tests when real interaction or rendering needs verification.

- Run checks appropriate to the change and report material gaps. For visual changes, inspect the actual page at desktop and narrow widths, including loading, empty and error states where affected.

- Never commit real financial records as fixtures or log full financial request/response bodies. Use synthetic data for tests and demos.


- Keep scrollbar styling global in `shared/ui/scrollbar.css`, following Insula: thin, transparent track, neutral rounded thumb and hover state. Never hide scrolling controls or add per-page overrides. Use the same DataTable header styling for lists, cards and popups; vary density for the context. SummaryList composes DataTable, with visually hidden accessible headings. Avoid permanent scrollbar gutters. Use TableRow for row activation, preserving independent nested actions, and DialogFrame size="form" for editor/summary dialogs. Chart tables contain only month and values.
