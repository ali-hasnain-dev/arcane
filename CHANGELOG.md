# Changelog

All notable changes to Arcane are documented here.
This project follows [Keep a Changelog](https://keepachangelog.com/) conventions.

---

## [Unreleased]

### Added

#### Simple Pagination
- **`->simplePagination(bool $simple = true)`** on both `Table` builder and `Panel`:
  - Table-level setting always takes precedence over the panel-level default.
  - When enabled, the pagination row shows only **Prev / Next** buttons plus a "X / Y" page indicator instead of numbered page links.
  - Panel default is `false` (numbered pagination). Set it globally via `->simplePagination()` on the panel, then override per-table as needed.

  ```php
  // app/Providers/Arcane/AdminPanelProvider.php
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
- Edit now uses `dark:text-[var(--arcane-primary-ring,#a78bfa)]` (the primary ring/accent colour), making it clearly distinct from the neutral-grey View link.



#### Developer Experience
- **`arcane:user` command** — create admin users from the CLI:
  ```bash
  php artisan arcane:user
  php artisan arcane:user --name="Ali" --email="ali@example.com" --password="secret123"
  # Use a custom model:
  php artisan arcane:user --model="App\\Models\\Admin"
  ```
- **`arcane:ide-helpers` command** — generate `_ide_helper_arcane.php` with full PHPDoc stubs for all fluent APIs (`Panel`, `Resource`, `Field`, `Table`, `Column`, etc.)
- **`CHANGELOG.md`** and `docs/upgrade.md` — version history and upgrade guides

#### Security — Login Rate Limiting
- `->loginRateLimiting(int $maxAttempts = 5, int $decayMinutes = 1)` on `Panel`
- Pass `false` to disable: `->loginRateLimiting(false)`
- Named `arcane-login` RateLimiter registered automatically — no manual setup required
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
- `arcane:api` command generates `routes/arcane-api.php` for manual inclusion
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
- `->realtime(bool $enabled = true, string $channel = 'arcane')` on `Panel`
- `RecordEvent` broadcast event fired after every create / update / delete in `ResourceController`
- Compatible with **Laravel Reverb**, **Pusher**, and any Echo-compatible driver
- Channel: `{channel}.{resource}` (e.g. `arcane.posts`)
- Event name: `arcane.record.created` / `arcane.record.updated` / `arcane.record.deleted`
- Broadcast silently fails if no driver is configured (safe for existing apps)
- Frontend wiring: listen via Laravel Echo:
  ```ts
  Echo.channel('arcane.posts')
      .listen('.arcane.record.created', (e) => { /* refresh table */ })
      .listen('.arcane.record.updated', (e) => { /* update row */ })
      .listen('.arcane.record.deleted', (e) => { /* remove row */ });
  ```

---

## Earlier Releases

See `docs/roadmap.md` → **Completed** section for a full feature history prior to this changelog.
