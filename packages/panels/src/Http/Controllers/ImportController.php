<?php

namespace Larafusion\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Larafusion\LarafusionManager;

class ImportController extends Controller
{
    public function show(string $resource)
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canCreate(), 403);
        abort_unless($resourceClass::importable(), 403, 'Import is not enabled for this resource.');

        return Inertia::render('Larafusion/Import', [
            'resource' => $resourceClass::getPageProps('index')['resource'],
            'columns'  => $resourceClass::getImportColumns(),
        ]);
    }

    public function preview(Request $request, string $resource)
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canCreate(), 403);
        abort_unless($resourceClass::importable(), 403);

        $request->validate(['file' => 'required|file|mimes:csv,txt|max:10240']);

        $file    = $request->file('file');
        $handle  = fopen($file->getRealPath(), 'r');
        $headers = fgetcsv($handle);

        if (!$headers) {
            return response()->json(['error' => 'Could not read CSV headers.'], 422);
        }

        $rows = [];
        $i    = 0;
        while (($row = fgetcsv($handle)) !== false && $i < 10) {
            $rows[] = array_combine($headers, array_pad($row, count($headers), ''));
            $i++;
        }

        $total = $i;
        while (fgetcsv($handle) !== false) { $total++; }
        fclose($handle);

        return response()->json([
            'headers'    => $headers,
            'preview'    => $rows,
            'totalRows'  => $total,
            'importCols' => $resourceClass::getImportColumns(),
        ]);
    }

    public function commit(Request $request, string $resource)
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canCreate(), 403);
        abort_unless($resourceClass::importable(), 403);

        $request->validate([
            'file'    => 'required|file|mimes:csv,txt|max:10240',
            'mapping' => 'required|array',   // { csvHeader => dbColumn|null }
        ]);

        $mapping = array_filter($request->input('mapping'), fn($v) => $v !== null && $v !== '');
        $rules   = $resourceClass::getCreateRules();
        $file    = $request->file('file');
        $handle  = fopen($file->getRealPath(), 'r');
        $headers = fgetcsv($handle);

        $inserted = 0;
        $errors   = [];
        $lineNo   = 1;

        while (($row = fgetcsv($handle)) !== false) {
            $lineNo++;
            $raw  = array_combine($headers, array_pad($row, count($headers), ''));
            $data = [];

            foreach ($mapping as $csvCol => $dbCol) {
                $data[$dbCol] = $raw[$csvCol] ?? '';
            }

            // Only validate fields that appear in the mapping
            $relevantRules = array_intersect_key($rules, $data);
            $validator     = Validator::make($data, $relevantRules);

            if ($validator->fails()) {
                $errors[] = ['row' => $lineNo, 'errors' => $validator->errors()->toArray()];
                continue;
            }

            $resourceClass::getModelInstance()->create($data);
            $inserted++;
        }

        fclose($handle);

        $message = "Imported {$inserted} record" . ($inserted !== 1 ? 's' : '') . '.';
        if (!empty($errors)) {
            $message .= ' ' . count($errors) . ' row(s) had errors and were skipped.';
        }

        return redirect()
            ->route('larafusion.resource.index', $resource)
            ->with('success', $message);
    }
}
