<?php

namespace Larafusion\Fields\Relations;

class BelongsToMany extends BelongsTo
{
    protected string  $pivotTable   = '';
    protected string  $pivotFk      = '';   // foreign key pointing to this model
    protected string  $pivotRelated = '';   // foreign key pointing to related model
    protected array   $pivotColumns = [];   // extra pivot columns to capture

    public function getType(): string { return 'belongs_to_many'; }

    public function pivotTable(string $table): static
    {
        $this->pivotTable = $table;
        return $this;
    }

    public function pivotForeignKey(string $key): static
    {
        $this->pivotFk = $key;
        return $this;
    }

    public function pivotRelatedKey(string $key): static
    {
        $this->pivotRelated = $key;
        return $this;
    }

    public function withPivot(array $columns): static
    {
        $this->pivotColumns = $columns;
        return $this;
    }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'pivotTable'   => $this->pivotTable,
            'pivotFk'      => $this->pivotFk,
            'pivotRelated' => $this->pivotRelated,
            'pivotColumns' => $this->pivotColumns,
        ]);
    }
}
