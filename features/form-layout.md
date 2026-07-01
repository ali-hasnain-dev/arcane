# Form Layout

## Overview

Form layout components let you group, organise, and visually separate fields inside a resource's `form()` array. The three layout primitives are **Section**, **Tabs**, and **Grid**. They are not fields — they do not produce input elements — but they are serialised alongside fields into the same JSON schema that the React form renderer reads.

---

## Why This Feature Exists

Without layout components, `form()` returns a flat list of fields that stack vertically in a single column. Real forms need sections with headings, tabbed panels to hide complexity, and multi-column grids for related fields that belong side by side. Layout components solve this without requiring you to write any markup.

---

## Core Concepts

All three classes sit in `Larafusion\Layout\` and implement the same serialisation contract: they have a `getSchema(): array` method that returns the nested fields (used by `Serializer::flattenFields()` for validation extraction) and a `toArray()` method that the `Serializer` calls to produce the JSON payload.

`Serializer::fields()` handles mixed arrays — it accepts `Field`, `Section`, `Tabs`, and `Grid` objects in the same top-level array:

```php
public static function form(): array
{
    return [
        Text::make('title'),          // Field
        Section::make('Details')      // Section wrapping more fields
            ->schema([...]),
        Tabs::make()                  // Tabs wrapping tab panels
            ->tabs([...]),
        Grid::make(3)                 // 3-column grid
            ->schema([...]),
    ];
}
```

---

## Section

`Larafusion\Layout\Section`

A card-style container with an optional label, description, icon, and column grid. Fields inside the section are rendered in a grid of `columns` per row.

### Basic Usage

```php
use Larafusion\Layout\Section;

Section::make('Publishing')
    ->description('Control when and how this post is visible.')
    ->icon('calendar')
    ->columns(2)
    ->schema([
        Select::make('status')->options(['draft' => 'Draft', 'live' => 'Live']),
        DatePicker::make('published_at')->nullable(),
    ]);
```

### Collapsible Section

```php
Section::make('Advanced SEO')
    ->collapsible()      // shows a toggle arrow
    ->collapsed()        // starts collapsed (implies collapsible)
    ->schema([
        Text::make('meta_title'),
        Textarea::make('meta_description'),
    ]);
```

### Serialised Output

```json
{
  "type": "section",
  "label": "Publishing",
  "description": "Control when and how this post is visible.",
  "icon": "calendar",
  "columns": 2,
  "collapsible": false,
  "collapsed": false,
  "fields": [...]
}
```

### Configuration Reference

| Method | Type | Default | Description |
|---|---|---|---|
| `make(string $label)` | — | — | Label shown in the section header |
| `description(string)` | string | `null` | Subtitle below the label |
| `icon(string)` | string | `null` | Lucide icon next to the label |
| `columns(int)` | int | `1` | Number of grid columns for child fields |
| `collapsible(bool)` | bool | `false` | Show a collapse/expand toggle |
| `collapsed(bool)` | bool | `false` | Start in the collapsed state (implies collapsible) |
| `schema(array)` | array | `[]` | Child Field, Section, Tabs, or Grid instances |

---

## Tabs

`Larafusion\Layout\Tabs` + `Larafusion\Layout\Tab`

Groups fields into labelled tab panels. The React renderer shows one tab at a time with a tab bar for switching.

### Basic Usage

```php
use Larafusion\Layout\Tabs;
use Larafusion\Layout\Tab;

Tabs::make()
    ->tabs([
        Tab::make('General')
            ->icon('settings')
            ->schema([
                Text::make('name')->required(),
                Email::make('email')->required(),
            ]),
        Tab::make('Profile')
            ->icon('user')
            ->schema([
                Textarea::make('bio'),
                ImageUpload::make('avatar')->avatar(),
            ]),
        Tab::make('Permissions')
            ->icon('lock')
            ->schema([
                CheckboxList::make('roles')
                    ->options(['admin' => 'Admin', 'editor' => 'Editor']),
            ]),
    ])
    ->default('General');  // open this tab first
```

### Tab with Badge

```php
Tab::make('Notifications')
    ->badge(3)
    ->schema([...]);
```

### Serialised Output

```json
{
  "type": "tabs",
  "defaultTab": "General",
  "tabs": [
    {
      "type": "tab",
      "label": "General",
      "icon": "settings",
      "fields": [...]
    },
    ...
  ]
}
```

### Validation with Tabs

`Serializer::flattenFields()` iterates `$tabs->getSchema()` which collects all fields from all tabs into a flat array. This means validation rules from fields in every tab — including non-active tabs — run on every submit. This is intentional: you cannot bypass required fields by staying on a different tab.

### Configuration Reference

#### `Tabs`

| Method | Description |
|---|---|
| `tabs(array)` | Array of `Tab` instances |
| `default(string)` | Label of the tab to show first |

#### `Tab`

| Method | Description |
|---|---|
| `make(string $label)` | Factory; label shown in the tab button |
| `icon(string)` | Lucide icon in the tab button |
| `badge(string|int)` | Count/label badge on the tab button |
| `schema(array)` | Child Field instances (not nested layouts) |

---

## Grid

`Larafusion\Layout\Grid`

A lightweight multi-column wrapper. Use it when you want a column split inside an existing Section or at the top level without a visual card boundary.

### Basic Usage

```php
use Larafusion\Layout\Grid;

Grid::make(3)
    ->schema([
        Text::make('first_name'),
        Text::make('last_name'),
        Text::make('phone'),
    ]);
