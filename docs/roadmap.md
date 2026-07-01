# Feature Roadmap

## Feature Roadmap

### Completed ✅

#### Core

- [x] Full CRUD — Index, Create, Edit, Show, Delete
- [x] Filament-style resource folder structure
- [x] Auto-discovery (recursive) — `app/Larafusion/Resources/**/*Resource.php`
- [x] Soft deletes — Trashed tab, restore, force-delete, bulk restore
- [x] Inline editing — click-to-edit cells, saved via PATCH
- [x] Export CSV — streamed, chunked, no memory issues
- [x] Import CSV — 3-step wizard (upload → preview → commit)
- [x] Modal forms — `useModalForms()` on any resource

#### Forms

- [x] All core fields: Text, Email, Password, Textarea, Select, Number, Toggle, DatePicker, Hidden
- [x] Extended fields: Radio, CheckboxList, Slider/Range, RichText, Markdown, KeyValue, Builder
- [x] Relation fields: BelongsTo, BelongsToMany, HasMany, MorphTo
- [x] Media fields: FileUpload, ImageUpload
- [x] Other fields: Tags, Color, Repeater
- [x] Form layout: Section, Tabs (with error dots), Grid — fully nestable
- [x] **Enum support** — `Select`, `Radio`, `CheckboxList` accept `EnumClass::class`; options, validation, and descriptions auto-generated from `HasLabel` / `HasDescription`
- [x] **Select field v2** — `->native(false)` custom JS dropdown; grouped options; `->multiple()` chips; `->clearable()`; `->boolean()`; `->disabledOptions()`/`->disableOptionWhen()`; `->minItems()`/`->maxItems()`; affixes with icon colors; `->searchingMessage()`/`->searchDebounce()`/`->optionsLimit()`/`->wrapOptionLabels()`/`->selectablePlaceholder()`
- [x] **Checkbox** — new single-checkbox field; `->inline()`, `->accepted()`, `->declined()`
- [x] **Toggle v2** — `->onIcon()`/`->offIcon()` (icon in knob), `->onColor()`/`->offColor()` (semantic track colors), `->inline()` (layout), `->accepted()`/`->declined()` (validation)
- [x] **Radio v2** — `->boolean()` (Yes/No shorthand), `->descriptions(array)` (per-option desc text), `->disabledOptions()`/`->disableOptionWhen()` (conditional disable)
- [x] **CheckboxList v2** — `->searchable()` with `->searchPrompt()`/`->noSearchResultsMessage()`, `->bulkToggleable()` (select/deselect all), `->descriptions(array)`, `->disabledOptions()`/`->disableOptionWhen()`
- [x] **DatePicker v2** — `->time()` (datetime-local input), `->seconds()`, `->displayFormat()`, `->timezone()`, `->weekStartsOnMonday/Sunday()`, `->disabledDates(array)`, `->closeOnDateSelection()`, `->readOnly()`; full affix support
- [x] **Text field v2** — `->url()`, `->tel()`, `->telRegex()`, `->integer()`, `->numeric()`, `->length()`, `->copyable()`, `->readOnly()`, `->trim()`, `->mask()`, `->autocomplete()`, `->datalist()`, `->inputMode()`, full affix support
- [x] **Email & Password affixes** — all affix methods available on Email and Password; Password adds `->revealable()` alias
- [x] **Textarea v2** — `->cols()`, `->autosize()`, `->readOnly()`, `->trim()`, `->minLength()`, `->length()`; live char/min-length counter
- [x] **FileUpload v2** — `->visibility()`, `->minFiles()`, `->minSize()`, `->openable()`, `->reorderable()`
- [x] **Tags v2** — `->separator()`, `->splitKeys()`, `->tagPrefix()`, `->tagSuffix()`, `->color()`, `->trim()`, `->reorderable()`; paste-split support; chip color theming
- [x] **KeyValue v2** — `->addable()`, `->deletable()`, `->editableKeys()`, `->editableValues()`
- [x] **Repeater v2** — `->cloneable()`, `->collapsible()`, `->collapsed()`, `->reorderable()`, `->addable()`, `->deletable()`, `->defaultItems()`, `->columns()`, `->minItems()`/`->maxItems()` Filament aliases
- [x] **Builder v2** — `->cloneable()`, `->collapsible()`, `->collapsed()`, `->reorderable()`, `->addable()`, `->deletable()`, `->minItems()`
- [x] **RichText v2** — `->toolbarButtons()` alias, `->disableToolbarButtons()`, `->maxHeight()`
- [x] **Markdown v2** — `->showPreview(bool)`, `->toolbarButtons()`, `->fileAttachmentsDisk/Directory()`
- [x] **Color v2** — `->hex()`, `->rgb()`, `->rgba()` (with alpha slider), `->hsl()` format modes; format badge in picker; preset swatch selection normalised across formats
- [x] **Slider v2** — `->decimalPlaces()`, `->vertical()`, `->fillTrack()`, `->tooltips()`, `->minDifference()`, `->maxDifference()`; `->showValue()` made positive (kept `->hideValue()` alias)
- [x] **ToggleButtons** (new field) — button-group selector; `->options()`, `->colors()`, `->icons()`, `->tooltips()`, `->multiple()`, `->inline()`, `->grouped()`, `->hiddenButtonLabels()`, `->columns()`, `->boolean()`, `->disabledOptions()`
- [x] **CodeEditor** (new field) — monospace editor with line numbers, Tab-key indent, language badge (14 languages), `->language()`, `->wrap()`, `->lineNumbers()`, `->minHeight()`, `->maxHeight()`, `->theme()`
- [x] **Validation v2** — 40+ fluent rule methods on every field: `->alpha()`, `->alphaDash()`, `->alphaNum()`, `->ascii()`, `->hexColor()`, `->macAddress()`, `->uuid()`, `->ulid()`, `->ip/4/6()`, `->json()`, `->filled()`, `->nullable()`, `->same()`, `->different()`, `->confirmed()`, `->gt/gte/lt/lte()`, `->after/before/OrEqual()`, `->startsWith()`, `->endsWith()`, `->doesntStartWith/EndWith()`, `->multipleOf()`, `->in/notIn()`, `->enum()`, `->prohibited/If/Unless/Prohibits()`, `->requiredIf/Unless/With/Without()`, `->validationAttribute()`, `->validationMessages()`; client-side validator extended to handle 30+ rules with custom-message interpolation; `FieldValidation` type gains `messages` and `attribute`
- [x] **Custom Fields** — `CustomField` PHP base class; `registerField(type, Component)` and `getRegisteredField(type)` JS API; `FieldRenderer` falls back to registry for unknown types with dev-mode warning; `componentData()` PHP method passes arbitrary config to React component

