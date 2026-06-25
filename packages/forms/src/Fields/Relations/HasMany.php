<?php

namespace Larafusion\Fields\Relations;

use Larafusion\Fields\Field;

class HasMany extends Field
{
    protected string $relatedModel;
    protected string $foreignKey    = '';
    protected array  $displayColumns = [];  // column names to show in the mini-table
    protected int    $limit          = 5;
    protected bool   $createInline   = false;
    protected ?string $relatedResource = null; // Larafusion resource slug for links

    public function __construct(string $name)
    {
        parent::__construct($name);
    }

    public function model(string $model): static
    {
        $this->relatedModel = $model;
        return $this;
    }

    public function foreignKey(string $key): static
    {
        $this->foreignKey = $key;
        return $this;
    }

    public function displayColumns(array $columns): static
    {
        $this->displayColumns = $columns;
        return $this;
    }

    public function limit(int $n): static
    {
        $this->limit = $n;
        return $this;
    }

    public function relatedResource(string $slug): static
    {
        $this->relatedResource = $slug;
        return $this;
    }

    public function getType(): string { return 'has_many'; }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'relatedModel'    => $this->relatedModel,
            'foreignKey'      => $this->foreignKey,
            'displayColumns'  => $this->displayColumns,
            'limit'           => $this->limit,
            'relatedResource' => $this->relatedResource,
        ]);
    }
}
