# Upgrade Guide

## Upgrading to the latest version (new features release)

### 1. Two-Factor Authentication — database migration

If you want to use `->twoFactor()`, add a migration to your app:

```bash
php artisan make:migration add_two_factor_to_users_table
```

```php
// database/migrations/xxxx_xx_xx_add_two_factor_to_users_table.php
public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->text('two_factor_secret')->nullable()->after('password');
        $table->timestamp('two_factor_confirmed_at')->nullable()->after('two_factor_secret');
        $table->text('two_factor_recovery_codes')->nullable()->after('two_factor_confirmed_at');
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn(['two_factor_secret', 'two_factor_confirmed_at', 'two_factor_recovery_codes']);
    });
}
```

Add these columns to `$fillable` (or use `#[Fillable]`) on your User model:

```php
// Also add to $hidden if you don't want them in JSON responses
protected $hidden = ['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'];
```

Enable 2FA in your panel provider:

```php
// app/Providers/Arcane/AdminPanelProvider.php
return $panel
    ->twoFactor()                    // optional, allow users to opt-in
    ->twoFactor(enforce: true)       // enforce — all users must set up 2FA
```

---

### 2. Role-Based Access — no migration required

The `canViewAny()` / `canCreate()` / etc. methods now accept an optional `$user` parameter.
**Existing resources that override these with no parameters continue to work** — the parameter is optional.

To start using role-based checks:

```php
// app/Arcane/Resources/Posts/PostResource.php
public static function canViewAny(mixed $user = null): bool
{
    return $user?->role->in([UserRole::Admin, UserRole::Editor]) ?? false;
}
```

To use a Laravel Policy:

```php
// In your resource
protected static string $policy = \App\Policies\PostPolicy::class;

// In PostPolicy (standard Laravel policy)
public function viewAny(User $user): bool { ... }
public function create(User $user): bool { ... }
public function update(User $user, Post $model): bool { ... }
public function delete(User $user, Post $model): bool { ... }
public function view(User $user, Post $model): bool { ... }
```

---

### 3. Login Rate Limiting — no migration required

Rate limiting is **enabled by default** (5 attempts / minute). To customise or disable:

```php
// Allow 10 attempts per 2 minutes
->loginRateLimiting(10, 2)

// Disable entirely
->loginRateLimiting(false)
```

No changes needed to your `bootstrap/app.php` — Arcane registers the named `arcane-login`
and `arcane-2fa` rate limiters automatically via the service provider.

---

### 4. REST API — no migration required

Enable in your panel provider:

```php
// Auto-generates API for all registered resources
->api()

// Custom prefix and middleware
->api(prefix: 'v1', middleware: ['api', 'auth:sanctum'])
```

Or generate standalone routes file:

```bash
php artisan arcane:api
# Creates routes/arcane-api.php — include it in bootstrap/app.php manually
```

To issue Sanctum tokens for API access:

```bash
# In your app — standard Laravel Sanctum setup
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

---

### 5. Realtime — requires a broadcast driver

Enable in your panel provider:

```php
->realtime()
```

Configure a broadcast driver (e.g. Reverb):

```bash
php artisan install:broadcasting   # Laravel 11+ wizard
# or manually add BROADCAST_CONNECTION=reverb to .env
```

Install Laravel Echo in your frontend:

```bash
npm install laravel-echo pusher-js
```

---

### 6. Multi-Tenancy — no migration required

```php
// Panel provider
->tenancy(fn ($request) => $request->user()?->team)

// Resource
public static function scopeForTenant($query, $tenant): mixed
{
    return $query->where('team_id', $tenant?->id);
}
```

---

### 7. New Artisan commands

| Command | Description |
|---------|-------------|
| `php artisan arcane:user` | Create an admin user interactively or via options |
| `php artisan arcane:ide-helpers` | Generate `_ide_helper_arcane.php` PHPDoc stubs |
| `php artisan arcane:api` | Generate `routes/arcane-api.php` REST API routes file |
