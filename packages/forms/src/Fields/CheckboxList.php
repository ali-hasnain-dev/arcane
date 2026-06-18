<?php

namespace Arcane\Fields;

use Arcane\Support\Enums\EnumOptions;

class CheckboxList extends Field
{
    protected array   $options      = [];
    protected array   $descriptions = [];
    protected ?int    $columns      = null;  // null = auto
    protected ?int    $min          = null;
    protected ?int    $max          = null;

    // ── Search ────────────────────────────────────────────────────────────────
    protected bool    $searchable             = false;
    protected ?string $noSearchResultsMessage = null;
    protected ?string $searchPrompt           = null;

    // ── Bulk toggle ───────────────────────────────────────────────────────────
    protected bool    $bulkToggleable = false;

    // ── Disabled options ──────────────────────────────────────────────────────
    protected array   $disabledOptions = [];

    public function __construct(string $name)
    {
        parent::__construct($name);
        $this->default = [];
    }

    public function getType(): string { return 'checkbox_list'; }

    // ── Options ───────────────────────────────────────────────────────────────

    /**
     * Set options from an array or a BackedEnum class string.
     * When an enum implementing HasDescription is passed, descriptions are
     * populated automatically.
     *
     * @param  array<string|int, string>|class-string  $options
     */
    public function options(array|string $options): static
    {
        if (is_string($options) && EnumOptions::isEnumClass($options)) {
            $this->options      = EnumOptions::toOptions($options);
            $this->descriptions = EnumOptions::toDescriptions($options);
        } else {
            $this->options = is_array($options) ? $options : [];
        }
        return $this;
    }

    /**
     * Add per-option description text displayed below each label.
     * Keys must match the option values.
     */
    public function descriptions(array $descriptions): static
    {
        $this->descriptions = $descriptions;
        return $this;
    }

    // ── Layout ────────────────────────────────────────────────────────────────

    public function columns(int $n): static { $this->columns = $n; return $this; }

    // ── Validation ────────────────────────────────────────────────────────────

    public function minSelected(int $n): static { $this->min = $n; return $this; }
    public function maxSelected(int $n): static { $this->max = $n; return $this; }

    // ── Search ────────────────────────────────────────────────────────────────

    public function searchable(bool $v = true): static              { $this->searchable = $v; return $this; }
    public function noSearchResultsMessage(string $msg): static     { $this->noSearchResultsMessage = $msg; return $this; }
    public function searchPrompt(string $prompt): static            { $this->searchPrompt = $prompt; return $this; }

    // ── Bulk toggle ───────────────────────────────────────────────────────────

    /** Show "Select all" / "Deselect all" buttons above the list. */
    public function bulkToggleable(bool $v = true): static { $this->bulkToggleable = $v; return $this; }

    // ── Disabled options ──────────────────────────────────────────────────────

    /**
     * Disable specific option values.
     * ->disabledOptions(['value1', 'value2'])
     */
    public function disabledOptions(array $values): static
    {
        $this->disabledOptions = $values;
        return $this;
    }

    /**
     * Disable options that match a closure.
     * ->disableOptionWhen(fn(string $value) => $value === 'archived')
     */
    public function disableOptionWhen(\Closure $callback): static
    {
        foreach (array_keys($this->options) as $value) {
            if ($callback((string) $value)) {
                $this->disabledOptions[] = (string) $value;
            }
        }
        return $this;
    }

    // ── Serialization ─────────────────────────────────────────────────────────

    public function toArray(): array
    {
        $arr = array_merge(parent::toArray(), [
            'options'       => $this->options,
            'columns'       => $this->columns,
            'min'           => $this->min,
            'max'           => $this->max,
            'searchable'    => $this->searchable,
            'bulkToggleable' => $this->bulkToggleable,
        ]);

        if (!empty($this->descriptions))       $arr['descriptions']           = $this->descriptions;
        if (!empty($this->disabledOptions))    $arr['disabledOptions']        = $this->disabledOptions;
        if ($this->noSearchResultsMessage !== null) $arr['noSearchResultsMessage'] = $this->noSearchResultsMessage;
        if ($this->searchPrompt !== null)      $arr['searchPrompt']           = $this->searchPrompt;

        return $arr;
    }
}
