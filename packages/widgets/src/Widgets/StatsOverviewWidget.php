<?php

namespace Arcane\Widgets;

class StatsOverviewWidget extends Widget
{
    protected array   $stats           = [];
    protected ?string $pollingInterval = '5s'; // null = disabled
    protected bool    $isLazy          = false;

    public function __construct()
    {
        $this->columnSpan = 'full';
    }

    public function stats(array $stats): static
    {
        $this->stats = $stats;
        return $this;
    }

    /**
     * Override in a subclass to provide a dynamic heading.
     * When using the fluent API, call ->heading('My Title') on the instance.
     */
    public function getHeading(): ?string
    {
        return $this->heading;
    }

    /**
     * Override in a subclass to provide a dynamic description.
     */
    public function getDescription(): ?string
    {
        return $this->description;
    }

    /**
     * Override in a subclass to provide stats dynamically.
     * When using the fluent API, call ->stats([...]) on the instance.
     */
    protected function getStats(): array
    {
        return $this->stats;
    }

    public function getType(): string { return 'stats_overview'; }

    public function getData(): array
    {
        return [
            'stats' => array_map(fn(Stat $s) => $s->toArray(), $this->getStats()),
        ];
    }
}
