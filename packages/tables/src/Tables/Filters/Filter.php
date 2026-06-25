<?php

namespace Larafusion\Tables\Filters;

class Filter
{
    protected string    $name;
    protected string    $label;
    protected string    $type     = 'boolean';
    protected ?\Closure $query    = null;
    protected mixed     $default  = null;
    protected ?string   $attribute = null;
    protected ?string   $indicator = null;

    public function __construct(string $name)
    {
        $this->name  = $name;
        $this->label = ucwords(str_replace(['_', '-'], ' ', $name));
    }

    public static function make(string $name): static
    {
        return new static($name);
    }

    // ── Configuration ─────────────────────────────────────────────────────────

    public function label(string $label): static      { $this->label     = $label;     return $this; }
    public function query(\Closure $cb): static        { $this->query     = $cb;        return $this; }
    public function default(mixed $value): static      { $this->default   = $value;    return $this; }
    public function attribute(string $column): static  { $this->attribute = $column;   return $this; }
    public function indicator(string $label): static   { $this->indicator = $label;    return $this; }

    // ── Getters ───────────────────────────────────────────────────────────────

    public function getName(): string      { return $this->name; }
    public function getQuery(): ?\Closure  { return $this->query; }
    public function getAttribute(): string { return $this->attribute ?? $this->name; }

    /**
     * Apply this filter to the Eloquent query builder.
     * Override in subclasses for type-specific logic.
     */
    public function applyToQuery($query, mixed $value): void
    {
        if ($this->query) {
            call_user_func($this->query, $query, $value);
            return;
        }

        $column = $this->getAttribute();
        if (in_array($value, ['true', 'false', '1', '0'], true)) {
            $query->where($column, filter_var($value, FILTER_VALIDATE_BOOLEAN));
        } else {
            $query->where($column, 'like', "%{$value}%");
        }
    }

    public function toArray(): array
    {
        return [
            'name'      => $this->name,
            'label'     => $this->label,
            'type'      => $this->type,
            'default'   => $this->default,
            'indicator' => $this->indicator,
        ];
    }
}
