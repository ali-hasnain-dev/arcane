<?php

namespace Larafusion\Tables\Filters;

use Larafusion\Support\Enums\EnumOptions;

class SelectFilter extends Filter
{
    protected array $options    = [];
    protected bool  $multiple   = false;
    protected bool  $searchable = false;

    // ── Per-option metadata (value → color / icon / description) ────────────────
    // Auto-populated when options() is given an enum implementing HasColor /
    // HasIcon / HasDescription; also settable manually via colors()/icons().
    protected array $optionColors       = [];
    protected array $optionIcons        = [];
    protected array $optionDescriptions = [];

    // Visibility toggles — let a filter opt out of enum-provided metadata without
    // touching the enum itself (e.g. show plain labels even though the enum has
    // colors/icons). Checked at serialization, so order vs options() doesn't matter.
    protected bool $showColors       = true;
    protected bool $showIcons        = true;
    protected bool $showDescriptions = true;

    // ── Relationship-backed options ────────────────────────────────────────────
    protected ?string   $relationship          = null;
    protected string    $relationshipTitleColumn = 'name';
    protected ?\Closure  $modifyRelationshipQuery = null;

    public function __construct(string $name)
    {
        parent::__construct($name);
        $this->type = 'select';
    }

    /**
     * Set filter options from an array or a BackedEnum class string.
     *
     * @param  array<string|int, string>|class-string  $options
     */
    public function options(array|string $options): static
    {
        if (is_string($options) && EnumOptions::isEnumClass($options)) {
            // Enum → labels + any color/icon/description the enum exposes, so the
            // filter renders the same badges/icons as the enum does elsewhere.
            $this->options            = EnumOptions::toOptions($options);
            $this->optionColors       = EnumOptions::toColors($options);
            $this->optionIcons        = EnumOptions::toIcons($options);
            $this->optionDescriptions = EnumOptions::toDescriptions($options);
        } else {
            $this->options = is_array($options) ? $options : [];
        }
        return $this;
    }

    /**
     * Manually map option values to colors (value => 'success'|'danger'|…).
     * Merges over any enum-derived colors.
     *
     * @param  array<string|int, string>  $map
     */
    public function colors(array $map): static
    {
        $this->optionColors = array_merge($this->optionColors, $map);
        return $this;
    }

    /**
     * Manually map option values to icon names (value => 'check-circle'|…).
     *
     * @param  array<string|int, string>  $map
     */
    public function icons(array $map): static
    {
        $this->optionIcons = array_merge($this->optionIcons, $map);
        return $this;
    }

    /**
     * Manually map option values to helper descriptions shown under each option.
     *
     * @param  array<string|int, string>  $map
     */
    public function descriptions(array $map): static
    {
        $this->optionDescriptions = array_merge($this->optionDescriptions, $map);
        return $this;
    }

    // ── Opt out of enum-provided metadata ──────────────────────────────────────
    // Use these when the enum defines colors/icons/descriptions but you want a
    // plainer filter. Each takes an optional condition so it can be toggled.

    /** Hide option colors (render neutral chips/labels instead of colored ones). */
    public function withoutColors(bool $condition = true): static       { $this->showColors       = ! $condition; return $this; }

    /** Hide option icons. */
    public function withoutIcons(bool $condition = true): static        { $this->showIcons        = ! $condition; return $this; }

    /** Hide the per-option description helper text. */
    public function withoutDescriptions(bool $condition = true): static { $this->showDescriptions = ! $condition; return $this; }

    /**
     * Hide all enum-provided metadata at once — labels only, no color/icon/description.
     * Equivalent to withoutColors()->withoutIcons()->withoutDescriptions().
     */
    public function plain(bool $condition = true): static
    {
        return $this
            ->withoutColors($condition)
            ->withoutIcons($condition)
            ->withoutDescriptions($condition);
    }

    public function multiple(): static   { $this->multiple   = true; return $this; }
    public function searchable(): static { $this->searchable = true; return $this; }

