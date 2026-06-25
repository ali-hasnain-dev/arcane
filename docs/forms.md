# Forms

## Forms

### Field Base Options

Every field inherits these methods:

```php
Text::make('field_name')
    ->label('Custom Label')            // override auto-generated label
    ->required()                       // adds 'required' validation rule
    ->disabled()                       // renders as read-only
    ->hidden()                         // hides from form UI (value still submitted)
    ->default('initial value')         // pre-fill value on create
    ->placeholder('Hint text')         // input placeholder
    ->hint('Helper text below')        // small text shown below the field
    ->rules(['min:3', 'max:255'])      // append extra validation rules (raw strings)
    ->unique('users', 'email')         // server-only uniqueness rule
    ->exists('roles', 'id')            // server-only existence rule
    ->validationAttribute('full name') // override field name in error messages
    ->validationMessages([             // custom error text per rule
        'required' => 'Please enter your :attribute.',
        'min'      => 'Your :attribute must be at least :min characters.',
    ])
```

---

### Validation

Larafusion provides fluent methods for every Laravel validation rule. Rules are automatically classified as **client-side** (instant feedback) or **server-side** (sent via Precognition) based on their nature.

#### Presence

```php
->required()                    // must not be empty
->filled()                      // must not be empty when the key is present
->nullable()                    // allow null (server-side; default when no required)
```

#### Type

```php
->string()     ->integer()    ->numeric()   ->boolean()
->json()                                    // valid JSON string
```

#### String format

```php
->alpha()            // letters only
->alphaDash()        // letters, numbers, dashes, underscores
->alphaNum()         // letters and numbers only
->ascii()            // 7-bit ASCII only
->hexColor()         // valid #rrggbb or #rgb hex
->macAddress()       // valid MAC address
->uuid()             // RFC 4122 UUID
->ulid()             // valid ULID
->email()            ->url()
->ip()   ->ipv4()   ->ipv6()
->startsWith(['https://', 'http://'])
->endsWith(['.pdf', '.docx'])
->doesntStartWith(['admin_', 'root_'])
->doesntEndWith(['_test', '_dev'])
->regex('/^[a-z]+$/i')
->notRegex('/[<>]/')
```

#### Numeric

```php
->min(3)           // minimum value (or minimum string length for strings)
->max(255)         // maximum value (or maximum string length)
->between(1, 100)
->multipleOf(5)    // must be a multiple of 5
->gt('min_price')  // greater than another field
->gte('min_qty')   // greater than or equal to
->lt('max_price')  // less than another field
->lte('max_qty')   // less than or equal to
```

#### Date comparison

```php
->after('2024-01-01')           // must be after a date
->afterOrEqual('today')         // today or later
->before('2030-12-31')          // must be before a date
->beforeOrEqual('end of month') // today or earlier
```

#### Cross-field

```php
->same('password_confirmation')    // must match another field
->different('old_password')        // must differ from another field
->confirmed()                      // must match a {field}_confirmation field
```

#### List membership

```php
->in(['draft', 'published', 'archived'])
->notIn(['banned', 'deleted'])
->enum(PostStatus::class)          // valid BackedEnum case
```

#### Prohibited rules (server-side)

```php
->prohibited()                     // must be empty
->prohibitedIf('role', 'guest')    // must be empty when role = guest
->prohibitedUnless('role', 'admin')
->prohibits('old_password')        // if this is set, old_password must be empty
```

#### Conditional required (server-side)

```php
->requiredIf('role', 'admin')
->requiredIfAccepted('terms')          // required if terms = "1"/"true"/etc.
->requiredUnless('role', 'guest')
->requiredWith('first_name')           // required when first_name is non-empty
->requiredWithAll('first_name,last_name')
->requiredWithout('phone')             // required when phone is empty
->requiredWithoutAll('phone,email')
```

#### Database (server-side)

```php
->unique('users', 'email')             // value must not exist in DB
->exists('categories', 'id')           // value must exist in DB
->activeUrl()                          // DNS lookup (A/AAAA record must exist)
```

#### Custom error messages

```php
Text::make('email')
    ->required()
    ->email()
    ->validationAttribute('email address')         // used in error messages
    ->validationMessages([
        'required' => 'We need your :attribute to send you a receipt.',
        'email'    => 'Please enter a valid :attribute.',
    ])
```

---

### Custom Fields

Larafusion supports user-defined field types. Since Larafusion uses React + Inertia (not Blade + Livewire), the approach is:

1. **PHP class** — extends `CustomField`, defines `getType()` and any config methods
2. **React component** — registered via `registerField()` and rendered by `FieldRenderer`

#### Step 1 — PHP field class

```php
// app/Larafusion/Fields/StarRatingField.php

use Larafusion\Fields\CustomField;

class StarRatingField extends CustomField
{
    public function __construct(string $name)
    {
        parent::__construct($name, 'star_rating'); // type string must match JS registration
    }

    public function maxStars(int $n): static
    {
        return $this->componentData(array_merge($this->getComponentData(), ['maxStars' => $n]));
    }

    public function color(string $color): static
    {
        return $this->componentData(array_merge($this->getComponentData(), ['color' => $color]));
    }
}
```

Or use `CustomField::make()` directly without subclassing:

```php
use Larafusion\Fields\CustomField;

CustomField::make('satisfaction', 'star_rating')
    ->componentData(['maxStars' => 5, 'color' => 'gold'])
    ->required()
    ->hint('Rate your experience.')
```

#### Step 2 — Register the React component

Call `registerField()` **once** at app boot, before any forms are rendered (e.g. in `resources/js/app.tsx`):

```tsx
import { registerField } from '@larafusion/forms';
import StarRatingField from './components/StarRatingField';

registerField('star_rating', StarRatingField);
```

#### Step 3 — Implement the React component

The component receives the standard field props:

```tsx
// resources/js/components/StarRatingField.tsx

interface Props {
    field: {
        label: string;
        required: boolean;
        hint: string | null;
        disabled: boolean;
        componentData: {
            maxStars: number;
            color?: string;
        };
    };
    value: number;
    error?: string;
    onChange: (v: number) => void;
}

export default function StarRatingField({ field, value, error, onChange }: Props) {
    const max   = field.componentData.maxStars ?? 5;
    const color = field.componentData.color ?? '#f59e0b';

    return (
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <div className="flex gap-1">
                {Array.from({ length: max }, (_, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => !field.disabled && onChange(i + 1)}
                        className="text-2xl focus:outline-none transition-transform hover:scale-110"
                        style={{ color: i < value ? color : '#d1d5db' }}
                    >
                        ★
                    </button>
                ))}
            </div>
            {error  && <p className="mt-1 text-xs text-red-600">{error}</p>}
            {field.hint && !error && <p className="mt-1 text-xs text-zinc-500">{field.hint}</p>}
        </div>
    );
}
```

