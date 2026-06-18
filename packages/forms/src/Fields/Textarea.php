<?php

namespace Arcane\Fields;

class Textarea extends Field
{
    protected int   $rows      = 4;
    protected ?int  $cols      = null;
    protected ?int  $maxLength = null;
    protected ?int  $minLength = null;
    protected bool  $autosize  = false;
    protected bool  $readOnly  = false;
    protected bool  $trim      = false;

    public function getType(): string { return 'textarea'; }

    public function rows(int $n): static      { $this->rows = $n; return $this; }
    public function cols(int $n): static      { $this->cols = $n; return $this; }

    public function maxLength(int $n): static
    {
        $this->maxLength = $n;
        $this->addRule("max:{$n}");
        return $this;
    }

    public function minLength(int $n): static
    {
        $this->minLength = $n;
        $this->addRule("min:{$n}");
        return $this;
    }

    /** Enforce an exact character count. */
    public function length(int $n): static
    {
        $this->minLength = $n;
        $this->maxLength = $n;
        $this->addRule("min:{$n}");
        $this->addRule("max:{$n}");
        return $this;
    }

    /** Automatically grow/shrink to fit content (no fixed height). */
    public function autosize(bool $v = true): static { $this->autosize = $v; return $this; }

    /** Make the textarea non-editable; value is still submitted. */
    public function readOnly(bool $v = true): static  { $this->readOnly = $v; return $this; }

    /** Auto-strip leading/trailing whitespace on blur. */
    public function trim(bool $v = true): static      { $this->trim = $v; return $this; }

    public function toArray(): array
    {
        $arr = array_merge(parent::toArray(), [
            'rows'      => $this->rows,
            'maxLength' => $this->maxLength,
            'autosize'  => $this->autosize,
            'readOnly'  => $this->readOnly,
            'trim'      => $this->trim,
        ]);
        if ($this->cols !== null)      $arr['cols']      = $this->cols;
        if ($this->minLength !== null) $arr['minLength'] = $this->minLength;
        return $arr;
    }
}
