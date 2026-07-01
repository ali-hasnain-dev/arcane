<?php

namespace Larafusion\Columns;

class Column
{
    protected string  $name;
    protected string  $label;
    protected string  $type          = 'text';
    protected bool    $sortable      = false;
    protected bool    $searchable    = false;
    protected bool    $inlineEditable = false;
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
        // Dot-notation relationship columns (e.g. 'category.name') humanize the
        // full path so the header reads "Category Name" rather than "Category.name".
        $this->label = ucwords(str_replace(['_', '-', '.'], ' ', $name));
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

    /**
     * Mark this column for the table's global search box (Filament-style).
     * The resource auto-collects every searchable column into its search set —
     * no separate `$searchable` array needed. Works on relationship columns too
     * (e.g. TextColumn::make('author.name')->searchable() searches via the
     * related table). This is search, not filtering — use ->filterable() for
     * a per-column filter control.
     */
    public function searchable(bool $v = true): static
    {
        $this->searchable = $v;
        return $this;
    }

    /**
     * Allow this column to be edited inline in the index table. The resource
     * auto-collects inline-editable columns — no separate array needed. Only
     * makes sense for plain (non-relationship) columns backed by a form field.
     */
    public function inlineEditable(bool $v = true): static
    {
        $this->inlineEditable = $v;
        return $this;
    }

    public function toggleable(bool $hiddenByDefault = false): static
    {
        $this->toggleable              = true;
        $this->toggledHiddenByDefault  = $hiddenByDefault;
        return $this;
    }

    // ── Getters ───────────────────────────────────────────────────────────────
    public function getName(): string        { return $this->name; }
    public function isSortable(): bool       { return $this->sortable; }
    public function isSearchable(): bool     { return $this->searchable; }
    public function isInlineEditable(): bool { return $this->inlineEditable; }

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
