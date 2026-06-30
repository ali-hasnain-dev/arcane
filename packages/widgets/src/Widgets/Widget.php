<?php

namespace Larafusion\Widgets;

abstract class Widget
{
    protected int|string $columnSpan      = 1;
    protected ?string    $heading         = null;
    protected ?string    $description     = null;
    protected int        $sort            = 0;
    /**
     * Polling interval. Set to null to disable polling entirely.
     * Supports 's' (seconds), 'm' (minutes), 'h' (hours) — e.g. '30s', '5m'.
     * Default: '30s'.
     */
    protected ?string    $pollingInterval = '30s';
    protected bool       $isLazy          = false;

    public static function make(): static
    {
        return new static();
    }

    public function columnSpan(int|string $n): static    { $this->columnSpan      = $n;    return $this; }
    public function heading(string $h): static           { $this->heading         = $h;    return $this; }
    public function description(string $d): static       { $this->description     = $d;    return $this; }
    public function sort(int $s): static                 { $this->sort            = $s;    return $this; }
    public function pollingInterval(?string $i): static  { $this->pollingInterval = $i;    return $this; }
    public function lazy(bool $lazy = true): static      { $this->isLazy          = $lazy; return $this; }
    /** Shortcut: make the widget span the full row width. */
    public function fullWidth(): static                  { $this->columnSpan      = 'full'; return $this; }

    /** Override to hide a widget based on permissions. */
    public static function canView(): bool
    {
        return true;
    }

    public function getHeading(): ?string     { return $this->heading; }
    public function getDescription(): ?string { return $this->description; }

    abstract public function getType(): string;
    abstract public function getData(): array;

    /**
     * Metadata only — cheap to serialize, no DB queries.
     * Used by DashboardController so the page loads fast and React
     * fetches each widget's data independently.
     */
    public function toMeta(): array
    {
        return [
            'widgetClass'     => static::class,
            'type'            => $this->getType(),
            'heading'         => $this->getHeading(),
            'description'     => $this->getDescription(),
            'columnSpan'      => $this->columnSpan,
            'sort'            => $this->sort,
            'pollingInterval' => $this->pollingInterval,
            'isLazy'          => $this->isLazy,
        ];
    }

    /** Full serialization (metadata + data). Used by the widget data endpoint. */
    public function toArray(): array
    {
        return array_merge($this->toMeta(), $this->getData());
    }
}
