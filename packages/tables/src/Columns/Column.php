<?php

namespace Larafusion\Columns;

class Column
{
    protected string  $name;
    protected string  $label;
    protected string  $type          = 'text';
    protected bool    $sortable      = false;
    protected bool    $filterable    = false;
    protected string  $filterType    = 'text';
    protected array   $filterOptions = [];
    protected bool    $visible       = true;
    protected string  $align         = 'left';
    protected ?string $width         = null;
    protected bool    $toggleable    = false;
    protected bool    $toggledHiddenByDefault = false;

    public function __construct(string $name)
    {
        $this->name  = $name;
        $this->label = ucwords(str_replace(['_', '-'], ' ', $name));
    }

    // ── Factories (backward-compatible shortcuts) ─────────────────────────────
    public static function make(string $name): static    { return new static($name); }
    public static function text(string $name): static    { return (new static($name))->type('text'); }
    public static function badge(string $name): static   { return (new static($name))->type('badge'); }
    public static function boolean(string $name): static { return (new static($name))->type('boolean'); }
    public static function date(string $name): static    { return (new static($name))->type('date'); }
    public static function image(string $name): static   { return (new static($name))->type('image'); }
    public static function number(string $name): static  { return (new static($name))->type('number'); }

    // ── Fluent setters ────────────────────────────────────────────────────────
    public function label(string $label): static         { $this->label    = $label; return $this; }
    public function type(string $type): static           { $this->type     = $type;  return $this; }
    public function align(string $align): static         { $this->align    = $align; return $this; }
    public function width(string $width): static         { $this->width    = $width; return $this; }
    public function hidden(bool $v = true): static       { $this->visible  = !$v;    return $this; }

    public function sortable(bool $v = true): static
    {
        $this->sortable = $v;
        return $this;
    }

    public function filterable(string $type = 'text'): static
    {
        $this->filterable = true;
        $this->filterType = $type;
        return $this;
    }

    public function filterOptions(array $options): static
    {
        $this->filterable    = true;
        $this->filterType    = 'select';
        $this->filterOptions = $options;
        return $this;
    }

    public function searchable(): static
    {
        return $this->filterable('text');
    }

    public function toggleable(bool $hiddenByDefault = false): static
    {
        $this->toggleable              = true;
        $this->toggledHiddenByDefault  = $hiddenByDefault;
        return $this;
    }

    // ── Getters ───────────────────────────────────────────────────────────────
    public function getName(): string  { return $this->name; }
    public function isSortable(): bool { return $this->sortable; }

    public function toArray(): array
    {
        $arr = [
            'name'     => $this->name,
            'label'    => $this->label,
            'type'     => $this->type,
            'sortable' => $this->sortable,
            'visible'  => $this->visible,
            'align'    => $this->align,
        ];
        if ($this->width)                   $arr['width']         = $this->width;
        if ($this->filterable)              $arr['filterable']    = true;
        if ($this->filterable)              $arr['filterType']    = $this->filterType;
        if (!empty($this->filterOptions))   $arr['filterOptions'] = $this->filterOptions;
        if ($this->toggleable)              $arr['toggleable']    = true;
        if ($this->toggledHiddenByDefault)  $arr['toggledHiddenByDefault'] = true;
        return $arr;
    }
}
