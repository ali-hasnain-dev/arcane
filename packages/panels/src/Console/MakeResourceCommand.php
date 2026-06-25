<?php

namespace Larafusion\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use function Laravel\Prompts\confirm;
use function Laravel\Prompts\info;
use function Laravel\Prompts\text;

class MakeResourceCommand extends Command
{
    protected $signature   = 'larafusion:resource {name : The model name e.g. User, BlogPost}';
    protected $description = 'Create a new Larafusion resource with Filament-style folder structure';

    // ── System columns to skip in forms / tables ──────────────────────────────
    private const SKIP_FORM  = ['id', 'created_at', 'updated_at', 'deleted_at', 'remember_token', 'email_verified_at'];
    private const SKIP_TABLE = ['id', 'updated_at', 'deleted_at', 'remember_token', 'password', 'email_verified_at'];

    // ── Column names that imply JSON even when SQLite reports 'text' ──────────
    private const JSON_NAMES = ['tags', 'meta', 'settings', 'config', 'options', 'data',
                                'attributes', 'properties', 'blocks', 'extra', 'metadata'];

    // ── Column types that are not text-searchable ─────────────────────────────
    private const NON_SEARCHABLE_TYPES = ['boolean', 'integer', 'bigint', 'int', 'smallint', 'decimal', 'float', 'double', 'datetime', 'timestamp', 'date', 'json'];

    // ── Icon map ──────────────────────────────────────────────────────────────
    private const ICON_MAP = [
        'user'         => 'users',     'member'    => 'users',     'team'   => 'users',
        'post'         => 'file-text', 'article'   => 'file-text', 'blog'   => 'file-text',
        'page'         => 'file-text', 'content'   => 'file-text',
        'product'      => 'star',      'item'      => 'star',      'listing' => 'star',
        'order'        => 'zap',       'sale'      => 'zap',       'invoice' => 'zap',
        'category'     => 'archive',   'tag'       => 'archive',   'label'  => 'archive',
        'comment'      => 'mail',      'review'    => 'mail',      'reply'  => 'mail',
        'customer'     => 'user',      'client'    => 'user',      'contact' => 'user',
        'setting'      => 'settings',  'config'    => 'settings',  'preference' => 'settings',
        'role'         => 'shield',    'permission' => 'shield',
        'media'        => 'image',     'photo'     => 'image',     'image'  => 'image',
        'video'        => 'play-circle',
        'event'        => 'bell',      'notification' => 'bell',
        'report'       => 'bar-chart', 'analytics' => 'bar-chart',
        'transaction'  => 'refresh',   'payment'   => 'refresh',
        'subscription' => 'link',
    ];

    // ─────────────────────────────────────────────────────────────────────────