#### Tables

- [x] Filament-style `table()` builder on Resource
- [x] Column classes: TextColumn, BadgeColumn, BooleanColumn, DateColumn, ImageColumn, IconColumn
- [x] Badge color maps — `->colors(['success' => 'active', 'danger' => 'archived'])`
- [x] **Enum support** — `BadgeColumn->enum(EnumClass::class)` and `TextColumn->enum(EnumClass::class)` auto-populate labels, colors, icons, and a select filter from `HasLabel` / `HasColor` / `HasIcon`; `SelectFilter->options(EnumClass::class)` generates filter options from enum labels
- [x] DateColumn: `->since()` (relative), `->dateTime()`, `->format()`
- [x] TextColumn: `->copyable()`, `->limit()`, `->wrap()`, `->description()`, `->prefix()`, `->suffix()`, `->weight()`, `->money()`, `->asBadge()`
- [x] ImageColumn: `->circular()`, `->size()`, `->stacked()`
- [x] Table settings: `->striped()`, `->heading()`, `->description()`, `->emptyState()`
- [x] Standalone filters: Filter, SelectFilter, DateRangeFilter, TrashedFilter
- [x] **TernaryFilter** — 3-state (All / Yes / No) with `trueLabel`, `falseLabel`, `placeholder`, `nullable()` (null vs non-null), `queries(true, false, blank)` per-state closures
- [x] Filter enhancements: `->attribute('column')` DB column override, `->default($value)` pre-activated state, `->indicator('label')` active-filter label
- [x] SelectFilter enhancements: `->searchable()` inline option search, `->attribute()`, `->default()`
- [x] DateRangeFilter: `->attribute()`, `->default()`
- [x] All standalone filters now rendered in the filter panel (previously only column-level filters showed)
- [x] **Filter layout** — 10 layout options matching Filament 5.x: `dropdown` (Filament-style popover), `drawer` (default), `modal`, `above`, `above_collapsible`, `below`, `before_content`, `before_content_collapsible`, `after_content`, `after_content_collapsible`
- [x] Filter trigger button uses funnel icon (matching `heroicons:funnel` / Filament convention)
- [x] **Dropdown layout** — icon-only trigger with active-filter count badge; popover with "Filters" heading, "Reset" link, filter form, and "Apply filters" button; closes on outside click
- [x] Side filter sidebar (`before_content` / `after_content`) — fixed-width panel alongside the table with Apply / Reset buttons and optional collapse toggle
- [x] `->filtersFormColumns()`, `->filtersFormWidth()`, `->filtersFormMaxHeight()`, `->hiddenFilterIndicators()` all wired to the React frontend
- [x] Filter query closures now correctly applied via `applyToQuery()` — `->attribute()` and `->query()` are respected server-side
- [x] Auto-merge of sortable from table builder into server-side sort allowlist
- [x] **Column-driven search** — `->searchable()` on columns; resource auto-collects them (no `$searchable` array); `->searchable()` now means global search, not a per-column filter
- [x] **Column-driven inline editing** — `->inlineEditable()` on columns; `getInlineEditable()` auto-detects them
- [x] **Relationship columns** — dot notation (e.g. `category.name`): eager-loaded, searchable via `whereHas`, `belongsTo` sortable via correlated subquery, dotted-path resolved on the frontend
- [x] **Column-scoped `SELECT`** — index query fetches only declared local columns (+ key, inline, soft-delete, title, `belongsTo` FKs); undisplayed columns like `password` never leave the DB
- [x] `->deferLoading()` skeleton keeps the search toolbar; only rows below the header are skeletonized
- [x] Legacy `Column::*` factories fully backward-compatible
- [x] Built-in record actions: `->recordActions([EditAction, DeleteAction, ViewAction])` — opt-in, only defined actions shown
- [x] **`Action::make()`** — Filament-style custom action inside `recordActions()`: server callback, URL navigation, confirmation modal (`requiresConfirmation`, `modalHeading`, `modalDescription`, `modalSubmitActionLabel`), display modes, visibility, success/failure notifications, tooltip, badge
- [x] Toolbar bulk actions: `->toolbarActions([BulkActionGroup::make([DeleteBulkAction, ForceDeleteBulkAction, RestoreBulkAction])])`
- [x] Default sort: `->defaultSort('field', 'asc|desc')` — server + client default direction
- [x] Checkbox column hidden automatically when `toolbarActions([])` is explicitly empty
- [x] ID column hidden automatically when explicit columns are defined via `table()` builder
- [x] Per-page options: 5, 10, 25, 50 — default 10
- [x] Footer layout: result count (left) · per-page selector (centre) · pagination (right)
- [x] Page title separator: `Page - Brand` (single hyphen)

