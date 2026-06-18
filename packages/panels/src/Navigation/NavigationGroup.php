<?php

namespace Arcane\Navigation;

class NavigationGroup
{
    protected string  $label;
    protected ?string $icon        = null;
    protected bool    $collapsible = true;
    protected bool    $collapsed   = false;
    protected int     $sort        = 0;

    public function __construct(string $label)
    {
        $this->label = $label;
    }

    public static function make(string $label): static
    {
        return new static($label);
    }

    public function icon(?string $icon): static        { $this->icon        = $icon;  return $this; }
    public function collapsible(bool $c = true): static { $this->collapsible = $c;    return $this; }
    public function collapsed(bool $c = true): static   { $this->collapsed   = $c;    return $this; }
    public function sort(int $n): static                { $this->sort        = $n;    return $this; }

    public function getLabel(): string { return $this->label; }
    public function getSort(): int     { return $this->sort; }

    public function toArray(): array
    {
        return [
            'label'       => $this->label,
            'icon'        => $this->icon,
            'collapsible' => $this->collapsible,
            'collapsed'   => $this->collapsed,
            'sort'        => $this->sort,
        ];
    }
}
