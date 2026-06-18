<?php

namespace Arcane\Columns;

use Arcane\Support\Enums\EnumOptions;

class TextColumn extends Column
{
    protected ?int     $limit       = null;
    protected bool     $wrap        = false;
    protected bool     $lineClamp   = false;
    protected ?string  $description = null;
    protected bool     $copyable    = false;
    protected ?string  $color       = null;
    protected ?string  $weight      = null;      // 'bold' | 'medium' | 'semibold'
    protected ?string  $prefix      = null;
    protected ?string  $suffix      = null;
    protected bool     $money       = false;
    protected ?string  $currency    = null;
    protected bool     $badge       = false;     // render as inline badge chip
    protected array    $enumLabels  = [];        // value → label (populated by ->enum())
    protected array    $enumColors  = [];        // value → color (populated by ->enum())

    public static function make(string $name): static
    {
        return (new static($name))->type('text');
    }

    public function limit(int $chars): static        { $this->limit       = $chars;    return $this; }
    public function wrap(): static                   { $this->wrap        = true;      return $this; }
    public function lineClamp(int $lines = 2): static{ $this->lineClamp   = true; $this->limit = $lines; return $this; }
    public function description(string $desc): static{ $this->description = $desc;     return $this; }
    public function copyable(): static               { $this->copyable    = true;      return $this; }
    public function color(string $color): static     { $this->color       = $color;    return $this; }
    public function weight(string $weight): static   { $this->weight      = $weight;   return $this; }
    public function bold(): static                   { return $this->weight('bold'); }
    public function prefix(string $prefix): static   { $this->prefix      = $prefix;   return $this; }
    public function suffix(string $suffix): static   { $this->suffix      = $suffix;   return $this; }
    /** Render this text column as an inline badge chip. */
    public function asBadge(): static               { $this->badge       = true;      return $this; }

    /**
     * Bind a BackedEnum class to this column.
     * Automatically enables badge rendering and populates labels/colors from
     * the enum's HasLabel / HasColor interfaces.
     *
     * @param  class-string  $enumClass
     */
    public function enum(string $enumClass): static
    {
        $this->badge       = true;
        $this->enumLabels  = EnumOptions::toOptions($enumClass);
        $this->enumColors  = EnumOptions::toColors($enumClass);

        // Auto-register a select filter with enum labels.
        $this->filterable    = true;
        $this->filterType    = 'select';
        $this->filterOptions = array_map(
            fn ($value, $label) => ['value' => $value, 'label' => $label],
            array_keys($this->enumLabels),
            array_values($this->enumLabels)
        );

        return $this;
    }

    public function money(?string $currency = null): static
    {
        $this->money    = true;
        $this->currency = $currency ?? 'USD';
        return $this;
    }

    public function searchable(): static
    {
        return $this->filterable('text');
    }

    public function toArray(): array
    {
        $arr = parent::toArray();
        if ($this->limit !== null)  $arr['limit']       = $this->limit;
        if ($this->wrap)            $arr['wrap']         = true;
        if ($this->lineClamp)       $arr['lineClamp']    = true;
        if ($this->description)     $arr['description']  = $this->description;
        if ($this->copyable)        $arr['copyable']     = true;
        if ($this->color)           $arr['color']        = $this->color;
        if ($this->weight)          $arr['weight']       = $this->weight;
        if ($this->prefix)          $arr['prefix']       = $this->prefix;
        if ($this->suffix)          $arr['suffix']       = $this->suffix;
        if ($this->money)           $arr['money']        = true;
        if ($this->currency)        $arr['currency']     = $this->currency;
        if ($this->badge)                    $arr['badge']       = true;
        if (!empty($this->enumLabels))       $arr['enumLabels']  = $this->enumLabels;
        if (!empty($this->enumColors))       $arr['enumColors']  = $this->enumColors;
        return $arr;
    }
}
