<?php

namespace Arcane\Fields;

use Arcane\Support\Enums\EnumOptions;

class ToggleButtons extends Field
{
    protected array   $options         = [];
    protected array   $colors          = [];   // value → color name
    protected array   $icons           = [];   // value → icon name (Lucide)
    protected array   $tooltips        = [];   // value → tooltip string
    protected bool    $multiple        = false;
    protected bool    $inline          = true; // true = row, false = grid
    protected bool    $grouped         = false; // connected pill style
    protected bool    $hiddenLabels    = false;
    protected ?int    $columns         = null;
    protected array   $disabledOptions = [];

    public function getType(): string { return 'toggle_buttons'; }

    // ── Options ───────────────────────────────────────────────────────────────

    /**
     * Set options from an array or a BackedEnum class.
     * If the enum implements HasColor / HasIcon, those are auto-populated.
     *
     * @param  array<string|int, string>|class-string  $options
     */
    public function options(mixed $options): static
    {
        if (is_string($options) && EnumOptions::isEnumClass($options)) {
            $this->options = EnumOptions::toOptions($options);
            // Auto-populate colors and icons if available
            if (method_exists($options, 'cases')) {
                foreach ($options::cases() as $case) {
                    if (method_exists($case, 'getColor') && $case->getColor() !== null) {
                        $this->colors[(string) $case->value] = $case->getColor();
                    }
                    if (method_exists($case, 'getIcon') && $case->getIcon() !== null) {
                        $this->icons[(string) $case->value] = $case->getIcon();
                    }
                }
            }
        } elseif (is_array($options)) {
            $this->options = $options;
        }
        $this->rebuildInRule();
        return $this;
    }

    /**
     * Map option values to colors.
     * Accepted color names: primary | success | warning | danger | info | gray
     *
     * ->colors(['active' => 'success', 'banned' => 'danger'])
     */
    public function colors(array $colors): static
    {
        $this->colors = $colors;
        return $this;
    }

    /**
     * Map option values to Lucide icon names.
     *
     * ->icons(['admin' => 'shield', 'editor' => 'pen', 'viewer' => 'eye'])
     */
    public function icons(array $icons): static
    {
        $this->icons = $icons;
        return $this;
    }

    /**
     * Map option values to tooltip strings shown on hover.
     *
     * ->tooltips(['pro' => 'Requires Pro plan'])
     */
    public function tooltips(array $tooltips): static
    {
        $this->tooltips = $tooltips;
        return $this;
    }

    // ── Selection ─────────────────────────────────────────────────────────────

    /** Allow selecting multiple options simultaneously (stored as JSON array). */
    public function multiple(bool $v = true): static { $this->multiple = $v; return $this; }

    // ── Layout ────────────────────────────────────────────────────────────────

    /** Arrange buttons in a horizontal row (true, default) or a responsive grid (false). */
    public function inline(bool $v = true): static { $this->inline = $v; return $this; }

    /** Connect buttons into a compact pill group (no gaps, shared borders). */
    public function grouped(bool $v = true): static { $this->grouped = $v; return $this; }

    /** Show only icons, hiding text labels. Requires icons() to be set. */
    public function hiddenButtonLabels(bool $v = true): static { $this->hiddenLabels = $v; return $this; }

    /** Number of columns for grid layout (null = auto). */
    public function columns(int $n): static { $this->columns = $n; return $this; }

    // ── Boolean shorthand ─────────────────────────────────────────────────────

    /**
     * Shorthand for a Yes / No button pair.
     * Values are stored as '1' (true) and '0' (false).
     */
    public function boolean(
        string $trueLabel  = 'Yes',
        string $falseLabel = 'No',
        ?string $trueColor  = 'success',
        ?string $falseColor = 'danger',
        ?string $trueIcon   = null,
        ?string $falseIcon  = null
    ): static {
        $this->options = ['1' => $trueLabel, '0' => $falseLabel];
        if ($trueColor)  $this->colors['1']  = $trueColor;
        if ($falseColor) $this->colors['0']  = $falseColor;
        if ($trueIcon)   $this->icons['1']   = $trueIcon;
        if ($falseIcon)  $this->icons['0']   = $falseIcon;
        $this->rebuildInRule();
        return $this;
    }

    // ── Disabled options ──────────────────────────────────────────────────────

    public function disabledOptions(array $values): static
    {
        $this->disabledOptions = $values;
        return $this;
    }

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
            'options'      => $this->options,
            'multiple'     => $this->multiple,
            'inline'       => $this->inline,
            'grouped'      => $this->grouped,
            'hiddenLabels' => $this->hiddenLabels,
        ]);
        if (!empty($this->colors))          $arr['colors']          = $this->colors;
        if (!empty($this->icons))           $arr['icons']           = $this->icons;
        if (!empty($this->tooltips))        $arr['tooltips']        = $this->tooltips;
        if ($this->columns !== null)        $arr['columns']         = $this->columns;
        if (!empty($this->disabledOptions)) $arr['disabledOptions'] = $this->disabledOptions;
        return $arr;
    }
}