#### Actions

- [x] `Action::make()` — unified Filament-style action inside `recordActions()` (preferred)
- [x] ButtonAction and LinkAction per-record row buttons via `actions()` on Resource (legacy, still supported)
- [x] Display modes: `iconOnly()`, `textOnly()`, `button()`
- [x] Modal confirm dialog (not `window.confirm`)
- [x] 30+ named icon map (Lucide icons)
- [x] Conditional visibility: `visibleWhen(fn($r)=>...)`
- [x] Bulk delete with modal confirmation
- [x] `unsavedChangesAlerts` scoped to form elements — table row checkboxes no longer falsely trigger the reload warning

#### UI & Layout

- [x] Dark mode — Tailwind `dark:` variant; user preference in `localStorage`; FOUC-free reload
- [x] 6 built-in themes (violet, slate, rose, emerald, amber, sky)
- [x] White sidebar, `bg-zinc-50` main area, lighter border
- [x] Sidebar: collapsible to icon-only, state persisted in `localStorage`
- [x] Top navigation mode — horizontal nav bar
- [x] User avatar dropdown — name, email, Light/Dark/System toggle, sign out
- [x] Global search — ⌘K palette, keyboard navigation, grouped results
- [x] Navigation groups — collapsible sidebar sections
- [x] Navigation badges — `getNavigationBadge()` count
- [x] Custom pages — `Page` base class, `LarafusionManager::registerPages([])`
- [x] Dynamic page titles — `Page — Brand Name` in browser tab
- [x] Breadcrumbs
- [x] Flash toasts — success/error, auto-dismiss, `useNotify()` hook

