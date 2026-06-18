<?php

namespace Arcane\Widgets;

class TableWidget extends Widget
{
    protected array          $columns = [];
    protected array|\Closure $rows    = [];
    protected int            $limit   = 5;

    public function __construct()
    {
        $this->columnSpan = 2;
    }

    public function columns(array $columns): static        { $this->columns = $columns; return $this; }
    public function rows(array|\Closure $rows): static     { $this->rows    = $rows;    return $this; }
    public function limit(int $n): static                  { $this->limit   = $n;       return $this; }

    public function getType(): string { return 'table'; }

    public function getData(): array
    {
        $rows = is_callable($this->rows)
            ? array_slice(($this->rows)(), 0, $this->limit)
            : array_slice($this->rows, 0, $this->limit);

        return [
            'columns' => array_values($this->columns),
            'rows'    => array_values(array_map('array_values', $rows)),
        ];
    }
}
