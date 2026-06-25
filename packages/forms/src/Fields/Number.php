<?php

namespace Larafusion\Fields;

class Number extends Field
{
    protected ?int $min  = null;
    protected ?int $max  = null;
    protected int  $step = 1;

    public function __construct(string $name)
    {
        parent::__construct($name);
        $this->addRule('numeric');
    }

    public function getType(): string { return 'number'; }

    public function min(int $n): static  { $this->min = $n; $this->addRule("min:{$n}"); return $this; }
    public function max(int $n): static  { $this->max = $n; $this->addRule("max:{$n}"); return $this; }
    public function step(int $n): static { $this->step = $n; return $this; }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'min'  => $this->min,
            'max'  => $this->max,
            'step' => $this->step,
        ]);
    }
}
