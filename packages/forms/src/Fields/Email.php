<?php

namespace Arcane\Fields;

use Arcane\Concerns\HasAffixes;

class Email extends Field
{
    use HasAffixes;

    public function __construct(string $name)
    {
        parent::__construct($name);
        $this->addRule('email');
    }

    public function getType(): string { return 'email'; }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), $this->affixesToArray());
    }
}
