<?php

namespace Arcane\Tables\Actions;

class BulkActionGroup
{
    protected string $label   = 'Bulk actions';
    protected array  $actions = [];

    private function __construct(array $actions)
    {
        $this->actions = $actions;
    }

    public static function make(array $actions): static
    {
        return new static($actions);
    }

    public function label(string $label): static { $this->label = $label; return $this; }

    public function toArray(): array
    {
        return [
            'type'    => 'bulk_group',
            'key'     => 'bulk_actions',
            'label'   => $this->label,
            'actions' => array_map(fn($a) => $a->toArray(), $this->actions),
        ];
    }
}
