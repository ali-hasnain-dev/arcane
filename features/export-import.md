# Export & Import

## Overview

Larafusion provides built-in CSV export (streaming download) and a 3-step CSV import wizard. Both are opt-in per resource, gated by the existing resource authorization, and respect the current table search and filter state.

---

## Why This Feature Exists

Admin panels routinely need to hand data to stakeholders (exports) or receive bulk data from external systems (imports). Hand-rolling a CSV controller per resource is tedious and error-prone. Larafusion unifies this into two resource methods and one controller pair.

---

## Export

### Enable

```php
class ProductResource extends Resource
{
    public static function exportable(): bool { return true; }
}
```

This adds an **Export CSV** button to the index table toolbar.

### How It Works

`ExportController::export()`:
1. Resolves the resource class.
2. Calls `abort_unless($resourceClass::canViewAny(), 403)` and `abort_unless($resourceClass::exportable(), 403)`.
3. Rebuilds the same search/filter/sort query as the index (from `?search=`, `?filter[]=`, `?sort=`, `?direction=`).
4. Calls `$resourceClass::getExportColumns()` for the column map.
5. Streams a CSV response with `response()->streamDownload()`, chunking records 500 at a time via `->chunk(500)`.
6. JSON arrays (multi-value fields) are flattened to comma-separated strings.

The export filename is `{slug}-export-{Y-m-d-His}.csv`.

### Customising Exported Columns

Override `getExportColumns()`:

```php
public static function getExportColumns(): array
{
    return [
        'id'           => 'ID',
        'name'         => 'Product Name',
        'sku'          => 'SKU',
        'price'        => 'Price',
        'stock'        => 'Stock',
        'status'       => 'Status',
        'created_at'   => 'Created',
    ];
}
```

The default implementation includes `id`, all `$searchable` and `$sortable` columns, and `created_at`.

### Context-Aware Export

The export mirrors the table's current search and filter state because the controller reads the same `?search`, `?filter`, `?sort`, `?direction` query parameters. Users can filter the table first, then export only the matching records.

---

## Import

### Enable

```php
class ProductResource extends Resource
{
    public static function importable(): bool { return true; }
}
```

This adds an **Import** link to the index page toolbar that opens a 3-step wizard at `GET /admin/{resource}/import`.

### Import Wizard Flow

**Step 1 — Upload CSV**
User selects a `.csv` or `.txt` file. React POSTs it to `POST /admin/{resource}/import/preview`.

**Step 2 — Column Mapping**
The server parses the CSV headers and returns them alongside `getImportColumns()`. The wizard shows a mapping UI: for each CSV header, the user selects which database column it maps to (or "Skip"). A preview of the first 10 rows is shown.

**Step 3 — Commit**
React POSTs the file and the mapping to `POST /admin/{resource}/import/commit`. The server:
1. Re-reads the CSV file.
2. For each row, builds a `$data` array from the column mapping.
3. Validates against the subset of `getCreateRules()` that applies to the mapped columns.
4. Calls `$resourceClass::getModelInstance()->create($data)` for valid rows.
5. Collects per-row validation errors; skipped rows are reported in the success flash message.

### Customising Import Columns

Override `getImportColumns()`:

```php
public static function getImportColumns(): array
{
    // 'CSV Header' => 'database_column'
    return [
        'Product Name' => 'name',
        'SKU'          => 'sku',
        'Price'        => 'price',
        'Stock'        => 'stock_quantity',
        'Status'       => 'status',
    ];
}
```

The default is the inverse of `getExportColumns()`, minus `id`, `created_at`, `updated_at`.

### Import Validation

`ImportController::commit()` extracts the subset of `getCreateRules()` relevant to the mapped columns:

```php
$relevantRules = array_intersect_key($rules, $data);
$validator = Validator::make($data, $relevantRules);
```

Rows that fail validation are skipped and counted. The success flash reports: `"Imported 47 records. 3 row(s) had errors and were skipped."` Error details are returned in the JSON preview phase.

---

## Real World Examples

### Full Export + Import Resource

```php
class ContactResource extends Resource
{
    protected static string $model     = Contact::class;
    protected static array  $searchable = ['name', 'email', 'company'];

    public static function exportable(): bool { return true; }
    public static function importable(): bool { return true; }

    public static function getExportColumns(): array
    {
        return [
            'id'         => 'ID',
            'name'       => 'Full Name',
            'email'      => 'Email',
            'company'    => 'Company',
            'phone'      => 'Phone',
            'status'     => 'Status',
            'created_at' => 'Created At',
        ];
    }

    public static function getImportColumns(): array
    {
        return [
            'Full Name' => 'name',
            'Email'     => 'email',
            'Company'   => 'company',
            'Phone'     => 'phone',
            'Status'    => 'status',
        ];
    }

    public static function form(): array
    {
        return [
            Text::make('name')->required(),
            Email::make('email')->required()->unique('contacts', 'email'),
            Text::make('company')->nullable(),
            Text::make('phone')->nullable(),
            Select::make('status')
                ->options(['active' => 'Active', 'inactive' => 'Inactive'])
                ->default('active'),
        ];
    }
}
```

---

## Security Considerations

- **Export** is gated by `canViewAny()` — only users who can view the index can export. Additional export-specific gates can be added by overriding `exportable()` to check permissions.
- **Import** is gated by `canCreate()` — only users who can create records can import. The controller also checks `importable()`.
- Import file type is validated: `mimes:csv,txt|max:10240` (10 MB max). Only CSV files are accepted.
- Import validates each row against the resource's `getCreateRules()`. Malformed data is skipped, not silently saved.
- There is no mass-assignment protection bypass — `create($data)` uses the model's `$fillable` list.

---

## Performance Considerations

- **Export uses `->chunk(500)`** to avoid loading the entire table into memory. For 500K rows, this means ~1000 database queries of 500 rows each, streamed immediately to the HTTP response buffer.
- **Import reads the CSV twice**: once for preview (first 10 rows + total count), once for commit. Large files are never held in memory beyond the current row.
- **Import is synchronous** — the HTTP request stays open until all rows are processed. For very large imports (> 10,000 rows), consider dispatching a queued job and redirecting immediately.

---

## Best Practices

- **Always define `getImportColumns()` explicitly** rather than relying on the default (inverse of export). The default includes `id` and timestamps, which should not be imported.
- **Keep import column headers consistent** with what you export. This ensures users can do an export → edit → re-import cycle without remapping columns.
- **Add a `unique()` rule on the email or identifier field** in the resource's form schema. Import will skip duplicate rows and report them as errors rather than creating duplicates.
- **Test the import with edge cases**: empty cells, special characters, commas inside quoted fields, Windows CRLF line endings.

---

## Common Mistakes

**Exporting without filtering and getting too many rows.** The export re-applies the table's current filter state from the URL. If the user is on a filtered view, only those records export. Encourage users to clear filters before exporting all records.

**Including related model attributes (e.g. `author.name`) in `getExportColumns()`.** `data_get($record, 'author.name')` will work only if the relation is eager-loaded. Larafusion's export query does not add `->with()`. Either eager-load in a model scope or denormalise the value onto the main table.

**Expecting the import to handle non-CSV formats.** The validator enforces `mimes:csv,txt`. Excel `.xlsx` files will be rejected.

---

## Related Features

- [Resources](resources.md) — `exportable()`, `importable()`, `getExportColumns()`, `getImportColumns()`
- [Forms](forms.md) — form field rules are reused for import row validation
