<?php

namespace Larafusion\Fields\Relations;

use Larafusion\Fields\Field;

/**
 * Polymorphic relation field.
 *
 * Usage:
 *   MorphTo::make('commentable')
 *       ->types(['App\Models\Post' => 'Post', 'App\Models\Video' => 'Video'])
 *       ->labelColumn('title');
 *
 * Stores as JSON: {"type":"App\\Models\\Post","id":5}
 * The controller unpacks this to commentable_type + commentable_id on save.
 */
class MorphTo extends Field
{
    protected array   $types       = [];   // ['ModelClass' => 'Label']
    protected string  $labelColumn = 'name';
    protected string  $searchColumn = 'name';
    protected int     $minChars    = 1;

    public function getType(): string { return 'morph_to'; }

    public function types(array $types): static
    {
        $this->types = $types;
        return $this;
    }

    public function labelColumn(string $col): static  { $this->labelColumn  = $col; return $this; }
    public function searchColumn(string $col): static { $this->searchColumn = $col; return $this; }
    public function minChars(int $n): static          { $this->minChars     = $n;   return $this; }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'types'        => $this->types,
            'labelColumn'  => $this->labelColumn,
            'searchColumn' => $this->searchColumn,
            'minChars'     => $this->minChars,
        ]);
    }
}
