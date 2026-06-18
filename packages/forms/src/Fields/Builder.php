<?php

namespace Arcane\Fields;

class Builder extends Field
{
    protected array  $blocks      = [];
    protected ?int   $maxItems    = null;
    protected ?int   $minItems    = null;
    protected string $addLabel    = 'Add Block';
    protected bool   $addable     = true;
    protected bool   $deletable   = true;
    protected bool   $cloneable   = false;
    protected bool   $reorderable = true;
    protected bool   $collapsible = false;
    protected bool   $collapsed   = false;

    public function __construct(string $name)
    {
        parent::__construct($name);
        $this->default = [];
    }

    public function getType(): string { return 'builder'; }

    public function blocks(array $blocks): static       { $this->blocks   = $blocks; return $this; }
    public function maxItems(int $n): static            { $this->maxItems = $n;      return $this; }
    public function minItems(int $n): static            { $this->minItems = $n;      return $this; }
    public function addLabel(string $l): static         { $this->addLabel = $l;      return $this; }
    public function addable(bool $v = true): static     { $this->addable     = $v;   return $this; }
    public function deletable(bool $v = true): static   { $this->deletable   = $v;   return $this; }
    public function cloneable(bool $v = true): static   { $this->cloneable   = $v;   return $this; }
    public function reorderable(bool $v = true): static { $this->reorderable = $v;   return $this; }
    public function collapsible(bool $v = true): static { $this->collapsible = $v;   return $this; }
    public function collapsed(bool $v = true): static   { $this->collapsed = $v; if ($v) $this->collapsible = true; return $this; }

    public function toArray(): array
    {
        $arr = array_merge(parent::toArray(), [
            'blocks'      => array_values(array_map(fn(BuilderBlock $b) => $b->toArray(), $this->blocks)),
            'maxItems'    => $this->maxItems,
            'addLabel'    => $this->addLabel,
            'addable'     => $this->addable,
            'deletable'   => $this->deletable,
            'cloneable'   => $this->cloneable,
            'reorderable' => $this->reorderable,
            'collapsible' => $this->collapsible,
            'collapsed'   => $this->collapsed,
        ]);
        if ($this->minItems !== null) $arr['minItems'] = $this->minItems;
        return $arr;
    }
}