#### Using the field in a form

```php
use App\Larafusion\Fields\StarRatingField;
use Larafusion\Fields\CustomField;

class ReviewForm
{
    public static function fields(): array
    {
        return [
            // Using the custom subclass
            (new StarRatingField('quality_rating'))
                ->label('Quality Rating')
                ->maxStars(5)
                ->color('#f59e0b')
                ->required(),

            // Or using CustomField::make() directly
            CustomField::make('ease_of_use', 'star_rating')
                ->label('Ease of Use')
                ->componentData(['maxStars' => 5])
                ->hint('How easy was it to use our product?'),
        ];
    }
}
```

**Method reference**

| Method | Description |
| --- | --- |
| `CustomField::make($name, $type)` | Create a custom field with an arbitrary type string |
| `->componentData(array)` | Pass arbitrary data to the React component |
| `->getComponentData()` | Read the current componentData (use in subclass methods) |
| `registerField($type, Component)` | Register a React component for a field type (JS side) |
| `getRegisteredField($type)` | Retrieve a registered component (JS side) |

### Core Fields

#### Text

The `Text` field is the primary single-line input. It mirrors Filament 5.x's `TextInput` with a rich set of modifiers.

```php
use Larafusion\Fields\Text;

// ── Basic ─────────────────────────────────────────────────────────────────
Text::make('title')
    ->minLength(3)
    ->maxLength(255)

// ── Exact length ──────────────────────────────────────────────────────────
Text::make('code')
    ->length(6)     // minLength and maxLength both set to 6

// ── Input types ───────────────────────────────────────────────────────────
Text::make('website')->url()   // <input type="url"> + url validation rule
Text::make('phone')->tel()     // <input type="tel">
Text::make('phone')
    ->tel()
    ->telRegex('/^\+?[1-9]\d{6,14}$/') // custom phone regex validation

// ── Numeric helpers ───────────────────────────────────────────────────────
Text::make('quantity')->integer() // adds 'integer' rule, inputmode="numeric"
Text::make('price')->numeric()    // adds 'numeric' rule, inputmode="decimal"

// ── Clipboard ─────────────────────────────────────────────────────────────
Text::make('api_key')
    ->copyable()                          // shows a copy-to-clipboard button
    ->copyable(message: 'Key copied!')    // custom tooltip message

// ── Read-only ─────────────────────────────────────────────────────────────
// Different from ->disabled(): value is still submitted but user cannot type.
Text::make('generated_id')->readOnly()

// ── Trim whitespace ───────────────────────────────────────────────────────
Text::make('username')->trim()  // strips leading/trailing spaces on blur

// ── Input masking ─────────────────────────────────────────────────────────
// Mask chars: 9 = digit, a = letter, * = alphanumeric
Text::make('phone')->mask('(999) 999-9999')
Text::make('card')->mask('9999 9999 9999 9999')

// ── Browser autocomplete ──────────────────────────────────────────────────
Text::make('name')->autocomplete('name')
Text::make('username')->autocomplete('off')

// ── Datalist suggestions ──────────────────────────────────────────────────
// Non-restrictive: user can still type anything
Text::make('framework')
    ->datalist(['Laravel', 'Symfony', 'CodeIgniter', 'Lumen'])

// ── inputmode ─────────────────────────────────────────────────────────────
// Hint to mobile keyboards (numeric, decimal, email, url, search, tel, none)
Text::make('search')->inputMode('search')

// ── Prefix / suffix affixes ───────────────────────────────────────────────
Text::make('domain')
    ->prefix('https://')         // text on the left
    ->suffix('.com')             // text on the right

Text::make('price')
    ->prefixIcon('dollar-sign')  // Lucide icon on the left
    ->suffixIcon('percent')      // Lucide icon on the right

Text::make('website')
    ->prefixIcon('globe', 'primary')      // icon with color (primary/success/warning/danger/info/gray)
    ->suffix('.io')

// Affixes + copyable
Text::make('api_key')
    ->prefixIcon('key')
    ->copyable()

// ── Validation helpers (also available on base Field) ─────────────────────
Text::make('slug')
    ->minLength(3)
    ->maxLength(100)
    ->rules(['alpha_dash'])
```

**Full method reference**

| Method | Description |
| --- | --- |
| `->minLength(n)` | Minimum character count |
| `->maxLength(n)` | Maximum character count |
| `->length(n)` | Exact character count (sets both min and max) |
| `->url()` | Sets `type="url"` and adds URL validation |
| `->tel()` | Sets `type="tel"` |
| `->telRegex(string)` | Custom phone regex validation |
| `->integer()` | Adds `integer` rule; hints numeric keyboard |
| `->numeric()` | Adds `numeric` rule; hints decimal keyboard |
| `->copyable(bool, string)` | Show copy-to-clipboard button with optional tooltip |
| `->readOnly()` | Prevents typing; value is still submitted |
| `->trim()` | Auto-strips leading/trailing whitespace on blur |
| `->mask(string)` | Input mask pattern (`9`=digit, `a`=letter, `*`=any) |
| `->autocomplete(string)` | HTML `autocomplete` attribute value |
| `->datalist(array)` | Non-restrictive suggestion list |
| `->inputMode(string)` | HTML `inputmode` attribute (hints mobile keyboard) |
| `->prefix(string)` / `->suffix(string)` | Text affix left/right |
| `->prefixIcon(string, ?color)` / `->suffixIcon(string, ?color)` | Lucide icon affix with optional color |
| `->prefixIconColor(string)` / `->suffixIconColor(string)` | Set icon color separately |

#### Email

```php
use Larafusion\Fields\Email;

Email::make('email')->required()
// Automatically adds the 'email' validation rule.

// With affixes
Email::make('email')
    ->prefixIcon('mail')
    ->placeholder('you@example.com')
    ->required()

// All affix methods (prefix, suffix, prefixIcon, suffixIcon, prefixIconColor, suffixIconColor)
// are available on Email exactly as on Text.
```

#### Password

```php
use Larafusion\Fields\Password;

Password::make('password')
    ->minLength(8)      // default: 8
    ->hideToggle()      // remove the show/hide eye button
    ->revealable()      // explicitly enable the eye button (on by default)

// With affixes
Password::make('password')
    ->prefixIcon('lock')
    ->required()
```

Passwords are `bcrypt`-hashed by the controller automatically. An empty value on edit means no change.

#### Textarea

