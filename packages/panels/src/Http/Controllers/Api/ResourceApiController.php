<?php

namespace Larafusion\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Http\JsonResponse;
use Larafusion\LarafusionManager;
use Larafusion\Fields\FileUpload;
use Larafusion\Fields\KeyValue;
use Larafusion\Fields\Builder;
use Larafusion\Fields\Relations\BelongsToMany;
use Larafusion\Fields\Relations\MorphTo;
use Larafusion\Http\Controllers\UploadController;

class ResourceApiController extends Controller
{
    // ── Index ─────────────────────────────────────────────────────────────────

    public function index(Request $request, string $resource): JsonResponse
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canViewAny(), 403);

        $model = $resourceClass::getModelInstance();
        $query = $model->newQuery();

        // Search
        $search     = $request->get('search');
        $searchable = $resourceClass::getSearchable();
        if ($search && !empty($searchable)) {
            $query->where(function ($q) use ($searchable, $search) {
                foreach ($searchable as $col) {
                    $q->orWhere($col, 'like', "%{$search}%");
                }
            });
        }

        // Sort
        $sortField = $request->get('sort', 'id');
        $sortDir   = $request->get('direction', 'asc');
        if (\in_array($sortField, \array_merge($resourceClass::getSortable(), ['id']))) {
            $query->orderBy($sortField, $sortDir);
        }

        // Filters
        foreach ($request->get('filter', []) as $field => $value) {
            if ($value === null || $value === '') continue;
            $query->where($field, $value);
        }

        // Tenant scope
        $panel = LarafusionManager::getPanel();
        if ($panel && $panel->hasTenancy()) {
            $tenant = ($panel->getTenantResolver())($request);
            $query  = $resourceClass::scopeForTenant($query, $tenant);
        }

        $perPage = min(max((int) $request->get('per_page', $resourceClass::getPerPage()), 1), 100);
        $records = $query->paginate($perPage)->withQueryString();

        return response()->json([
            'data'  => $records->items(),
            'meta'  => [
                'total'        => $records->total(),
                'per_page'     => $records->perPage(),
                'current_page' => $records->currentPage(),
                'last_page'    => $records->lastPage(),
            ],
            'links' => [
                'first' => $records->url(1),
                'last'  => $records->url($records->lastPage()),
                'prev'  => $records->previousPageUrl(),
                'next'  => $records->nextPageUrl(),
            ],
        ]);
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function show(string $resource, int|string $id): JsonResponse
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canView(), 403);
        $record = $resourceClass::getModelInstance()->findOrFail($id);
        return response()->json(['data' => $record]);
    }

    // ── Store ─────────────────────────────────────────────────────────────────

    public function store(Request $request, string $resource): JsonResponse
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canCreate(), 403);

        $schema    = $resourceClass::getFlatFields();
        $validated = $request->validate($resourceClass::getCreateRules());
        $validated = $this->processFields($validated, $schema);

        $record = $resourceClass::getModelInstance()->create($validated);
        LarafusionManager::fire('record.created', $record);

        return response()->json(['data' => $record], 201);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function update(Request $request, string $resource, int|string $id): JsonResponse
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canEdit(), 403);

        $schema    = $resourceClass::getFlatFields();
        $record    = $resourceClass::getModelInstance()->findOrFail($id);
        $validated = $request->validate($resourceClass::getUpdateRules($id));
        $validated = $this->processFields($validated, $schema);

        $record->update($validated);
        LarafusionManager::fire('record.updated', $record);

        return response()->json(['data' => $record]);
    }

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function destroy(string $resource, int|string $id): JsonResponse
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canDelete(), 403);
        $record = $resourceClass::getModelInstance()->findOrFail($id);

        LarafusionManager::fire('record.deleting', $record);
        $record->delete();
        LarafusionManager::fire('record.deleted', $record);

        return response()->json(null, 204);
    }

    // ── Schema ────────────────────────────────────────────────────────────────

    public function schema(string $resource): JsonResponse
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canViewAny(), 403);
        return response()->json([
            'schema'  => $resourceClass::getFormSchema(),
            'columns' => $resourceClass::getColumnsSchema(),
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    protected function processFields(array $validated, array $schema): array
    {
        foreach ($schema as $field) {
            $name  = $field->getName();
            $value = $validated[$name] ?? null;

            if ($field instanceof BelongsToMany) {
                unset($validated[$name]); // handled via sync separately
                continue;
            }
            if ($field instanceof MorphTo && $value !== null) {
                $decoded = \is_string($value) ? \json_decode($value, true) : $value;
                if (\is_array($decoded) && isset($decoded['type'], $decoded['id'])) {
                    $validated["{$name}_type"] = $decoded['type'];
                    $validated["{$name}_id"]   = $decoded['id'];
                }
                unset($validated[$name]);
                continue;
            }
            if (($field instanceof KeyValue || $field instanceof Builder) && \is_array($value)) {
                $validated[$name] = \json_encode($value);
                continue;
            }
            if (\str_contains(\strtolower($name), 'password') && $value) {
                $validated[$name] = \bcrypt($value);
            }
        }
        return $validated;
    }
}
