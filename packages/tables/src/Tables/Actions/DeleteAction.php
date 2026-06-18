<?php

namespace Arcane\Tables\Actions;

class DeleteAction
{
    protected string  $label   = 'Delete';
    protected string  $color   = 'danger';
    protected ?string $confirm = 'Are you sure you want to delete this record? This action cannot be undone.';

    public static function make(): static
    {
        return new static();
    }

    public function label(string $label): static    { $this->label   = $label;   return $this; }
    public function color(string $color): static     { $this->color   = $color;   return $this; }
    public function confirm(?string $msg): static    { $this->confirm = $msg;     return $this; }
    public function withoutConfirmation(): static    { $this->confirm = null;     return $this; }

    public function toArray(): array
    {
        return ['type' => 'delete', 'key' => 'delete', 'label' => $this->label, 'color' => $this->color, 'confirm' => $this->confirm];
    }
}
