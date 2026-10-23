# Shared presentation components

`DataTable` follows Insula's contained-scroll layout with a simpler compositional
API. Feature pages project a semantic native table, keeping columns, sorting and
row actions within their domain. The shared component owns scrolling, sticky
headers, neutral loading overlays, errors and pagination. It never fetches data.

- Give list pages the `list-page` host class and project filters with the
  `tableToolbar` attribute. Bind `loading`, `error`, `page` and `label`.
  Handle `retry` and zero-based `pageChange`.
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

`UiSpinner` and `LoadingState` reproduce Insula's neutral circular loading state;
every table uses this component for initial loading and refresh. Never build
feature-specific progress bars or spinners. `Card` reserves its header and body
geometry before data arrives and owns loading/error presentation. Dashboard cards
load independently through `cardResource`; retry and chart period changes affect only
the owning card; changing the dashboard month reloads all cards independently. All dashboard financial aggregates come from dedicated backend
resources, without fetching full CRUD collections or calculating totals in the
browser. Only chart geometry and localized formatting belong in the frontend.
`ChartViewport` adapts SVG geometry to the available width without shrinking its
text. `ChartTooltip` is shared by charts; offer pointer, touch and keyboard access to
amounts and keep a tabular alternative for historical data. Controls, focus,
loading and surfaces use neutral tokens; chart and semantic chip colors remain
separate.

`ResultState` provides Insula-style centered, neutral content feedback. Use
`EmptyState` for successful requests with no data and `ErrorState` for failed
requests, with an explicit retry. Reserve `Notice` for inline form/mutation
feedback. `Card` renders these states within its reserved body; its compact
variant keeps metric actions reachable. Project empty-state actions through
`cardEmptyActions`, instead of building banners or placeholder rows in features.
A missing balance is not a zero. Metrics expose `transactionCount` from the
backend so a net zero with recorded transactions stays visible as real data.

Use `PageHeader` with a plain translated section title and projected actions.
The shell has no footer/status label. Dashboard cards use `fill` to consume their
grid row instead of fixed heights; the shared `Card` measures its body to choose
compact loading/empty/error feedback. Use `scrollable=false` for compact metrics
and for cards containing a DataTable, so only the table owns row scrolling. `DataTable` density `compact` also compacts
its shared paginator. On narrow or short screens, `PanelTabs` provides roving
keyboard focus and controls retained panels; switching panels must not refetch
data. Chart viewports measure both width and height. Put historical tables in
`DialogFrame`, so expanding detail never increases dashboard height.

Use `ChartDialog` for every chart detail popup. It composes the chart-sized
`DialogFrame`, `Card`, `TimeSeriesChart` and `ChartDataTable`; feature components
supply typed points/series and handle month selection and retry. Do not duplicate
SVGs, dialog layouts or financial tables inside individual dashboard cards.
`TimeSeriesChart` draws gradient-filled areas without bridging missing months,
uses the observed value range and keeps gradient IDs unique across chart instances.
`ChartTooltip` accepts a viewport anchor, flips/clamps around it and uses a native
manual popover so it remains visible above dialogs and contained chart viewports.
`MonthSelector` reuses the month datepicker and a localized current-month action.

Tables expose `headerStyle`; use the default `subtle` for list and chart tables.
Both variants retain semantic, sticky column headings and use normal-case labels.
Header styling is shared across contexts; density controls spacing. Scrollbar tokens and
styling live in `scrollbar.css`, imported once globally, following Insula's thin
neutral thumb and transparent track. Keep routine explanatory copy out of pages
and dialogs; preserve actionable errors, prerequisites, dates and confirmations.

`SummaryList` composes `DataTable` with compact rows and accessible visually hidden
headings. Do not implement separate table CSS in feature cards or popups.
`TableRow` provides click/Enter/Space activation without intercepting nested actions.
Use `DialogFrame size="form"` for creation, editing and instrument summaries.
Chart detail tables contain month and financial values only. `MonthComparison`
formats backend comparisons; differences mean current minus selected, and are
omitted when data is missing/incomplete. Current flow totals are labeled in progress.

Embedded projected tables pass `contentKey` when their data changes, so shared
row entrance motion and scroll reset behave like paginated lists.

Chart dialogs place both the graph and values inside shared `Card` components.
`ChartDialog` coordinates temporary `monthHighlighted` events and `highlightedMonth`
inputs on `TimeSeriesChart` and `ChartDataTable`: pointer and keyboard highlighting
never trigger HTTP requests. Row activation and chart activation select the same
month and emit `monthSelected`; a parent may use that event for navigation.
Highlighting a graph point reveals its corresponding table row inside the table's
own viewport, without scrolling the dialog or document. Keep this interaction in
shared components for all financial series, including missing and zero values.

Historical comparisons use the shared `MonthComparison` trigger and dialog. Keep
comparison amounts and differences out of dashboard card bodies: a quiet action
opens two period cards and the backend-supplied difference. Preserve missing amounts
and the current-month-in-progress notice; do not imply that recorded flows are
complete monthly totals. No extra request or financial arithmetic is needed to open it.