```

### Inside a Section

```php
Section::make('Personal Details')
    ->schema([
        Grid::make(2)->schema([
            Text::make('first_name'),
            Text::make('last_name'),
        ]),
        Email::make('email'),   // full-width, below the grid
    ]);
```

### Serialised Output

```json
{
  "type": "grid",
  "columns": 3,
  "fields": [...]
}
```

### Configuration Reference

| Method | Description |
|---|---|
| `make(int $columns)` | Factory; `$columns` defaults to 2 |
| `schema(array)` | Child Field instances |

---

## Architecture

### Serialisation Path

```
form()
  → array of Field + Section + Tabs + Grid
  → Serializer::fields()
      - Field instance     → call ->toArray()
      - Section instance   → call ->toArray() (recursively calls Serializer::fields on its schema)
      - Tabs instance      → call ->toArray() (maps tabs to arrays)
      - Grid instance      → call ->toArray() (recursively calls Serializer::fields on its schema)
  → JSON array sent as Inertia prop 'schema'
```

### Validation Extraction Path

```
Resource::getCreateRules()
  → Serializer::flattenFields(static::form())
      - Field instance   → return field
      - Section instance → recurse into section->getSchema()
      - Grid instance    → recurse into grid->getSchema()
      - Tabs instance    → iterate tabs, recurse into each tab->getSchema()
  → collect all Field instances
  → build [$field->getName() => $field->getRules()] map
```

This means that no matter how deeply nested a field is inside sections, grids, or tabs, its validation rules are always extracted.

---

## Real World Examples

### Full CMS Resource Form

```php
public static function form(): array
{
    return [
        Section::make('Content')
            ->columns(1)
            ->schema([
                Text::make('title')->required()->maxLength(200),
                Text::make('slug')->required()->unique('articles', 'slug'),
                RichText::make('body')->required(),
            ]),

        Tabs::make()->tabs([
            Tab::make('SEO')->icon('search')->schema([
                Text::make('meta_title')->nullable(),
                Textarea::make('meta_description')->nullable()->maxLength(160),
                Text::make('canonical_url')->url()->nullable(),
            ]),
            Tab::make('Open Graph')->icon('share-2')->schema([
                Text::make('og_title')->nullable(),
                Textarea::make('og_description')->nullable(),
                ImageUpload::make('og_image')->nullable(),
            ]),
        ]),

        Section::make('Publishing')
            ->columns(2)
            ->collapsible()
            ->schema([
                Select::make('status')
                    ->options(['draft' => 'Draft', 'review' => 'In Review', 'published' => 'Published'])
                    ->required(),
                Select::make('category_id')
                    ->options(Category::pluck('name', 'id')->toArray())
                    ->required(),
                DatePicker::make('published_at')->nullable(),
                Toggle::make('featured')->default(false),
            ]),
    ];
}
```

### Ecommerce Product Form

```php
public static function form(): array
{
    return [
        Grid::make(2)->schema([
            Text::make('name')->required()->columnSpan('full'),
            Text::make('sku')->required(),
            Number::make('price')->min(0)->required(),
            Number::make('compare_at_price')->nullable(),
            Number::make('stock_quantity')->min(0),
            Select::make('status')
                ->options(['active' => 'Active', 'draft' => 'Draft', 'archived' => 'Archived']),
        ]),

        Section::make('Description')
            ->schema([
                RichText::make('description'),
            ]),

        Section::make('Images')
            ->schema([
                ImageUpload::make('images')
                    ->multiple()
                    ->maxFiles(8)
                    ->reorderable()
                    ->directory('products'),
            ]),

        Section::make('Variants')
            ->collapsible()
            ->schema([
                Repeater::make('variants')
                    ->schema([
                        Text::make('option_name')->required(),
                        Text::make('option_value')->required(),
                        Number::make('price_adjustment'),
                        Number::make('stock'),
                    ])
                    ->columns(4)
                    ->addLabel('Add Variant'),
            ]),
    ];
}
```

---

## Best Practices

- **Use `Section` as your primary layout primitive.** It adds a visual card boundary and label that helps users navigate long forms.
- **Use `Tabs` for conceptually separate concerns** (e.g. Content vs SEO vs Permissions), not just to reduce visual clutter. Users often miss required fields on hidden tabs if the form submission fails.
- **Use `Grid` inside Sections** for tightly related fields (first/last name, price/currency) rather than as a standalone layout. This gives you the card boundary from Section plus the column layout from Grid.
- **Keep tabs shallow** — avoid nesting `Grid` or `Section` inside `Tab` schemas unless the form is genuinely complex. Flat schemas inside tabs are easier to scan.
- **`->collapsed()`** is useful for sections containing optional advanced settings that most users will ignore.

---

## Common Mistakes

**Nesting a `Tabs` inside a `Section` schema.** This is technically valid but the React renderer may not support arbitrary nesting. Keep `Tabs` at the top level of `form()`.

**Expecting `->columns(2)` on `Section` to make individual fields half-width.** The column count defines the grid template; a field that does not declare `columnSpan` takes one column. If you have 5 fields and `columns(2)`, the last field appears alone on its row.

**Forgetting that all tab fields are validated.** Required fields on non-visible tabs still run their rules on submit. If a user fills in tab 1 and submits, tab 2's required fields will produce validation errors.

---

## Related Features

- [Forms](forms.md) — all field types that go inside layout schemas
- [Resources](resources.md) — the `form()` method where layouts are declared
