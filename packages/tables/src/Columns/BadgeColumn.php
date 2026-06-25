<?php

namespace Larafusion\Columns;

use Larafusion\Support\Enums\EnumOptions;

class BadgeColumn extends Column
{
    /** value → tailwind color name: 'primary'|'success'|'warning'|'danger'|'info'|'gray' */
    protected array $colors = [];
    /** value → lucide icon name */
    protected array $icons  = [];
    /** value → human-readable label */
    protected array $labels = [];

    public static function make(string $name): static
    {
        return (new static($name))->type('badge');
    }

    /**
     * Map a single value (or array of values) to a color.
     *
     * ->color('success', 'active')
     * ->color('danger', ['archived', 'deleted'])
     */
    public function color(string $color, string|array $values): static
    {
        foreach ((array) $values as $v) {
            $this->colors[$v] = $color;
        }
        return $this;
    }

    /**
     * Map an entire value→color dictionary at once (Filament style).
     *
     * ->colors(['success' => 'active', 'danger' => ['archived', 'deleted']])
     */
    public function colors(array $map): static
    {
        foreach ($map as $color => $values) {
            foreach ((array) $values as $v) {
                $this->colors[$v] = $color;
            }
        }
        return $this;
    }

    /** Map value → lucide icon name. */
    public function icons(array $map): static
    {
        $this->icons = $map;
        return $this;
    }

    /**
     * Populate labels, colors, and icons automatically from a BackedEnum class.
     *
     * The enum may implement HasLabel, HasColor, and/or HasIcon.
     * Also registers an enum-based filter on this column.
     *
     * @param  class-string  $enumClass
     */
    public function enum(string $enumClass): static
    {
        $this->labels = EnumOptions::toOptions($enumClass);
        $colors       = EnumOptions::toColors($enumClass);
        $icons        = EnumOptions::toIcons($enumClass);

        if (!empty($colors)) $this->colors = array_merge($this->colors, $colors);
        if (!empty($icons))  $this->icons  = array_merge($this->icons,  $icons);

        // Auto-register a select filter with enum labels as options.
        $this->filterable  = true;
        $this->filterType  = 'select';
        $this->filterOptions = array_map(
            fn ($value, $label) => ['value' => $value, 'label' => $label],
            array_keys($this->labels),
            array_values($this->labels)
        );

        return $this;
    }

    public function searchable(): static { return $this->filterable('select'); }

    public function toArray(): array
    {
        $arr = parent::toArray();
        if (!empty($this->labels)) $arr['labels'] = $this->labels;
        if (!empty($this->colors)) $arr['colors'] = $this->colors;
        if (!empty($this->icons))  $arr['icons']  = $this->icons;
        return $arr;
    }
}
