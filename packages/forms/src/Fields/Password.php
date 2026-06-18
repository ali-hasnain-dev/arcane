<?php

namespace Arcane\Fields;

use Arcane\Concerns\HasAffixes;

class Password extends Field
{
    use HasAffixes;

    protected int  $minLength  = 8;
    protected bool $showToggle = true;

    public function getType(): string { return 'password'; }

    public function minLength(int $n): static   { $this->minLength = $n; $this->addRule("min:{$n}"); return $this; }

    /** Hide the show/hide eye button. */
    public function hideToggle(): static        { $this->showToggle = false; return $this; }

    /** Alias for ->hideToggle(false) — explicitly enable the reveal button (on by default). */
    public function revealable(bool $v = true): static { $this->showToggle = $v; return $this; }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'minLength'  => $this->minLength,
            'showToggle' => $this->showToggle,
        ], $this->affixesToArray());
    }
}
