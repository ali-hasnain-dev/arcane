<?php

namespace Larafusion\Fields;

use Larafusion\Support\Enums\EnumOptions;
use Illuminate\Support\Collection;

class Radio extends Field
{
    protected array  $options         = [];
    protected array  $descriptions    = [];
    protected string $layout          = 'vertical'; // vertical | horizontal | grid
    protected array  $disabledOptions = [];

    public function getType(): string { return 'radio'; }

    // ── Options ───────────────────────────────────────────────────────────────

    /**
     * Set options from an array, an Eloquent Collection, or a BackedEnum class string.
     * When an enum implementing HasDescription is passed, descriptions are
     * populated automatically.
     *
     * @param  array<string|int, string>|\Illuminate\Support\Collection|class-string  $options
     */
    public function options(mixed $options): static
    {
        if (is_string($options) && EnumOptions::isEnumClass($options)) {
            $this->options      = EnumOptions::toOptions($options);
            $this->descriptions = EnumOptions::toDescriptions($options);
        } elseif (is_object($options) && method_exists($options, 'toArray')) {
            $this->options = $options->toArray();
        } elseif (is_array($options)) {
            $this->options = $options;
        }
        $this->rebuildInRule();
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

    /** Display options horizontally (inline). */
    public function inline(): static   { $this->layout = 'horizontal'; return $this; }

    /** Display options in a card grid. */
    public function grid(): static     { $this->layout = 'grid';       return $this; }

    /** Display options in a vertical stack (default). */
    public function vertical(): static { $this->layout = 'vertical';   return $this; }

    // ── Boolean shorthand ─────────────────────────────────────────────────────

    /**
     * Shorthand for a Yes / No radio pair.
     * Values are stored as '1' (true) and '0' (false).
     */
    public function boolean(string $trueLabel = 'Yes', string $falseLabel = 'No'): static
    {
        $this->options = ['1' => $trueLabel, '0' => $falseLabel];
        $this->rebuildInRule();
        return $this;
    }

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

    // ── Helpers ───────────────────────────────────────────────────────────────

    protected function rebuildInRule(): void
    {
        if (!empty($this->options)) {
            $this->rules = array_values(array_filter(
                $this->rules,
                fn($r) => !str_starts_with($r, 'in:')
            ));
            $this->addRule('in:' . implode(',', array_keys($this->options)));
        }
    }

    // ── Serialization ─────────────────────────────────────────────────────────

    public function toArray(): array
    {
        $arr = array_merge(parent::toArray(), [
            'options' => $this->options,
            'layout'  => $this->layout,
        ]);
        if (!empty($this->descriptions))    $arr['descriptions']    = $this->descriptions;
        if (!empty($this->disabledOptions)) $arr['disabledOptions'] = $this->disabledOptions;
        return $arr;
    }
}
