<?php

namespace Larafusion\Columns;

class IconColumn extends Column
{
    /** value → lucide icon name */
    protected array $icons  = [];
    /** value → color name */
    protected array $colors = [];
    /** treat the column as a boolean: true=check-circle, false=x-circle */
    protected bool  $boolean = false;

    public static function make(string $name): static
    {
        return (new static($name))->type('icon');
    }

    public function boolean(): static               { $this->boolean = true; return $this; }
    public function icons(array $map): static        { $this->icons   = $map; return $this; }
    public function colors(array $map): static       { $this->colors  = $map; return $this; }

    public function toArray(): array
    {
        $arr = parent::toArray();
        if ($this->boolean)          $arr['boolean'] = true;
        if (!empty($this->icons))    $arr['icons']   = $this->icons;
        if (!empty($this->colors))   $arr['colors']  = $this->colors;
        return $arr;
    }
}
