# Shared controls

These controls were adapted from `insula/ui/projects/ui` (datepicker, calendar,
date-range picker, select, input and their shared foundations). This is a local,
self-contained source adaptation: building Worthline does not require the Insula
checkout or access to its private package registry.

- `UiInput`: shared directive for text, search, numeric-text inputs and textareas.
- `UiDatepicker`: Italian text entry and keyboard calendar; `monthOnly` reuses it
  for `yyyy-MM` selection, with previous/next month arrows that respect
  `earliest`, `latest` and the disabled state. Day values stay civil ISO dates (`yyyy-MM-dd`).
- `UiDateRangePicker`: one reusable range control with start/end ISO values,
  preview and clear action; supports partial ranges for backend filters.
- `UiSelect`: single, searchable and multiple selection in the same component.
  Single selection uses `value`; multiple selection uses `multiple` and `values`.
  `selectionLimit` optionally caps multiple selections.
- `UiOptions`: presentation-only mapping of named API records to select options.

Single selects and datepickers integrate directly with Signal Forms through
their `value` model, `disabled`/`invalid` inputs and `touch` output. Native labels
target the internal control through `inputId`. Filter controls can bind `value`
and `valueChange` directly to URL state. Do not replace these with page-specific
controls or native date/select alternatives.

`theme.css` maps the original component styling to Worthline design tokens.
All labels come from `controls.*` in the sole Italian translation catalog.
Angular CDK handles overlays, repositioning and listbox keyboard interaction;
the application enables popover overlays so controls work inside native dialogs.