```php
use Larafusion\Fields\Textarea;

// ── Basic ─────────────────────────────────────────────────────────────────
Textarea::make('bio')
    ->rows(6)
    ->maxLength(1000)

// ── Column width & autosize ───────────────────────────────────────────────
Textarea::make('notes')
    ->cols(60)              // HTML cols attribute
    ->autosize()            // grows to fit content; no fixed height

// ── Validation ────────────────────────────────────────────────────────────
Textarea::make('description')
    ->minLength(20)         // shows "N more characters needed" hint
    ->maxLength(500)        // shows live char counter

// ── Exact length ──────────────────────────────────────────────────────────
Textarea::make('code')
    ->length(140)           // sets both min and max to 140

// ── State modifiers ───────────────────────────────────────────────────────
Textarea::make('system_notes')
    ->readOnly()            // non-editable; value still submitted
    ->trim()                // auto-strip whitespace on blur
```

**Method reference**

| Method | Description |
| --- | --- |
| `->rows(int)` | Number of visible text rows |
| `->cols(int)` | HTML `cols` attribute |
| `->maxLength(int)` | Maximum characters; shows live counter |
| `->minLength(int)` | Minimum characters; shows inline prompt |
| `->length(int)` | Exact length (sets both min and max) |
| `->autosize()` | Textarea grows automatically to fit content |
| `->readOnly()` | Non-editable; value is still submitted |
| `->trim()` | Auto-strip leading/trailing whitespace on blur |

#### Select

Arcane's Select field mirrors Filament 5.x with two rendering modes and a rich API.

**Native select (default)** — uses the browser's `<select>` element. Fastest and most accessible.

**Custom JS dropdown** — opt-in via `->native(false)`. Adds live search, chip-based multi-select, grouped options, clear button, disabled options, and custom messages.

```php
use Larafusion\Fields\Select;

// ── Basic ─────────────────────────────────────────────────────────────────
Select::make('status')
    ->options(['draft' => 'Draft', 'published' => 'Published', 'archived' => 'Archived'])

// ── Enum options (label, color, icon auto-populated from HasLabel) ────────
Select::make('status')->options(PostStatus::class)->required()

// ── Searchable custom dropdown ────────────────────────────────────────────
Select::make('status')
    ->options(['draft' => 'Draft', 'published' => 'Published'])
    ->native(false)          // custom JS dropdown
    ->searchable()           // live client-side search
    ->clearable()            // shows × to deselect

// ── Multiple select with chip pills ──────────────────────────────────────
Select::make('technologies')
    ->options(['php' => 'PHP', 'js' => 'JavaScript', 'ts' => 'TypeScript'])
    ->multiple()             // stored as JSON array
    ->native(false)
    ->searchable()
    ->clearable()
    ->maxItems(3)            // max chips allowed
    ->minItems(1)            // validation minimum

// ── Grouped options ───────────────────────────────────────────────────────
// Pass a nested array — outer keys become group headers.
Select::make('status')
    ->options([
        'In Progress' => ['draft' => 'Draft', 'reviewing' => 'In Review'],
        'Finalized'   => ['published' => 'Published', 'archived' => 'Archived'],
    ])
    ->native(false)
    ->searchable()

// ── Boolean shorthand ─────────────────────────────────────────────────────
// Stores '1' / '0'; labels and placeholder are customisable.
Select::make('is_featured')
    ->boolean()                                     // → Yes / No
    ->boolean('Absolutely!', 'Not at all', '...')   // custom labels

// ── Disabled options ──────────────────────────────────────────────────────
Select::make('role')
    ->options(['admin' => 'Admin', 'editor' => 'Editor', 'viewer' => 'Viewer'])
    ->disabledOptions(['admin'])                        // explicit list
    ->disableOptionWhen(fn(string $v) => $v === 'admin') // closure

// ── Prefix / suffix affixes ───────────────────────────────────────────────
Select::make('currency')
    ->options(['usd' => 'USD', 'eur' => 'EUR', 'gbp' => 'GBP'])
    ->prefix('Currency')       // text on the left
    ->suffixIcon('globe')      // icon on the right
    ->prefixIcon('hash')       // icon on the left
    ->suffix('.com')           // text on the right

// ── Custom messages ───────────────────────────────────────────────────────
Select::make('author')
    ->native(false)
    ->searchable()
    ->searchPrompt('Type a name…')
    ->noSearchResultsMessage('No authors found.')
    ->noOptionsMessage('No authors available.')
    ->loadingMessage('Loading…')
```

**Full method reference**

| Method | Description |
| --- | --- |
| `->options(array\|Collection\|EnumClass)` | Options array, Eloquent Collection, or BackedEnum class |
| `->native(false)` | Switch to custom JS dropdown |
| `->searchable()` | Enable live client-side search (custom dropdown only) |
| `->multiple()` | Allow multiple selections; stored as JSON array |
| `->clearable()` | Show × deselect button |
| `->boolean($true, $false, $placeholder)` | Yes/No shorthand (stores `'1'`/`'0'`) |
| `->disabledOptions(array)` | Disable specific option values |
| `->disableOptionWhen(Closure)` | Disable options matching a closure |
| `->minItems(n)` | Minimum selections (multiple mode) |
| `->maxItems(n)` | Maximum selections (multiple mode) |
| `->prefix(string)` / `->suffix(string)` | Text affix |
| `->prefixIcon(string, ?color)` / `->suffixIcon(string, ?color)` | Icon affix with optional color |
| `->prefixIconColor(string)` / `->suffixIconColor(string)` | Icon color (separate setter) |
| `->searchPrompt(string)` | Placeholder inside the search input |
| `->noSearchResultsMessage(string)` | Message when search returns nothing |
| `->noOptionsMessage(string)` | Message when options list is empty |
| `->loadingMessage(string)` | Message while options are loading |
| `->searchingMessage(string)` | Message shown while debounced search is pending |
| `->searchDebounce(int)` | Milliseconds before search fires after typing (default: 0) |
| `->optionsLimit(int)` | Max options shown in the dropdown list (default: 50) |
| `->wrapOptionLabels(bool)` | Wrap long option labels (true) or truncate (false, default: true) |
| `->selectablePlaceholder(bool)` | Whether the placeholder entry itself is selectable (default: true) |
| `->placeholder(string)` | Trigger placeholder text |

#### Number

```php
use Larafusion\Fields\Number;

Number::make('quantity')
    ->min(1)
    ->max(999)
    ->step(1)
```

#### Checkbox

A single boolean checkbox. Use for opt-in fields like terms acceptance.

```php
use Larafusion\Fields\Checkbox;

// Inline mode (default) — label beside the checkbox
Checkbox::make('terms')
    ->label('I agree to the Terms of Service')
    ->inline()           // true by default
    ->accepted()         // validation: must be checked

// Above-label mode
Checkbox::make('newsletter')
    ->inline(false)
    ->hint('We send at most one email per week.')

// Require unchecked
Checkbox::make('no_bots')->declined()
```

