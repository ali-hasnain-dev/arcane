<?php

namespace Larafusion\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Larafusion\LarafusionManager;
use Larafusion\Fields\Relations\MorphTo;

class MorphController extends Controller
{
    /**
     * Return search options for one morph type.
     * GET /{resource}/morph/{field}/options?type=App\Models\Post&q=hello
     */
    public function options(Request $request, string $resource, string $field)
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canViewAny(), 403);

        // Find the MorphTo field definition
        $morphField = null;
        foreach ($resourceClass::getFlatFields() as $f) {
            if ($f instanceof MorphTo && $f->getName() === $field) {
                $morphField = $f;
                break;
            }
        }
        abort_if($morphField === null, 404, "MorphTo field [{$field}] not found.");

        $typeClass = $request->get('type');
        $types     = $morphField->toArray()['types'];
        abort_unless(array_key_exists($typeClass, $types), 422, 'Unknown morph type.');

        $labelCol  = $morphField->toArray()['labelColumn'];
        $searchCol = $morphField->toArray()['searchColumn'];
        $query     = trim((string) $request->get('q', ''));

        $model     = new $typeClass();
        $dbQuery   = $model->newQuery();

        if ($query) {
            $dbQuery->where($searchCol, 'like', "%{$query}%");
        }

        $results = $dbQuery->limit(20)->get()->map(fn($r) => [
            'id'    => $r->getKey(),
            'label' => $r->{$labelCol} ?? $r->getKey(),
        ]);

        return response()->json($results);
    }
}
