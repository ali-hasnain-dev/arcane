<?php

namespace Larafusion\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Larafusion\LarafusionManager;
use Larafusion\Fields\Relations\BelongsTo;
use Larafusion\Fields\Relations\HasMany;
use Larafusion\Schema\Serializer;

class RelationController extends Controller
{
    /**
     * GET /larafusion/relations/{resource}/{field}/options?search=&page=
     *
     * Returns paginated options for a BelongsTo or BelongsToMany field.
     * Called by the React async select on keystroke.
     */
    public function options(Request $request, string $resource, string $fieldName)
    {
        $resourceClass = LarafusionManager::resolve($resource);
        $field         = $this->findField($resourceClass::form(), $fieldName);

        if (!($field instanceof BelongsTo)) {
            return response()->json(['options' => [], 'hasMore' => false]);
        }

        $search  = $request->get('search', '');
        $page    = max(1, (int) $request->get('page', 1));
        $perPage = 20;
        $offset  = ($page - 1) * $perPage;

        $query = ($field->getRelatedModel())::query();

        foreach ($field->getWhere() as $col => $val) {
            $query->where($col, $val);
        }

        if ($search) {
            $query->where($field->getSearchColumn(), 'like', "%{$search}%");
        }

        $total   = $query->count();
        $records = $query->skip($offset)->take($perPage + 1)->get();
        $hasMore = $records->count() > $perPage;
        $records = $records->take($perPage);

        $options = $records->map(function ($model) use ($field) {
            return [
                'value' => $model->{$field->getValueColumn()},
                'label' => $this->formatLabel($model, $field),
            ];
        })->toArray();

        return response()->json([
            'options' => $options,
            'hasMore' => $hasMore,
            'total'   => $total,
        ]);
    }

    /**
     * GET /larafusion/relations/{resource}/{id}/{field}
     *
     * Returns HasMany related records for a given parent record.
     */
    public function related(Request $request, string $resource, int|string $id, string $fieldName)
    {
        $resourceClass = LarafusionManager::resolve($resource);
        $field         = $this->findField($resourceClass::form(), $fieldName);

        if (!($field instanceof HasMany)) {
            return response()->json(['records' => []]);
        }

        $parentRecord = $resourceClass::getModelInstance()->findOrFail($id);
        $fk           = $field->foreignKey ?: \Illuminate\Support\Str::snake(class_basename($resourceClass::getModel())) . '_id';
        $relatedModel = $field->getRelatedModel() ?? null;

        if (!$relatedModel) {
            return response()->json(['records' => []]);
        }

        $records = $relatedModel::where($fk, $id)
            ->limit($field->limit ?? 10)
            ->get();

        return response()->json(['records' => $records]);
    }

    private function findField(array $fields, string $name): mixed
    {
        foreach (Serializer::flattenFields($fields) as $field) {
            if ($field->getName() === $name) return $field;
        }
        return null;
    }

    private function formatLabel($model, BelongsTo $field): string
    {
        $fmt = $field->getOptionLabel();
        if (!$fmt) return (string) $model->{$field->getLabelColumn()};

        return preg_replace_callback('/\{(\w+)\}/', fn($m) => $model->{$m[1]} ?? '', $fmt);
    }
}
