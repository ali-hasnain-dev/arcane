<?php

namespace Arcane\Fields;

class Toggle extends Field
{
    protected string  $onLabel  = 'Yes';
    protected string  $offLabel = 'No';
    protected ?string $onIcon   = null;
    protected ?string $offIcon  = null;
    protected ?string $onColor  = null;  // primary | success | warning | danger | info | gray
    protected ?string $offColor = null;
    protected bool    $inline   = true;  // true: label beside toggle; false: label above

    public function __construct(string $name)
    {
        parent::__construct($name);
        $this->default = false;
        $this->addRule('boolean');
    }

    public function getType(): string { return 'toggle'; }

    public function onLabel(string $l): static  { $this->onLabel  = $l; return $this; }
    public function offLabel(string $l): static { $this->offLabel = $l; return $this; }

    /** Lucide icon name shown inside the toggle knob when it is on. */
    public function onIcon(string $icon): static  { $this->onIcon  = $icon; return $this; }

    /** Lucide icon name shown inside the toggle knob when it is off. */
    public function offIcon(string $icon): static { $this->offIcon = $icon; return $this; }

    /**
     * Background colour of the toggle track when it is on.
     * Accepts semantic names: primary | success | warning | danger | info | gray
     */
    public function onColor(string $color): static  { $this->onColor  = $color; return $this; }

    /**
     * Background colour of the toggle track when it is off.
     * Accepts semantic names: primary | success | warning | danger | info | gray
     */
    public function offColor(string $color): static { $this->offColor = $color; return $this; }

    /** Display the label beside the toggle (true, default) instead of above it. */
    public function inline(bool $v = true): static  { $this->inline = $v; return $this; }

    /** Require the toggle to be on (e.g. agree to terms). */
    public function accepted(): static { $this->addRule('accepted'); return $this; }

    /** Require the toggle to remain off. */
    public function declined(): static { $this->addRule('declined'); return $this; }

    public function toArray(): array
    {
        $arr = array_merge(parent::toArray(), [
            'onLabel'  => $this->onLabel,
            'offLabel' => $this->offLabel,
            'inline'   => $this->inline,
        ]);
        if ($this->onIcon  !== null) $arr['onIcon']  = $this->onIcon;
        if ($this->offIcon !== null) $arr['offIcon'] = $this->offIcon;
        if ($this->onColor !== null) $arr['onColor'] = $this->onColor;
        if ($this->offColor !== null) $arr['offColor'] = $this->offColor;
        return $arr;
    }
}
