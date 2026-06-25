<?php

namespace Larafusion\Fields;

class Color extends Field
{
    protected array   $presets = [];
    protected string  $format  = 'hex'; // hex | rgb | rgba | hsl

    public function getType(): string { return 'color'; }

    public function presets(array $colors): static { $this->presets = $colors; return $this; }

    /** Store value as a hex string (default, e.g. '#3b82f6'). */
    public function hex(): static  { $this->format = 'hex';  return $this; }

    /** Store value in 'rgb(r, g, b)' format. */
    public function rgb(): static  { $this->format = 'rgb';  return $this; }

    /** Store value in 'rgba(r, g, b, a)' format (includes alpha channel). */
    public function rgba(): static { $this->format = 'rgba'; return $this; }

    /** Store value in 'hsl(h, s%, l%)' format. */
    public function hsl(): static  { $this->format = 'hsl';  return $this; }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'presets' => $this->presets,
            'format'  => $this->format,
        ]);
    }
}
