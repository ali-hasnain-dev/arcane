<?php

namespace Larafusion\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Larafusion\LarafusionManager;
use Larafusion\Tables\Table;
use Larafusion\Fields\FileUpload;
use Larafusion\Fields\KeyValue;
use Larafusion\Fields\Builder;
use Larafusion\Fields\Relations\BelongsToMany;
use Larafusion\Fields\Relations\MorphTo;

class ResourceController extends Controller
{
    public function index(Request $request, string $resource)
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canViewAny(), 403);
        $model         = $resourceClass::getModelInstance();
        $query         = $model->newQuery();

        // ── Columns → eager loads + narrowed SELECT ─────────────────────────────
        // The configured table columns drive exactly what leaves the database.
        // Relationship columns (dot notation, e.g. 'category.name') are split off
        // and eager-loaded; the base table SELECT is narrowed to only the local
        // attributes the columns need, so faster queries AND stray columns like
        // `password` never leave the DB.
        //
        // Note: if a record action's ->visibleWhen() closure reads an attribute
        // that isn't one of the displayed columns, it'll be null here — add that
        // attribute to the resource's table columns (even ->hidden()) to keep it
        // in the SELECT.
        $tableColumns  = $resourceClass::table(Table::make())->getColumns();
        $columnNames   = array_map(fn ($c) => $c->getName(), $tableColumns);
        $localColumns  = array_values(array_filter($columnNames, fn ($n) => !str_contains($n, '.')));
        $relationCols  = array_values(array_filter($columnNames, fn ($n) => str_contains($n, '.')));

        // Eager-load every relationship a column reads (supports nested paths like
        // 'author.company.name'), avoiding N+1 queries. The whole relation is
        // loaded via its own (cheap, separate) query rather than risk breaking
        // hydration by under-selecting the related table's keys.
        $relationPaths = array_values(array_unique(array_map(
            fn ($n) => implode('.', array_slice(explode('.', $n), 0, -1)),
            $relationCols
        )));
        if (!empty($relationPaths)) {
            $query->with($relationPaths);
        }

        if (!empty($columnNames)) {
            $needed = array_merge(
                [$model->getKeyName()],
                $localColumns,
                $resourceClass::getInlineEditable(),
                $resourceClass::softDeletes() ? ['deleted_at'] : [],
                $resourceClass::getRecordTitleAttribute() ? [$resourceClass::getRecordTitleAttribute()] : [],
            );

            // For single-level belongsTo relations, add the local foreign key so
            // the eager load can resolve. Nested relations (a.b.c) can't be safely
            // narrowed here, so we skip narrowing and fetch all base columns.
            $canNarrow = true;
            foreach ($relationCols as $name) {
                $segments = explode('.', $name);
                if (count($segments) > 2) { $canNarrow = false; break; }
                try {
                    $relation = $model->{$segments[0]}();
                } catch (\Throwable $e) {
                    $canNarrow = false;
                    break;
                }
                if ($relation instanceof BelongsTo) {
                    $needed[] = $relation->getForeignKeyName();
                }
            }

            if ($canNarrow) {
                // Guard: only local columns belong in the base SELECT — a dotted
                // name (relationship column) would be an invalid column here.
                $select = array_filter(
                    array_unique($needed),
                    fn ($c) => $c !== null && $c !== '' && !str_contains((string) $c, '.'),
                );
                $query->select(array_values($select));
            }
        }

        // ── Multi-tenancy scope ───────────────────────────────────────────────
        $panel = LarafusionManager::getPanel();
        if ($panel && $panel->hasTenancy()) {
            $tenant = ($panel->getTenantResolver())($request);
            $query  = $resourceClass::scopeForTenant($query, $tenant);
        }

        $search     = $request->get('search');
        $searchable = $resourceClass::getSearchable();
        if ($search && !empty($searchable)) {
            $query->where(function ($q) use ($searchable, $search) {
                foreach ($searchable as $col) {
                    if (str_contains($col, '.')) {
                        // Relationship column (e.g. 'author.name') → search the
                        // related table via whereHas on the relation path.
                        $segments = explode('.', $col);
                        $attr     = array_pop($segments);
                        $relation = implode('.', $segments);
                        $q->orWhereHas($relation, function ($rq) use ($attr, $search) {
                            $rq->where($attr, 'like', "%{$search}%");
                        });
                    } else {
                        $q->orWhere($col, 'like', "%{$search}%");
                    }
                }
            });
        }

        // Build a map of standalone Filter objects so their query closures + attribute() are respected
        $standaloneFilters = [];
        foreach ($resourceClass::table(Table::make())->getFilters() as $f) {
            $standaloneFilters[$f->getName()] = $f;
        }

        $filters = $request->get('filter', []);
        if (is_array($filters)) {
            foreach ($filters as $field => $value) {
                // Skip completely empty values (but allow 'false' / '0')
                if ($value === null || $value === '') continue;

                // Standalone filter with a PHP object → delegate to its applyToQuery()
                if (isset($standaloneFilters[$field])) {
                    $standaloneFilters[$field]->applyToQuery($query, $value);
                    continue;
                }

                // Generic column-level filter (from ->filterable() on columns)
                if (is_array($value)) {
                    if (!empty($value['from'])) $query->where($field, '>=', $value['from']);
                    if (!empty($value['to']))   $query->where($field, '<=', $value['to']);
                    continue;
                }
                if (in_array($value, ['true', 'false', '1', '0'], true)) {
                    $query->where($field, filter_var($value, FILTER_VALIDATE_BOOLEAN));
                    continue;
                }
                if (str_contains($value, ',')) {
                    $query->whereIn($field, array_map('trim', explode(',', $value)));
                    continue;
                }
                $query->where($field, 'like', "%{$value}%");
            }
        }

        $tableConfig     = $resourceClass::getTableConfig();
        $defaultSortField = $tableConfig['defaultSort']['field'] ?? 'id';
        $defaultSortDir   = $tableConfig['defaultSort']['dir']   ?? 'asc';

        $sortField = $request->get('sort', $defaultSortField);
        $sortDir   = $request->get('direction', $defaultSortDir);
        if (in_array($sortField, array_merge($resourceClass::getSortable(), ['id']))) {
            if (str_contains($sortField, '.')) {
                // Relationship sort — single-level belongsTo via a correlated
                // subquery (no join, no ambiguous column names). Other relation
                // types are left unsorted rather than throwing.
                $segments = explode('.', $sortField);
                if (count($segments) === 2) {
                    [$rel, $attr] = $segments;
                    try {
                        $relation = $model->{$rel}();
                        if ($relation instanceof BelongsTo) {
                            $related = $relation->getRelated();
                            $query->orderBy(
                                $related->newQuery()
                                    ->select($attr)
                                    ->whereColumn(
                                        $related->getTable() . '.' . $relation->getOwnerKeyName(),
                                        $model->getTable() . '.' . $relation->getForeignKeyName()
                                    )
                                    ->limit(1),
                                $sortDir
                            );
                        }
                    } catch (\Throwable $e) {
                        // Unsupported relationship sort — keep default order.
                    }
                }
            } else {
                $query->orderBy($sortField, $sortDir);
            }
        }

        // Soft-delete trashed filter
        if ($resourceClass::softDeletes()) {
            $trashed = $request->get('trashed', 'without');
            if ($trashed === 'only')    $query->onlyTrashed();
            elseif ($trashed === 'with') $query->withTrashed();
        }

        $perPage = min(max((int) $request->get('per_page', $resourceClass::getPerPage()), 5), 100);
        $tableConfig       = $resourceClass::getTableConfig();
        $disablePagination = ($tableConfig['pagination'] ?? null) === false;
        $deferLoading      = $tableConfig['deferLoading'] ?? false;

        // Evaluate widgets once here so we can branch without calling widgets() twice.
        $widgetData = $resourceClass::widgets();

        return Inertia::render('Larafusion/Index', [
            // ── Lazy props (fn closures) ──────────────────────────────────────────
            // Evaluated on every full page visit so navigating between resources
            // (all using the same Larafusion/Index component) always gets the correct
            // resource-specific data.
            //
            // On partial reloads (only:['records']) these closures are NEVER evaluated
            // or sent — Inertia only evaluates props that are in the `only` list.
            // So the "don't re-send on filter/sort/paginate" guarantee is preserved
            // without needing Inertia::once(), which breaks same-component navigation.
            'resource' => fn () => array_merge($resourceClass::getPageProps('index')['resource'], [
                'softDeletes'    => $resourceClass::softDeletes(),
                'inlineEditable' => $resourceClass::getInlineEditable(),
            ]),
            // Only needed for type-aware cell rendering when inline editing is on
            // (Select labels, boolean/date formatting, edit inputs) — the prop is
            // omitted entirely otherwise rather than sent as an empty schema, so the
            // index page doesn't ship a full form schema for resources that don't
            // use inline editing at all.
            ...($resourceClass::getInlineEditable() ? [
                'schema' => fn () => $resourceClass::getFormSchema(),
            ] : []),
            'columns'       => fn () => $resourceClass::getColumnsSchema(),
            'tableConfig'   => fn () => $tableConfig,
            'actions'       => fn () => $resourceClass::getActionsSchema(),
            // Header actions from the resource's ListPage class (Filament v5 style).
            // Falls back to a default create button when no ListPage is found.
            'headerActions' => fn () => (function () use ($resourceClass) {
                $actions = $resourceClass::getHeaderActionsFor('list');
                if ($actions !== null) return $actions;
                // Fallback: show create button when no page class exists
                if ($resourceClass::canCreate() && !$resourceClass::getHideCreateButton()) {
                    return [[
                        'type'  => 'create',
                        'label' => 'New ' . $resourceClass::getRecordLabel(),
                        'color' => 'primary',
                        // No default icon — the create button is icon-free unless the
                        // developer adds one (e.g. CreateAction::make()->icon('plus')).
                        'href'  => '/admin/' . $resourceClass::getSlug() . '/create',
                    ]];
                }
                return [];
            })(),
            'page'   => 'index',
            'record' => null,

            // ── Regular prop (or deferred on first load) ──────────────────────────
            // Always fresh; refreshed via only:['records'] on sort / filter / paginate.
            // ->deferLoading() defers only the *initial* fetch (page shell renders
            // first, records arrive in a follow-up request) — once loaded it's a
            // normal prop again, so partial reloads keep working exactly as before.
            'records' => (function () use ($query, $request, $perPage, $disablePagination, $deferLoading) {
                $build = function () use ($query, $request, $perPage, $disablePagination) {
                    if ($disablePagination) {
                        $items = $query->get();
                        $total = $items->count();
                        return new LengthAwarePaginator(
                            $items, $total, max($total, 1), 1,
                            ['path' => $request->url(), 'query' => $request->query()]
                        );
                    }
                    return $query->paginate($perPage)->withQueryString();
                };

                return $deferLoading ? Inertia::defer($build) : $build();
            })(),

            // ── Widgets: defer only when widgets exist ────────────────────────────
            // If the resource has no widgets, send [] immediately — no second HTTP
            // request. If it has widgets, defer them so the table renders first.
            'widgets' => !empty($widgetData)
                ? Inertia::defer(fn () => array_map(fn ($w) => $w->toArray(), $widgetData))
                : [],
        ]);
    }

    public function create(string $resource)
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canCreate(), 403);
        return Inertia::render('Larafusion/Create', [
            // Schema / resource meta never change during the create flow — send once.
            'resource'      => Inertia::once(fn () => $resourceClass::getPageProps('create')['resource']),
            'schema'        => Inertia::once(fn () => $resourceClass::getFormSchema()),
            'columns'       => Inertia::once(fn () => $resourceClass::getColumnsSchema()),
            'actions'       => Inertia::once(fn () => $resourceClass::getActionsSchema()),
            'headerActions' => Inertia::once(fn () => $resourceClass::getHeaderActionsFor('create') ?? []),
            'page'          => Inertia::once(fn () => 'create'),
            'record'        => null,
        ]);
    }

    public function store(Request $request, string $resource)
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canCreate(), 403);
        $schema        = $resourceClass::getFlatFields();
        $validated     = $request->validate($resourceClass::getCreateRules());

        // 🔌 Plugin hook: record.creating
        $validated = LarafusionManager::fire('record.creating', $validated) ?? $validated;

        [$validated, $relations] = $this->separateRelations($validated, $schema);
        $validated = $this->handleFileFields($validated, $schema);
        $validated = $this->handleJsonFields($validated, $schema);
        $validated = $this->handleMorphFields($validated, $schema);
        $validated = $this->hashPasswords($validated);

        $record = $resourceClass::getModelInstance()->create($validated);
        $this->syncRelations($record, $relations, $schema);

        // 🔌 Plugin hook: record.created
        LarafusionManager::fire('record.created', $record);

        // 📡 Realtime broadcast
        $this->broadcastIfEnabled('created', $resource, $record);

        Inertia::flash('success', "{$resourceClass::getRecordLabel()} created successfully.");
        return redirect()->route('larafusion.resource.index', $resource);
    }

    public function show(string $resource, int|string $id)
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canView(), 403);
        $record = $resourceClass::getModelInstance()->findOrFail($id);
        return Inertia::render('Larafusion/Show', [
            // Static — field definitions and permissions don't change per-visit.
            'resource' => Inertia::once(fn () => $resourceClass::getPageProps('show', $record)['resource']),
            'schema'   => Inertia::once(fn () => $resourceClass::getFormSchema()),
            'columns'  => Inertia::once(fn () => $resourceClass::getColumnsSchema()),
            'actions'  => Inertia::once(fn () => $resourceClass::getActionsSchema($record)),
            'page'     => Inertia::once(fn () => 'show'),
            // record stays as a regular prop so router.reload({only:['record']}) works.
            'record'   => $record,
        ]);
    }

    public function edit(string $resource, int|string $id)
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canEdit(), 403);
        $record = $resourceClass::getModelInstance()->findOrFail($id);
        return Inertia::render('Larafusion/Edit', [
            // Static — schema never changes while the user edits a record.
            'resource'      => Inertia::once(fn () => $resourceClass::getPageProps('edit', $record)['resource']),
            'schema'        => Inertia::once(fn () => $resourceClass::getFormSchema()),
            'columns'       => Inertia::once(fn () => $resourceClass::getColumnsSchema()),
            'actions'       => Inertia::once(fn () => $resourceClass::getActionsSchema($record)),
            'headerActions' => Inertia::once(fn () => $resourceClass::getHeaderActionsFor('edit', $record) ?? []),
            'page'          => Inertia::once(fn () => 'edit'),
            // record stays regular — the form needs fresh data if reloaded.
            'record'        => $record,
        ]);
    }

    public function update(Request $request, string $resource, int|string $id)
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canEdit(), 403);
        $schema        = $resourceClass::getFlatFields();
        $record        = $resourceClass::getModelInstance()->findOrFail($id);
        $validated     = $request->validate($resourceClass::getUpdateRules($id));

        // 🔌 Plugin hook: record.updating
        $validated = LarafusionManager::fire('record.updating', ['record' => $record, 'data' => $validated])['data'] ?? $validated;

        [$validated, $relations] = $this->separateRelations($validated, $schema);
        $validated = $this->handleFileFields($validated, $schema);
        $validated = $this->handleJsonFields($validated, $schema);
        $validated = $this->handleMorphFields($validated, $schema);
        $validated = $this->hashPasswords($validated);

        $record->update($validated);
        $this->syncRelations($record, $relations, $schema);

        // 🔌 Plugin hook: record.updated
        LarafusionManager::fire('record.updated', $record);

        // 📡 Realtime broadcast
        $this->broadcastIfEnabled('updated', $resource, $record);

        Inertia::flash('success', "{$resourceClass::getRecordLabel()} updated successfully.");
        return redirect()->route('larafusion.resource.index', $resource);
    }

    public function destroy(string $resource, int|string $id)
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canDelete(), 403);
        $record        = $resourceClass::getModelInstance()->findOrFail($id);

        // 🔌 Plugin hook: record.deleting
        LarafusionManager::fire('record.deleting', $record);

        $record->delete();

        // 🔌 Plugin hook: record.deleted
        LarafusionManager::fire('record.deleted', $record);

        // 📡 Realtime broadcast
        $this->broadcastIfEnabled('deleted', $resource, ['id' => $id]);

        Inertia::flash('success', "{$resourceClass::getRecordLabel()} deleted successfully.");
        return redirect()->route('larafusion.resource.index', $resource);
    }

    public function bulkDestroy(Request $request, string $resource)
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canDelete(), 403);
        $ids = $request->validate(['ids' => 'required|array', 'ids.*' => 'integer'])['ids'];
        $resourceClass::getModelInstance()->whereIn('id', $ids)->delete();
        Inertia::flash('success', count($ids) . " {$resourceClass::getRecordLabel()}s deleted.");
        return back();
    }

    public function restore(string $resource, int|string $id)
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canEdit(), 403);
        abort_unless($resourceClass::softDeletes(), 403);
        $resourceClass::getModelInstance()->withTrashed()->findOrFail($id)->restore();
        Inertia::flash('success', "{$resourceClass::getRecordLabel()} restored.");
        return back();
    }

    public function forceDestroy(string $resource, int|string $id)
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canDelete(), 403);
        abort_unless($resourceClass::softDeletes(), 403);
        $resourceClass::getModelInstance()->withTrashed()->findOrFail($id)->forceDelete();
        Inertia::flash('success', "{$resourceClass::getRecordLabel()} permanently deleted.");
        return back();
    }

    public function bulkRestore(Request $request, string $resource)
    {
        $resourceClass = LarafusionManager::resolve($resource);
        abort_unless($resourceClass::canEdit(), 403);
        abort_unless($resourceClass::softDeletes(), 403);
        $ids = $request->validate(['ids' => 'required|array', 'ids.*' => 'integer'])['ids'];
        $resourceClass::getModelInstance()->withTrashed()->whereIn('id', $ids)->restore();
        Inertia::flash('success', count($ids) . " {$resourceClass::getRecordLabel()}s restored.");
        return back();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    protected function broadcastIfEnabled(string $event, string $resource, mixed $payload): void
    {
        $panel = LarafusionManager::getPanel();
        if (!$panel || !$panel->hasRealtime()) return;

        try {
            $channel = $panel->getRealtimeChannel() . '.' . $resource;
            broadcast(new \Larafusion\Events\RecordEvent($event, $resource, $payload))->toOthers();
        } catch (\Throwable) {
            // Broadcasting is optional — silently ignore if driver not configured
        }
    }

    protected function hashPasswords(array $data): array
    {
        foreach ($data as $key => $value) {
            if (str_contains(strtolower($key), 'password')) {
                if ($value) { $data[$key] = bcrypt($value); }
                else        { unset($data[$key]); }
            }
        }
        return $data;
    }

    protected function separateRelations(array $validated, array $schema): array
    {
        $relations = [];
        foreach ($schema as $field) {
            if ($field instanceof BelongsToMany) {
                $name = $field->getName();
                if (isset($validated[$name])) {
                    $relations[$name] = $validated[$name];
                    unset($validated[$name]);
                }
            }
        }
        return [$validated, $relations];
    }

    protected function syncRelations($record, array $relations, array $schema): void
    {
        foreach ($schema as $field) {
            if (!($field instanceof BelongsToMany)) continue;
            $name = $field->getName();
            if (!array_key_exists($name, $relations)) continue;
            $method = \Illuminate\Support\Str::camel($name);
            if (method_exists($record, $method)) {
                $ids = is_array($relations[$name]) ? $relations[$name] : [$relations[$name]];
                $record->$method()->sync(array_filter($ids));
            }
        }
    }

    protected function handleJsonFields(array $validated, array $schema): array
    {
        foreach ($schema as $field) {
            if (!($field instanceof KeyValue) && !($field instanceof Builder)) continue;
            $name  = $field->getName();
            $value = $validated[$name] ?? null;
            if ($value === null) continue;
            if (is_array($value)) {
                $validated[$name] = json_encode($value);
            }
        }
        return $validated;
    }

    protected function handleMorphFields(array $validated, array $schema): array
    {
        foreach ($schema as $field) {
            if (!($field instanceof MorphTo)) continue;
            $name  = $field->getName();
            $value = $validated[$name] ?? null;
            if ($value === null) continue;
            $decoded = is_string($value) ? json_decode($value, true) : $value;
            if (is_array($decoded) && isset($decoded['type'], $decoded['id'])) {
                $validated["{$name}_type"] = $decoded['type'];
                $validated["{$name}_id"]   = $decoded['id'];
            }
            unset($validated[$name]);
        }
        return $validated;
    }

    protected function handleFileFields(array $validated, array $schema): array
    {
        foreach ($schema as $field) {
            if (!($field instanceof FileUpload)) continue;
            $name  = $field->getName();
            $value = $validated[$name] ?? null;
            if (!$value) continue;
            $keys  = is_array($value) ? $value : [$value];
            $paths = [];
            foreach ($keys as $key) {
                if (is_string($key) && str_starts_with($key, 'eyJ')) {
                    $path = UploadController::persist($key, $field->getDirectory(), $field->getDisk());
                    if ($path) $paths[] = $path;
                } else {
                    $paths[] = $key;
                }
            }
            $validated[$name] = $field->isMultiple() ? json_encode($paths) : ($paths[0] ?? null);
        }
        return $validated;
    }
}
