<?php

namespace Arcane\Columns;

class DateColumn extends Column
{
    protected string $format   = 'M j, Y';
    protected bool   $since    = false;   // "3 days ago" (relative)
    protected bool   $dateTime = false;
    protected bool   $time     = false;

    public static function make(string $name): static
    {
        return (new static($name))->type('date');
    }

    public function format(string $format): static { $this->format   = $format; return $this; }
    public function since(): static                { $this->since    = true;    return $this; }
    public function time(): static                 { $this->time     = true;    return $this; }

    public function dateTime(): static
    {
        $this->dateTime = true;
        $this->format   = 'M j, Y H:i';
        return $this;
    }

    public function searchable(): static { return $this->filterable('date_range'); }

    public function toArray(): array
    {
        $arr = parent::toArray();
        $arr['format']   = $this->format;
        if ($this->since)    $arr['since']    = true;
        if ($this->dateTime) $arr['dateTime'] = true;
        if ($this->time)     $arr['time']     = true;
        return $arr;
    }
}
