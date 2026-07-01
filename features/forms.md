# Forms & Field Types

## Overview

The Larafusion forms system is a PHP-first form schema builder. You define fields as PHP objects with fluent method chains; the `Serializer` converts them to plain arrays that Inertia ships to React, where the prebuilt form renderer displays them.

Every field type extends `Larafusion\Fields\Field`, which provides the shared validation infrastructure and base serialisation. Field-specific subclasses add their own display options, constraints, and extra `toArray()` keys.

---

## Why This Feature Exists

In a traditional full-stack app, form markup lives in Blade views, validation in Form Request classes, and field display logic scattered across both. If you rename a field, you touch at least three files. Larafusion collapses this to one: the field definition carries the label, placeholder, default, and all validation rules — both the rules that run server-side in Laravel and the client hints sent to React for instant feedback.

---

## Core Concepts

### Field Base Class

`Larafusion\Fields\Field` (abstract) provides:
- `name` — the key used in both the HTML input and the validated data array
- `label` — auto-generated from the name via `ucwords(str_replace(['_', '-'], ' ', $name))` unless overridden
- `rules` — the full array sent to `Illuminate\Validation\Validator`
- `clientRules` — the subset sent to React for live validation (no DB round-trips)
- `serverRules` — rules that only run server-side (e.g. `unique`, `exists`, `prohibited_if`)

### Dual Validation Split

Larafusion automatically classifies each added rule as client or server:

```php
// In Field::addRule()
if (in_array($base, self::SERVER_RULES)) {
    $this->serverRules[] = $rule;
} else {
    $this->clientRules[] = $rule;
}
```

Client rules (the full `CLIENT_RULES` constant list includes `required`, `min`, `max`, `email`, `regex`, `confirmed`, `in`, etc.) are sent to React so the form can show inline errors before submission. Server-only rules (`unique`, `exists`, `required_if`, `prohibited_unless`, etc.) are withheld from the JSON — they only apply in the Laravel validator.

### Serialisation Path

```
Resource::form()
  → array of Field / Section / Tabs / Grid objects
  → Serializer::fields()          // calls ->toArray() on each
  → sent as Inertia prop 'schema'
  → React form renderer reads schema
  → renders the correct component for each field['type']
```

---

## Complete Field Reference

### Text

```php
use Larafusion\Fields\Text;

Text::make('title')
    ->label('Post Title')
    ->required()
    ->minLength(3)
    ->maxLength(255)
    ->placeholder('Enter a title...')
    ->hint('This appears in the browser tab')
    ->copyable()           // shows a copy-to-clipboard button
    ->trim()               // whitespace stripped before saving
    ->mask('(999) 999-9999')  // input mask (9=digit, a=letter, *=any)
    ->datalist(['Draft', 'Published', 'Archived'])  // non-restrictive suggestions
    ->autocomplete('given-name')
    ->readOnly()           // can be seen but not edited
    ->url()                // adds url validation, renders type="url"
    ->tel()                // renders type="tel"
    ->prefixIcon('globe')
    ->suffixText('.com')
```

**Methods:**

| Method | Effect |
|---|---|
| `minLength(int)` | Adds `min:{n}` rule |
| `maxLength(int)` | Adds `max:{n}` rule |
| `length(int)` | Adds both `min:{n}` and `max:{n}` |
| `url()` | Sets `inputType='url'`, adds `url` rule |
| `tel()` | Sets `inputType='tel'` |
| `telRegex(string)` | Adds `regex:{pattern}` for phone format |
| `integer()` | Adds `integer` rule, sets `inputMode='numeric'` |
| `numeric()` | Adds `numeric` rule, sets `inputMode='decimal'` |
| `copyable(bool, ?string)` | Shows copy button; optional success message |
| `readOnly()` | Value submitted but not editable |
| `trim()` | Auto-strips whitespace |
| `mask(string)` | Input mask pattern |
| `datalist(array)` | `<datalist>` suggestions |
| `autocomplete(string)` | HTML autocomplete attribute |
| `inputMode(string)` | HTML inputmode attribute |
| `prefixText(string)` | Text prefix inside the input |
| `suffixText(string)` | Text suffix inside the input |
| `prefixIcon(string)` | Lucide icon before the input |
| `suffixIcon(string)` | Lucide icon after the input |

---

### Textarea

```php
use Larafusion\Fields\Textarea;

Textarea::make('description')
    ->rows(5)
    ->minLength(10)
    ->autoResize()
```

---

### Email

```php
use Larafusion\Fields\Email;

Email::make('email')
    ->required()
    ->unique('users', 'email')
```