    public function handle(): int
    {
        $name = Str::studly($this->argument('name'));

        // Normalize: strip trailing 'Resource' so both 'Post' and 'PostResource' produce 'Post'
        if (str_ends_with($name, 'Resource')) {
            $name = substr($name, 0, -strlen('Resource'));
        }

        $plural = Str::plural($name);

        $baseDir = app_path("Larafusion/Resources/{$plural}");
        $ns      = "App\\Larafusion\\Resources\\{$plural}";

        $resourcePath = "{$baseDir}/{$name}Resource.php";

        if (File::exists($resourcePath)) {
            $this->error("Resource already exists: {$resourcePath}");
            return self::FAILURE;
        }

        // ── Prompt 1: title attribute ─────────────────────────────────────────
        info('The "title attribute" is used to identify each record in the UI (e.g. in page headings and global search).');
        $titleAttribute = text(
            label: 'What is the title attribute for this model?',
            placeholder: 'name',
            hint: 'Leave blank if records do not have a meaningful title field.',
        );

        // ── Prompt 2: view/show page ──────────────────────────────────────────
        $hasViewPage = confirm(
            label: 'Would you like to generate a read-only view page for the resource?',
            default: false,
        );

        // ── Prompt 3: generate from DB columns ────────────────────────────────
        $generateFromColumns = confirm(
            label: 'Should the configuration be generated from the current database columns?',
            default: false,
        );

        // ── Model + migration ──────────────────────────────────────────────────
        $modelClass = "App\\Models\\{$name}";
        $modelExists = class_exists($modelClass);

        if (!$modelExists) {
            $createModel = confirm(
                label: "Model App\\Models\\{$name} does not exist. Create it with a migration?",
                default: true,
            );

            if ($createModel) {
                $this->call('make:model', ['name' => $name, '--migration' => true]);
            }
        }

        // Try to introspect the model only when the user opts in
        $schema = $generateFromColumns ? $this->introspect($name) : [];
        $icon   = $this->guessIcon($name);

        if ($generateFromColumns && $schema) {
            $this->line("  <info>→</info> Detected model <comment>App\\Models\\{$name}</comment> — generating from schema.");
        } elseif ($generateFromColumns) {
            $this->line("  <comment>!</comment> Model or table not found — generating generic stubs.");
        }

        // Create directories
        File::ensureDirectoryExists("{$baseDir}/Pages");
        File::ensureDirectoryExists("{$baseDir}/Schemas");
        File::ensureDirectoryExists("{$baseDir}/Tables");

        // Write files
        File::put($resourcePath,                          $this->resourceStub($name, $plural, $ns, $schema, $icon, $titleAttribute));
        File::put("{$baseDir}/Schemas/{$name}Form.php",   $this->formStub($name, $plural, $ns, $schema));
        File::put("{$baseDir}/Tables/{$plural}Table.php", $this->tableStub($name, $plural, $ns, $schema));
        File::put("{$baseDir}/Pages/List{$plural}.php",   $this->listPageStub($name, $plural, $ns));
        File::put("{$baseDir}/Pages/Create{$name}.php",   $this->createPageStub($name, $plural, $ns));
        File::put("{$baseDir}/Pages/Edit{$name}.php",     $this->editPageStub($name, $plural, $ns));

        if ($hasViewPage) {
            File::put("{$baseDir}/Pages/View{$name}.php", $this->showPageStub($name, $plural, $ns));
        }

        $rel = "app/Larafusion/Resources/{$plural}";
        $this->newLine();
        $this->info("✅ Resource scaffolded: <comment>{$rel}/</comment>");
        $this->line("   <comment>{$name}Resource.php</comment>        ← model, navigation, wires schema + table");
        $this->line("   <comment>Schemas/{$name}Form.php</comment>    ← form field definitions");
        $this->line("   <comment>Tables/{$plural}Table.php</comment>  ← column + filter + action definitions");
        $this->line("   <comment>Pages/List{$plural}.php</comment>    ← list page (with create action)");
        $this->line("   <comment>Pages/Create{$name}.php</comment>    ← create page hook");
        $this->line("   <comment>Pages/Edit{$name}.php</comment>      ← edit page hook");
        if ($hasViewPage) {
            $this->line("   <comment>Pages/View{$name}.php</comment>     ← read-only view page hook");
        }
        $this->newLine();
        $this->line("Resources are <comment>auto-discovered</comment> — no registration needed.");

        return self::SUCCESS;
    }

    // ── Model introspection ───────────────────────────────────────────────────

    /**
     * Try to load the model class, connect to its DB table, and return
     * ['col' => 'type', ...].  Returns [] on any failure.
     */
    protected function introspect(string $name): array
    {
        $modelClass = "App\\Models\\{$name}";
        if (!class_exists($modelClass)) return [];

        try {
            $table = (new $modelClass())->getTable();
            if (!Schema::hasTable($table)) return [];

            $result = [];
            foreach (Schema::getColumnListing($table) as $col) {
                try {
                    $result[$col] = Schema::getColumnType($table, $col);
                } catch (\Throwable) {
                    $result[$col] = 'string';
                }
            }
            return $result;
        } catch (\Throwable) {
            return [];
        }
    }

    // ── Icon guesser ─────────────────────────────────────────────────────────

    protected function guessIcon(string $name): string
    {
        $lower = strtolower($name);
        foreach (self::ICON_MAP as $keyword => $icon) {
            if (str_contains($lower, $keyword)) return $icon;
        }
        return 'circle';
    }

    // ── Schema helpers ────────────────────────────────────────────────────────

    /** Column names that are typically enum-like select fields. */
    private const ENUM_NAMES = ['status', 'type', 'role', 'state', 'gender', 'plan', 'tier',
                                'level', 'visibility', 'priority', 'category', 'kind', 'mode',
                                'format', 'scope', 'source', 'stage'];

