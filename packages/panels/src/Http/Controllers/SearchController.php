<?php

namespace Arcane\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Arcane\ArcaneManager;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $query = trim((string) $request->get('q', ''));

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $results = [];

        foreach (ArcaneManager::all() as $slug => $resourceClass) {
            if (!$resourceClass::canViewAny()) continue;

            $searchable = $resourceClass::getSearchable();
            if (empty($searchable)) continue;

            $model     = $resourceClass::getModelInstance();
            $dbQuery   = $model->newQuery();
            $dbQuery->where(function ($q) use ($searchable, $query) {
                foreach ($searchable as $col) {
                    $q->orWhere($col, 'like', "%{$query}%");
                }
            });

            $hits = $dbQuery->limit(5)->get();

            foreach ($hits as $record) {
                $title       = $resourceClass::getGlobalSearchTitle($record);
                $description = $resourceClass::getGlobalSearchDescription($record);

                $results[] = [
                    'resource'    => $slug,
                    'label'       => $resourceClass::getNavigationLabel(),
                    'id'          => $record->getKey(),
                    'title'       => $title,
                    'description' => $description,
                    'url'         => route('arcane.resource.show', [$slug, $record->getKey()]),
                    'editUrl'     => route('arcane.resource.edit', [$slug, $record->getKey()]),
                ];
            }
        }

        return response()->json($results);
    }
}
