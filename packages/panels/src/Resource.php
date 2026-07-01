<?php

namespace Larafusion;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Larafusion\Schema\Serializer;
use Larafusion\Tables\Table;

abstract class Resource
{
    protected static string  $model;
    protected static string  $navigationLabel  = '';
    protected static ?string $navigationIcon   = null;
    protected static ?string $navigationGroup  = null;
    protected static int     $navigationSort   = 0;
    protected static bool    $hideCreateButton = false;
    protected static string  $slug             = '';
    protected static string  $recordLabel      = 'Record';
    protected static ?string $recordTitleAttribute = null;
    protected static int     $perPage          = 10;
    protected static array   $searchable       = [];
    protected static array   $sortable         = [];

    // ── Must define ───────────────────────────────────────────────────────────
    abstract public static function form(): array;

    // ── Optional ──────────────────────────────────────────────────────────────

    /**
     * Filament-style table builder. Override this in your resource to use
     * the rich column API (TextColumn, BadgeColumn, etc.) and table-level
     * settings (striped, heading, description, filters, …).
     *
     * The default implementation wraps the legacy columns() array for
     * full backward compatibility.
     */
    public static function table(Table $table): Table
    {
        return $table->columns(static::columns());
    }

    /** Legacy columns API — still supported. Override either this OR table(). */
    public static function columns(): array  { return []; }
    public static function actions(): array  { return []; }
    public static function widgets(): array  { return []; }

    // ── Modal Forms ───────────────────────────────────────────────────────────
    public static function useModalForms(): bool { return false; }

    // ── Export / Import ───────────────────────────────────────────────────────
    public static function exportable(): bool   { return false; }
    public static function importable(): bool   { return false; }

    /**
     * Column map for CSV export: ['db_column' => 'Header Label'].
     * Defaults to all searchable + sortable fields.
     */
    public static function getExportColumns(): array
    {
        $cols = array_unique(array_merge(['id'], static::getSearchable(), static::getSortable(), ['created_at']));
        $map  = [];
        foreach ($cols as $col) {
            $map[$col] = ucwords(str_replace(['_', '-'], ' ', $col));
        }
        return $map;
    }

    /**
     * Column map for CSV import: ['csv_header' => 'db_column'].
     * Defaults to the inverse of exportable columns (minus id/created_at).
     */
    public static function getImportColumns(): array
    {
        $cols = [];
        foreach (static::getExportColumns() as $col => $label) {
            if (\in_array($col, ['id', 'created_at', 'updated_at'])) continue;
            $cols[$label] = $col;
        }
        return $cols;
    }

    // ── Soft Deletes ──────────────────────────────────────────────────────────
    public static function softDeletes(): bool { return false; }

    // ── Inline Editing ────────────────────────────────────────────────────────
    /**
     * Column names editable inline in the index table. Inferred from any table
     * column declared ->inlineEditable(); override to set them explicitly.
     */
    public static function getInlineEditable(): array
    {
        return static::table(Table::make())->getInlineEditableColumnNames();
    }

    // ── Getters ───────────────────────────────────────────────────────────────
    public static function getModel(): string           { return static::$model; }
    public static function getPerPage(): int            { return static::$perPage; }

    /**
     * All searchable field names: the legacy static $searchable array PLUS any
     * table column declared ->searchable(). Lets you drop the $searchable array
     * entirely and mark columns instead (relationship columns supported).
     */
    public static function getSearchable(): array
    {
        $fromClass = static::$searchable;
        $fromTable = static::table(Table::make())->getSearchableColumnNames();
        return array_values(array_unique(array_merge($fromClass, $fromTable)));
    }

    /**
     * Returns all sortable field names: the static $sortable array PLUS any
     * column declared ->sortable() inside table(). This lets you skip the
     * redundant $sortable array when using the table() builder.
     */
    public static function getSortable(): array
    {
        $fromClass = static::$sortable;
        $fromTable = static::table(Table::make())->getSortableColumnNames();
        return array_values(array_unique(array_merge($fromClass, $fromTable)));
    }
    public static function getRecordLabel(): string          { return static::$recordLabel; }
    public static function getRecordTitleAttribute(): ?string { return static::$recordTitleAttribute; }
    public static function getNavigationIcon(): ?string      { return static::$navigationIcon; }
    public static function getHideCreateButton(): bool   { return static::$hideCreateButton; }
    public static function getNavigationGroup(): ?string { return static::$navigationGroup; }
    public static function getNavigationSort(): int      { return static::$navigationSort; }
    public static function getNavigationBadge(): string|int|null { return null; }

