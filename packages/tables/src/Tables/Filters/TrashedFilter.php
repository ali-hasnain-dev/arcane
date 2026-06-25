<?php

namespace Larafusion\Tables\Filters;

class TrashedFilter extends Filter
{
    public function __construct()
    {
        parent::__construct('trashed');
        $this->label = 'Trashed';
        $this->type  = 'trashed';
    }

    public static function make(): static
    {
        return new static();
    }
}
