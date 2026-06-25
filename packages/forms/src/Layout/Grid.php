<?php

namespace Larafusion\Layout;

class Grid
{
    protected int   $columns = 2;
    protected array $schema  = [];

    public function __construct(int $columns = 2)
    {
        $this->columns = $columns;
    }

    public static function make(int $columns = 2): static
    {
        return new static($columns);
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
            'type'    => 'grid',
            'columns' => $this->columns,
            'fields'  => \Larafusion\Schema\Serializer::fields($this->schema),
        ];
    }
}
