# Enums

## Enums

Larafusion has first-class support for PHP 8.1+ backed enums. Implement one or more of the four enum interfaces from `Larafusion\Support\Enums\` to drive labels, colors, icons, and descriptions across forms, tables, and filters automatically.

### Interfaces

| Interface        | Method                    | Return type  | Used by                                               |
| ---------------- | ------------------------- | ------------ | ----------------------------------------------------- |
| `HasLabel`       | `getLabel(): ?string`     | `string\|null` | Select, Radio, CheckboxList, BadgeColumn, TextColumn  |
| `HasColor`       | `getColor(): ?string`     | `string\|null` | BadgeColumn, TextColumn (badge mode)                  |
| `HasIcon`        | `getIcon(): ?string`      | `string\|null` | BadgeColumn                                           |
| `HasDescription` | `getDescription(): ?string` | `string\|null` | Radio, CheckboxList (shown below each option)       |

Valid color values: `primary` · `success` · `warning` · `danger` · `info` · `gray`

### Defining an Enum

```php
use Larafusion\Support\Enums\HasColor;
use Larafusion\Support\Enums\HasDescription;
use Larafusion\Support\Enums\HasIcon;
use Larafusion\Support\Enums\HasLabel;

enum PostStatus: string implements HasLabel, HasColor, HasIcon, HasDescription
{
    case Draft     = 'draft';
    case Published = 'published';
    case Archived  = 'archived';

    public function getLabel(): ?string
    {
        return match ($this) {
            self::Draft     => 'Draft',
            self::Published => 'Published',
            self::Archived  => 'Archived',
        };
    }

    public function getColor(): ?string
    {
        return match ($this) {
            self::Draft     => 'gray',
            self::Published => 'success',
            self::Archived  => 'warning',
        };
    }

    public function getIcon(): ?string
    {
        return match ($this) {
            self::Draft     => 'pencil',
            self::Published => 'check-circle',
            self::Archived  => 'archive',
        };
    }

    public function getDescription(): ?string
    {
        return match ($this) {
            self::Draft     => 'Not yet visible to the public.',
            self::Published => 'Live and visible to all readers.',
            self::Archived  => 'Hidden from listings but not deleted.',
        };
    }
}
```

### Model Cast

Cast the attribute to your enum so Laravel serialises it automatically:

```php
protected $casts = [
    'status' => PostStatus::class,
];
```

### Forms

Pass the enum class string to `Select`, `Radio`, or `CheckboxList` — options, `in:` validation rule, and descriptions are all generated automatically:

```php
// Select — dropdown with enum labels as options
Select::make('status')->options(PostStatus::class)->required(),

// Radio — each option includes the getDescription() text below it
Radio::make('status')->options(PostStatus::class),

// CheckboxList — multi-select with enum labels and descriptions
CheckboxList::make('statuses')->options(PostStatus::class),
```

### Tables

#### BadgeColumn

`->enum()` auto-populates labels (from `HasLabel`), badge colors (from `HasColor`), icons (from `HasIcon`), and a `SelectFilter` for the column:

```php
BadgeColumn::make('status')->enum(PostStatus::class)->sortable(),
```

The badge renders the human-readable label instead of the raw database value.

#### TextColumn (badge mode)

`->enum()` enables badge rendering and populates labels/colors:

```php
TextColumn::make('status')->enum(PostStatus::class)->sortable(),
```

#### SelectFilter

Pass the enum class to `SelectFilter::options()` to populate filter options automatically:

```php
SelectFilter::make('status')->options(PostStatus::class)->label('Status'),
```

### Full Example

```php
// app/Larafusion/Resources/Posts/Schemas/PostForm.php
Select::make('status')->options(PostStatus::class)->required(),
Radio::make('status')->options(PostStatus::class)->label('Post Status'),

// app/Larafusion/Resources/Posts/Tables/PostsTable.php
BadgeColumn::make('status')->enum(PostStatus::class)->sortable(),
// or: TextColumn::make('status')->enum(PostStatus::class)->sortable(),

->filters([
    SelectFilter::make('status')->options(PostStatus::class),
])
```

---
