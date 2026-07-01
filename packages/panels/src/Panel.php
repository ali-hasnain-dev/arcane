<?php

namespace Larafusion;

class Panel
{
    // ── Core ──────────────────────────────────────────────────────────────────
    protected string  $id               = 'admin';
    protected string  $path             = 'admin';
    protected bool    $hasLogin         = true;
    protected bool    $hasRegistration  = false;
    protected bool    $hasForgotPassword = false;
    protected array   $middleware       = ['web', 'auth'];
    protected array   $authMiddleware   = ['web'];

    // ── Branding ──────────────────────────────────────────────────────────────
    protected string  $brandName          = '';
    protected ?string $brandLogo          = null;
    protected ?string $darkModeBrandLogo  = null;
    protected string  $brandLogoHeight    = '2rem';
    protected ?string $favicon            = null;

    // ── Font ──────────────────────────────────────────────────────────────────
    // Inter is the default — designed for UI, used by Linear, Vercel, GitHub.
    protected ?string $font       = 'Inter';
    protected ?string $fontWeight = '300..900';

    // ── Theme ─────────────────────────────────────────────────────────────────
    protected string  $theme            = 'stone';
    protected bool    $darkMode         = false;
    protected string  $defaultThemeMode = 'light'; // light | dark | system
    protected array   $colors           = [];

    // ── Layout ────────────────────────────────────────────────────────────────
    protected bool    $topNavigation             = false;
    protected bool    $sidebarCollapsibleOnDesktop = false;
    protected string  $sidebarWidth              = '16rem';
    protected string  $collapsedSidebarWidth      = '4rem';
    protected ?string $maxContentWidth            = null;
    protected bool    $breadcrumbs               = true;
    protected string  $breadcrumbsPosition       = 'page'; // 'page' | 'header' (header only works in vertical sidebar mode)
    protected bool    $topbar                    = true;
    protected string  $subNavigationPosition     = 'start'; // start | end | top | bottom

    // ── Rate Limiting ─────────────────────────────────────────────────────────
    protected int  $loginMaxAttempts   = 5;
    protected int  $loginDecayMinutes  = 1;
    protected bool $loginRateLimiting  = true;

    // ── Two-Factor Auth ───────────────────────────────────────────────────────
    protected bool   $twoFactor              = false;
    protected bool   $twoFactorEnforced      = false;

    // ── Multi-Tenancy ─────────────────────────────────────────────────────────
    protected ?\Closure $tenantResolver = null;

    // ── Realtime ──────────────────────────────────────────────────────────────
    protected bool   $realtime          = false;
    protected string $realtimeChannel   = 'larafusion';

    // ── REST API ──────────────────────────────────────────────────────────────
    protected bool    $apiEnabled    = false;
    protected string  $apiPrefix     = 'api';
    protected array   $apiMiddleware = ['api', 'auth:sanctum'];

    // ── Auth customisation ────────────────────────────────────────────────────
    protected string $authGuard             = 'web';
    protected string $authPasswordBroker    = 'users';
    protected bool   $revealablePasswords   = true;
    protected bool   $hasProfile            = false;

    // Auth URL slugs (relative to panel path)
    protected string $loginSlug            = 'login';
    protected string $registrationSlug     = 'register';
    protected string $forgotPasswordSlug   = 'forgot-password';
    protected string $resetPasswordSlug    = 'reset-password';
    protected string $profileSlug          = 'profile';

    // ── Topbar features ───────────────────────────────────────────────────────
    protected bool   $globalSearch          = false;
    protected string $globalSearchMode      = 'dropdown'; // 'dropdown' | 'modal'
    protected string $globalSearchAlignment = 'center';   // 'left' | 'center' | 'right'
    protected string $globalSearchSize      = 'default';  // 'default' | 'wide'
    protected bool   $notifications         = false;