    /** Determine if a column+type acts as a boolean. */
    protected function isBoolean(string $col, string $type): bool
    {
        $norm = $this->normaliseType($type);
        return in_array($type, ['boolean', 'tinyint'])
            || ($norm === 'integer' && (str_starts_with($col, 'is_') || str_starts_with($col, 'has_')));
    }

    /** Normalise SQLite / MySQL type strings. */
    protected function normaliseType(string $type): string
    {
        return match(true) {
            in_array($type, ['varchar', 'char', 'string'])             => 'varchar',
            in_array($type, ['text', 'longtext', 'mediumtext',
                             'tinytext', 'clob'])                      => 'text',
            $type === 'boolean'                                        => 'boolean',
            in_array($type, ['integer', 'int', 'bigint', 'smallint',
                             'mediumint', 'tinyint'])                  => 'integer',
            in_array($type, ['decimal', 'float', 'double', 'numeric',
                             'real'])                                  => 'decimal',
            in_array($type, ['datetime', 'timestamp'])                 => 'datetime',
            $type === 'date'                                           => 'date',
            $type === 'json'                                           => 'json',
            default                                                    => $type,
        };
    }

    // ── Form generation ───────────────────────────────────────────────────────

    /** True if column name implies JSON storage (for SQLite which reports 'text'). */
    protected function isJsonColumn(string $col): bool
    {
        $base = strtolower(preg_replace('/_+$/', '', $col));
        return in_array($base, self::JSON_NAMES)
            || str_ends_with($base, '_json')
            || str_ends_with($base, '_data')
            || str_ends_with($base, '_meta')
            || str_ends_with($base, '_config')
            || str_ends_with($base, '_settings');
    }

    /** Map one DB column to a PHP form-field line (or null to skip). */
    protected function columnToFormField(string $col, string $rawType): ?string
    {
        if (in_array($col, self::SKIP_FORM)) return null;

        $type = $this->normaliseType($rawType);

        // Foreign key → Select placeholder
        if (str_ends_with($col, '_id')) {
            $relation = Str::headline(str_replace('_id', '', $col));
            return "                    Select::make('{$col}')->label('{$relation}')->options([/* TODO */]),";
        }

        // Enum-like column names → Select with TODO placeholder
        $baseName = preg_replace('/^.+_/', '', $col); // e.g. 'post_status' → 'status'
        if (in_array($col, self::ENUM_NAMES) || in_array($baseName, self::ENUM_NAMES)) {
            return "                    Select::make('{$col}')->options([/* TODO: add options */]),";
        }

        // Specific column names take priority over type
        if ($col === 'email' || str_ends_with($col, '_email')) {
            return "                    Email::make('{$col}')->required(),";
        }
        if ($col === 'password') {
            return "                    Password::make('{$col}'),";
        }
        if ($col === 'color' || str_ends_with($col, '_color') || str_ends_with($col, '_colour')) {
            return "                    Color::make('{$col}'),";
        }

        // tags column → Tags field
        if ($col === 'tags' || str_ends_with($col, '_tags')) {
            return "                    Tags::make('{$col}'),";
        }

        // JSON-like text columns → KeyValue
        if ($this->isJsonColumn($col) || $type === 'json') {
            return "                    KeyValue::make('{$col}'),";
        }

        // Boolean / toggle
        if ($this->isBoolean($col, $rawType) || $type === 'boolean') {
            $label = Str::headline($col);
            return "                    Toggle::make('{$col}')->label('{$label}'),";
        }

        // Long text → Textarea
        if ($type === 'text') {
            return "                    Textarea::make('{$col}')->rows(4),";
        }

        // Numbers
        if ($type === 'integer' || $type === 'decimal') {
            return "                    Number::make('{$col}'),";
        }

        // Dates
        if ($type === 'datetime' || $type === 'date') {
            return "                    DatePicker::make('{$col}'),";
        }

        // Varchar / default
        $extra = in_array($col, ['name', 'title', 'slug', 'subject'])
            ? '->required()->maxLength(255)'
            : '->maxLength(255)';
        return "                    Text::make('{$col}'){$extra},";
    }

