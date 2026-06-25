<?php

namespace Larafusion\Tables;

class Table
{
    protected array   $columns              = [];
    protected array   $filters              = [];
    protected ?array  $recordActions        = null;
    protected ?array  $toolbarActions       = null;
    protected ?string $defaultSortField     = null;
    protected string  $defaultSortDir       = 'asc';
    // ── Filter layout ─────────────────────────────────────────────────────────
    protected string  $filtersLayout        = 'dropdown'; // dropdown (default) | drawer | modal | above | above_collapsible | below
    protected int     $filtersFormColumns   = 1;
    protected ?string $filtersFormWidth     = null;
    protected ?string $filtersFormMaxHeight = null;
    protected bool    $hideFilterIndicators = false;

    protected bool    $striped              = false;
    protected ?bool   $simplePagination     = null;
    protected bool    $disablePagination    = false;
    protected ?string $heading              = null;
    protected ?string $description         = null;
    protected ?string $emptyStateHeading    = null;
    protected ?string $emptyStateDescription = null;
    protected ?string $emptyStateIcon       = null;
    protected ?string $poll                 = null;
    protected bool    $deferLoading         = false;
    protected bool    $reorderable          = false;
    protected ?string $reorderColumn        = null;
    protected ?string $contentWidth         = null; // 'full' = no max-width constraint; default is max-w-7xl

    public static function make(): static
    {
        return new static();
    }

    // ── Columns ───────────────────────────────────────────────────────────────

    public function columns(array $columns): static
    {
        $this->columns = $columns;
        return $this;
    }

    public function pushColumns(array $columns): static
    {
        $this->columns = array_merge($this->columns, $columns);
        return $this;
    }

    // ── Filters ───────────────────────────────────────────────────────────────

    public function filters(array $filters): static
    {
        $this->filters = $filters;
        return $this;
    }

    // ── Filter layout ─────────────────────────────────────────────────────────

    /**
     * Control where/how the filter panel is shown.
     * Options: 'dropdown' (Filament-style popover) | 'drawer' (slide-in panel, default)
     *          | 'modal' | 'above' | 'above_collapsible' | 'below'
     *          | 'before_content' | 'before_content_collapsible'
     *          | 'after_content'  | 'after_content_collapsible'
     */
    public function filtersLayout(string $layout = 'dropdown'): static
    {
        $this->filtersLayout = $layout;
        return $this;
    }

    /** Number of grid columns when rendering filters (useful for 'above' / 'below' layouts). */
    public function filtersFormColumns(int $columns): static
    {
        $this->filtersFormColumns = $columns;
        return $this;
    }

    /** Max-width of the dropdown/modal filter panel (CSS value, e.g. '20rem'). */
    public function filtersFormWidth(string $width): static
    {
        $this->filtersFormWidth = $width;
        return $this;
    }

    /** Max-height of the dropdown/modal filter panel before scrolling (CSS value, e.g. '400px'). */
    public function filtersFormMaxHeight(string $height): static
    {
        $this->filtersFormMaxHeight = $height;
        return $this;
    }

    /** Hide the active-filter indicator chips shown above the table. */
    public function hiddenFilterIndicators(bool $v = true): static
    {
        $this->hideFilterIndicators = $v;
        return $this;
    }

    // ── Record / Toolbar Actions ──────────────────────────────────────────────

    public function recordActions(array $actions): static
    {
        $this->recordActions = $actions;
        return $this;
    }

    public function toolbarActions(array $actions): static
    {
        $this->toolbarActions = $actions;
        return $this;
    }

    // ── Default Sort ──────────────────────────────────────────────────────────

    public function defaultSort(string $field, string $dir = 'asc'): static
    {
        $this->defaultSortField = $field;
        $this->defaultSortDir   = in_array(strtolower($dir), ['asc', 'desc']) ? strtolower($dir) : 'asc';
        return $this;
    }

    // ── Appearance ────────────────────────────────────────────────────────────

    public function striped(): static
    {
        $this->striped = true;
        return $this;
    }

    public function simplePagination(bool $simple = true): static
    {
        $this->simplePagination = $simple;
        return $this;
    }

    public function disablePagination(bool $disable = true): static
    {
        $this->disablePagination = $disable;
        return $this;
    }