**Method reference**

| Method | Description |
| --- | --- |
| `->inline(bool)` | Place label beside checkbox (true, default) instead of above |
| `->accepted()` | Validation: checkbox must be checked |
| `->declined()` | Validation: checkbox must be unchecked |

#### Toggle

```php
use Larafusion\Fields\Toggle;

// Basic
Toggle::make('is_active')
    ->onLabel('Active')
    ->offLabel('Inactive')
    ->default(true)

// Custom colors
Toggle::make('notifications')
    ->onColor('success')   // primary | success | warning | danger | info | gray
    ->offColor('gray')
    ->onLabel('Enabled')
    ->offLabel('Disabled')

// Icons inside the toggle knob
Toggle::make('dark_mode')
    ->onIcon('moon')       // Lucide icon name shown when ON
    ->offIcon('sun')       // Lucide icon name shown when OFF
    ->onLabel('Dark')
    ->offLabel('Light')

// Display: inline (default) vs stacked
Toggle::make('is_public')->inline()       // label beside toggle (default)
Toggle::make('is_public')->inline(false)  // label above toggle

// Validation
Toggle::make('terms')->accepted()   // must be on
Toggle::make('spam')->declined()    // must be off
```

**Method reference**

| Method | Description |
| --- | --- |
| `->onLabel(string)` | Label shown when toggle is on |
| `->offLabel(string)` | Label shown when toggle is off |
| `->onIcon(string)` | Lucide icon inside the knob when on |
| `->offIcon(string)` | Lucide icon inside the knob when off |
| `->onColor(string)` | Track color when on (`primary` / `success` / `warning` / `danger` / `info` / `gray`) |
| `->offColor(string)` | Track color when off |
| `->inline(bool)` | Label beside toggle (true, default) or above it (false) |
| `->accepted()` | Validation: must be on |
| `->declined()` | Validation: must be off |

#### DatePicker

Larafusion's `DatePicker` also supports time, affixes, week-start configuration, and disabled dates.

```php
use Larafusion\Fields\DatePicker;

// ── Basic ─────────────────────────────────────────────────────────────────
DatePicker::make('published_at')
    ->minDate('2020-01-01')
    ->maxDate('2030-12-31')
    ->format('Y-m-d')

// ── Date + time ───────────────────────────────────────────────────────────
DatePicker::make('scheduled_at')
    ->time()             // adds time picker; format becomes 'Y-m-d H:i'
    ->seconds()          // also include seconds; format becomes 'Y-m-d H:i:s'

// ── Display format ────────────────────────────────────────────────────────
DatePicker::make('expires_at')
    ->format('Y-m-d')                 // storage format
    ->displayFormat('M d, Y')         // human-readable label (informational)

// ── Timezone ──────────────────────────────────────────────────────────────
DatePicker::make('event_at')
    ->time()
    ->timezone('America/New_York')

// ── Week start ────────────────────────────────────────────────────────────
DatePicker::make('week_start')
    ->weekStartsOnMonday()   // ISO 8601
    ->weekStartsOnSunday()   // default

// ── Disabled dates ────────────────────────────────────────────────────────
DatePicker::make('appointment')
    ->disabledDates(['2025-12-25', '2025-12-31', '2026-01-01'])

// ── Close on selection ────────────────────────────────────────────────────
DatePicker::make('birthday')->closeOnDateSelection(false)  // keep picker open

// ── Read-only ─────────────────────────────────────────────────────────────
DatePicker::make('created_at')->readOnly()

// ── Affixes ───────────────────────────────────────────────────────────────
DatePicker::make('published_at')
    ->prefixIcon('calendar')
    ->suffix('UTC')
```

**Method reference**

| Method | Description |
| --- | --- |
| `->minDate(string)` / `->maxDate(string)` | Restrict selectable date range |
| `->format(string)` | PHP date format for storage |
| `->time(bool)` | Include time picker; auto-sets `H:i` format |
| `->seconds(bool)` | Include seconds in time picker; auto-sets `H:i:s` format |
| `->displayFormat(string)` | Separate human-readable display format |
| `->timezone(string)` | Timezone identifier for display |
| `->weekStartsOnMonday()` / `->weekStartsOnSunday()` | First day of the week |
| `->disabledDates(array)` | ISO date strings that cannot be selected |
| `->closeOnDateSelection(bool)` | Close picker after picking a date (default: true) |
| `->readOnly(bool)` | User cannot type; can still use picker |
| `->prefix/suffix/prefixIcon/suffixIcon` | All affix methods (same as Text) |

#### Hidden

```php
use Larafusion\Fields\Hidden;

Hidden::make('tenant_id')->default(auth()->user()->tenant_id)
// Renders nothing in the UI; value is submitted with the form.
// Users can edit hidden field values via browser DevTools — never store sensitive data here.
```

---

### Extended Fields

#### Radio

```php
use Larafusion\Fields\Radio;

// ── Basic ─────────────────────────────────────────────────────────────────
Radio::make('role')
    ->options(['admin' => 'Admin', 'editor' => 'Editor', 'viewer' => 'Viewer'])

// ── Layout ────────────────────────────────────────────────────────────────
Radio::make('priority')->options([...])->vertical()     // default, stacked
Radio::make('priority')->options([...])->inline()       // side-by-side
Radio::make('priority')->options([...])->grid()         // card grid with selection highlight

// ── Per-option descriptions ───────────────────────────────────────────────
Radio::make('plan')
    ->options(['free' => 'Free', 'pro' => 'Pro', 'enterprise' => 'Enterprise'])
    ->descriptions([
        'free'       => 'Up to 3 projects, community support.',
        'pro'        => 'Unlimited projects, email support.',
        'enterprise' => 'Custom limits, SLA, dedicated support.',
    ])
    ->grid()

// ── Boolean shorthand ─────────────────────────────────────────────────────
Radio::make('agree')
    ->boolean()                         // Yes / No (stores '1' / '0')
    ->boolean('Agree', 'Disagree')      // custom labels
    ->inline()

// ── Disable specific options ──────────────────────────────────────────────
Radio::make('status')
    ->options(PostStatus::class)
    ->disabledOptions(['archived'])
    ->disableOptionWhen(fn(string $v) => $v === 'archived')

// ── Enum options with auto-descriptions ──────────────────────────────────
Radio::make('role')->options(UserRole::class)->grid()
```

**Method reference**

| Method | Description |
| --- | --- |
| `->options(array\|EnumClass)` | Option values and labels |
| `->descriptions(array)` | Per-option description text (keys match option values) |
| `->vertical()` | Stacked layout (default) |
| `->inline()` | Horizontal / side-by-side layout |
| `->grid()` | Card grid layout with selection highlight |
| `->boolean(trueLabel, falseLabel)` | Yes/No shorthand (stores `'1'`/`'0'`) |
| `->disabledOptions(array)` | Disable specific option values |
| `->disableOptionWhen(Closure)` | Disable options matching a closure |

