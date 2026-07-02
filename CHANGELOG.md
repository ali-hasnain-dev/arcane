# Changelog

All notable changes to Larafusion are documented here.
This project follows [Keep a Changelog](https://keepachangelog.com/) conventions.

---

## [Unreleased]

### Added

#### FiltersLayout enum
- **`Larafusion\Tables\Enums\FiltersLayout`** — typed filter-layout API. `->filters()`
  accepts an optional named `layout` argument:
  ```php
  ->filters([
      // ...
  ], layout: FiltersLayout::Modal)
  ```
  Cases: `Drawer` (default) · `Dropdown` · `Modal` · `Above` · `AboveCollapsible` ·
  `Below` · `BeforeContent` · `BeforeContentCollapsible` · `AfterContent` ·
  `AfterContentCollapsible`. `->filtersLayout()` accepts the enum too; the old string
  values remain accepted for backwards compatibility.

### Changed

- **Default filter layout is now `drawer`** (was `dropdown`). Tables that never call
  `->filtersLayout()` now open filters in the slide-in drawer; pass
  `FiltersLayout::Dropdown` to restore the popover.
- **Side filter layouts (`before_content` / `after_content` + collapsible variants):**
  the filter form is always single-column — `->filtersFormColumns()` is ignored for
  these layouts — and the sidebar panel is now sticky below the admin header, so the
  Reset/Apply buttons stay in view while scrolling long tables (previously they sat at
  the very bottom of the table, e.g. below 50 rows).
- **Active-filter chips for trigger layouts (`drawer` / `modal` / `dropdown`):**
  applied-filter indicator chips now render in a full-width row directly below the
  table's column-header row (previously these layouts showed no chips at all).
  Respects `->hiddenFilterIndicators()`.
- **Filter badges/chips reflect applied filters only.** The filter count badge and
  the active-filter chips now derive from the filters actually applied in the URL —
  editing the filter form no longer updates them live; they change only when the user
  clicks Apply (or Reset / removes a chip). Open panels re-sync their draft when the
  applied filters change externally (chip removal, back/forward navigation).

#### Column-driven table configuration (Filament-style)
- **`->searchable()` on columns** — mark any table column searchable and the resource
  collects them automatically; the `$searchable` array is no longer required.
  ```php
  ->columns([
      TextColumn::make('title')->searchable(),
      TextColumn::make('author.name')->searchable(),   // searches the related table
  ])
  ```
  The legacy `protected static array $searchable` still works and is merged in if present.
- **`->inlineEditable()` on columns** — opt a column into inline editing directly on the
  column; `Resource::getInlineEditable()` auto-detects them (still overridable). Method
  names are case-insensitive, so `->inlineeditable()` also works.
- **Relationship columns (dot notation)** — `TextColumn::make('category.name')` now renders.
  The relation is eager-loaded (no N+1), searched via `whereHas`, and sorted (single-level
  `belongsTo`) via a correlated subquery. The frontend resolves the dotted path and the
  header humanizes it ("Category Name").
- **Column-scoped `SELECT`** — the index query only fetches the local columns the table
  declares (plus key, inline-editable, soft-delete, record-title, and `belongsTo` foreign
  keys). Faster queries, and undisplayed columns (e.g. `password`) never leave the DB.
  Deeply nested relations (`a.b.c`) safely fall back to selecting all base columns.

#### Dashboard widget data animations
- **`->widgetAnimations(bool $enabled = true)`** on `Panel` — off by default. When enabled,
  the **data inside** each dashboard widget animates on first load (once, never on polling):
  stat numbers count up (with sparkline draw-in), line/area charts wipe in left→right,
  bars grow up, pie/doughnut slices sweep around (with the centre total counting up), and
  radar/polar plots grow from the centre. Fully disabled under `prefers-reduced-motion`.

### Changed

- **`Column::searchable()` now means global search, not filtering.** Previously it (and the
  per-type overrides on Text/Boolean/Badge/Date columns) aliased to `->filterable(<type>)`.
  Use `->filterable('select'|'boolean'|'date_range')` for a per-column filter; use
  `->searchable()` for the shared search box (matches Filament).
- **Create button has no default icon.** `CreateAction` and the fallback header action no
  longer inject a `plus` icon — add one explicitly with `CreateAction::make()->icon('plus')`.
- **`->deferLoading()` skeleton keeps the search bar.** The loading placeholder now renders
  the real search toolbar and only skeletonizes the rows below the table headers.
- `Resource::getSearchable()` and `getInlineEditable()` are derived from `table()` columns
  (merged with the legacy arrays where present).
- **Delayed table loading indicator.** Pagination / sort / filter / search now dim + disable
  the table (with a centred spinner) only if the response runs past a short threshold
  (`LOADING_INDICATOR_DELAY_MS`, ~120 ms). Fast responses resolve first and never flash a
  loading state, so quick paginations no longer flicker.

### Removed

- Stale "Defaults already applied …" comment block from the generated `*Table` stubs
  (`larafusion:resource`).

#### Simple Pagination
- **`->simplePagination(bool $simple = true)`** on both `Table` builder and `Panel`:
  - Table-level setting always takes precedence over the panel-level default.
  - When enabled, the pagination row shows only **Prev / Next** buttons plus a "X / Y" page indicator instead of numbered page links.
  - Panel default is `false` (numbered pagination). Set it globally via `->simplePagination()` on the panel, then override per-table as needed.

  ```php
  // app/Providers/Larafusion/AdminPanelProvider.php
  ->simplePagination()          // Prev/Next globally

  // Per-table override
  public static function table(Table $table): Table
  {
      return $table
          ->simplePagination(false)   // full numbers for this table only
          ->columns([...]);
  }
  ```

### Fixed

#### Bulk Delete `MethodNotAllowedHttpException`
- **`DeleteBulkAction`** in `BasicTable` was calling `router.post(…/bulk-delete, …)` — wrong HTTP method (`POST`) and wrong URL segment (`/bulk-delete`).
- The registered route is `DELETE /{resource}/bulk`. The frontend now sends `router.delete(…/bulk, { data: ids })`, eliminating the `MethodNotAllowedHttpException` (`POST method is not supported for route admin/{resource}/bulk-delete`).

#### Dark Mode — Breadcrumb Visibility
- Breadcrumb trail text was using `dark:text-zinc-700` which is *darker* than the light-mode equivalent and nearly invisible on dark backgrounds.
- Trail text is now `dark:text-zinc-400`, link hover `dark:hover:text-zinc-200`, current-page label `dark:text-zinc-300`, and chevron separators `dark:text-zinc-500`.

#### Dark Mode — View vs Edit Button Indistinguishable
- The **Edit** action link in table rows used `dark:text-zinc-300` — the same shade as the **View** link — making them visually identical in dark mode.
- Edit now uses `dark:text-[var(--larafusion-primary-ring,#a78bfa)]` (the primary ring/accent colour), making it clearly distinct from the neutral-grey View link.



#### Developer Experience
- **`larafusion:user` command** — create admin users from the CLI:
  ```bash
  php artisan larafusion:user
  php artisan larafusion:user --name="Ali" --email="ali@example.com" --password="secret123"
  # Use a custom model:
  php artisan larafusion:user --model="App\\Models\\Admin"
  ```
- **`larafusion:ide-helpers` command** — generate `_ide_helper_larafusion.php` with full PHPDoc stubs for all fluent APIs (`Panel`, `Resource`, `Field`, `Table`, `Column`, etc.)
- **`CHANGELOG.md`** and `docs/upgrade.md` — version history and upgrade guides

#### Security — Login Rate Limiting
- `->loginRateLimiting(int $maxAttempts = 5, int $decayMinutes = 1)` on `Panel`
- Pass `false` to disable: `->loginRateLimiting(false)`
- Named `larafusion-login` RateLimiter registered automatically — no manual setup required
- Error messages use Laravel's `auth.throttle` translation key


#### Security — Two-Factor Authentication (TOTP)
- `->twoFactor(bool $enabled = true, bool $enforce = false)` on `Panel`
- RFC 6238 TOTP implementation built-in — **no external package required**
- Full flow: login → 2FA challenge → dashboard
- Enforce mode redirects users to setup page until 2FA is confirmed
- Pages: `TwoFactorChallenge`, `TwoFactorSetup`, `TwoFactorRecoveryCodes`, `TwoFactorManage`
- Recovery codes (8 × `XXXXX-XXXXX` format) generated on setup; single-use
- Users can disable 2FA or regenerate recovery codes (password confirmation required)
- Database columns needed: `two_factor_secret`, `two_factor_confirmed_at`, `two_factor_recovery_codes`
- Add the provided migration (see `docs/upgrade.md`)

#### Advanced — Multi-Tenancy
- `->tenancy(\Closure $resolver)` on `Panel` — resolver receives the `Request`, returns the tenant:
  ```php
  ->tenancy(fn ($request) => $request->user()?->team)
  ```
- `public static function scopeForTenant(mixed $query, mixed $tenant): mixed` on `Resource` — override to apply tenant scope:
  ```php
  public static function scopeForTenant($query, $tenant): mixed
  {
      return $query->where('team_id', $tenant->id);
  }
  ```
- Scope applied automatically on every index/list query in both the Inertia controller and the API controller

#### Advanced — REST API Generator
- `->api(bool $enabled = true, string $prefix = 'api', array $middleware = ['api', 'auth:sanctum'])` on `Panel`
- When enabled, registers JSON REST endpoints for all resources automatically
- `larafusion:api` command generates `routes/larafusion-api.php` for manual inclusion
- Endpoints per resource:

  | Method | URI | Action |
  |--------|-----|--------|
  | GET | `/{prefix}/{resource}` | List (paginated, searchable, sortable, filterable) |
  | POST | `/{prefix}/{resource}` | Create |
  | GET | `/{prefix}/{resource}/schema` | Field schema + column definitions |
  | GET | `/{prefix}/{resource}/{id}` | Show |
  | PUT/PATCH | `/{prefix}/{resource}/{id}` | Update |
  | DELETE | `/{prefix}/{resource}/{id}` | Delete |

- All endpoints respect `resolvePermission()` (policies, role checks, etc.)
- Tenant scope applied automatically when `->tenancy()` is configured
- Query params: `?search=`, `?sort=field&direction=asc`, `?filter[field]=value`, `?per_page=25`

#### Advanced — Realtime WebSocket Updates
- `->realtime(bool $enabled = true, string $channel = 'larafusion')` on `Panel`
- `RecordEvent` broadcast event fired after every create / update / delete in `ResourceController`
- Compatible with **Laravel Reverb**, **Pusher**, and any Echo-compatible driver
- Channel: `{channel}.{resource}` (e.g. `larafusion.posts`)
- Event name: `larafusion.record.created` / `larafusion.record.updated` / `larafusion.record.deleted`
- Broadcast silently fails if no driver is configured (safe for existing apps)
- Frontend wiring: listen via Laravel Echo:
  ```ts
  Echo.channel('larafusion.posts')
      .listen('.larafusion.record.created', (e) => { /* refresh table */ })
      .listen('.larafusion.record.updated', (e) => { /* update row */ })
      .listen('.larafusion.record.deleted', (e) => { /* remove row */ });
  ```

---

## Earlier Releases

See `docs/roadmap.md` → **Completed** section for a full feature history prior to this changelog.