    // ── Prefetch ──────────────────────────────────────────────────────────────
    protected bool             $prefetchEnabled         = false;
    protected string|array     $prefetchStrategy        = 'hover';   // 'hover' | 'click' | 'mount' | ['hover','mount']
    protected string|int|array $prefetchCacheFor        = '30s';     // '30s' | '1m' | 5000 | ['30s','1m'] (SWR)
    protected bool             $prefetchFlushOnNavigate = false;

    // ── Behaviour ─────────────────────────────────────────────────────────────
    protected bool  $unsavedChangesAlerts  = false;
    protected bool  $databaseTransactions  = false;
    protected bool  $strictAuthorization   = false;
    protected int   $pagination            = 15;
    protected bool  $simplePagination      = false;

    // ── Domain ────────────────────────────────────────────────────────────────
    protected ?string $domain = null;

    // ── User Menu ─────────────────────────────────────────────────────────────
    protected bool   $userMenuEnabled  = true;
    protected string $userMenuPosition = 'topbar'; // 'topbar' | 'sidebar'

    /**
     * Mixed array of UserMenuItem instances and special string-keyed overrides.
     * Keys 'profile' and 'logout' override the built-in items.
     * All other items are appended after the profile item.
     *
     * @var array<string|int, \Larafusion\Navigation\UserMenuItem|\Closure>
     */
    protected array $userMenuItems = [];

    // ── Registration ──────────────────────────────────────────────────────────
    protected array    $resources        = [];
    protected array    $pages            = [];
    protected array    $widgets          = [];
    protected array    $plugins          = [];
    protected array    $navigationItems  = [];

    // ── Hooks ─────────────────────────────────────────────────────────────────
    protected ?\Closure $bootUsing = null;

    // ── Factory ───────────────────────────────────────────────────────────────

    public static function make(): static
    {
        return new static();
    }

    // ── Identity ──────────────────────────────────────────────────────────────

    public function id(string $id): static
    {
        $this->id = $id;
        return $this;
    }

    public function path(string $path): static
    {
        $this->path = $path;
        return $this;
    }

    public function domain(string $domain): static
    {
        $this->domain = $domain;
        return $this;
    }

    // ── Rate Limiting ─────────────────────────────────────────────────────────

    /**
     * Configure login rate limiting. Defaults to 5 attempts per minute.
     * Pass false to disable entirely.
     */
    public function loginRateLimiting(bool|int $maxAttempts = 5, int $decayMinutes = 1): static
    {
        if ($maxAttempts === false) {
            $this->loginRateLimiting = false;
        } else {
            $this->loginRateLimiting = true;
            $this->loginMaxAttempts  = (int) $maxAttempts;
            $this->loginDecayMinutes = $decayMinutes;
        }
        return $this;
    }

    // ── Two-Factor Auth ───────────────────────────────────────────────────────

    /**
     * Enable TOTP two-factor authentication for this panel.
     * When $enforce is true, users MUST set up 2FA before accessing the panel.
     */
    public function twoFactor(bool $enabled = true, bool $enforce = false): static
    {
        $this->twoFactor         = $enabled;
        $this->twoFactorEnforced = $enforce;
        return $this;
    }

    // ── Multi-Tenancy ─────────────────────────────────────────────────────────

    /**
     * Provide a closure that resolves the current tenant from the request/session.
     * The closure receives the current Request and should return the tenant model/value.
     *
     * Example:
     *   ->tenancy(fn ($request) => $request->user()?->team)
     */
    public function tenancy(\Closure $resolver): static
    {
        $this->tenantResolver = $resolver;
        return $this;
    }

    // ── Realtime ──────────────────────────────────────────────────────────────

    /**
     * Enable WebSocket-based realtime table updates via Laravel Broadcasting.
     * Requires Reverb, Pusher, or a compatible driver configured in your app.
     */
    public function realtime(bool $enabled = true, string $channel = 'larafusion'): static
    {
        $this->realtime        = $enabled;
        $this->realtimeChannel = $channel;
        return $this;
    }

    // ── REST API ──────────────────────────────────────────────────────────────