    public function heading(string $heading): static
    {
        $this->heading = $heading;
        return $this;
    }

    public function description(string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function emptyState(string $heading, ?string $description = null, ?string $icon = null): static
    {
        $this->emptyStateHeading     = $heading;
        $this->emptyStateDescription = $description;
        $this->emptyStateIcon        = $icon;
        return $this;
    }

    // ── Behaviour ─────────────────────────────────────────────────────────────

    public function poll(string $interval): static
    {
        $this->poll = $interval;
        return $this;
    }

    public function deferLoading(): static
    {
        $this->deferLoading = true;
        return $this;
    }

    public function reorderable(string $column = 'sort'): static
    {
        $this->reorderable   = true;
        $this->reorderColumn = $column;
        return $this;
    }

    /**
     * Control the max-width of the index page content area.
     * Default is max-w-7xl. Pass 'full' to remove the constraint entirely.
     */
    public function contentWidth(string $width): static
    {
        $this->contentWidth = $width === 'full' ? 'full' : null;
        return $this;
    }

    // ── Getters ───────────────────────────────────────────────────────────────

    public function getColumns(): array        { return $this->columns; }
    public function getFilters(): array        { return $this->filters; }
    public function getRecordActions(): array  { return $this->recordActions  ?? []; }
    public function getToolbarActions(): array { return $this->toolbarActions ?? []; }
    public function getDefaultSortField(): ?string { return $this->defaultSortField; }
    public function getDefaultSortDir(): string    { return $this->defaultSortDir; }

    /**
     * Return sortable field names derived from columns that declared ->sortable().
     * Used by Resource::getSortable() to avoid duplicating the sortable list.
     */
    public function getSortableColumnNames(): array
    {
        $names = [];
        foreach ($this->columns as $col) {
            if (method_exists($col, 'isSortable') && $col->isSortable()) {
                $names[] = $col->getName();
            }
        }
        return $names;
    }

    /**
     * Serialise non-column table config for the React frontend.
     */
    public function toConfig(): array
    {
        $config = ['striped' => $this->striped];
        if ($this->simplePagination !== null) $config['simplePagination'] = $this->simplePagination;
        if ($this->disablePagination)         $config['disablePagination'] = true;
        if ($this->contentWidth)              $config['contentWidth']         = $this->contentWidth;
        if ($this->heading)               $config['heading']              = $this->heading;
        if ($this->description)           $config['description']          = $this->description;
        if ($this->emptyStateHeading)     $config['emptyStateHeading']    = $this->emptyStateHeading;
        if ($this->emptyStateDescription) $config['emptyStateDescription'] = $this->emptyStateDescription;
        if ($this->emptyStateIcon)        $config['emptyStateIcon']       = $this->emptyStateIcon;
        if ($this->poll)                  $config['poll']                 = $this->poll;
        if ($this->deferLoading)          $config['deferLoading']         = true;
        if ($this->reorderable)           $config['reorderable']          = $this->reorderColumn;

        // Serialize standalone filters for React
        if (!empty($this->filters)) {
            $config['standaloneFilters'] = array_map(fn($f) => $f->toArray(), $this->filters);
        }

        // Filter layout config
        $config['filtersLayout']          = $this->filtersLayout;
        $config['filtersFormColumns']     = $this->filtersFormColumns;
        $config['hideFilterIndicators']   = $this->hideFilterIndicators;
        if ($this->filtersFormWidth)      $config['filtersFormWidth']     = $this->filtersFormWidth;
        if ($this->filtersFormMaxHeight)  $config['filtersFormMaxHeight'] = $this->filtersFormMaxHeight;

        // Only include when explicitly set — null means legacy resource (no explicit actions defined)
        if ($this->recordActions !== null) {
            $config['recordActions'] = array_map(fn($a) => $a->toArray(), $this->recordActions);
        }
        if ($this->toolbarActions !== null) {
            $config['toolbarActions'] = array_map(fn($a) => $a->toArray(), $this->toolbarActions);
        }

        // Default sort (only include if explicitly set)
        if ($this->defaultSortField !== null) {
            $config['defaultSort'] = ['field' => $this->defaultSortField, 'dir' => $this->defaultSortDir];
        }

        return $config;
    }
}
