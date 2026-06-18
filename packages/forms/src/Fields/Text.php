<?php

namespace Arcane\Fields;

use Arcane\Concerns\HasAffixes;

class Text extends Field
{
    use HasAffixes;

    // ── Length ────────────────────────────────────────────────────────────────
    protected ?int $minLength = null;
    protected ?int $maxLength = null;

    // ── Input type ────────────────────────────────────────────────────────────
    protected string $inputType = 'text'; // text | url | tel

    // ── Clipboard ─────────────────────────────────────────────────────────────
    protected bool    $copyable    = false;
    protected ?string $copyMessage = null;

    // ── State ─────────────────────────────────────────────────────────────────
    protected bool $readOnly = false;
    protected bool $trim     = false;

    // ── Masking & suggestions ─────────────────────────────────────────────────
    protected ?string $mask         = null;
    protected ?string $autocomplete = null;
    protected array   $datalist     = [];

    // ── HTML attributes ───────────────────────────────────────────────────────
    protected ?string $inputMode = null;

    public function getType(): string { return 'text'; }

    // ── Length ────────────────────────────────────────────────────────────────

    public function minLength(int $n): static
    {
        $this->minLength = $n;
        $this->addRule("min:{$n}");
        return $this;
    }

    public function maxLength(int $n): static
    {
        $this->maxLength = $n;
        $this->addRule("max:{$n}");
        return $this;
    }

    /** Require an exact character count. */
    public function length(int $n): static
    {
        $this->minLength = $n;
        $this->maxLength = $n;
        $this->addRule("min:{$n}");
        $this->addRule("max:{$n}");
        return $this;
    }

    // ── Input type convenience methods ────────────────────────────────────────

    /** Render as <input type="url"> and add URL validation. */
    public function url(): static
    {
        $this->inputType = 'url';
        $this->addRule('url');
        return $this;
    }

    /** Render as <input type="tel">. */
    public function tel(): static
    {
        $this->inputType = 'tel';
        return $this;
    }

    /** Validate phone format with a custom regex. */
    public function telRegex(string $regex): static
    {
        $this->addRule("regex:{$regex}");
        return $this;
    }

    /** Treat value as an integer (adds integer validation rule). */
    public function integer(): static
    {
        $this->addRule('integer');
        $this->inputMode = 'numeric';
        return $this;
    }

    /** Treat value as numeric (adds numeric validation rule). */
    public function numeric(): static
    {
        $this->addRule('numeric');
        $this->inputMode = 'decimal';
        return $this;
    }

    // ── Clipboard ─────────────────────────────────────────────────────────────

    /** Show a copy-to-clipboard button. */
    public function copyable(bool $v = true, ?string $message = null): static
    {
        $this->copyable    = $v;
        $this->copyMessage = $message;
        return $this;
    }

    // ── State ─────────────────────────────────────────────────────────────────

    /** Make the input read-only (user cannot edit, but value is submitted). */
    public function readOnly(bool $v = true): static
    {
        $this->readOnly = $v;
        return $this;
    }

    /** Automatically trim whitespace from the value before saving. */
    public function trim(bool $v = true): static
    {
        $this->trim = $v;
        return $this;
    }

    // ── Masking & suggestions ─────────────────────────────────────────────────

    /**
     * Apply an input mask pattern.
     * Mask characters: 9 = digit, a = letter, * = alphanumeric.
     * Example: '(999) 999-9999'
     */
    public function mask(string $mask): static
    {
        $this->mask = $mask;
        return $this;
    }

    /** Set the HTML autocomplete attribute value. */
    public function autocomplete(string $value): static
    {
        $this->autocomplete = $value;
        return $this;
    }

    /** Provide non-restrictive suggestions via a <datalist>. */
    public function datalist(array $options): static
    {
        $this->datalist = array_values($options);
        return $this;
    }

    // ── HTML attributes ───────────────────────────────────────────────────────

    /** Set the HTML inputmode attribute (e.g. 'numeric', 'decimal', 'email', 'url', 'search', 'tel'). */
    public function inputMode(string $mode): static
    {
        $this->inputMode = $mode;
        return $this;
    }

    // ── Serialization ─────────────────────────────────────────────────────────

    public function toArray(): array
    {
        $arr = array_merge(parent::toArray(), [
            'inputType' => $this->inputType,
            'minLength' => $this->minLength,
            'maxLength' => $this->maxLength,
            'copyable'  => $this->copyable,
            'readOnly'  => $this->readOnly,
            'trim'      => $this->trim,
        ], $this->affixesToArray());

        if ($this->copyMessage !== null) $arr['copyMessage'] = $this->copyMessage;
        if ($this->mask !== null)        $arr['mask']        = $this->mask;
        if ($this->autocomplete !== null) $arr['autocomplete'] = $this->autocomplete;
        if (!empty($this->datalist))     $arr['datalist']    = $this->datalist;
        if ($this->inputMode !== null)   $arr['inputMode']   = $this->inputMode;

        return $arr;
    }
}