#### Panel Config

- [x] Branding: name, logo, dark logo, logo height, favicon
- [x] Font: Google Fonts auto-loaded
- [x] Theme: `->theme()`, `->darkMode()`, `->defaultThemeMode('system')`
- [x] Layout: sidebar width, max content width, top navigation, topbar
- [x] Auth: login, registration, forgot-password (all individually opt-in)
- [x] Prefetch: `->prefetch()`, `->prefetchStrategy()`, `->prefetchCacheFor()`, `->prefetchFlushOnNavigate()`
- [x] Behaviour: unsaved-change alerts, DB transactions, strict auth, pagination size
- [x] Boot hook: `->bootUsing(fn($panel) => ...)`

#### Infrastructure

- [x] No page publishing — React components resolved directly from vendor via Vite plugin
- [x] `@source '../../vendor/larafusion/*/resources/js/**/*.{ts,tsx}'` — Tailwind scans vendor classes
- [x] Inertia v3: `once()`, `defer()`, `only:[]`, optimistic updates, `<Link prefetch>`
- [x] Plugins — navigation items, layout slots, lifecycle hooks
- [x] Widgets — StatsOverview, Chart (pure SVG), Table
- [x] **Widget data animations** — `->widgetAnimations()` on Panel (off by default): numbers count up, sparklines/lines draw in, bars grow, pie/doughnut sweep, radar/polar grow from centre; plays once, respects `prefers-reduced-motion`
- [x] Authorization — `canViewAny`, `canCreate`, `canEdit`, `canDelete`, `canView`

---

### Planned

#### Developer Experience

- [ ] Test suite — PHPUnit + Vitest coverage
- [x] `larafusion:user` command — create admin users from CLI
- [x] IDE helper stubs — PHPDoc for fluent APIs (`php artisan larafusion:ide-helpers`)
- [x] Changelog and upgrade guides between versions

#### Security

- [x] Two-factor authentication — TOTP (`->twoFactor()` / `->twoFactor(enforce: true)` on Panel; RFC 6238 built-in; setup/challenge/manage/recovery pages)
- [x] Login rate limiting — `->loginRateLimiting(maxAttempts, decayMinutes)` on Panel (default 5/min)

#### Advanced Features

- [x] Multi-tenancy — per-tenant resource scoping (`->tenancy(fn($req) => ...)` on Panel; `scopeForTenant($query, $tenant)` on Resource)
- [x] Realtime — WebSocket table updates (`->realtime()` on Panel; `RecordEvent` broadcast on every create/update/delete; compatible with Reverb/Pusher)
- [x] REST API generator — JSON API from resource definition (`->api()` on Panel; `larafusion:api` command; `ResourceApiController` with pagination, search, sort, filters)

### Future

- [ ] Role-based access — per-resource, per-action permissions *(planned as a standalone `larafusion-permissions` package)*
- [ ] Activity log — audit trail for all CRUD events
- [ ] IP allowlist
- [ ] Revision history — view and restore previous record versions
- [ ] Scheduled reports — email/Slack on cron