    /** Collect the set of Larafusion field classes actually used. */
    protected function neededFormClasses(array $schema): array
    {
        $classes = [];
        foreach ($schema as $col => $rawType) {
            if ($this->columnToFormField($col, $rawType) === null) continue;
            $type = $this->normaliseType($rawType);

            $baseName = preg_replace('/^.+_/', '', $col);
            if (in_array($col, self::ENUM_NAMES) || in_array($baseName, self::ENUM_NAMES)) { $classes[] = 'Select';   continue; }
            if ($col === 'email' || str_ends_with($col, '_email'))          { $classes[] = 'Email';    continue; }
            if ($col === 'password')                                        { $classes[] = 'Password'; continue; }
            if ($col === 'color' || str_ends_with($col, '_color'))          { $classes[] = 'Color';    continue; }
            if (str_ends_with($col, '_id'))                                 { $classes[] = 'Select';   continue; }
            if ($col === 'tags' || str_ends_with($col, '_tags'))            { $classes[] = 'Tags';     continue; }
            if ($this->isJsonColumn($col) || $type === 'json')              { $classes[] = 'KeyValue'; continue; }
            if ($this->isBoolean($col, $rawType))                           { $classes[] = 'Toggle';   continue; }

            match($type) {
                'text'     => $classes[] = 'Textarea',
                'integer',
                'decimal'  => $classes[] = 'Number',
                'datetime',
                'date'     => $classes[] = 'DatePicker',
                default    => $classes[] = 'Text',
            };
        }

        // Always include Text as fallback for generic stubs
        $classes[] = 'Text';
        return array_unique($classes);
    }

    // ── Table generation ──────────────────────────────────────────────────────

    /** Map one DB column to a PHP table-column line (or null to skip). */
    protected function columnToTableColumn(string $col, string $rawType, bool &$firstString): ?string
    {
        if (in_array($col, self::SKIP_TABLE))   return null;
        if (str_ends_with($col, '_id'))         return null; // FKs skipped

        $type = $this->normaliseType($rawType);

        if ($type === 'json')                   return null;
        if ($this->isJsonColumn($col))          return null; // JSON stored as text (SQLite)
        if ($type === 'text')                   return null; // too long for table cells

        // Boolean / toggle
        if ($this->isBoolean($col, $rawType) || $type === 'boolean') {
            $label = Str::headline($col);
            return "                BooleanColumn::make('{$col}')->label('{$label}'),";
        }

        // Dates
        if ($type === 'datetime' || $type === 'date') {
            $since = (str_ends_with($col, '_at') || $col === 'created_at') ? '->since()' : '';
            return "                DateColumn::make('{$col}')->sortable(){$since},";
        }

        // Numbers
        if ($type === 'integer' || $type === 'decimal') {
            return "                TextColumn::make('{$col}')->sortable()->align('right'),";
        }

        // Image / avatar columns → ImageColumn
        if (preg_match('/(_image|_photo|_avatar|_thumbnail|_icon|_thumb)$/', $col)
            || in_array($col, ['avatar', 'photo', 'image', 'thumbnail', 'icon', 'featured_image'])) {
            return "                ImageColumn::make('{$col}')->circular(false)->size('2rem'),";
        }

        // Skip color / URL / path columns — not useful as table text
        if (preg_match('/(_color|_colour|_url|_path|_token)$/', $col)) return null;

        // Strings (varchar / text)
        $extra = '';
        if ($firstString) {
            $extra       = "->sortable()->weight('semibold')";
            $firstString = false;
        } else {
            $extra = '->sortable()';
        }
        if ($col === 'email' || str_ends_with($col, '_email')) {
            $extra .= '->copyable()';
        }
        return "                TextColumn::make('{$col}'){$extra},";
    }

    /** Collect the set of Larafusion column classes actually used. */
    protected function neededTableClasses(array $schema): array
    {
        $classes = ['TextColumn', 'DateColumn']; // always include fallback pair
        foreach ($schema as $col => $rawType) {
            $type = $this->normaliseType($rawType);
            if ($this->isBoolean($col, $rawType) || $type === 'boolean') $classes[] = 'BooleanColumn';
            if ($type === 'datetime' || $type === 'date')                 $classes[] = 'DateColumn';
            if (preg_match('/(_image|_photo|_avatar|_thumbnail|_icon|_thumb)$/', $col)
                || in_array($col, ['avatar', 'photo', 'image', 'thumbnail', 'icon', 'featured_image'])) {
                $classes[] = 'ImageColumn';
            }
        }
        return array_unique($classes);
    }

