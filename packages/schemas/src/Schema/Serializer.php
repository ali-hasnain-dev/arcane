<?php

namespace Arcane\Schema;

use Arcane\Fields\Field;
use Arcane\Layout\Section;
use Arcane\Layout\Tabs;
use Arcane\Layout\Grid;

class Serializer
{
    /**
     * Serialize a mixed schema (fields + layout components) to arrays for Inertia.
     */
    public static function fields(array $items): array
    {
        $out = [];
        foreach ($items as $item) {
            if ($item instanceof Field) {
                $out[] = $item->toArray();
            } elseif ($item instanceof Section || $item instanceof Tabs || $item instanceof Grid) {
                $out[] = $item->toArray();
            }
        }
        return array_values($out);
    }

    public static function columns(array $columns): array
    {
        return array_values(array_map(fn($c) => $c->toArray(), $columns));
    }

    /**
     * Flatten a mixed schema to only Field instances (for validation rule extraction).
     */
    public static function flattenFields(array $items): array
    {
        $fields = [];
        foreach ($items as $item) {
            if ($item instanceof Field) {
                $fields[] = $item;
            } elseif ($item instanceof Section || $item instanceof Grid) {
                foreach (static::flattenFields($item->getSchema()) as $f) {
                    $fields[] = $f;
                }
            } elseif ($item instanceof Tabs) {
                foreach ($item->getSchema() as $f) {
                    $fields[] = $f;
                }
            }
        }
        return $fields;
    }
}
