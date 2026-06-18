<?php

namespace Arcane\Tables\Actions;

class ViewAction
{
    protected string $label = 'View';
    protected string $color = 'default';

    public static function make(): static
    {
        return new static();
    }

    public function label(string $label): static { $this->label = $label; return $this; }
    public function color(string $color): static  { $this->color = $color; return $this; }

    public function toArray(): array
    {
        return ['type' => 'view', 'key' => 'view', 'label' => $this->label, 'color' => $this->color];
    }
}
