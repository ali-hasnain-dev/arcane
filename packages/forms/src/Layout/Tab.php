<?php

namespace Larafusion\Layout;

class Tab
{
    protected string  $label  = '';
    protected ?string $icon   = null;
    protected int     $columns = 1;
    protected array   $schema = [];

    public function __construct(string $label)
    {
        $this->label = $label;
    }

    public static function make(string $label): static
    {
        return new static($label);
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
            'label'   => $this->label,
            'icon'    => $this->icon,
            'columns' => $this->columns,
            'fields'  => \Larafusion\Schema\Serializer::fields($this->schema),
        ];
    }
}