#### CheckboxList

```php
use Larafusion\Fields\CheckboxList;

// ── Basic ─────────────────────────────────────────────────────────────────
CheckboxList::make('permissions')
    ->options(['read' => 'Read', 'write' => 'Write', 'delete' => 'Delete'])
    ->columns(2)
    ->minSelected(1)
    ->maxSelected(5)
    ->default([])
// Stored as JSON array.

// ── Per-option descriptions ───────────────────────────────────────────────
CheckboxList::make('features')
    ->options(['sso' => 'SSO', 'api' => 'API Access', 'audit' => 'Audit Log'])
    ->descriptions([
        'sso'   => 'Single sign-on via SAML or OAuth.',
        'api'   => 'Full REST API with key management.',
        'audit' => 'Immutable audit trail for all actions.',
    ])

// ── Search ────────────────────────────────────────────────────────────────
CheckboxList::make('tags')
    ->options(Tag::pluck('name', 'id')->toArray())
    ->searchable()
    ->searchPrompt('Filter tags…')
    ->noSearchResultsMessage('No tags matched.')

// ── Bulk toggle ───────────────────────────────────────────────────────────
CheckboxList::make('roles')
    ->options(Role::pluck('name', 'id')->toArray())
    ->bulkToggleable()   // adds "Select all" / "Deselect all" buttons

// ── Disabled options ──────────────────────────────────────────────────────
CheckboxList::make('permissions')
    ->options([...])
    ->disabledOptions(['delete'])
    ->disableOptionWhen(fn(string $v) => $v === 'delete')

// ── Enum options ──────────────────────────────────────────────────────────
CheckboxList::make('roles')->options(UserRole::class)
```

**Method reference**

| Method | Description |
| --- | --- |
| `->options(array\|EnumClass)` | Option values and labels |
| `->descriptions(array)` | Per-option description text (keys match option values) |
| `->columns(int)` | Grid columns (null = auto) |
| `->minSelected(int)` | Minimum selections required |
| `->maxSelected(int)` | Maximum selections allowed |
| `->searchable()` | Show a search input to filter options |
| `->searchPrompt(string)` | Placeholder inside the search input |
| `->noSearchResultsMessage(string)` | Message when search yields nothing |
| `->bulkToggleable()` | Add "Select all" / "Deselect all" buttons |
| `->disabledOptions(array)` | Disable specific option values |
| `->disableOptionWhen(Closure)` | Disable options matching a closure |

#### Slider

```php
use Larafusion\Fields\Slider;

// ── Basic ─────────────────────────────────────────────────────────────────
Slider::make('rating')
    ->min(1)->max(10)->step(1)
    ->showValue()           // show live value beside the thumb (default: true)
    ->prefix('★ ')
    ->suffix('/10')
    ->default(5)

// ── Decimal precision ─────────────────────────────────────────────────────
Slider::make('price')
    ->min(0)->max(100)->step(0.5)
    ->decimalPlaces(1)      // format value as "4.5" not "4.500000"
    ->prefix('$')

// ── Appearance ────────────────────────────────────────────────────────────
Slider::make('volume')
    ->min(0)->max(100)
    ->fillTrack()           // fill track from start to thumb (default: true)
    ->fillTrack(false)      // unfilled track
    ->tooltips()            // show tooltip above thumb while dragging (default: true)
    ->tooltips(false)       // no tooltip
    ->vertical()            // vertical orientation

// ── Dual-handle range (value = [min, max]) ────────────────────────────────
Slider::make('price_range')
    ->range()
    ->min(0)->max(1000)->step(10)
    ->prefix('$')
    ->minDifference(50)     // handles must be at least $50 apart
    ->maxDifference(500)    // handles may be at most $500 apart
```

**Method reference**

| Method | Description |
| --- | --- |
| `->min(int)` / `->max(int)` | Slider bounds |
| `->step(int)` | Value increment |
| `->decimalPlaces(int)` | Decimal places shown in value/tooltip |
| `->showValue(bool)` | Show current value beside the thumb |
| `->hideValue()` | Alias for `->showValue(false)` |
| `->prefix(string)` / `->suffix(string)` | Text prepended/appended to displayed value |
| `->fillTrack(bool)` | Colour the track from start to thumb (default: true) |
| `->tooltips(bool)` | Show value tooltip above thumb (default: true) |
| `->vertical()` | Render vertically instead of horizontally |
| `->range()` | Dual-handle range slider; value becomes `[low, high]` |
| `->minDifference(int)` | Minimum gap between range handles |
| `->maxDifference(int)` | Maximum gap between range handles |

#### ToggleButtons

A button-group alternative to Radio / CheckboxList — each option is a clickable pill button with optional icon and colour.

```php
use Larafusion\Fields\ToggleButtons;

// ── Basic ─────────────────────────────────────────────────────────────────
ToggleButtons::make('status')
    ->options(['draft' => 'Draft', 'published' => 'Published', 'archived' => 'Archived'])

// ── Enum options with auto-colours/icons ──────────────────────────────────
ToggleButtons::make('status')->options(PostStatus::class)

// ── Semantic colours per option ───────────────────────────────────────────
ToggleButtons::make('priority')
    ->options(['low' => 'Low', 'medium' => 'Medium', 'high' => 'High'])
    ->colors(['low' => 'info', 'medium' => 'warning', 'high' => 'danger'])

// ── Icons (Lucide names) ──────────────────────────────────────────────────
ToggleButtons::make('view')
    ->options(['list' => 'List', 'grid' => 'Grid'])
    ->icons(['list' => 'list', 'grid' => 'layout-grid'])

// ── Icon-only buttons ─────────────────────────────────────────────────────
ToggleButtons::make('align')
    ->options(['left' => 'Left', 'center' => 'Center', 'right' => 'Right'])
    ->icons(['left' => 'align-left', 'center' => 'align-center', 'right' => 'align-right'])
    ->hiddenButtonLabels()   // shows only icons

// ── Connected pill group ──────────────────────────────────────────────────
ToggleButtons::make('size')
    ->options(['sm' => 'S', 'md' => 'M', 'lg' => 'L', 'xl' => 'XL'])
    ->grouped()

// ── Multiple selection ────────────────────────────────────────────────────
ToggleButtons::make('features')
    ->options(['dark_mode' => 'Dark Mode', 'notifications' => 'Notifications', 'beta' => 'Beta'])
    ->multiple()             // stored as JSON array

// ── Boolean shorthand ─────────────────────────────────────────────────────
ToggleButtons::make('active')
    ->boolean()                                          // Yes (success) / No (danger)
    ->boolean('Enabled', 'Disabled', 'success', 'gray') // custom labels + colors

// ── Layout ────────────────────────────────────────────────────────────────
ToggleButtons::make('plan')
    ->options([...])
    ->inline(false)          // grid layout
    ->columns(2)             // 2-column grid

// ── Disabled options ──────────────────────────────────────────────────────
ToggleButtons::make('role')
    ->options(['admin' => 'Admin', 'editor' => 'Editor', 'viewer' => 'Viewer'])
    ->disabledOptions(['admin'])
    ->disableOptionWhen(fn(string $v) => $v === 'admin')

// ── Tooltips on hover ─────────────────────────────────────────────────────
ToggleButtons::make('plan')
    ->options(['free' => 'Free', 'pro' => 'Pro'])
    ->tooltips(['pro' => 'Requires payment method'])
```

