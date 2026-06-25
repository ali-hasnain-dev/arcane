<?php

namespace Larafusion\Fields;

abstract class Field
{
    protected string  $name;
    protected string  $label;
    protected bool    $required    = false;
    protected bool    $disabled    = false;
    protected bool    $hidden      = false;
    protected mixed   $default     = null;
    protected ?string $placeholder = null;
    protected ?string $hint        = null;
    protected array   $rules        = [];
    protected array   $clientRules  = [];
    protected array   $serverRules  = [];
    protected array   $validationMessages   = [];
    protected ?string $validationAttribute  = null;

    protected const CLIENT_RULES = [
        'required','string','integer','numeric','boolean',
        'email','url','ip','ipv4','ipv6','uuid','ulid',
        'alpha','alpha_num','alpha_dash',
        'min','max','between','digits','digits_between',
        'min_digits','max_digits',
        'regex','not_regex','confirmed',
        'in','not_in',
        'same','different','filled','nullable',
        'gt','gte','lt','lte',
        'starts_with','ends_with','doesnt_start_with','doesnt_end_with',
        'hex_color','json','mac_address','multiple_of',
        'after','after_or_equal','before','before_or_equal',
        'size',
    ];

    protected const SERVER_RULES = [
        'unique','exists','sometimes',
        'prohibited','prohibited_if','prohibited_unless','prohibits',
        'required_if','required_if_accepted','required_unless',
        'required_with','required_with_all','required_without','required_without_all',
        'active_url',
    ];

    public function __construct(string $name)
    {
        $this->name  = $name;
        $this->label = $this->generateLabel($name);
    }

    public static function make(string $name): static
    {
        return new static($name);
    }

    // ── Core ─────────────────────────────────────────────────────────────────

    public function label(string $label): static          { $this->label = $label;            return $this; }
    public function required(bool $condition = true): static { $this->required = $condition; if ($condition) $this->addRule('required'); return $this; }
    public function disabled(bool $condition = true): static { $this->disabled = $condition;  return $this; }
    public function hidden(bool $condition = true): static   { $this->hidden   = $condition;  return $this; }
    public function default(mixed $value): static            { $this->default  = $value;      return $this; }
    public function placeholder(string $p): static           { $this->placeholder = $p;       return $this; }
    public function hint(string $hint): static               { $this->hint = $hint;           return $this; }

    public function rules(array $rules): static { foreach ($rules as $r) $this->addRule($r); return $this; }

    // ── Validation meta ───────────────────────────────────────────────────────

    /**
     * Override the field label used in error messages.
     * e.g. ->validationAttribute('email address')
     */
    public function validationAttribute(string $attribute): static
    {
        $this->validationAttribute = $attribute;
        return $this;
    }

    /**
     * Provide custom error message strings per rule.
     * e.g. ->validationMessages(['required' => 'Please enter your :attribute.'])
     */
    public function validationMessages(array $messages): static
    {
        $this->validationMessages = $messages;
        return $this;
    }

    // ── Presence ──────────────────────────────────────────────────────────────

    /** Must not be empty when the key is present (distinct from required). */
    public function filled(): static    { $this->addRule('filled');   return $this; }

    /** Explicitly allow null values (adds 'nullable' to server rules). */
    public function nullable(): static  { $this->addRule('nullable', 'server'); return $this; }

    // ── Type ──────────────────────────────────────────────────────────────────

    public function string(): static    { $this->addRule('string');   return $this; }
    public function integer(): static   { $this->addRule('integer');  return $this; }
    public function numeric(): static   { $this->addRule('numeric');  return $this; }
    public function boolean(): static   { $this->addRule('boolean');  return $this; }
    public function array(): static     { $this->addRule('array');    return $this; }
    public function json(): static      { $this->addRule('json');     return $this; }

    // ── String format ─────────────────────────────────────────────────────────

    public function alpha(): static       { $this->addRule('alpha');       return $this; }
    public function alphaDash(): static   { $this->addRule('alpha_dash');  return $this; }
    public function alphaNum(): static    { $this->addRule('alpha_num');   return $this; }
    public function ascii(): static       { $this->addRule('ascii');       return $this; }
    public function hexColor(): static    { $this->addRule('hex_color');   return $this; }
    public function macAddress(): static  { $this->addRule('mac_address'); return $this; }
    public function ulid(): static        { $this->addRule('ulid');        return $this; }
    public function uuid(): static        { $this->addRule('uuid');        return $this; }