    /**
     * Auto-generate a JSON REST API for all registered resources.
     * Endpoints are secured with Laravel Sanctum by default.
     *
     * Routes are registered at /{prefix}/{resource} (GET, POST, PUT, DELETE).
     */
    public function api(bool $enabled = true, string $prefix = 'api', array $middleware = ['api', 'auth:sanctum']): static
    {
        $this->apiEnabled    = $enabled;
        $this->apiPrefix     = $prefix;
        $this->apiMiddleware = $middleware;
        return $this;
    }

    // ── Auth ──────────────────────────────────────────────────────────────────

    public function login(bool $enabled = true): static
    {
        $this->hasLogin = $enabled;
        return $this;
    }

    public function registration(bool $enabled = true): static
    {
        $this->hasRegistration = $enabled;
        return $this;
    }

    public function forgotPassword(bool $enabled = true): static
    {
        $this->hasForgotPassword = $enabled;
        return $this;
    }

    /**
     * Middleware applied to ALL panel routes (authenticated + guest).
     */
    public function middleware(array $middleware): static
    {
        $this->middleware = $middleware;
        return $this;
    }

    /**
     * Middleware applied only to the login / password-reset routes.
     * Defaults to ['web'] (no auth gate).
     */
    public function authMiddleware(array $middleware): static
    {
        $this->authMiddleware = $middleware;
        return $this;
    }

    // ── Branding ──────────────────────────────────────────────────────────────

    public function brand(string $name, ?string $logo = null): static
    {
        $this->brandName = $name;
        $this->brandLogo = $logo;
        return $this;
    }

    public function brandLogo(string $url): static
    {
        $this->brandLogo = $url;
        return $this;
    }

    public function darkModeBrandLogo(string $url): static
    {
        $this->darkModeBrandLogo = $url;
        return $this;
    }

    public function brandLogoHeight(string $height): static
    {
        $this->brandLogoHeight = $height;
        return $this;
    }

    public function favicon(string $url): static
    {
        $this->favicon = $url;
        return $this;
    }

    // ── Font ──────────────────────────────────────────────────────────────────

    /**
     * Set the Google Font family name (e.g. 'Inter', 'Nunito', 'DM Sans').
     * Larafusion will inject the Google Fonts stylesheet automatically.
     */
    public function font(string $family, ?string $weight = null): static
    {
        $this->font       = $family;
        $this->fontWeight = $weight ?? '300..900';
        return $this;
    }

    // ── Theme ─────────────────────────────────────────────────────────────────

    /**
     * Set a named theme ('stone', 'violet', 'emerald', etc.) OR pass a hex
     * colour directly ('#292524') as a shorthand for ->colors(['primary' => $hex]).
     */
    public function theme(string $name, bool $darkMode = false): static
    {
        if (str_starts_with($name, '#')) {
            // Hex shorthand: store as a primary colour override and auto-derive
            // companions in ThemeManager::cssVars().
            $this->colors = array_merge($this->colors, ['primary' => $name]);
            if ($darkMode) $this->darkMode = true;
            return $this;
        }
        $this->theme    = $name;
        $this->darkMode = $darkMode;
        return $this;
    }

    public function darkMode(bool $enabled = true): static
    {
        $this->darkMode = $enabled;
        return $this;
    }

    /**
     * Default theme mode: 'light', 'dark', or 'system' (respects OS preference).
     */
    public function defaultThemeMode(string $mode): static
    {
        $this->defaultThemeMode = $mode;
        return $this;
    }

    public function colors(array $colors): static
    {
        $this->colors = $colors;
        return $this;
    }

    // ── Layout ────────────────────────────────────────────────────────────────

    /**
     * Use a horizontal top navigation bar instead of the left sidebar.
     */
    public function topNavigation(bool $enabled = true): static
    {
        $this->topNavigation = $enabled;
        return $this;
    }

