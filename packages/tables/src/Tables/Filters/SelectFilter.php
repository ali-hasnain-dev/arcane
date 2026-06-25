<?php

namespace Larafusion\Tables\Filters;

use Larafusion\Support\Enums\EnumOptions;

class SelectFilter extends Filter
{
    protected array $options    = [];
    protected bool  $multiple   = false;
    protected bool  $searchable = false;

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
            $this->options = EnumOptions::toOptions($options);
        } else {
            $this->options = is_array($options) ? $options : [];
        }
        return $this;
    }
    public function multiple(): static                { $this->multiple   = true;     return $this; }
    public function searchable(): static              { $this->searchable = true;     return $this; }

    public function applyToQuery($query, mixed $value): void
    {
        if ($this->query) {
            call_user_func($this->query, $query, $value);
            return;
        }

        $column = $this->getAttribute();

        if (is_array($value) && !empty($value)) {
            $query->whereIn($column, $value);
        } elseif (is_string($value) && str_contains($value, ',')) {
            $query->whereIn($column, array_map('trim', explode(',', $value)));
        } elseif ($value !== null && $value !== '') {
            $query->where($column, $value);
        }
    }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'options'    => $this->options,
            'multiple'   => $this->multiple,
            'searchable' => $this->searchable,
        ]);
    }
}