    /** Value must start with one of the given strings. */
    public function startsWith(array $values): static     { $this->addRule('starts_with:'    . implode(',', $values)); return $this; }

    /** Value must end with one of the given strings. */
    public function endsWith(array $values): static       { $this->addRule('ends_with:'      . implode(',', $values)); return $this; }

    /** Value must NOT start with any of the given strings. */
    public function doesntStartWith(array $values): static { $this->addRule('doesnt_start_with:' . implode(',', $values)); return $this; }

    /** Value must NOT end with any of the given strings. */
    public function doesntEndWith(array $values): static  { $this->addRule('doesnt_end_with:'   . implode(',', $values)); return $this; }

    // ── Network ───────────────────────────────────────────────────────────────

    public function ip(): static    { $this->addRule('ip');    return $this; }
    public function ipv4(): static  { $this->addRule('ipv4');  return $this; }
    public function ipv6(): static  { $this->addRule('ipv6');  return $this; }
    public function email(): static { $this->addRule('email'); return $this; }
    public function url(): static   { $this->addRule('url');   return $this; }

    /** Server-side: value must have valid A/AAAA DNS records (active URL). */
    public function activeUrl(): static { $this->addRule('active_url', 'server'); return $this; }

    // ── Numeric comparison ────────────────────────────────────────────────────

    /** Value must be a multiple of the given number. */
    public function multipleOf(int|float $n): static { $this->addRule("multiple_of:{$n}"); return $this; }

    /** Value must be greater than another field's value. */
    public function gt(string $field): static  { $this->addRule("gt:{$field}");  return $this; }

    /** Value must be greater than or equal to another field's value. */
    public function gte(string $field): static { $this->addRule("gte:{$field}"); return $this; }

    /** Value must be less than another field's value. */
    public function lt(string $field): static  { $this->addRule("lt:{$field}");  return $this; }

    /** Value must be less than or equal to another field's value. */
    public function lte(string $field): static { $this->addRule("lte:{$field}"); return $this; }

    // ── Date comparison ───────────────────────────────────────────────────────

    /** Value must be a date after the given date/field. */
    public function after(string $date): static          { $this->addRule("after:{$date}");           return $this; }

    /** Value must be a date after or equal to the given date/field. */
    public function afterOrEqual(string $date): static   { $this->addRule("after_or_equal:{$date}");   return $this; }

    /** Value must be a date before the given date/field. */
    public function before(string $date): static         { $this->addRule("before:{$date}");           return $this; }

    /** Value must be a date before or equal to the given date/field. */
    public function beforeOrEqual(string $date): static  { $this->addRule("before_or_equal:{$date}");  return $this; }

    // ── List membership ───────────────────────────────────────────────────────

    /** Value must be one of the given values. */
    public function in(array $values): static    { $this->addRule('in:'    . implode(',', $values)); return $this; }

    /** Value must NOT be one of the given values. */
    public function notIn(array $values): static { $this->addRule('not_in:'. implode(',', $values)); return $this; }

    /** Value must be a valid case of the given BackedEnum class. */
    public function enum(string $enumClass): static { $this->addRule("in:" . implode(',', array_column($enumClass::cases(), 'value'))); return $this; }

    // ── Cross-field ───────────────────────────────────────────────────────────

    /** Value must match the field named `{field}_confirmation`. */
    public function confirmed(): static { $this->addRule('confirmed'); return $this; }

    /** Value must be identical to another field's value. */
    public function same(string $field): static      { $this->addRule("same:{$field}");      return $this; }

    /** Value must differ from another field's value. */
    public function different(string $field): static { $this->addRule("different:{$field}"); return $this; }

    // ── Regex ─────────────────────────────────────────────────────────────────

    public function regex(string $pattern): static    { $this->addRule("regex:{$pattern}");     return $this; }
    public function notRegex(string $pattern): static { $this->addRule("not_regex:{$pattern}"); return $this; }

    // ── Prohibited rules ──────────────────────────────────────────────────────

    /** Value must be empty. */
    public function prohibited(): static { $this->addRule('prohibited', 'server'); return $this; }