    /**
     * Filament-style: no-op here because relationship options are always
     * serialized to the client. Accepted for API compatibility so copied
     * Filament code keeps working.
     */
    public function preload(bool $condition = true): static { return $this; }

    /**
     * Populate the filter from an Eloquent relationship on the resource model.
     * Options become [relatedKey => titleAttribute]; filtering runs through the
     * relationship via whereHas, so it works for belongsTo/hasMany/belongsToMany.
     *
     * @param  string        $name             Relationship method on the model, e.g. 'category'
     * @param  string        $titleAttribute   Column on the related model to display, e.g. 'name'
     * @param  \Closure|null $modifyQueryUsing Optional closure to scope the options query ($query)
     */
    public function relationship(string $name, string $titleAttribute = 'name', ?\Closure $modifyQueryUsing = null): static
    {
        $this->relationship            = $name;
        $this->relationshipTitleColumn = $titleAttribute;
        $this->modifyRelationshipQuery = $modifyQueryUsing;
        return $this;
    }

    public function getRelationship(): ?string { return $this->relationship; }
    public function hasRelationship(): bool    { return $this->relationship !== null; }

    /**
     * Resolve the option map for a relationship filter using the resource model.
     * Falls back to any statically-provided options if the relationship can't be
     * resolved or none was set. Called during serialization where the model is known.
     *
     * @return array<int|string, string>
     */
    public function resolveOptions(?string $modelClass): array
    {
        if ($this->relationship === null || $modelClass === null || ! class_exists($modelClass)) {
            return $this->options;
        }

        try {
            $model    = new $modelClass;
            $relation = $model->{$this->relationship}();
            $related  = $relation->getRelated();
            $query    = $related->newQuery();

            if ($this->modifyRelationshipQuery) {
                call_user_func($this->modifyRelationshipQuery, $query);
            }

            return $query
                ->pluck($this->relationshipTitleColumn, $related->getKeyName())
                ->map(fn ($v) => (string) $v)
                ->all();
        } catch (\Throwable $e) {
            return $this->options;
        }
    }

    public function applyToQuery($query, mixed $value): void
    {
        if ($this->query) {
            call_user_func($this->query, $query, $value);
            return;
        }

        $values = $this->normalizeValues($value);
        if (empty($values)) {
            return;
        }

        // Relationship filter → constrain via the relationship's key.
        if ($this->relationship !== null) {
            $query->whereHas($this->relationship, fn ($q) => $q->whereKey($values));
            return;
        }

        $column = $this->getAttribute();
        if (count($values) > 1) {
            $query->whereIn($column, $values);
        } else {
            $query->where($column, $values[0]);
        }
    }

    /**
     * Normalise an incoming filter value (array, comma-string, or scalar) into a
     * clean list of non-empty values.
     *
     * @return array<int, mixed>
     */
    protected function normalizeValues(mixed $value): array
    {
        if (is_array($value)) {
            return array_values(array_filter($value, fn ($v) => $v !== null && $v !== ''));
        }

        if (is_string($value) && str_contains($value, ',')) {
            return array_values(array_filter(array_map('trim', explode(',', $value)), fn ($v) => $v !== ''));
        }

        if ($value === null || $value === '') {
            return [];
        }

        return [$value];
    }

    public function toArray(): array
    {
        $arr = array_merge(parent::toArray(), [
            'options'    => $this->options,
            'multiple'   => $this->multiple,
            'searchable' => $this->searchable,
        ]);

        // Only serialize metadata maps when present AND not opted out — keeping
        // the payload lean and honoring withoutColors()/withoutIcons()/etc.
        if ($this->showColors       && $this->optionColors)       $arr['optionColors']       = $this->optionColors;
        if ($this->showIcons        && $this->optionIcons)        $arr['optionIcons']        = $this->optionIcons;
        if ($this->showDescriptions && $this->optionDescriptions) $arr['optionDescriptions'] = $this->optionDescriptions;

        return $arr;
    }
}