Automatically adds the `email` validation rule.

---

### Password

```php
use Larafusion\Fields\Password;

Password::make('password')
    ->required()
    ->minLength(8)
    ->confirmed()   // requires 'password_confirmation' field
```

Passwords are **automatically bcrypt-hashed** in `ResourceController` before saving. Any field whose name contains the string `"password"` (case-insensitive) is hashed; empty values are stripped so existing hashes are not overwritten on update.

---

### Number

```php
use Larafusion\Fields\Number;

Number::make('price')
    ->min(0)
    ->max(99999)
    ->step(1)
```

Adds the `numeric` rule by default. `min()` and `max()` also add the corresponding validation rules.

---

### Toggle (Boolean)

```php
use Larafusion\Fields\Toggle;

Toggle::make('is_featured')
    ->onLabel('Featured')
    ->offLabel('Not featured')
    ->onColor('success')
    ->offColor('gray')
    ->onIcon('star')
    ->offIcon('star-off')
    ->default(false)
    ->inline()    // label beside the toggle (default)
```

Default value is `false`. Adds `boolean` rule automatically. Use `->accepted()` for "must be on" (e.g. terms of service), `->declined()` for "must be off".

---

### Select

```php
use Larafusion\Fields\Select;
use App\Enums\PostStatus;

// Static array
Select::make('status')
    ->options(['draft' => 'Draft', 'published' => 'Published'])
    ->required();

// Grouped options
Select::make('category')
    ->options([
        'Fiction'    => ['sci_fi' => 'Sci-Fi', 'fantasy' => 'Fantasy'],
        'Non-Fiction' => ['history' => 'History', 'science' => 'Science'],
    ]);

// From a BackedEnum
Select::make('status')->options(PostStatus::class);

// Multiple selection
Select::make('tags')
    ->options(['php' => 'PHP', 'laravel' => 'Laravel', 'react' => 'React'])
    ->multiple()
    ->minItems(1)
    ->maxItems(5);

// Boolean shortcut
Select::make('active')
    ->boolean('Active', 'Inactive');

// Custom JS dropdown (non-native)
Select::make('country')
    ->options([...])
    ->native(false)
    ->searchable()
    ->clearable()
    ->searchDebounce(500)
    ->optionsLimit(100);

// Disable specific options
Select::make('status')
    ->options(['draft' => 'Draft', 'archived' => 'Archived'])
    ->disabledOptions(['archived']);
```

**Key Options:**

| Method | Description |
|---|---|
| `options(array|string)` | Static array, grouped array, or BackedEnum class |
| `multiple()` | Allow multi-select; stores as JSON array |
| `searchable()` | Enables search inside the dropdown |
| `native(bool)` | `true` = HTML `<select>`, `false` = custom JS widget |
| `clearable()` | Show a clear/deselect button |
| `boolean(string, string)` | Shortcut for Yes/No dropdown |
| `disabledOptions(array)` | Grey-out specific values |
| `disableOptionWhen(Closure)` | Closure-based disabling |
| `minItems(int)` | Minimum selections (multi-mode) |
| `maxItems(int)` | Maximum selections (multi-mode) |
| `searchDebounce(int)` | Ms to wait before search fires (default 1000) |
| `optionsLimit(int)` | Max options shown (default 50) |

---

### Radio

```php
use Larafusion\Fields\Radio;

Radio::make('plan')
    ->options(['starter' => 'Starter', 'pro' => 'Pro', 'enterprise' => 'Enterprise'])
    ->required()
    ->inline();    // horizontal layout
```

---

### Checkbox

```php
use Larafusion\Fields\Checkbox;

Checkbox::make('agree_to_terms')
    ->label('I agree to the Terms of Service')
    ->required()
    ->accepted();  // must be checked
```

---

### CheckboxList

```php
use Larafusion\Fields\CheckboxList;

CheckboxList::make('permissions')
    ->options(['read' => 'Read', 'write' => 'Write', 'delete' => 'Delete'])
    ->columns(3)
    ->minItems(1);
```

---

### ToggleButtons

```php
use Larafusion\Fields\ToggleButtons;

ToggleButtons::make('size')
    ->options(['sm' => 'Small', 'md' => 'Medium', 'lg' => 'Large'])
    ->multiple()
    ->inline();
```

---

### DatePicker

