<?php

namespace Arcane\Fields;

use Arcane\Support\Enums\EnumOptions;

class Select extends Field
{
    // ── Core ──────────────────────────────────────────────────────────────────
    protected array  $options      = [];
    protected bool   $searchable   = false;
    protected bool   $multiple     = false;

    // ── Display ───────────────────────────────────────────────────────────────
    protected bool   $native       = true;    // false → custom JS dropdown
    protected bool   $clearable    = false;
    protected bool   $isBoolean    = false;

    // ── Disabled options ──────────────────────────────────────────────────────
    protected array  $disabledOptions = [];

    // ── Multiple validation ───────────────────────────────────────────────────
    protected ?int   $minItems     = null;
    protected ?int   $maxItems     = null;

    // ── Custom messages ───────────────────────────────────────────────────────
    protected ?string $noSearchResultsMessage = null;
    protected ?string $loadingMessage         = null;
    protected ?string $searchPrompt           = null;
    protected ?string $noOptionsMessage       = null;
    protected ?string $searchingMessage       = null;

    // ── Search behaviour ──────────────────────────────────────────────────────
    protected int  $searchDebounce       = 1000; // ms before search fires
    protected int  $optionsLimit         = 50;   // max options shown in list
    protected bool $wrapOptionLabels     = true; // wrap long labels
    protected bool $selectablePlaceholder = true; // whether null/placeholder is selectable

    // ── Affixes ───────────────────────────────────────────────────────────────
    protected ?string $prefixText       = null;
    protected ?string $suffixText       = null;
    protected ?string $prefixIcon       = null;
    protected ?string $suffixIcon       = null;
    protected ?string $prefixIconColor  = null;
    protected ?string $suffixIconColor  = null;

    public function getType(): string { return 'select'; }

    // ── Options ───────────────────────────────────────────────────────────────

    /**
     * Set options from an array (supports grouped), Collection, or a BackedEnum class.
     *
     * Grouped example:
     *   ->options([
     *       'Active'   => ['draft' => 'Draft', 'published' => 'Published'],
     *       'Inactive' => ['archived' => 'Archived'],
     *   ])
     *
     * @param  array|\Illuminate\Support\Collection|class-string  $options
     */
    public function options(mixed $options): static
    {
        if (is_string($options) && EnumOptions::isEnumClass($options)) {
            $this->options = EnumOptions::toOptions($options);
        } elseif (is_object($options) && method_exists($options, 'toArray')) {
            $this->options = $options->toArray();
        } elseif (is_array($options)) {
            $this->options = $options;
        }
        $this->rebuildInRule();
        return $this;
    }

    // ── Core modifiers ────────────────────────────────────────────────────────

    public function searchable(bool $v = true): static   { $this->searchable = $v; return $this; }
    public function multiple(bool $v = true): static     { $this->multiple   = $v; return $this; }

    /** Use native HTML <select> (true, default) or a custom JS dropdown (false). */
    public function native(bool $v = true): static       { $this->native     = $v; return $this; }

    /** Show a clear / deselect button. */
    public function clearable(bool $v = true): static    { $this->clearable  = $v; return $this; }

    /**
     * Shortcut for a Yes / No select.
     * Values are stored as '1' (true) and '0' (false).
     */
    public function boolean(
        string $trueLabel  = 'Yes',
        string $falseLabel = 'No',
        string $placeholder = 'Select an option'
    ): static {
        $this->isBoolean = true;
        $this->options = ['1' => $trueLabel, '0' => $falseLabel];
        if (!$this->placeholder) $this->placeholder = $placeholder;
        $this->rebuildInRule();
        return $this;
    }

    // ── Disabled options ──────────────────────────────────────────────────────

    /**
     * Explicitly disable specific option values.
     *
     * ->disabledOptions(['archived', 'deleted'])
     */
    public function disabledOptions(array $values): static
    {
        $this->disabledOptions = $values;
        return $this;
    }

    /**
     * Disable option values that match the given closure.
     *
     * ->disableOptionWhen(fn(string $value) => $value === 'archived')
     */
    public function disableOptionWhen(\Closure $callback): static
    {
        foreach ($this->flatOptionValues() as $value) {
            if ($callback($value)) {
                $this->disabledOptions[] = $value;
            }
        }
        return $this;
    }

    // ── Validation ────────────────────────────────────────────────────────────

    public function minItems(int $n): static { $this->minItems = $n; return $this; }
    public function maxItems(int $n): static { $this->maxItems = $n; return $this; }

    // ── Messages ──────────────────────────────────────────────────────────────

    public function noSearchResultsMessage(string $msg): static { $this->noSearchResultsMessage = $msg; return $this; }
    public function loadingMessage(string $msg): static         { $this->loadingMessage         = $msg; return $this; }
    public function searchPrompt(string $msg): static           { $this->searchPrompt           = $msg; return $this; }
    public function noOptionsMessage(string $msg): static       { $this->noOptionsMessage       = $msg; return $this; }

