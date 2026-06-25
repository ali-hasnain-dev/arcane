<?php

namespace Larafusion\Layout;

class Tabs
{
    protected array  $tabs         = [];
    protected string $defaultTab   = '';

    public static function make(): static
    {
        return new static();
    }

    public function tabs(array $tabs): static
    {
        $this->tabs = $tabs;
        return $this;
    }

    public function default(string $label): static
    {
        $this->defaultTab = $label;
        return $this;
    }

    public function getSchema(): array
    {
        $fields = [];
        foreach ($this->tabs as $tab) {
            foreach ($tab->getSchema() as $field) {
                $fields[] = $field;
            }
        }
        return $fields;
    }

    public function toArray(): array
    {
        return [
            'type'       => 'tabs',
            'defaultTab' => $this->defaultTab,
            'tabs'       => array_values(array_map(fn(Tab $t) => $t->toArray(), $this->tabs)),
        ];
    }
}