    /** Value must be empty when another field equals a given value. */
    public function prohibitedIf(string $field, string $value): static
    {
        $this->addRule("prohibited_if:{$field},{$value}", 'server');
        return $this;
    }

    /** Value must be empty unless another field equals a given value. */
    public function prohibitedUnless(string $field, string $value): static
    {
        $this->addRule("prohibited_unless:{$field},{$value}", 'server');
        return $this;
    }

    /** If this field is non-empty, the listed field(s) must be empty. */
    public function prohibits(string|array $fields): static
    {
        $list = is_array($fields) ? implode(',', $fields) : $fields;
        $this->addRule("prohibits:{$list}", 'server');
        return $this;
    }

    // ── Conditional required ──────────────────────────────────────────────────

    /** Required when another field equals a given value. */
    public function requiredIf(string $field, string $value): static
    {
        $this->addRule("required_if:{$field},{$value}", 'server');
        return $this;
    }

    /** Required when another field is accepted (yes/on/1/true). */
    public function requiredIfAccepted(string $field): static
    {
        $this->addRule("required_if_accepted:{$field}", 'server');
        return $this;
    }

    /** Required unless another field equals a given value. */
    public function requiredUnless(string $field, string $value): static
    {
        $this->addRule("required_unless:{$field},{$value}", 'server');
        return $this;
    }

    /** Required when any of the listed fields are non-empty. */
    public function requiredWith(string|array $fields): static
    {
        $list = is_array($fields) ? implode(',', $fields) : $fields;
        $this->addRule("required_with:{$list}", 'server');
        return $this;
    }

    /** Required when ALL of the listed fields are non-empty. */
    public function requiredWithAll(string|array $fields): static
    {
        $list = is_array($fields) ? implode(',', $fields) : $fields;
        $this->addRule("required_with_all:{$list}", 'server');
        return $this;
    }

    /** Required when any of the listed fields are empty. */
    public function requiredWithout(string|array $fields): static
    {
        $list = is_array($fields) ? implode(',', $fields) : $fields;
        $this->addRule("required_without:{$list}", 'server');
        return $this;
    }

    /** Required when ALL of the listed fields are empty. */
    public function requiredWithoutAll(string|array $fields): static
    {
        $list = is_array($fields) ? implode(',', $fields) : $fields;
        $this->addRule("required_without_all:{$list}", 'server');
        return $this;
    }

    // ── Database ──────────────────────────────────────────────────────────────

    public function unique(?string $table = null, string $column = 'NULL'): static
    {
        $rule = $table ? "unique:{$table},{$column}" : 'unique';
        $this->addRule($rule, 'server');
        return $this;
    }

    public function exists(string $table, string $column = 'NULL'): static
    {
        $this->addRule("exists:{$table},{$column}", 'server');
        return $this;
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    protected function addRule(string $rule, string $side = 'auto'): void
    {
        $this->rules[] = $rule;
        $base = explode(':', $rule)[0];

        if ($side === 'server')      { $this->serverRules[] = $rule; return; }
        if ($side === 'client')      { $this->clientRules[] = $rule; return; }
        if (in_array($base, self::SERVER_RULES)) { $this->serverRules[] = $rule; }
        else                         { $this->clientRules[] = $rule; }
    }

    public function getName(): string   { return $this->name; }
    public function getRules(): array   { return $this->rules; }
    abstract public function getType(): string;

    public function toArray(): array
    {
        $arr = [
            'type'        => $this->getType(),
            'name'        => $this->name,
            'label'       => $this->label,
            'required'    => $this->required,
            'disabled'    => $this->disabled,
            'hidden'      => $this->hidden,
            'default'     => $this->default,
            'placeholder' => $this->placeholder,
            'hint'        => $this->hint,
            'validation'  => [
                'rules'    => $this->rules,
                'client'   => $this->clientRules,
                'server'   => $this->serverRules,
            ],
        ];
        if (!empty($this->validationMessages))  $arr['validation']['messages']  = $this->validationMessages;
        if ($this->validationAttribute !== null) $arr['validation']['attribute'] = $this->validationAttribute;
        return $arr;
    }

    protected function generateLabel(string $name): string
    {
        return ucwords(str_replace(['_', '-'], ' ', $name));
    }
}