    // ── Searchable array ──────────────────────────────────────────────────────

    protected function buildSearchableArray(array $schema): string
    {
        $cols = [];
        foreach ($schema as $col => $rawType) {
            if (in_array($col, self::SKIP_TABLE))          continue; // system fields
            if (str_ends_with($col, '_id'))                continue; // FKs
            if ($this->isBoolean($col, $rawType))          continue; // booleans
            if ($this->isJsonColumn($col))                 continue; // JSON
            // Skip enum-like names — use filters, not search
            $base = preg_replace('/^.+_/', '', $col);
            if (in_array($col, self::ENUM_NAMES) || in_array($base, self::ENUM_NAMES)) continue;
            // Skip image/file/color/url-type columns
            if (preg_match('/(_image|_photo|_avatar|_icon|_thumb|_url|_path|_color|_colour|_token)$/', $col)) continue;
            if (in_array($col, ['avatar', 'photo', 'image', 'thumbnail', 'icon'])) continue;

            $type = $this->normaliseType($rawType);
            // Only varchar columns make sense for LIKE search; text is slow and rarely useful
            if ($type !== 'varchar')  continue;

            $cols[] = $col;
        }
        if (empty($cols)) return "['name']";
        $quoted = array_map(fn($c) => "'{$c}'", $cols);
        return '[' . implode(', ', $quoted) . ']';
    }

    // ── Stubs ─────────────────────────────────────────────────────────────────

    protected function resourceStub(string $name, string $plural, string $ns, array $schema, string $icon, string $titleAttribute = ''): string
    {
        $model      = "App\\Models\\{$name}";
        $label      = Str::headline($name);
        $searchable = $schema ? $this->buildSearchableArray($schema) : "['name']";

        $titleAttrLine = $titleAttribute !== ''
            ? "    protected static ?string \$recordTitleAttribute = '{$titleAttribute}';"
            : "    protected static ?string \$recordTitleAttribute = null;";

        return <<<PHP
<?php

namespace {$ns};

use {$model};
use Larafusion\Resource;
use Larafusion\Tables\Table;
use {$ns}\Schemas\\{$name}Form;
use {$ns}\Tables\\{$plural}Table;

class {$name}Resource extends Resource
{
    protected static string  \$model               = {$name}::class;
    protected static ?string \$navigationIcon      = '{$icon}';
    protected static string  \$recordLabel         = '{$label}';
{$titleAttrLine}
    protected static array   \$searchable          = {$searchable};

    public static function form(): array
    {
        return {$name}Form::fields();
    }

    public static function table(Table \$table): Table
    {
        return {$plural}Table::configure(\$table);
    }
}
PHP;
    }

    protected function formStub(string $name, string $plural, string $ns, array $schema): string
    {
        if (empty($schema)) {
            return $this->genericFormStub($name, $plural, $ns);
        }

        $classes   = $this->neededFormClasses($schema);
        $imports   = implode("\n", array_map(fn($c) => "use Larafusion\\Fields\\{$c};", $classes));

        $fieldLines = [];
        foreach ($schema as $col => $rawType) {
            $line = $this->columnToFormField($col, $rawType);
            if ($line !== null) $fieldLines[] = $line;
        }
        $fields = implode("\n", $fieldLines);
        $sectionLabel = Str::headline($name) . ' Details';

        return <<<PHP
<?php

namespace {$ns}\Schemas;

{$imports}
use Larafusion\Layout\Section;

class {$name}Form
{
    public static function fields(): array
    {
        return [
            Section::make('{$sectionLabel}')
                ->columns(2)
                ->schema([
{$fields}
                ]),
        ];
    }
}
PHP;
    }

    protected function genericFormStub(string $name, string $plural, string $ns): string
    {
        $sectionLabel = Str::headline($name) . ' Details';
        return <<<PHP
<?php

namespace {$ns}\Schemas;

use Larafusion\Fields\Text;
use Larafusion\Fields\Email;
use Larafusion\Layout\Section;

class {$name}Form
{
    public static function fields(): array
    {
        return [
            Section::make('{$sectionLabel}')
                ->columns(2)
                ->schema([
                    Text::make('name')->required()->maxLength(255),
                    Email::make('email')->required(),
                ]),
        ];
    }
}
PHP;
    }