    public static function getModelInstance(): Model
    {
        $class = static::$model;
        return new $class();
    }

    public static function getSlug(): string
    {
        if (static::$slug) return static::$slug;
        $parts = explode('\\', static::$model);
        return strtolower(end($parts)) . 's';
    }

    public static function getNavigationLabel(): string
    {
        if (static::$navigationLabel) return static::$navigationLabel;
        $parts = explode('\\', static::$model);
        return ucfirst(end($parts)) . 's';
    }

    // ── Schema ────────────────────────────────────────────────────────────────
    public static function getFormSchema(): array
    {
        return Serializer::fields(static::form());
    }

    public static function getColumnsSchema(): array
    {
        $built = static::table(Table::make());
        return Serializer::columns($built->getColumns());
    }

    /**
     * Table-level config (striped, heading, description, etc.) for the React frontend.
     */
    public static function getTableConfig(): array
    {
        return static::table(Table::make())->forModel(static::getModel())->toConfig();
    }

    /** Actions schema — strips hidden actions and serializes to arrays. */
    public static function getActionsSchema(?Model $record = null): array
    {
        $out = [];
        foreach (static::actions() as $action) {
            if ($record !== null && !$action->visibleFor($record)) continue;
            if ($action->isHidden()) continue;
            $out[] = $action->toArray();
        }
        return $out;
    }

    // ── Validation ────────────────────────────────────────────────────────────
    public static function getCreateRules(): array
    {
        $rules = [];
        foreach (Serializer::flattenFields(static::form()) as $field) {
            // Always include every field in validation so its value reaches $validated.
            // Fields with no explicit rules default to ['nullable'] so Laravel doesn't
            // strip them from the validated payload (empty-array rules = field excluded).
            $rules[$field->getName()] = $field->getRules() ?: ['nullable'];
        }
        return $rules;
    }

    public static function getUpdateRules(int|string $id): array
    {
        $rules = static::getCreateRules();
        foreach ($rules as $field => $fieldRules) {
            foreach ($fieldRules as $i => $rule) {
                if (\is_string($rule) && str_starts_with($rule, 'unique:')) {
                    [$table, $column] = explode(',', str_replace('unique:', '', $rule)) + [1 => $field];
                    $rules[$field][$i] = "unique:{$table},{$column},{$id}";
                }
            }
        }
        return $rules;
    }

    /** Flat Field instances only (strips layout wrappers) — for controller use. */
    public static function getFlatFields(): array
    {
        return Serializer::flattenFields(static::form());
    }

    // ── Global Search ─────────────────────────────────────────────────────────

    /** Primary display string for global search results. Override to customise. */
    public static function getGlobalSearchTitle(Model $record): string
    {
        if (static::$recordTitleAttribute !== null) {
            return (string) ($record->{static::$recordTitleAttribute} ?? $record->getKey());
        }
        $searchable = static::getSearchable();
        if (!empty($searchable)) {
            return (string) ($record->{$searchable[0]} ?? $record->getKey());
        }
        return '#' . $record->getKey();
    }

    /** Secondary line shown below the title in search results. Override to customise. */
    public static function getGlobalSearchDescription(Model $record): ?string
    {
        $searchable = static::getSearchable();
        if (count($searchable) > 1) {
            return (string) ($record->{$searchable[1]} ?? null);
        }
        return null;
    }

    // ── Authorization ─────────────────────────────────────────────────────────
    public static function canViewAny(): bool  { return true; }
    public static function canCreate(): bool   { return true; }
    public static function canEdit(): bool     { return true; }
    public static function canDelete(): bool   { return true; }
    public static function canView(): bool     { return true; }

    // ── Multi-Tenancy ─────────────────────────────────────────────────────────

