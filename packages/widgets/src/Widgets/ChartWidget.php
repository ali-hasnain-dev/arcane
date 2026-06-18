<?php

namespace Arcane\Widgets;

class ChartWidget extends Widget
{
    /**
     * Supported chart types (matches Chart.js types):
     * 'line' | 'bar' | 'doughnut' | 'pie' | 'radar' | 'polar-area' | 'bubble' | 'scatter'
     */
    protected string  $chartType          = 'line';
    protected array   $labels             = [];
    protected array   $datasets           = [];

    /** Semantic color token: 'primary'|'success'|'warning'|'danger'|'info'|'gray' */
    protected string  $color              = 'primary';

    /** Key-value filter options shown in the dropdown e.g. ['today' => 'Today', 'week' => 'This Week'] */
    protected array   $filterOptions      = [];

    /** The currently active filter key */
    protected ?string $activeFilter       = null;

    /** When true, filter changes are buffered until the user clicks "Apply" */
    protected bool    $hasDeferredFilters = false;

    /** CSS max-height for the chart area e.g. '300px' */
    protected ?string $maxHeight          = null;

    /** Chart.js compatible options array merged with the default config */
    protected array   $options            = [];

    protected bool    $isCollapsible      = false;
    protected bool    $isCollapsed        = false;
    protected bool    $isLazy             = false;

    public function __construct()
    {
        $this->columnSpan = 2;
    }

    // ── Fluent setters ────────────────────────────────────────────────────────

    public function chartType(string $t): static         { $this->chartType          = $t;    return $this; }
    public function labels(array $l): static             { $this->labels             = $l;    return $this; }

    /**
     * Each dataset: ['label' => 'Name', 'data' => [1,2,3], 'color' => '#7c3aed']
     * For bubble/scatter: 'data' should be [{x, y, r?}] arrays
     */
    public function datasets(array $d): static           { $this->datasets           = $d;    return $this; }
    public function color(string $c): static             { $this->color              = $c;    return $this; }
    public function filters(array $opts): static         { $this->filterOptions      = $opts; return $this; }
    public function defaultFilter(string $f): static     { $this->activeFilter       = $f;    return $this; }
    public function deferFilters(bool $b = true): static { $this->hasDeferredFilters = $b;    return $this; }
    public function maxHeight(string $h): static         { $this->maxHeight          = $h;    return $this; }
    public function options(array $o): static            { $this->options            = $o;    return $this; }
    public function collapsible(bool $b = true): static  { $this->isCollapsible      = $b;    return $this; }
    public function collapsed(bool $b = true): static    { $this->isCollapsed        = $b;    return $this; }

    // ── Overrideable in subclasses ─────────────────────────────────────────────

    /**
     * Return key-value pairs for the filter dropdown.
     * Override in a subclass; when using the fluent API call ->filters([...]).
     *
     * @return array<string, string>  e.g. ['today' => 'Today', 'week' => 'This Week']
     */
    public function getFilters(): array
    {
        return $this->filterOptions;
    }

    /**
     * Override to return Chart.js options merged on top of defaults.
     */
    public function getOptions(): array
    {
        return $this->options;
    }

    public function getType(): string { return 'chart'; }

    public function getData(): array
    {
        return [
            'chartType'          => $this->chartType,
            'color'              => $this->color,
            'labels'             => array_values($this->labels),
            'datasets'           => array_values($this->datasets),
            'filterOptions'      => $this->getFilters(),
            'activeFilter'       => $this->activeFilter,
            'hasDeferredFilters' => $this->hasDeferredFilters,
            'maxHeight'          => $this->maxHeight,
            'options'            => $this->getOptions(),
            'isCollapsible'      => $this->isCollapsible,
            'isCollapsed'        => $this->isCollapsed,
        ];
    }
}