    protected function tableStub(string $name, string $plural, string $ns, array $schema): string
    {
        if (empty($schema)) {
            return $this->genericTableStub($name, $plural, $ns);
        }

        $columnClasses = $this->neededTableClasses($schema);
        $colImports    = implode("\n", array_map(fn($c) => "use Larafusion\\Columns\\{$c};", $columnClasses));

        $firstString = true;
        $columnLines = [];
        foreach ($schema as $col => $rawType) {
            $line = $this->columnToTableColumn($col, $rawType, $firstString);
            if ($line !== null) $columnLines[] = $line;
        }

        // Always end with created_at if not already included
        if (!isset($schema['created_at']) || !array_filter($columnLines, fn($l) => str_contains($l, "'created_at'"))) {
            $columnLines[] = "                DateColumn::make('created_at')->sortable()->since(),";
        }

        $columns = implode("\n", $columnLines);
        $heading = Str::headline($plural);

        return <<<PHP
<?php

namespace {$ns}\Tables;

use Larafusion\Tables\Table;
{$colImports}
use Larafusion\Tables\Actions\EditAction;
use Larafusion\Tables\Actions\DeleteAction;
use Larafusion\Tables\Actions\BulkActionGroup;
use Larafusion\Tables\Actions\DeleteBulkAction;

class {$plural}Table
{
    public static function configure(Table \$table): Table
    {
        return \$table
            ->columns([
{$columns}
            ])
            ->filtersLayout()
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc')
            ->heading('{$heading}');
    }
}
PHP;
    }

    protected function genericTableStub(string $name, string $plural, string $ns): string
    {
        $heading = Str::headline($plural);
        return <<<PHP
<?php

namespace {$ns}\Tables;

use Larafusion\Tables\Table;
use Larafusion\Columns\TextColumn;
use Larafusion\Columns\DateColumn;
use Larafusion\Tables\Actions\EditAction;
use Larafusion\Tables\Actions\DeleteAction;
use Larafusion\Tables\Actions\BulkActionGroup;
use Larafusion\Tables\Actions\DeleteBulkAction;

class {$plural}Table
{
    public static function configure(Table \$table): Table
    {
        return \$table
            ->columns([
                TextColumn::make('name')->sortable()->weight('semibold'),
                DateColumn::make('created_at')->sortable()->since(),
            ])
            ->filtersLayout()
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc')
            ->heading('{$heading}');
    }
}
PHP;
    }

    protected function listPageStub(string $name, string $plural, string $ns): string
    {
        return <<<PHP
<?php

namespace {$ns}\Pages;

use Larafusion\Pages\ListPage;
use Larafusion\Pages\Actions\CreateAction;
use {$ns}\\{$name}Resource;

class List{$plural} extends ListPage
{
    protected static string \$resource = {$name}Resource::class;

    public static function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
PHP;
    }

    protected function createPageStub(string $name, string $plural, string $ns): string
    {
        return <<<PHP
<?php

namespace {$ns}\Pages;

use Larafusion\Pages\CreatePage;
use {$ns}\\{$name}Resource;

class Create{$name} extends CreatePage
{
    protected static string \$resource = {$name}Resource::class;
}
PHP;
    }

    protected function editPageStub(string $name, string $plural, string $ns): string
    {
        return <<<PHP
<?php

namespace {$ns}\Pages;

use Larafusion\Pages\EditPage;
use {$ns}\\{$name}Resource;

class Edit{$name} extends EditPage
{
    protected static string \$resource = {$name}Resource::class;
}
PHP;
    }

    protected function showPageStub(string $name, string $plural, string $ns): string
    {
        return <<<PHP
<?php

namespace {$ns}\Pages;

use Larafusion\Pages\ShowPage;
use Larafusion\Pages\Actions\EditAction;
use {$ns}\\{$name}Resource;

class View{$name} extends ShowPage
{
    protected static string \$resource = {$name}Resource::class;

    public static function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
PHP;
    }
}