    /** Message displayed while search results are being fetched. */
    public function searchingMessage(string $msg): static       { $this->searchingMessage       = $msg; return $this; }

    // ── Search behaviour ──────────────────────────────────────────────────────

    /** Milliseconds to wait after the user stops typing before firing the search (default: 1000). */
    public function searchDebounce(int $ms): static              { $this->searchDebounce       = $ms;   return $this; }

    /** Maximum number of options shown in the dropdown list (default: 50). */
    public function optionsLimit(int $n): static                 { $this->optionsLimit         = $n;    return $this; }

    /** Allow long option labels to wrap (default: true). Set false to truncate. */
    public function wrapOptionLabels(bool $v = true): static     { $this->wrapOptionLabels     = $v;    return $this; }

    /** Whether the null / placeholder entry is itself selectable (default: true). */
    public function selectablePlaceholder(bool $v = true): static { $this->selectablePlaceholder = $v;  return $this; }

    // ── Affixes ───────────────────────────────────────────────────────────────

    public function prefix(string $text): static                 { $this->prefixText      = $text;  return $this; }
    public function suffix(string $text): static                 { $this->suffixText      = $text;  return $this; }
    public function prefixIcon(string $icon, ?string $color = null): static { $this->prefixIcon = $icon; if ($color !== null) $this->prefixIconColor = $color; return $this; }
    public function suffixIcon(string $icon, ?string $color = null): static { $this->suffixIcon = $icon; if ($color !== null) $this->suffixIconColor = $color; return $this; }
    public function prefixIconColor(string $color): static       { $this->prefixIconColor = $color; return $this; }
    public function suffixIconColor(string $color): static       { $this->suffixIconColor = $color; return $this; }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Flatten option values, unwrapping groups. */
    protected function flatOptionValues(): array
    {
        $values = [];
        foreach ($this->options as $key => $value) {
            if (is_array($value)) {
                array_push($values, ...array_keys($value));
            } else {
                $values[] = $key;
            }
        }
        return $values;
    }

    protected function rebuildInRule(): void
    {
        $flat = $this->flatOptionValues();
        if (!empty($flat)) {
            // Remove any previous in: rule to avoid duplicates
            $this->rules = array_filter(
                $this->rules,
                fn($r) => !str_starts_with($r, 'in:')
            );
            $this->rules = array_values($this->rules);
            $this->addRule('in:' . implode(',', $flat));
        }
    }

    // ── Serialization ─────────────────────────────────────────────────────────

    public function toArray(): array
    {
        $arr = array_merge(parent::toArray(), [
            'options'    => $this->options,
            'searchable' => $this->searchable,
            'multiple'   => $this->multiple,
            'native'     => $this->native,
            'clearable'  => $this->clearable,
            'isBoolean'  => $this->isBoolean,
        ]);

        if (!empty($this->disabledOptions))            $arr['disabledOptions']          = $this->disabledOptions;
        if ($this->minItems !== null)                  $arr['minItems']                 = $this->minItems;
        if ($this->maxItems !== null)                  $arr['maxItems']                 = $this->maxItems;
        if ($this->noSearchResultsMessage !== null)    $arr['noSearchResultsMessage']   = $this->noSearchResultsMessage;
        if ($this->loadingMessage !== null)            $arr['loadingMessage']           = $this->loadingMessage;
        if ($this->searchPrompt !== null)              $arr['searchPrompt']             = $this->searchPrompt;
        if ($this->noOptionsMessage !== null)          $arr['noOptionsMessage']         = $this->noOptionsMessage;
        if ($this->searchingMessage !== null)          $arr['searchingMessage']         = $this->searchingMessage;
        if ($this->searchDebounce !== 1000)            $arr['searchDebounce']           = $this->searchDebounce;
        if ($this->optionsLimit !== 50)                $arr['optionsLimit']             = $this->optionsLimit;
        if (!$this->wrapOptionLabels)                  $arr['wrapOptionLabels']         = false;
        if (!$this->selectablePlaceholder)             $arr['selectablePlaceholder']    = false;
        if ($this->prefixText !== null)                $arr['prefixText']               = $this->prefixText;
        if ($this->suffixText !== null)                $arr['suffixText']               = $this->suffixText;
        if ($this->prefixIcon !== null)                $arr['prefixIcon']               = $this->prefixIcon;
        if ($this->suffixIcon !== null)                $arr['suffixIcon']               = $this->suffixIcon;
        if ($this->prefixIconColor !== null)           $arr['prefixIconColor']          = $this->prefixIconColor;
        if ($this->suffixIconColor !== null)           $arr['suffixIconColor']          = $this->suffixIconColor;

        return $arr;
    }
}