**Method reference**

| Method | Description |
| --- | --- |
| `->options(array\|EnumClass)` | Option values and labels |
| `->colors(array)` | Map values to semantic colors (`primary` / `success` / `warning` / `danger` / `info` / `gray`) |
| `->icons(array)` | Map values to Lucide icon names |
| `->tooltips(array)` | Map values to hover tooltip strings |
| `->multiple()` | Multi-select mode; stored as JSON array |
| `->inline(bool)` | Horizontal row (true, default) or grid layout |
| `->grouped()` | Connected pill style (no gaps between buttons) |
| `->hiddenButtonLabels()` | Show icons only, hide text labels |
| `->columns(int)` | Grid columns when `inline(false)` |
| `->boolean(true, false, trueColor, falseColor)` | Yes/No shorthand with colour presets |
| `->disabledOptions(array)` | Disable specific option values |
| `->disableOptionWhen(Closure)` | Disable options matching a closure |

#### CodeEditor

A syntax-aware code editor with line numbers, tab-key support, and language badge. Built on a plain `<textarea>` — no external dependencies.

```php
use Larafusion\Fields\CodeEditor;

// ── Basic ─────────────────────────────────────────────────────────────────
CodeEditor::make('snippet')
    ->language('php')        // sets syntax badge; see constants below

// ── Using class constants ─────────────────────────────────────────────────
CodeEditor::make('query')
    ->language(CodeEditor::LANG_SQL)
    ->minHeight(300)
    ->maxHeight(600)         // scrollable above this height

// ── Line wrapping ─────────────────────────────────────────────────────────
CodeEditor::make('config')
    ->language(CodeEditor::LANG_JSON)
    ->wrap()                 // soft-wrap long lines

// ── Line numbers ──────────────────────────────────────────────────────────
CodeEditor::make('template')
    ->language(CodeEditor::LANG_HTML)
    ->lineNumbers(false)     // hide line number gutter

// ── Dark / light theme override ───────────────────────────────────────────
CodeEditor::make('script')
    ->language(CodeEditor::LANG_JS)
    ->theme('dark')          // force dark theme regardless of panel setting
```

**Available language constants**

| Constant | Value | Badge colour |
| --- | --- | --- |
| `LANG_PHP` | `'php'` | Indigo |
| `LANG_JS` | `'javascript'` | Yellow |
| `LANG_TYPESCRIPT` | `'typescript'` | Blue |
| `LANG_HTML` | `'html'` | Orange |
| `LANG_CSS` | `'css'` | Sky |
| `LANG_JSON` | `'json'` | Green |
| `LANG_SQL` | `'sql'` | Violet |
| `LANG_PYTHON` | `'python'` | Blue |
| `LANG_GO` | `'go'` | Cyan |
| `LANG_YAML` | `'yaml'` | Amber |
| `LANG_XML` | `'xml'` | Teal |
| `LANG_BASH` | `'bash'` | Emerald |
| `LANG_MARKDOWN` | `'markdown'` | Gray |
| `LANG_PLAINTEXT` | `'plaintext'` | Gray |

**Method reference**

| Method | Description |
| --- | --- |
| `->language(string)` | Language hint for badge display |
| `->wrap()` | Soft-wrap long lines (default: false) |
| `->lineNumbers(bool)` | Show/hide line number gutter (default: true) |
| `->minHeight(int)` | Minimum editor height in px (default: 200) |
| `->maxHeight(int)` | Max height before scrolling |
| `->theme(string)` | Force `'dark'` or `'light'` colour scheme |

#### RichText

```php
use Larafusion\Fields\RichText;

// ── Basic ─────────────────────────────────────────────────────────────────
RichText::make('content')
    ->toolbar(['bold', 'italic', 'underline', 'h2', 'h3', 'ul', 'ol', 'blockquote', 'link'])
    ->minHeight(200)
// Stores HTML. Uses native contentEditable — no external dependencies.

// ── Toolbar shortcuts ─────────────────────────────────────────────────────
RichText::make('body')->toolbarButtons(['bold', 'italic', 'ul', 'ol', 'link'])  // Filament alias
RichText::make('excerpt')->simple()                                              // bold, italic, ul, ol only
RichText::make('notes')->disableToolbarButtons(['blockquote', 'strike'])        // remove specific tools

// ── Height ────────────────────────────────────────────────────────────────
RichText::make('content')
    ->minHeight(300)        // minimum editor height in px
    ->maxHeight(600)        // scrollable above this height
```

**Available toolbar tools:** `bold` `italic` `underline` `strike` `h2` `h3` `ul` `ol` `blockquote` `link`

#### Markdown

```php
use Larafusion\Fields\Markdown;

// ── Basic ─────────────────────────────────────────────────────────────────
Markdown::make('description')
    ->minHeight(300)

// ── Preview tab ───────────────────────────────────────────────────────────
Markdown::make('body')
    ->showPreview()          // default: true — show Preview tab
    ->hidePreview()          // remove Preview tab entirely
    ->startInPreview()       // open in Preview mode by default

// ── Toolbar ───────────────────────────────────────────────────────────────
Markdown::make('notes')
    ->toolbarButtons(['bold', 'italic', 'link', 'ul', 'ol'])  // restrict toolbar
// Stores plain Markdown. Built-in renderer — no dependencies.
```

#### KeyValue

```php
use Larafusion\Fields\KeyValue;

// ── Basic ─────────────────────────────────────────────────────────────────
KeyValue::make('meta')
    ->keyLabel('Key')
    ->valueLabel('Value')
    ->keyPlaceholder('e.g. og:title')
    ->valuePlaceholder('e.g. My Page')
    ->reorderable()
    ->default([])
// Stored as JSON object: {"key": "value", ...}

// ── Access control ────────────────────────────────────────────────────────
KeyValue::make('headers')
    ->addable(false)        // prevent adding new rows
    ->deletable(false)      // prevent deleting rows
    ->editableKeys(false)   // lock key column (read-only display)
    ->editableValues()      // values still editable (default: true)
```