    /**
     * Allow the sidebar to be collapsed to icon-only mode on desktop.
     */
    public function sidebarCollapsibleOnDesktop(bool $enabled = true): static
    {
        $this->sidebarCollapsibleOnDesktop = $enabled;
        return $this;
    }

    /**
     * Width of the expanded sidebar, e.g. '18rem' or '280px'.
     */
    public function sidebarWidth(string $width): static
    {
        $this->sidebarWidth = $width;
        return $this;
    }

    /**
     * Width of the collapsed (icon-only) sidebar.
     */
    public function collapsedSidebarWidth(string $width): static
    {
        $this->collapsedSidebarWidth = $width;
        return $this;
    }

    /**
     * CSS max-width for the main content area, e.g. '90rem' or 'full'.
     * Pass null (default) to use the full available width.
     */
    public function maxContentWidth(?string $width): static
    {
        $this->maxContentWidth = $width;
        return $this;
    }

    /**
     * Show/hide breadcrumb trail.
     */
    public function breadcrumbs(bool $enabled = true): static
    {
        $this->breadcrumbs = $enabled;
        return $this;
    }

    /**
     * Where to render breadcrumbs.
     * - 'page'   (default) — inside the page content area, below the topbar
     * - 'header' — inside the topbar header bar (only works in vertical sidebar mode;
     *              automatically falls back to 'page' when using topNavigation())
     */
    public function breadcrumbsPosition(string $position): static
    {
        $this->breadcrumbsPosition = in_array($position, ['page', 'header']) ? $position : 'page';
        return $this;
    }

    /**
     * Show/hide the topbar entirely.
     */
    public function topbar(bool $enabled = true): static
    {
        $this->topbar = $enabled;
        return $this;
    }

    /**
     * Position of sub-navigation (secondary sidebar / tabs).
     * Options: 'start' | 'end' | 'top' | 'bottom'
     */
    public function subNavigationPosition(string $position): static
    {
        $this->subNavigationPosition = $position;
        return $this;
    }

    // ── Behaviour ─────────────────────────────────────────────────────────────

    // ── Topbar features ───────────────────────────────────────────────────────

    /**
     * Show a global search box in the topbar.
     */
    public function globalSearch(bool $enabled = true): static
    {
        $this->globalSearch = $enabled;
        return $this;
    }

    /**
     * How the search panel opens: 'dropdown' (default) drops below the trigger button,
     * 'modal' opens a centred full-screen palette.
     */
    public function globalSearchMode(string $mode): static
    {
        $this->globalSearchMode = $mode;
        return $this;
    }

    /**
     * Horizontal alignment of the search panel: 'left', 'center' (default), or 'right'.
     * For modal mode this controls screen-level positioning; for dropdown it controls
     * which edge of the panel aligns with the trigger button.
     */
    public function globalSearchAlignment(string $alignment): static
    {
        $this->globalSearchAlignment = $alignment;
        return $this;
    }

    /**
     * Width of the search panel: 'default' (current) or 'wide' (slightly larger, responsive).
     */
    public function globalSearchSize(string $size): static
    {
        $this->globalSearchSize = $size;
        return $this;
    }

    /**
     * Show a notification bell in the topbar.
     */
    public function notifications(bool $enabled = true): static
    {
        $this->notifications = $enabled;
        return $this;
    }

    // ── Auth customisation ────────────────────────────────────────────────────

    /**
     * The authentication guard to use for this panel.
     * Defaults to 'web'. Change when using a custom guard (e.g. 'admin').
     */
    public function authGuard(string $guard): static
    {
        $this->authGuard = $guard;
        return $this;
    }

    /**
     * The password broker to use for password reset emails.
     * Defaults to 'users'. Change when using a custom broker.
     */
    public function authPasswordBroker(string $broker): static
    {
        $this->authPasswordBroker = $broker;
        return $this;
    }

    /**
     * Show/hide the eye-toggle on password fields in auth pages.
     * Enabled by default.
     */
    public function revealablePasswords(bool $enabled = true): static
    {
        $this->revealablePasswords = $enabled;
        return $this;
    }

