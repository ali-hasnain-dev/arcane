<?php

namespace Larafusion;

use InvalidArgumentException;
use Larafusion\Plugins\PluginManager;
use Larafusion\Themes\ThemeManager;
use Larafusion\Navigation\NavigationGroup;

class LarafusionManager
{
    protected static array        $resources      = [];
    protected static array        $widgets        = [];
    protected static array        $pages          = [];
    protected static array        $navGroups      = [];
    protected static array        $extraNavItems  = [];
    protected static ?PluginManager $plugins  = null;
    protected static ?ThemeManager  $theme    = null;
    protected static ?Panel         $panel    = null;

    // ── Panel (PanelProvider registration) ───────────────────────────────────

    public static function registerPanel(Panel $panel): void
    {
        static::$panel = $panel;

        // Use explicitly registered resources, or auto-discover from app/Larafusion/
        $resources = $panel->getResources();
        if (empty($resources)) {
            $resources = static::discoverResources(app_path('Larafusion'));
        }
        if (!empty($resources)) {
            static::register($resources);
        }

        if (!empty($panel->getPages())) {
            static::registerPages($panel->getPages());
        }

        if (!empty($panel->getWidgets())) {
            static::registerWidgets($panel->getWidgets());
        }

        if (!empty($panel->getPlugins())) {
            static::plugins()->register($panel->getPlugins());
        }

        if (!empty($panel->getNavigationItems())) {
            static::registerExtraNavItems($panel->getNavigationItems());
        }
    }

    /**
     * Scan a directory recursively for classes that extend Larafusion\Resource.
     * Uses PSR-4 convention: files under app/ → App\ namespace.
     */
    public static function discoverResources(string $directory): array
    {
        if (!is_dir($directory)) {
            return [];
        }

        $found    = [];
        $appPath  = app_path();

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($directory, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::LEAVES_ONLY
        );

        foreach ($iterator as $file) {
            if ($file->getExtension() !== 'php') {
                continue;
            }

            // Derive PSR-4 class name: app/Larafusion/Resources/Users/UserResource.php → App\Larafusion\Resources\Users\UserResource
            $relativePath = ltrim(str_replace($appPath, '', $file->getPathname()), DIRECTORY_SEPARATOR . '/');
            $className    = 'App\\' . str_replace(['/', DIRECTORY_SEPARATOR], '\\', substr($relativePath, 0, -4));

            if (
                class_exists($className) &&
                is_subclass_of($className, \Larafusion\Resource::class)
            ) {
                $found[] = $className;
            }
        }

        return $found;
    }

    public static function registerExtraNavItems(array $items): void
    {
        foreach ($items as $item) {
            static::$extraNavItems[] = array_merge([
                'type'   => 'item',
                'plugin' => null,
                'badge'  => null,
                'group'  => null,
                'sort'   => 0,
            ], $item);
        }
    }

    public static function getPanel(): ?Panel
    {
        return static::$panel;
    }

    // ── Resources ─────────────────────────────────────────────────────────────

    public static function register(string|array $resourceClasses): void
    {
        $classes = is_array($resourceClasses) ? $resourceClasses : [$resourceClasses];
        foreach ($classes as $class) {
            static::$resources[$class::getSlug()] = $class;
        }
    }

    public static function resolve(string $slug): string
    {
        if (!isset(static::$resources[$slug])) {
            throw new InvalidArgumentException("Larafusion resource [{$slug}] is not registered.");
        }
        return static::$resources[$slug];
    }

    public static function all(): array { return static::$resources; }

    // ── Widgets ───────────────────────────────────────────────────────────────

    public static function registerWidgets(array $widgets): void
    {
        foreach ($widgets as $widget) {
            static::$widgets[] = $widget;
        }
    }

    public static function getWidgets(): array { return static::$widgets; }