**Method reference**

| Method | Description |
| --- | --- |
| `->keyLabel(string)` / `->valueLabel(string)` | Column header labels |
| `->keyPlaceholder(string)` / `->valuePlaceholder(string)` | Input placeholder text |
| `->reorderable()` | Allow row drag-to-reorder |
| `->addable(bool)` | Allow adding new rows (default: true) |
| `->deletable(bool)` | Allow deleting rows (default: true) |
| `->editableKeys(bool)` | Keys are editable (default: true) |
| `->editableValues(bool)` | Values are editable (default: true) |

#### Builder

```php
use Larafusion\Fields\Builder;
use Larafusion\Fields\BuilderBlock;

Builder::make('blocks')
    ->blocks([
        BuilderBlock::make('hero')
            ->label('Hero Section')
            ->icon('image')
            ->schema([
                Text::make('heading')->required(),
                Textarea::make('subheading'),
            ]),
        BuilderBlock::make('text')
            ->label('Text Block')
            ->schema([RichText::make('content')]),
    ])
    ->maxItems(10)
    ->minItems(1)            // require at least 1 block
    ->addLabel('Add Block')
    ->collapsible()          // allow collapsing individual blocks
    ->collapsed()            // start all blocks collapsed
    ->cloneable()            // show "duplicate" button per block
    ->reorderable()          // up/down reorder (default: true)
    ->deletable()            // allow removing blocks (default: true)
    ->addable()              // allow adding blocks (default: true)
// Stored as JSON array: [{"_type":"hero","_id":"uuid","heading":"..."}]
```

**Method reference**

| Method | Description |
| --- | --- |
| `->blocks(array)` | Register block definitions |
| `->maxItems(int)` | Maximum total blocks |
| `->minItems(int)` | Minimum total blocks |
| `->addLabel(string)` | Label on the "add block" button |
| `->collapsible()` | Allow collapsing individual blocks |
| `->collapsed()` | Start all blocks collapsed (implies collapsible) |
| `->cloneable()` | Show duplicate button on each block |
| `->reorderable(bool)` | Up/down reorder buttons (default: true) |
| `->deletable(bool)` | Show delete button (default: true) |
| `->addable(bool)` | Show add button (default: true) |

#### Tags

```php
use Larafusion\Fields\Tags;

// ── Basic ─────────────────────────────────────────────────────────────────
Tags::make('keywords')
    ->suggestions(['laravel', 'php', 'react'])
    ->maxTags(10)
// Stored as JSON array.

// ── Input behavior ────────────────────────────────────────────────────────
Tags::make('labels')
    ->separator(',')                         // character that splits a pasted string
    ->splitKeys(['Enter', ',', 'Tab', ' '])  // keys that commit a tag
    ->trim()                                 // auto-strip whitespace (default: true)

// ── Display ───────────────────────────────────────────────────────────────
Tags::make('hashtags')
    ->tagPrefix('#')          // decorative prefix (not stored)
    ->color('primary')        // chip color: primary | success | warning | danger | info | gray

Tags::make('prices')
    ->tagSuffix(' USD')       // decorative suffix (not stored)
    ->color('success')
```

**Method reference**

| Method | Description |
| --- | --- |
| `->suggestions(array)` | Autocomplete suggestions |
| `->maxTags(int)` | Maximum number of tags |
| `->separator(string)` | Character(s) for split-paste (default: `,`) |
| `->splitKeys(array)` | Keys that commit the typed input as a tag |
| `->trim(bool)` | Auto-strip whitespace (default: true) |
| `->tagPrefix(string)` | Decorative text before each chip (not stored) |
| `->tagSuffix(string)` | Decorative text after each chip (not stored) |
| `->color(string)` | Chip color (`primary` / `success` / `warning` / `danger` / `info` / `gray`) |
| `->reorderable()` | Drag-to-reorder tags |

#### Color

A full-featured colour picker with SV canvas, hue slider, RGB channel inputs, preset swatches, and optional alpha channel.

```php
use Larafusion\Fields\Color;

// ── Default (hex storage) ─────────────────────────────────────────────────
Color::make('brand_color')->default('#7c3aed')
// Stores: "#7c3aed"

// ── Format modes ──────────────────────────────────────────────────────────
Color::make('bg_color')->rgb()    // Stores: "rgb(124, 58, 237)"
Color::make('bg_color')->hsl()    // Stores: "hsl(263, 70%, 58%)"
Color::make('bg_color')->rgba()   // Stores: "rgba(124, 58, 237, 0.8)" + alpha slider

// ── Custom preset swatches ────────────────────────────────────────────────
Color::make('theme_color')
    ->presets(['#7c3aed', '#2563eb', '#16a34a', '#dc2626', '#d97706', '#0891b2'])
    ->default('#7c3aed')
```

**Method reference**

| Method | Description |
| --- | --- |
| `->hex()` | Store as `#rrggbb` hex string (default) |
| `->rgb()` | Store as `rgb(r, g, b)` |
| `->rgba()` | Store as `rgba(r, g, b, a)` — shows alpha slider |
| `->hsl()` | Store as `hsl(h, s%, l%)` |
| `->presets(array)` | Custom hex colour swatches shown in the picker |

#### Repeater

```php
use Larafusion\Fields\Repeater;

// ── Basic ─────────────────────────────────────────────────────────────────
Repeater::make('links')
    ->schema([
        Text::make('label'),
        Text::make('url')->url(),
    ])
    ->minItems(1)            // also accepts minRows()
    ->maxItems(5)            // also accepts maxRows()
    ->addLabel('Add Link')
// Stored as JSON array of objects.

// ── Layout ────────────────────────────────────────────────────────────────
Repeater::make('items')
    ->schema([...])
    ->columns(3)             // 3-column grid inside each row (default: 2)
    ->defaultItems(1)        // pre-populate 1 row when form first loads

// ── Item controls ─────────────────────────────────────────────────────────
Repeater::make('steps')
    ->schema([...])
    ->cloneable()            // show "duplicate row" button
    ->collapsible()          // allow collapsing rows
    ->collapsed()            // start all rows collapsed
    ->reorderable(false)     // hide up/down buttons
    ->deletable(false)       // hide delete buttons
    ->addable(false)         // hide the add button
```

**Method reference**

