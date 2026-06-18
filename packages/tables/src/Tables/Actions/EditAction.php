<?php

namespace Arcane\Tables\Actions;

class EditAction
{
    protected string  $label = 'Edit';
    protected string  $color = 'primary';

    public static function make(): static
    {
        return new static();
    }

    public function label(string $label): static { $this->label = $label; return $this; }
    public function color(string $color): static  { $this->color = $color; return $this; }

    public function toArray(): array
    {
        return ['type' => 'edit', 'key' => 'edit', 'label' => $this->label, 'color' => $this->color];
    }
}
