<?php

namespace Arcane\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Arcane\ArcaneManager;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function export(Request $request, string $resource): StreamedResponse
    {
        $resourceClass = ArcaneManager::resolve($resource);
        abort_unless($resourceClass::canViewAny(), 403);
        abort_unless($resourceClass::exportable(), 403, 'Export is not enabled for this resource.');

        $model  = $resourceClass::getModelInstance();
        $query  = $model->newQuery();

        // Re-apply the same search/filter logic as index
        $search     = $request->get('search');
        $searchable = $resourceClass::getSearchable();
        if ($search && !empty($searchable)) {
            $query->where(function ($q) use ($searchable, $search) {
                foreach ($searchable as $col) {
                    $q->orWhere($col, 'like', "%{$search}%");
                }
            });
        }

        $filters = $request->get('filter', []);
        if (\is_array($filters)) {
            foreach ($filters as $field => $value) {
                if ($value === null || $value === '') continue;
                if (\is_array($value)) {
                    if (!empty($value['from'])) $query->where($field, '>=', $value['from']);
                    if (!empty($value['to']))   $query->where($field, '<=', $value['to']);
                    continue;
                }
                if (\in_array($value, ['true', 'false', '1', '0'], true)) {
                    $query->where($field, \filter_var($value, \FILTER_VALIDATE_BOOLEAN));
                    continue;
                }
                $query->where($field, 'like', "%{$value}%");
            }
        }

        $sort = $request->get('sort', 'id');
        $dir  = $request->get('direction', 'desc');
        if (\in_array($sort, array_merge($resourceClass::getSortable(), ['id']))) {
            $query->orderBy($sort, $dir);
        }

        $columns  = $resourceClass::getExportColumns();
        $filename = $resourceClass::getSlug() . '-export-' . now()->format('Y-m-d-His') . '.csv';

        return response()->streamDownload(function () use ($query, $columns) {
            $handle = fopen('php://output', 'w');

            // Header row
            fputcsv($handle, array_values($columns));

            // Data rows — chunked to avoid memory exhaustion
            $query->chunk(500, function ($records) use ($handle, $columns) {
                foreach ($records as $record) {
                    $row = [];
                    foreach (array_keys($columns) as $field) {
                        $val = data_get($record, $field);
                        // Unwrap JSON arrays to comma-separated strings
                        if (\is_string($val)) {
                            $decoded = json_decode($val, true);
                            if (\is_array($decoded)) {
                                $val = implode(', ', $decoded);
                            }
                        }
                        $row[] = $val;
                    }
                    fputcsv($handle, $row);
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
