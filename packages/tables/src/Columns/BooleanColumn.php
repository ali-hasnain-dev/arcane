<?php

namespace Larafusion\Columns;

class BooleanColumn extends Column
{
    protected string  $trueIcon    = 'check-circle';
    protected string  $falseIcon   = 'x-circle';
    protected string  $trueColor   = 'success';   // 'success'|'primary'|'warning'|'danger'|'gray'
    protected string  $falseColor  = 'danger';
    protected ?string $trueLabel   = null;
    protected ?string $falseLabel  = null;

    public static function make(string $name): static
    {
        return (new static($name))->type('boolean');
    }

    public function trueIcon(string $icon): static   { $this->trueIcon   = $icon;  return $this; }
    public function falseIcon(string $icon): static  { $this->falseIcon  = $icon;  return $this; }
    public function trueColor(string $c): static     { $this->trueColor  = $c;     return $this; }
    public function falseColor(string $c): static    { $this->falseColor = $c;     return $this; }
    public function trueLabel(string $l): static     { $this->trueLabel  = $l;     return $this; }
    public function falseLabel(string $l): static    { $this->falseLabel = $l;     return $this; }

    public function searchable(): static { return $this->filterable('boolean'); }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), array_filter([
            'trueIcon'   => $this->trueIcon,
            'falseIcon'  => $this->falseIcon,
            'trueColor'  => $this->trueColor,
            'falseColor' => $this->falseColor,
            'trueLabel'  => $this->trueLabel,
            'falseLabel' => $this->falseLabel,
        ]));
    }
}