    /**
     * Enable the user profile editing page at /{panel}/profile.
     */
    public function profile(bool $enabled = true): static
    {
        $this->hasProfile = $enabled;
        return $this;
    }

    /** Customise the URL slug for the login page (default: 'login'). */
    public function loginSlug(string $slug): static          { $this->loginSlug          = $slug; return $this; }

    /** Customise the URL slug for the registration page (default: 'register'). */
    public function registrationSlug(string $slug): static   { $this->registrationSlug   = $slug; return $this; }

    /** Customise the URL slug for the forgot-password page (default: 'forgot-password'). */
    public function forgotPasswordSlug(string $slug): static { $this->forgotPasswordSlug = $slug; return $this; }

    /** Customise the URL slug for the reset-password page (default: 'reset-password'). */
    public function resetPasswordSlug(string $slug): static  { $this->resetPasswordSlug  = $slug; return $this; }

    /** Customise the URL slug for the profile page (default: 'profile'). */
    public function profileSlug(string $slug): static        { $this->profileSlug        = $slug; return $this; }

    // ── User Menu ─────────────────────────────────────────────────────────────

    /**
     * Configure the user menu.
     *
     * Pass false to disable it entirely.
     * Pass 'sidebar' to move it to the bottom of the sidebar instead of the topbar.
     *
     * @param  bool|string  $positionOrEnabled  false | 'topbar' | 'sidebar'
     */
    public function userMenu(bool|string $positionOrEnabled = true): static
    {
        if ($positionOrEnabled === false) {
            $this->userMenuEnabled = false;
        } elseif (is_string($positionOrEnabled)) {
            $this->userMenuEnabled  = true;
            $this->userMenuPosition = $positionOrEnabled; // 'topbar' | 'sidebar'
        } else {
            $this->userMenuEnabled = (bool) $positionOrEnabled;
        }
        return $this;
    }

    /**
     * Register user menu items.
     *
     * Use string keys 'profile' or 'logout' to customise the built-in items:
     *
     *   ->userMenuItems([
     *       'profile' => UserMenuItem::make('profile')->label('Edit profile')->url('/admin/profile'),
     *       'logout'  => UserMenuItem::make('logout')->label('Sign out'),
     *       UserMenuItem::make('settings')->label('Settings')->url('/admin/settings')->icon('settings'),
     *   ])
     *
     * @param  array<string|int, \Larafusion\Navigation\UserMenuItem>  $items
     */
    public function userMenuItems(array $items): static
    {
        $this->userMenuItems = array_merge($this->userMenuItems, $items);
        return $this;
    }

    // ── Behaviour ─────────────────────────────────────────────────────────────

    /**
     * Warn users when they try to leave a page with unsaved form changes.
     */
    public function unsavedChangesAlerts(bool $enabled = true): static
    {
        $this->unsavedChangesAlerts = $enabled;
        return $this;
    }

    /**
     * Wrap each resource mutation (create / update / delete) in a DB transaction.
     */
    public function databaseTransactions(bool $enabled = true): static
    {
        $this->databaseTransactions = $enabled;
        return $this;
    }

    /**
     * When enabled, Larafusion will throw an AuthorizationException instead of
     * silently hiding items the user cannot access.
     */
    public function strictAuthorization(bool $enabled = true): static
    {
        $this->strictAuthorization = $enabled;
        return $this;
    }

    // ── Prefetch ──────────────────────────────────────────────────────────────

    /**
     * Enable Inertia link prefetching for all navigation links.
     * Disabled by default.
     */
    public function prefetch(bool $enabled = true): static
    {
        $this->prefetchEnabled = $enabled;
        return $this;
    }

    /**
     * Prefetch strategy: 'hover' (default) | 'click' | 'mount' | array combination.
     * Hover triggers prefetch after 75 ms of hovering; click on mousedown; mount immediately.
     *
     * @param  string|string[]  $strategy
     */
    public function prefetchStrategy(string|array $strategy): static
    {
        $this->prefetchStrategy = $strategy;
        return $this;
    }

