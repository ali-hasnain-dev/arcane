<?php

namespace Arcane\Layout;

class Section
{
    protected string  $label       = '';
    protected ?string $description = null;
    protected ?string $icon        = null;
    protected int     $columns     = 1;
    protected bool    $collapsible = false;
    protected bool    $collapsed   = false;
    protected array   $schema      = [];

    public function __construct(string $label = '')
    {
        $this->label = $label;
    }

    public static function make(string $label = ''): static
    {
        return new static($label);
    }

    public function description(string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function icon(string $icon): static
    {
        $this->icon = $icon;
        return $this;
    }

    public function columns(int $columns): static
    {
        $this->columns = $columns;
        return $this;
    }

    public function collapsible(bool $collapsible = true): static
    {
        $this->collapsible = $collapsible;
        return $this;
    }

    public function collapsed(bool $collapsed = true): static
    {
        $this->collapsed   = $collapsed;
        $this->collapsible = true;
        return $this;
    }

    public function schema(array $schema): static
    {
        $this->schema = $schema;
        return $this;
    }

    public function getSchema(): array
    {
        return $this->schema;
    }

    public function toArray(): array
    {
        return [
            'type'        => 'section',
            'label'       => $this->label,
            'description' => $this->description,
            'icon'        => $this->icon,
            'columns'     => $this->columns,
            'collapsible' => $this->collapsible,
            'collapsed'   => $this->collapsed,
            'fields'      => \Arcane\Schema\Serializer::fields($this->schema),
        ];
    }
}
