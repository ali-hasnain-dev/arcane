<?php

namespace Larafusion\Fields;

class Checkbox extends Field
{
    protected bool $inline = true;

    public function __construct(string $name)
    {
        parent::__construct($name);
        $this->default = false;
        $this->addRule('boolean');
    }

    public function getType(): string { return 'checkbox'; }

    /** Place the label beside the checkbox (true, default) instead of above it. */
    public function inline(bool $v = true): static
    {
        $this->inline = $v;
        return $this;
    }

    /** Require the checkbox to be checked (e.g. terms acceptance). */
    public function accepted(): static
    {
        $this->addRule('accepted');
        return $this;
    }

    /** Require the checkbox to remain unchecked. */
    public function declined(): static
    {
        $this->addRule('declined');
        return $this;
    }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'inline' => $this->inline,
        ]);
    }
}