    /**
     * How long the prefetch cache is considered fresh.
     * String: '30s', '1m', '5m', etc.
     * Integer: milliseconds.
     * Tuple [fresh, stale]: stale-while-revalidate mode, e.g. ['30s', '1m'].
     *
     * @param  string|int|array  $duration
     */
    public function prefetchCacheFor(string|int|array $duration): static
    {
        $this->prefetchCacheFor = $duration;
        return $this;
    }

    /**
     * Flush the entire prefetch cache on every Inertia navigation.
     * Useful when data changes frequently and stale reads are unacceptable.
     */
    public function prefetchFlushOnNavigate(bool $flush = true): static
    {
        $this->prefetchFlushOnNavigate = $flush;
        return $this;
    }

    // ── Pagination ────────────────────────────────────────────────────────────

    public function pagination(int $perPage): static
    {
        $this->pagination = $perPage;
        return $this;
    }

    public function simplePagination(bool $simple = true): static
    {
        $this->simplePagination = $simple;
        return $this;
    }

    // ── Resources / Pages / Widgets / Plugins ─────────────────────────────────

    public function resources(array $classes): static
    {
        $this->resources = array_merge($this->resources, $classes);
        return $this;
    }

    public function pages(array $classes): static
    {
        $this->pages = array_merge($this->pages, $classes);
        return $this;
    }

    public function widgets(array $classes): static
    {
        $this->widgets = array_merge($this->widgets, $classes);
        return $this;
    }

    public function plugins(array $classes): static
    {
        $this->plugins = array_merge($this->plugins, $classes);
        return $this;
    }

    /**
     * Add raw navigation items (e.g. external links) that are not tied to a
     * registered resource or page.
     *
     * Each item: ['label', 'icon', 'url', 'group' (optional), 'sort' (optional)]
     */
    public function navigationItems(array $items): static
    {
        $this->navigationItems = array_merge($this->navigationItems, $items);
        return $this;
    }

    // ── Hooks ─────────────────────────────────────────────────────────────────

    /**
     * Register a callback that is called during the panel's boot phase.
     * Useful for registering event listeners, macros, or other side effects.
     */
    public function bootUsing(\Closure $callback): static
    {
        $this->bootUsing = $callback;
        return $this;
    }

    // ── Getters ───────────────────────────────────────────────────────────────

    public function getId(): string                   { return $this->id; }
    public function getPath(): string                 { return $this->path; }
    public function getDomain(): ?string              { return $this->domain; }
    public function hasLogin(): bool                  { return $this->hasLogin; }
    public function hasRegistration(): bool           { return $this->hasRegistration; }
    public function hasForgotPassword(): bool         { return $this->hasForgotPassword; }
    public function getMiddleware(): array            { return $this->middleware; }
    public function getAuthMiddleware(): array        { return $this->authMiddleware; }

    public function getBrandName(): string            { return $this->brandName; }
    public function getBrandLogo(): ?string           { return $this->brandLogo; }
    public function getDarkModeBrandLogo(): ?string   { return $this->darkModeBrandLogo; }
    public function getBrandLogoHeight(): string      { return $this->brandLogoHeight; }
    public function getFavicon(): ?string             { return $this->favicon; }

    public function getFont(): ?string                { return $this->font; }
    public function getFontWeight(): ?string          { return $this->fontWeight; }

    public function getTheme(): string                { return $this->theme; }
    public function getDarkMode(): bool               { return $this->darkMode; }
    public function getDefaultThemeMode(): string     { return $this->defaultThemeMode; }
    public function getColors(): array                { return $this->colors; }

