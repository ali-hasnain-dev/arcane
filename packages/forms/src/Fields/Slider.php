<?php

namespace Larafusion\Fields;

class Slider extends Field
{
    protected int     $min           = 0;
    protected int     $max           = 100;
    protected int     $step          = 1;
    protected bool    $showValue     = true;
    protected ?string $prefix        = null;
    protected ?string $suffix        = null;
    protected bool    $range         = false;
    protected int     $decimalPlaces = 0;
    protected bool    $vertical      = false;
    protected bool    $fillTrack     = true;
    protected bool    $tooltips      = true;
    protected ?int    $minDifference = null;
    protected ?int    $maxDifference = null;

    public function __construct(string $name)
    {
        parent::__construct($name);
        $this->default = 0;
        $this->addRule('numeric');
    }

    public function getType(): string { return 'slider'; }

    // ── Core ──────────────────────────────────────────────────────────────────

    public function min(int $n): static  { $this->min = $n; $this->addRule("min:{$n}"); return $this; }
    public function max(int $n): static  { $this->max = $n; $this->addRule("max:{$n}"); return $this; }
    public function step(int $n): static { $this->step = $n; return $this; }

    /** Number of decimal places shown in the value label and tooltips. */
    public function decimalPlaces(int $places): static { $this->decimalPlaces = $places; return $this; }

    /** Show the current value beside the slider (default: true). */
    public function showValue(bool $v = true): static  { $this->showValue = $v;  return $this; }

    /** Hide the current value beside the slider. */
    public function hideValue(): static { $this->showValue = false; return $this; }

    public function prefix(string $p): static { $this->prefix = $p; return $this; }
    public function suffix(string $s): static { $this->suffix = $s; return $this; }

    // ── Appearance ────────────────────────────────────────────────────────────

    /** Render the slider vertically instead of horizontally. */
    public function vertical(bool $v = true): static { $this->vertical  = $v; return $this; }

    /** Fill the track from the start to the current thumb position (default: true). */
    public function fillTrack(bool $v = true): static { $this->fillTrack = $v; return $this; }

    /** Show a value tooltip above the thumb while dragging (default: true). */
    public function tooltips(bool $v = true): static  { $this->tooltips  = $v; return $this; }

    // ── Range constraints ─────────────────────────────────────────────────────

    /** Enable a dual-handle range slider. Value becomes [min, max] array. */
    public function range(): static
    {
        $this->range   = true;
        $this->default = [$this->min, $this->max];
        return $this;
    }

    /** Minimum gap enforced between the two handles (range mode). */
    public function minDifference(int $n): static { $this->minDifference = $n; return $this; }

    /** Maximum gap allowed between the two handles (range mode). */
    public function maxDifference(int $n): static { $this->maxDifference = $n; return $this; }

    // ── Serialization ─────────────────────────────────────────────────────────

    public function toArray(): array
    {
        $arr = array_merge(parent::toArray(), [
            'min'           => $this->min,
            'max'           => $this->max,
            'step'          => $this->step,
            'showValue'     => $this->showValue,
            'prefix'        => $this->prefix,
            'suffix'        => $this->suffix,
            'range'         => $this->range,
            'decimalPlaces' => $this->decimalPlaces,
            'vertical'      => $this->vertical,
            'fillTrack'     => $this->fillTrack,
            'tooltips'      => $this->tooltips,
        ]);
        if ($this->minDifference !== null) $arr['minDifference'] = $this->minDifference;
        if ($this->maxDifference !== null) $arr['maxDifference'] = $this->maxDifference;
        return $arr;
    }
}