    public static function getNavigation(): array
    {
        // Build flat item list from resources
        $items = [];
        foreach (static::$resources as $slug => $class) {
            $items[] = [
                'type'   => 'item',
                'label'  => $class::getNavigationLabel(),
                'icon'   => $class::getNavigationIcon(),
                'slug'   => $slug,
                'url'    => route('larafusion.resource.index', $slug),
                'plugin' => null,
                'badge'  => $class::getNavigationBadge(),
                'group'  => $class::getNavigationGroup(),
                'sort'   => $class::getNavigationSort(),
            ];
        }

        // Add custom page items
        foreach (static::$pages as $slug => $class) {
            if (!$class::showInNavigation()) continue;
            $items[] = [
                'type'   => 'item',
                'label'  => $class::getNavigationLabel(),
                'icon'   => $class::getNavigationIcon(),
                'slug'   => $slug,
                'url'    => route('larafusion.page.show', $slug),
                'plugin' => null,
                'badge'  => null,
                'group'  => $class::getNavigationGroup(),
                'sort'   => $class::getNavigationSort(),
            ];
        }

        // Merge extra nav items registered via Panel::navigationItems()
        foreach (static::$extraNavItems as $item) {
            $items[] = $item;
        }

        // Merge plugin navigation items
        foreach (static::plugins()->navigationItems() as $item) {
            $items[] = array_merge(['type' => 'item', 'group' => null, 'sort' => 0], $item);
        }

        usort($items, fn($a, $b) => $a['sort'] <=> $b['sort']);

        // Separate ungrouped items from grouped
        $ungrouped = array_values(array_filter($items, fn($i) => $i['group'] === null));
        $grouped   = array_filter($items, fn($i) => $i['group'] !== null);

        // Build group nodes
        $groupNodes = [];
        foreach ($grouped as $item) {
            $key = $item['group'];
            if (!isset($groupNodes[$key])) {
                $cfg = static::$navGroups[$key] ?? null;
                $groupNodes[$key] = array_merge(
                    $cfg ? $cfg->toArray() : ['label' => $key, 'icon' => null, 'collapsible' => true, 'collapsed' => false, 'sort' => 0],
                    ['type' => 'group', 'items' => []]
                );
            }
            $groupNodes[$key]['items'][] = $item;
        }

        usort($groupNodes, fn($a, $b) => $a['sort'] <=> $b['sort']);

        return array_values(array_merge($ungrouped, array_values($groupNodes)));
    }

    // ── Nav Groups ────────────────────────────────────────────────────────────

    public static function registerNavGroup(string $key, NavigationGroup $group): void
    {
        static::$navGroups[$key] = $group;
    }

    // ── Pages ─────────────────────────────────────────────────────────────────

    public static function registerPages(array $pageClasses): void
    {
        foreach ($pageClasses as $class) {
            static::$pages[$class::getSlug()] = $class;
        }
    }

    public static function resolvePage(string $slug): string
    {
        if (!isset(static::$pages[$slug])) {
            abort(404, "Larafusion page [{$slug}] is not registered.");
        }
        return static::$pages[$slug];
    }

    public static function allPages(): array { return static::$pages; }

    // ── Plugins ───────────────────────────────────────────────────────────────

    public static function plugins(): PluginManager
    {
        if (!static::$plugins) {
            static::$plugins = new PluginManager();
        }
        return static::$plugins;
    }

    public static function plugin(string $id): ?\Larafusion\Plugins\LarafusionPlugin
    {
        return static::plugins()->get($id);
    }

    // ── Theme ─────────────────────────────────────────────────────────────────

    public static function theme(): ThemeManager
    {
        if (!static::$theme) {
            static::$theme = new ThemeManager();
        }
        return static::$theme;
    }

    // ── Hooks shorthand ───────────────────────────────────────────────────────

    public static function on(string $event, callable $handler): void
    {
        static::plugins()->on($event, $handler);
    }

    public static function fire(string $event, mixed $payload = null): mixed
    {
        return static::plugins()->fire($event, $payload);
    }
}