```php
use Larafusion\Fields\DatePicker;

DatePicker::make('published_at')
    ->minDate('today')
    ->maxDate('2030-12-31')
    ->format('Y-m-d')
    ->displayFormat('M j, Y')
    ->time()               // adds time input, changes format to 'Y-m-d H:i'
    ->seconds()            // adds seconds, format becomes 'Y-m-d H:i:s'
    ->timezone('America/New_York')
    ->weekStartsOnMonday()
    ->disabledDates(['2025-12-25'])
    ->closeOnDateSelection(false)
    ->readOnly()           // shows picker but disables text input
    ->nullable()
```

Calling `minDate()` / `maxDate()` automatically adds the corresponding `after_or_equal` / `before_or_equal` validation rules.

---

### Slider

```php
use Larafusion\Fields\Slider;

Slider::make('rating')
    ->min(1)
    ->max(10)
    ->step(1)
    ->default(5)
```

---

### Color

```php
use Larafusion\Fields\Color;

Color::make('brand_color')
    ->default('#7c3aed')
    ->hexColor()   // adds hex_color validation rule
```

---

### Tags

```php
use Larafusion\Fields\Tags;

Tags::make('keywords')
    ->suggestions(['laravel', 'php', 'react', 'inertia'])
    ->maxTags(10)
    ->splitKeys(['Enter', ',', ' '])
    ->separator(',')
    ->color('primary')
    ->reorderable()
    ->trim()
```

Tags are stored as a comma-separated or JSON-encoded string depending on how the model casts the column. `separator` controls how pasted strings are split. `splitKeys` controls keyboard commit triggers.

---

### RichText

```php
use Larafusion\Fields\RichText;

RichText::make('body')
    ->toolbar(['bold', 'italic', 'h2', 'h3', 'ul', 'ol', 'blockquote', 'link'])
    ->minHeight(300)
    ->maxHeight(600)
    ->fileAttachmentsDisk('public')
    ->fileAttachmentsDirectory('uploads/editor')
    ->simple()   // shortcut: bold, italic, ul, ol only
```

Available toolbar buttons: `bold`, `italic`, `underline`, `strike`, `h2`, `h3`, `ul`, `ol`, `blockquote`, `link`.

Remove specific buttons:
```php
->disableToolbarButtons(['underline', 'strike'])
```

---

### CodeEditor

```php
use Larafusion\Fields\CodeEditor;

CodeEditor::make('config_json')
    ->language('json')
    ->minHeight(200)
```

---

### Markdown

```php
use Larafusion\Fields\Markdown;

Markdown::make('content')
    ->minHeight(400)
```

---

### FileUpload

```php
use Larafusion\Fields\FileUpload;

FileUpload::make('attachment')
    ->disk('public')
    ->directory('attachments')
    ->acceptedFileTypes(['application/pdf', 'image/jpeg'])
    ->maxSize(10240)     // KB
    ->minSize(1)
    ->multiple()
    ->maxFiles(5)
    ->preserveFilenames()
    ->deletable()
    ->downloadable()
    ->openable()         // "open in new tab" button
    ->reorderable()      // drag to reorder (multi mode)
    ->visibility('private')

// Presets
FileUpload::make('photo')->image();      // jpeg, png, gif, webp
FileUpload::make('doc')->pdf();
FileUpload::make('file')->documents();   // pdf, doc, docx, xls, xlsx
```

File uploads use a two-stage approach:
1. React uploads the file to `POST /admin/upload` → receives a base64 JWT-encoded temp key.
2. On form submit, `ResourceController` detects keys starting with `eyJ` (base64 JSON) and calls `UploadController::persist()` to move the temp file to the final location.

---

### ImageUpload

```php
use Larafusion\Fields\ImageUpload;

ImageUpload::make('cover')
    ->disk('public')
    ->directory('images/covers')
    ->maxSize(5120)
    ->dimensions(800, 600)   // sets exact min/max width+height
    ->minWidth(400)
    ->maxWidth(2000)
    ->minHeight(300)
    ->maxHeight(1500)
    ->avatar()               // circular preview in the form
    ->optimize()             // compress on server (default: true)
```

Extends `FileUpload` with image-dimension constraints and an avatar preview mode.

---

### Hidden

```php
use Larafusion\Fields\Hidden;

Hidden::make('user_id')->default(auth()->id())
```

---

### KeyValue

```php
use Larafusion\Fields\KeyValue;

KeyValue::make('metadata')
    ->keyLabel('Setting')
    ->valueLabel('Value')
    ->keyPlaceholder('e.g. theme')
    ->valuePlaceholder('e.g. dark')
    ->reorderable()
    ->addable()
    ->deletable()
    ->editableKeys(false)    // lock keys, allow editing values only
```