    public function isTopNavigation(): bool           { return $this->topNavigation; }
    public function isSidebarCollapsibleOnDesktop(): bool { return $this->sidebarCollapsibleOnDesktop; }
    public function getSidebarWidth(): string         { return $this->sidebarWidth; }
    public function getCollapsedSidebarWidth(): string { return $this->collapsedSidebarWidth; }
    public function getMaxContentWidth(): ?string     { return $this->maxContentWidth; }
    public function hasBreadcrumbs(): bool              { return $this->breadcrumbs; }
    public function getBreadcrumbsPosition(): string   { return $this->breadcrumbsPosition; }
    public function hasTopbar(): bool                 { return $this->topbar; }
    public function getSubNavigationPosition(): string { return $this->subNavigationPosition; }

    public function hasGlobalSearch(): bool            { return $this->globalSearch; }
    public function hasNotifications(): bool          { return $this->notifications; }

    public function getAuthGuard(): string             { return $this->authGuard; }
    public function getAuthPasswordBroker(): string    { return $this->authPasswordBroker; }
    public function hasRevealablePasswords(): bool     { return $this->revealablePasswords; }
    public function hasProfile(): bool                 { return $this->hasProfile; }
    public function getLoginSlug(): string             { return $this->loginSlug; }
    public function getRegistrationSlug(): string      { return $this->registrationSlug; }
    public function getForgotPasswordSlug(): string    { return $this->forgotPasswordSlug; }
    public function getResetPasswordSlug(): string     { return $this->resetPasswordSlug; }
    public function getProfileSlug(): string           { return $this->profileSlug; }

    public function isUserMenuEnabled(): bool          { return $this->userMenuEnabled; }
    public function getUserMenuPosition(): string      { return $this->userMenuPosition; }

    /**
     * Returns the resolved, serializable user menu configuration for Inertia.
     * Visibility closures are evaluated here on the PHP side so the frontend
     * never receives items the current user cannot see.
     */
    public function getUserMenuConfig(): array
    {
        $custom   = [];
        $profile  = null;
        $logout   = null;

        foreach ($this->userMenuItems as $key => $item) {
            if (!($item instanceof \Larafusion\Navigation\UserMenuItem)) continue;
            if (!$item->isVisible()) continue;

            if ($key === 'profile') {
                $profile = $item->toArray();
            } elseif ($key === 'logout') {
                $arr = $item->toArray();
                // Logout with no custom URL uses the built-in POST endpoint; ensure method is 'post'
                // so the frontend does not render a GET link that falls through to the resource wildcard.
                if ($arr['url'] === null) {
                    $arr['method'] = 'post';
                }
                $logout = $arr;
            } else {
                $custom[] = $item->toArray();
            }
        }

        return [
            'enabled'  => $this->userMenuEnabled,
            'position' => $this->userMenuPosition,
            'profile'  => $profile,   // null = use default
            'logout'   => $logout,    // null = use default
            'items'    => $custom,    // extra items appended below profile
        ];
    }

    public function hasUnsavedChangesAlerts(): bool   { return $this->unsavedChangesAlerts; }
    public function hasDatabaseTransactions(): bool   { return $this->databaseTransactions; }
    public function hasStrictAuthorization(): bool    { return $this->strictAuthorization; }
    public function getPagination(): int              { return $this->pagination; }
    public function getSimplePagination(): bool       { return $this->simplePagination; }

    // Rate Limiting
    public function hasLoginRateLimiting(): bool  { return $this->loginRateLimiting; }
    public function getLoginMaxAttempts(): int    { return $this->loginMaxAttempts; }
    public function getLoginDecayMinutes(): int   { return $this->loginDecayMinutes; }

    // Two-Factor Auth
    public function hasTwoFactor(): bool          { return $this->twoFactor; }
    public function isTwoFactorEnforced(): bool   { return $this->twoFactorEnforced; }

    // Multi-Tenancy
    public function getTenantResolver(): ?\Closure { return $this->tenantResolver; }
    public function hasTenancy(): bool             { return $this->tenantResolver !== null; }

    // Realtime
    public function hasRealtime(): bool           { return $this->realtime; }
    public function getRealtimeChannel(): string  { return $this->realtimeChannel; }