    /**
     * Apply tenant scope to the query. Override in resources that support tenancy.
     *
     * Example:
     *   public static function scopeForTenant($query, $tenant): mixed {
     *       return $query->where('team_id', $tenant->id);
     *   }
     */
    public static function scopeForTenant(mixed $query, mixed $tenant): mixed
    {
        return $query;
    }

    // ── Page class auto-discovery ─────────────────────────────────────────────

    /**
     * Find the page class for this resource by convention.
     *
     * PostResource → App\Larafusion\Resources\Posts\Pages\ListPosts   ($type='List')
     * PostResource → App\Larafusion\Resources\Posts\Pages\EditPost    ($type='Edit')
     * PostResource → App\Larafusion\Resources\Posts\Pages\CreatePost  ($type='Create')
     *
     * Tries the plural form first for List, singular first for Edit/Create.
     */
    protected static function discoverPageClass(string $type): ?string
    {
        $parts    = explode('\\', static::class);
        $resName  = str_replace('Resource', '', end($parts)); // e.g. "Post", "Category"
        $plural   = Str::plural($resName);                   // e.g. "Posts", "Categories"

        array_pop($parts);
        $ns = implode('\\', $parts) . '\\Pages';

        $candidates = $type === 'List'
            ? [$ns . '\\List' . $plural, $ns . '\\List' . $resName]
            : [$ns . '\\' . $type . $resName, $ns . '\\' . $type . $plural];

        foreach ($candidates as $candidate) {
            if (class_exists($candidate)) return $candidate;
        }
        return null;
    }

    public static function getListPage(): ?string   { return static::discoverPageClass('List'); }
    public static function getEditPage(): ?string   { return static::discoverPageClass('Edit'); }
    public static function getCreatePage(): ?string { return static::discoverPageClass('Create'); }
    public static function getShowPage(): ?string   { return static::discoverPageClass('Show'); }

    /**
     * Serialize header actions from a page class into Inertia-ready arrays.
     * Returns [] if no page class is found (controller falls back to legacy logic).
     */
    public static function getHeaderActionsFor(string $pageType, mixed $record = null): ?array
    {
        $pageClass = match ($pageType) {
            'list'   => static::getListPage(),
            'edit'   => static::getEditPage(),
            'create' => static::getCreatePage(),
            'show'   => static::getShowPage(),
            default  => null,
        };

        if (!$pageClass) return null; // null = use fallback

        $slug = static::getSlug();
        $resourceClass = static::class;

        return array_values(array_filter(
            array_map(
                fn ($a) => $a->toArray($slug, $record, $resourceClass),
                $pageClass::getHeaderActions()
            )
        ));
    }

    // ── Page props passed to Inertia/React ────────────────────────────────────
    public static function getPageProps(string $page, mixed $record = null): array
    {
        return [
            'resource' => [
                'slug'            => static::getSlug(),
                'label'           => static::getRecordLabel(),
                'navigationLabel' => static::getNavigationLabel(),
                'searchable'      => static::getSearchable(),
                'sortable'        => static::getSortable(),
                'useModalForms'   => static::useModalForms(),
                // Lets the index page size a deferLoading skeleton to roughly the
                // real table's dimensions instead of an arbitrary placeholder.
                'perPage'         => static::getPerPage(),
                // Not a permission check (that's being split into its own package,
                // see the removed `can` object below) — this is a feature toggle:
                // whether the row-level View link should render at all. Generated
                // resources override canView() to false when the developer declines
                // the view-page prompt, so this needs to reach the frontend on its
                // own rather than living inside the removed `can` object.
                'showView'        => static::canView(),
                // hideCreateButton: dropped — never read on the frontend. Its effect
                // already happens server-side (ResourceController omits the create
                // action from `headerActions` when it's true).
                // can: dropped — authorization is being split into its own package.
                // The frontend already falls back to { viewAny, create, edit, delete,
                // view: true } when `can` is absent, so nothing breaks here yet.
            ],
            'schema'  => static::getFormSchema(),
            'columns' => static::getColumnsSchema(),
            'actions' => static::getActionsSchema($record instanceof Model ? $record : null),
            'page'    => $page,
            'record'  => $record,
        ];
    }
}