Stored as JSON. The controller JSON-encodes it before saving. Use `->cast('array')` or `->cast('json')` on the Eloquent model to decode on read.

---

### Repeater

```php
use Larafusion\Fields\Repeater;
use Larafusion\Fields\Text;
use Larafusion\Fields\Number;

Repeater::make('line_items')
    ->schema([
        Text::make('product_name')->required(),
        Number::make('quantity')->min(1),
        Number::make('price'),
    ])
    ->minItems(1)
    ->maxItems(20)
    ->defaultItems(1)  // start with 1 empty row
    ->columns(3)       // 3-column grid inside each row
    ->addLabel('Add Line Item')
    ->cloneable()      // show duplicate-row button
    ->reorderable()    // show drag handles
    ->collapsible()    // rows can be collapsed
    ->collapsed()      // start collapsed (implies collapsible)
```

Validation rules from sub-fields are automatically extracted as `line_items.*.product_name`, `line_items.*.quantity`, etc. by `Repeater::getRules()`.

---

### Builder

A page-builder-style field where each block has a distinct schema.

```php
use Larafusion\Fields\Builder;
use Larafusion\Fields\BuilderBlock;
use Larafusion\Fields\Text;
use Larafusion\Fields\RichText;
use Larafusion\Fields\ImageUpload;

Builder::make('content')
    ->blocks([
        BuilderBlock::make('hero')
            ->label('Hero Section')
            ->icon('layout')
            ->schema([
                Text::make('heading'),
                Text::make('subheading'),
                ImageUpload::make('background'),
            ]),
        BuilderBlock::make('text')
            ->label('Text Block')
            ->schema([
                RichText::make('body'),
            ]),
        BuilderBlock::make('cta')
            ->label('Call to Action')
            ->schema([
                Text::make('button_label'),
                Text::make('button_url')->url(),
            ]),
    ])
    ->maxItems(10)
    ->addLabel('Add Block')
    ->cloneable()
    ->reorderable()
    ->collapsible()
```

The stored value is a JSON array of `{ type, data: {...} }` objects. The React builder renders each block type with its own form fields.

---

### Relation Fields

#### BelongsTo

Renders as an async searchable dropdown that queries the related model via `GET /{resource}/relations/{field}/options?search=...`.

```php
use Larafusion\Fields\Relations\BelongsTo;

BelongsTo::make('author')
    ->model(User::class)
    ->labelColumn('name')     // displayed text
    ->valueColumn('id')       // stored value (FK)
    ->searchColumn('name')    // column searched server-side
    ->optionLabel('{name} ({email})')  // template for label
    ->foreignKey('author_id') // inferred from field name by default
    ->preload(50)             // preload first 50 options on mount
    ->where('role', 'admin')  // filter the options query
```

Foreign key is auto-inferred: field name `author` → `author_id`, field name `user_id` → `user_id`.

#### BelongsToMany

Same as `BelongsTo` but multi-select; syncs the pivot table on save.

```php
use Larafusion\Fields\Relations\BelongsToMany;

BelongsToMany::make('tags')
    ->model(Tag::class)
    ->labelColumn('name')
    ->pivotTable('post_tag')
    ->pivotForeignKey('post_id')
    ->pivotRelatedKey('tag_id')
    ->withPivot(['order'])   // extra pivot columns
```

The controller calls `$record->tags()->sync($ids)` after saving the main record.

#### HasMany

```php
use Larafusion\Fields\Relations\HasMany;

HasMany::make('comments')
    ->model(Comment::class)
    ->labelColumn('body')
```

#### MorphTo

Renders a two-step picker: first select the morph type, then search within that model.

```php
use Larafusion\Fields\Relations\MorphTo;

MorphTo::make('commentable')
    ->types([
        Post::class  => 'Post',
        Video::class => 'Video',
    ])
    ->labelColumn('title')
    ->searchColumn('title')
    ->minChars(1)
```

Stored as JSON `{"type":"App\\Models\\Post","id":5}`. The controller unpacks it to `commentable_type` + `commentable_id` before saving.

---

## API Reference — Base Field Methods

All fields inherit these from `Larafusion\Fields\Field`:

| Method | Description |
|---|---|
| `make(string $name): static` | Factory constructor |
| `label(string)` | Override auto-generated label |
| `required()` | Mark required; adds `required` rule |
| `disabled()` | Render as disabled input |
| `hidden()` | Hide from the form (but still validated) |
| `default(mixed)` | Pre-fill value |
| `placeholder(string)` | Input placeholder text |
| `hint(string)` | Help text below the field |
| `nullable()` | Adds `nullable` server rule |
| `filled()` | Adds `filled` rule (non-empty when present) |
| `rules(array)` | Add raw Laravel validation rule strings |
| `validationAttribute(string)` | Override field name in error messages |
| `validationMessages(array)` | Custom messages per rule |
| `string() / integer() / numeric() / boolean() / array() / json()` | Type rules |
| `email() / url() / ip() / ipv4() / ipv6() / uuid() / ulid()` | Format rules |
| `min(n) / max(n) / between(a,b)` | Size rules |
| `minLength(n) / maxLength(n)` | String length |
| `regex(string) / notRegex(string)` | Pattern rules |
| `in(array) / notIn(array)` | Membership rules |
| `unique(?string, string)` | DB unique rule (server only) |
| `exists(string, string)` | DB existence rule (server only) |
| `confirmed()` | Match `{name}_confirmation` field |
| `same(string) / different(string)` | Cross-field comparison |
| `after(string) / before(string) / afterOrEqual / beforeOrEqual` | Date comparison |
| `gt/gte/lt/lte(string)` | Numeric cross-field comparison |
| `requiredIf / requiredUnless / requiredWith / ...` | Conditional required (server only) |
| `prohibitedIf / prohibitedUnless / prohibits` | Prohibition rules (server only) |

---

## Best Practices

- **Let Larafusion derive the label from the field name.** Only override with `->label()` when the auto-generated version is wrong.
- **Chain `->nullable()` on optional fields** rather than omitting rules entirely. Without it, Laravel strips the field from `$validated`, so your model will not receive the value on update.
- **Use `->default()` thoughtfully.** Defaults are shipped in the schema JSON and pre-fill the React form on the create page. They also matter for the `rules` extraction — a default does not bypass `required`.
- **Prefer `Select::make()->options(MyEnum::class)`** over manual arrays. Larafusion reads the `HasLabel`, `HasColor` interfaces and auto-populates filter options too.
- **Use `BelongsTo` instead of a `Select` with a static options list** for any relation with more than ~100 records. Static options are serialised into the schema and sent on every visit.

---

## Common Mistakes

**Forgetting `->nullable()` on optional date/select fields.** Without it, Laravel rejects an empty submission with a "field must be a valid date/must be a string" error even though the field is logically optional.

**Using `->unique()` without a table name on update.** The resource's `getUpdateRules()` strips the current record from the unique check automatically, but only when the rule string starts with `unique:{table},{column}`. Always pass the table name: `->unique('users', 'email')`.

**Expecting `Repeater` sub-field defaults to apply to rows.** The `->defaultItems(1)` creates empty rows; individual sub-field defaults set the initial value within each row when it is first added.

**Using `multiple()` on `Select` but storing as a string.** The submitted value is an array. Cast the column as `array` on the Eloquent model, or the stored JSON will not decode on read.

---

## Security Considerations

- **Client rules are hints, not enforcements.** All rules in `$rules` run server-side via `$request->validate()`. The `clientRules` subset is sent to React purely for UX; a malicious request bypasses them. Never rely on client-side validation for security.
- **Password fields are hashed automatically** when the field name contains `"password"`. Do not double-hash by also adding `bcrypt()` in a model observer.
- **File upload paths are validated.** `UploadController::persist()` only moves files that were uploaded through the temp-upload endpoint (detected by the `eyJ` prefix of the base64 JWT). Arbitrary paths cannot be injected.
- **`MorphTo` types are declared on the PHP side.** The `->types([Post::class => 'Post'])` whitelist means users cannot morph to arbitrary model classes by crafting JSON.

---

## Performance Considerations

- **Schema is serialised once per full page visit** (lazy closure, never re-evaluated on `only:['records']` reloads). Complex forms with many fields do not hurt sort/filter/paginate performance.
- **`BelongsTo` with `->preload(50)`** fires one database query at schema-serialisation time and embeds the results. Useful for dropdowns with a small, stable option list. For large or dynamic sets, omit `preload` and rely on the async search endpoint.
- **`Builder` and `Repeater` with complex sub-schemas** increase schema payload size. For very large builders (10+ block types, 5+ fields each), consider lazy-loading the schema via a custom Inertia endpoint.

---

## Related Features

- [Form Layout](form-layout.md) — `Section`, `Tabs`, `Grid` wrappers
- [Resources](resources.md) — where `form()` is defined
- [Enums](enums.md) — `HasLabel`, `HasColor`, `HasIcon` interfaces for Select / Badge
- [Export & Import](export-import.md) — how field rules are reused for CSV import validation
