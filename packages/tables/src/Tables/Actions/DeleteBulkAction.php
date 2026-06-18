<?php

namespace Arcane\Tables\Actions;

class DeleteBulkAction
{
    protected string $label = 'Delete selected';

    public static function make(): static
    {
        return new static();
    }

    public function label(string $label): static { $this->label = $label; return $this; }

    public function toArray(): array
    {
        return ['type' => 'delete_bulk', 'key' => 'delete_bulk', 'label' => $this->label];
    }
}
