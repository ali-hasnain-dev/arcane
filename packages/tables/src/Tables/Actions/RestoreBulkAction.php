<?php

namespace Arcane\Tables\Actions;

class RestoreBulkAction
{
    protected string $label = 'Restore selected';

    public static function make(): static
    {
        return new static();
    }

    public function label(string $label): static { $this->label = $label; return $this; }

    public function toArray(): array
    {
        return ['type' => 'restore_bulk', 'key' => 'restore_bulk', 'label' => $this->label];
    }
}
