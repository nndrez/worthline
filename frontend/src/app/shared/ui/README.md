# Shared presentation components

`DataTable` follows Insula's contained-scroll layout with a simpler compositional
API. Feature pages project a semantic native table, keeping columns, sorting and
row actions within their domain. The shared component owns scrolling, sticky
headers, loading, errors, skeletons and pagination. It never fetches data.

- Give list pages the `list-page` host class and project filters with the
  `tableToolbar` attribute. Bind `loading`, `error`, `page`, `label` and `columns`
  (the skeleton column count). Handle `retry` and zero-based `pageChange`.
- Apply `retainTableData()` outside the query `switchMap` so previous data stays
  in place during loading, while errors clear it. Refreshing content is inert and
  pagination is disabled until the response settles.
- Use `[contained]="false"` for embedded dashboard tables. They retain the same
  table styling and sticky header, with a bounded internal scroll area.
- `Chip` projects a label and exposes only the `neutral`, `positive`, `negative`
  tones. Translate enum labels in the feature; the component has no domain logic.
- `Tabs` receives readonly `{ path, label }` items, where labels are translation
  keys. It uses native router links with current-page semantics; query filters
  do not alter the active section.

All motion respects `prefers-reduced-motion`. Table CSS is scoped under
`app-data-table` to style projected semantic cells; chip and tab styles are
component-local. Do not recreate these patterns in feature templates.

Motion tokens and entrance keyframes live in `motion.css`. `DataTable` uses
`UiMotion` after results render: rows fade and move in over 480 ms, staggered by
28 ms with a maximum delay of 168 ms. This restarts after every completed request,
including filters and pagination. Empty/error states use the same entrance.
Animations are cancelled on refresh, destruction or a reduced-motion change.
`DialogFrame` animates the native dialog and backdrop on opening; every shared
select and calendar panel inherits the `ui-popover-panel` hook from
`UI_PANEL_CLASSES`. Route entry uses the same tokens. Keep keyboard focus and
controls available during entrance; never delay HTTP results to simulate motion.
Extend these shared components for new surfaces instead of adding feature-level
keyframes, timers or animation dependencies.
