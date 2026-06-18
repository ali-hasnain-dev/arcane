<?php

namespace Arcane\Columns;

class ImageColumn extends Column
{
    protected bool    $circular   = false;
    protected string  $size       = '2.5rem';
    protected string  $disk       = 'public';
    protected bool    $stacked    = false;   // overlapping avatars (multi-image)
    protected int     $stackedLimit = 3;

    public static function make(string $name): static
    {
        return (new static($name))->type('image');
    }

    public function circular(): static               { $this->circular    = true;  return $this; }
    public function size(string $size): static       { $this->size        = $size; return $this; }
    public function disk(string $disk): static       { $this->disk        = $disk; return $this; }
    public function stacked(int $limit = 3): static  { $this->stacked     = true;  $this->stackedLimit = $limit; return $this; }

    public function toArray(): array
    {
        $arr = parent::toArray();
        $arr['size'] = $this->size;
        $arr['disk'] = $this->disk;
        if ($this->circular) $arr['circular'] = true;
        if ($this->stacked)  $arr['stacked']  = true;
        if ($this->stacked)  $arr['stackedLimit'] = $this->stackedLimit;
        return $arr;
    }
}
