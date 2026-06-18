<?php

namespace Arcane\Tables\Actions;

class ForceDeleteBulkAction
{
    protected string $label = 'Force delete selected';

    public static function make(): static
    {
        return new static();
    }

    public function label(string $label): static { $this->label = $label; return $this; }

    public function toArray(): array
    {
        return ['type' => 'force_delete_bulk', 'key' => 'force_delete_bulk', 'label' => $this->label];
    }
}