| Method | Description |
| --- | --- |
| `->schema(array)` | Sub-fields for each row |
| `->minItems(int)` / `->minRows(int)` | Minimum row count |
| `->maxItems(int)` / `->maxRows(int)` | Maximum row count |
| `->defaultItems(int)` | Pre-populate N empty rows on load |
| `->columns(int)` | Sub-field grid columns per row (default: 2) |
| `->addLabel(string)` | Label on the "add row" button |
| `->addable(bool)` | Show add button (default: true) |
| `->deletable(bool)` | Show delete button (default: true) |
| `->cloneable()` | Show duplicate button per row |
| `->reorderable(bool)` | Show up/down reorder buttons (default: true) |
| `->collapsible()` | Allow rows to be collapsed |
| `->collapsed()` | Start all rows collapsed (implies collapsible) |

---

### Relation Fields

#### BelongsTo

```php
use Larafusion\Fields\Relations\BelongsTo;

BelongsTo::make('category_id')
    ->model(\App\Models\Category::class)
    ->labelColumn('name')
    ->searchColumn('name')
    ->minChars(1)
// Async search via GET /admin/{resource}/relations/{field}/options?q=
```

#### BelongsToMany

```php
use Larafusion\Fields\Relations\BelongsToMany;

BelongsToMany::make('tags')
    ->model(\App\Models\Tag::class)
    ->labelColumn('name')
    ->preload(50)
// Values synced via $record->tags()->sync([...]) on save.
```

#### HasMany

```php
use Larafusion\Fields\Relations\HasMany;

HasMany::make('posts')
    ->model(\App\Models\Post::class)
    ->foreignKey('user_id')
    ->displayColumns(['title', 'status', 'created_at'])
    ->limit(5)
    ->relatedResource('posts')  // links to /admin/posts
```

#### MorphTo

```php
use Larafusion\Fields\Relations\MorphTo;

MorphTo::make('commentable')
    ->types([
        \App\Models\Post::class  => 'Post',
        \App\Models\Video::class => 'Video',
    ])
    ->labelColumn('title')
    ->searchColumn('title')
// Controller unpacks the JSON {type, id} into commentable_type + commentable_id.
```

---

### Media Fields

#### FileUpload

```php
use Larafusion\Fields\FileUpload;

// ── Basic ─────────────────────────────────────────────────────────────────
FileUpload::make('attachment')
    ->disk('public')
    ->directory('attachments')
    ->multiple()
    ->maxSize(10240)         // KB
    ->acceptedFileTypes(['application/pdf', 'image/*'])

// ── Visibility & naming ───────────────────────────────────────────────────
FileUpload::make('contract')
    ->disk('s3')
    ->visibility('private')         // 'public' (default) or 'private'
    ->preserveFilenames()           // keep original filename instead of UUID

// ── Size & count constraints ──────────────────────────────────────────────
FileUpload::make('documents')
    ->multiple()
    ->minFiles(1)                   // at least 1 file required
    ->maxFiles(5)                   // at most 5 files
    ->minSize(10)                   // minimum 10 KB per file
    ->maxSize(5120)                 // maximum 5 MB per file

// ── Interaction buttons ───────────────────────────────────────────────────
FileUpload::make('reports')
    ->multiple()
    ->downloadable()                // show download button (default: true)
    ->openable()                    // add "open in new tab" button
    ->deletable(false)              // hide the remove button
    ->reorderable()                 // allow dragging to reorder files

// ── Preset helpers ────────────────────────────────────────────────────────
FileUpload::make('photo')->image()          // JPEG, PNG, GIF, WebP only
FileUpload::make('invoice')->pdf()          // PDF only
FileUpload::make('file')->documents()       // PDF, Word, Excel
```

**Method reference**

| Method | Description |
| --- | --- |
| `->disk(string)` | Storage disk |
| `->directory(string)` | Directory on disk |
| `->visibility(string)` | `'public'` or `'private'` |
| `->multiple()` | Allow multiple files (stored as JSON array) |
| `->minFiles(int)` / `->maxFiles(int)` | File count constraints |
| `->minSize(int)` / `->maxSize(int)` | Per-file size in KB |
| `->acceptedFileTypes(array)` | Allowed MIME types |
| `->preserveFilenames()` | Keep original filename |
| `->deletable(bool)` | Show/hide remove button (default: true) |
| `->downloadable(bool)` | Show/hide download button (default: true) |
| `->openable()` | Add "open in new tab" button |
| `->reorderable()` | Allow drag-to-reorder (multiple mode) |
| `->image()` | Shortcut: accept images only |
| `->pdf()` | Shortcut: accept PDF only |
| `->documents()` | Shortcut: accept PDF, Word, Excel |

#### ImageUpload

```php
use Larafusion\Fields\ImageUpload;

ImageUpload::make('avatar')
    ->disk('public')
    ->directory('avatars')
    ->avatar()              // circular preview
    ->maxSize(2048)         // KB
    ->minFiles(1)           // require at least 1 image
    ->openable()            // allow opening image in new tab
    ->dimensions(800, 600)  // enforce exact dimensions
```

---

## Form Layout

Wrap fields in layout primitives to build structured, multi-column forms.

### Section

```php
use Larafusion\Layout\Section;

Section::make('Personal Information')
    ->description('Basic contact details.')
    ->icon('user')
    ->columns(2)      // 2-column grid inside the section
    ->collapsible()   // show collapse toggle
    ->collapsed()     // start collapsed
    ->schema([
        Text::make('first_name'),
        Text::make('last_name'),
        Email::make('email'),
    ])
```

### Tabs

```php
use Larafusion\Layout\Tabs;
use Larafusion\Layout\Tab;

Tabs::make()
    ->default('General')
    ->tabs([
        Tab::make('General')
            ->icon('settings')
            ->columns(2)
            ->schema([
                Text::make('title'),
                Select::make('status')->options([...]),
            ]),
        Tab::make('SEO')
            ->schema([
                Text::make('meta_title'),
                Textarea::make('meta_description'),
            ]),
    ])
// Tabs with validation errors show a red dot so users know where to look.
```

### Grid

```php
use Larafusion\Layout\Grid;

Grid::make()
    ->columns(3)
    ->schema([
        Text::make('first_name'),
        Text::make('last_name'),
        Text::make('phone'),
    ])
```

Layout primitives are fully nestable:

```php
public static function form(): array
{
    return [
        Hidden::make('author_id')->default(auth()->id()),
        Section::make('Content')
            ->columns(1)
            ->schema([
                Text::make('title')->required(),
                Tabs::make()->tabs([
                    Tab::make('Body')->schema([RichText::make('body')]),
                    Tab::make('SEO')->schema([
                        Text::make('meta_title'),
                        Textarea::make('meta_description'),
                    ]),
                ]),
            ]),
        Section::make('Publishing')
            ->collapsible()
            ->columns(2)
            ->schema([
                Select::make('status')->options(['draft' => 'Draft', 'published' => 'Published']),
                DatePicker::make('published_at'),
            ]),
    ];
}
```

---
