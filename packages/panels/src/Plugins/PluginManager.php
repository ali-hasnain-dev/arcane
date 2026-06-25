<?php

namespace Larafusion\Plugins;

use Illuminate\Support\Collection;

class PluginManager
{
    /** @var LarafusionPlugin[] */
    protected array $plugins = [];

    /** @var array<string, callable[]> */
    protected array $hooks = [];

    // ── Registration ──────────────────────────────────────────────────────────

    public function register(string|array $pluginClasses): void
    {
        $classes = is_array($pluginClasses) ? $pluginClasses : [$pluginClasses];

        foreach ($classes as $class) {
            if (isset($this->plugins[$class::id()])) continue;

            $plugin = new $class();
            $this->plugins[$class::id()] = $plugin;

            // Register hooks declared by plugin
            foreach ($plugin->hooks() as $event => $handler) {
                $this->on($event, $handler);
            }

            // Boot the plugin
            $plugin->boot();
        }
    }

    public function get(string $id): ?LarafusionPlugin
    {
        return $this->plugins[$id] ?? null;
    }

    public function all(): array
    {
        return $this->plugins;
    }

    // ── Hook system ───────────────────────────────────────────────────────────

    /**
     * Register a hook listener.
     *
     * Available events:
     *   record.creating  — before a record is created ($data array)
     *   record.created   — after a record is created ($record model)
     *   record.updating  — before a record is updated ($record, $data)
     *   record.updated   — after a record is updated ($record)
     *   record.deleting  — before a record is deleted ($record)
     *   record.deleted   — after a record is deleted ($record)
     *   page.rendering   — before Inertia renders a page ($props)
     *   navigation.built — after navigation is built ($items)
     */
    public function on(string $event, callable $handler): void
    {
        $this->hooks[$event][] = $handler;
    }

    /**
     * Fire an event and return (possibly modified) payload.
     * Listeners can modify the payload by returning a new value.
     */
    public function fire(string $event, mixed $payload = null): mixed
    {
        foreach ($this->hooks[$event] ?? [] as $handler) {
            $result = $handler($payload);
            if ($result !== null) {
                $payload = $result;
            }
        }
        return $payload;
    }

    // ── Navigation ────────────────────────────────────────────────────────────

    /**
     * Collect navigation items from all plugins.
     */
    public function navigationItems(): array
    {
        $items = [];
        foreach ($this->plugins as $plugin) {
            foreach ($plugin->navigationItems() as $item) {
                $items[] = array_merge([
                    'plugin' => $plugin::id(),
                    'icon'   => 'circle',
                    'badge'  => null,
                ], $item);
            }
        }
        return $items;
    }

    // ── Custom fields ─────────────────────────────────────────────────────────

    /**
     * Collect all custom field types registered by plugins.
     * Returns a map of type-slug → field class.
     */
    public function customFieldTypes(): array
    {
        $types = [];
        foreach ($this->plugins as $plugin) {
            foreach ($plugin->customFields() as $fieldClass) {
                $instance = new $fieldClass('__probe');
                $types[$instance->getType()] = $fieldClass;
            }
        }
        return $types;
    }

    // ── Assets ────────────────────────────────────────────────────────────────

    /**
     * All plugin asset URLs to inject into the page.
     */
    public function assets(): array
    {
        $assets = [];
        foreach ($this->plugins as $plugin) {
            foreach ($plugin->assets() as $asset) {
                $assets[] = $asset;
            }
        }
        return array_unique($assets);
    }

    // ── Metadata for frontend ─────────────────────────────────────────────────

    /**
     * Serialise plugin registry for the React frontend.
     */
    public function toArray(): array
    {
        return array_map(fn(LarafusionPlugin $p) => [
            'id'          => $p::id(),
            'name'        => $p::name(),
            'version'     => $p::version(),
            'description' => $p::description(),
            'components'  => $p->components(),
        ], $this->plugins);
    }
}