    // API
    public function hasApi(): bool                { return $this->apiEnabled; }
    public function getApiPrefix(): string        { return $this->apiPrefix; }
    public function getApiMiddleware(): array     { return $this->apiMiddleware; }

    public function getPrefetchConfig(): array
    {
        return [
            'enabled'         => $this->prefetchEnabled,
            'strategy'        => $this->prefetchStrategy,
            'cacheFor'        => $this->prefetchCacheFor,
            'flushOnNavigate' => $this->prefetchFlushOnNavigate,
        ];
    }

    public function getResources(): array             { return $this->resources; }
    public function getPages(): array                 { return $this->pages; }
    public function getWidgets(): array               { return $this->widgets; }

    /**
     * True when DefaultDashboardCards::class is present in ->widgets([...]) —
     * this is what actually toggles the dashboard's greeting + GitHub cards.
     * See DefaultDashboardCards for the full explanation.
     */
    public function hasDefaultDashboardCards(): bool
    {
        return in_array(DefaultDashboardCards::class, $this->widgets, true);
    }

    /**
     * Real widgets only — strips DefaultDashboardCards::class so it never
     * gets treated as an actual widget (WidgetGrid, ::make(), etc).
     */
    public function getRealWidgets(): array
    {
        return array_values(array_filter(
            $this->widgets,
            fn ($w) => $w !== DefaultDashboardCards::class,
        ));
    }

    public function getPlugins(): array               { return $this->plugins; }
    public function getNavigationItems(): array       { return $this->navigationItems; }

    public function getBootUsing(): ?\Closure          { return $this->bootUsing; }

    // ── Serialise to array (shared with Inertia) ──────────────────────────────

    public function toArray(): array
    {
        return [
            'id'                          => $this->id,
            'path'                        => $this->path,
            'registration'                => $this->hasRegistration,
            'forgotPassword'              => $this->hasForgotPassword,
            'topNavigation'               => $this->topNavigation,
            'sidebarCollapsibleOnDesktop' => $this->sidebarCollapsibleOnDesktop,
            'sidebarWidth'                => $this->sidebarWidth,
            'collapsedSidebarWidth'       => $this->collapsedSidebarWidth,
            'maxContentWidth'             => $this->maxContentWidth,
            'breadcrumbs'                 => $this->breadcrumbs,
            'breadcrumbsPosition'         => $this->breadcrumbsPosition,
            'topbar'                      => $this->topbar,
            'subNavigationPosition'       => $this->subNavigationPosition,
            'globalSearch'                => $this->globalSearch,
            'globalSearchMode'            => $this->globalSearchMode,
            'globalSearchAlignment'       => $this->globalSearchAlignment,
            'globalSearchSize'            => $this->globalSearchSize,
            'notifications'               => $this->notifications,
            'unsavedChangesAlerts'        => $this->unsavedChangesAlerts,
            'font'                        => $this->font,
            'fontWeight'                  => $this->fontWeight ?? '300..900',
            'favicon'                     => $this->favicon,
            'brandLogoHeight'             => $this->brandLogoHeight,
            'darkModeBrandLogo'           => $this->darkModeBrandLogo,
            'defaultThemeMode'            => $this->defaultThemeMode,
            'prefetch'                    => $this->getPrefetchConfig(),
            'userMenu'                    => $this->getUserMenuConfig(),
            'revealablePasswords'         => $this->revealablePasswords,
            'hasProfile'                  => $this->hasProfile,
            'profileSlug'                 => $this->profileSlug,
            'loginSlug'                   => $this->loginSlug,
            'registrationSlug'            => $this->registrationSlug,
            'forgotPasswordSlug'          => $this->forgotPasswordSlug,
            'twoFactor'                   => $this->twoFactor,
            'twoFactorEnforced'           => $this->twoFactorEnforced,
            'realtime'                    => $this->realtime,
            'realtimeChannel'             => $this->realtimeChannel,
            'api'                         => $this->apiEnabled,
            'simplePagination'            => $this->simplePagination,
        ];
    }
}
