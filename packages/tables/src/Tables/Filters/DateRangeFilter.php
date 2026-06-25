<?php

namespace Larafusion\Tables\Filters;

class DateRangeFilter extends Filter
{
    public function __construct(string $name)
    {
        parent::__construct($name);
        $this->type = 'date_range';
    }

    public function applyToQuery($query, mixed $value): void
    {
        if ($this->query) {
            call_user_func($this->query, $query, $value);
            return;
        }

        $column = $this->getAttribute();

        if (is_array($value)) {
            if (!empty($value['from'])) $query->where($column, '>=', $value['from']);
            if (!empty($value['to']))   $query->where($column, '<=', $value['to']);
        }
    }
}
