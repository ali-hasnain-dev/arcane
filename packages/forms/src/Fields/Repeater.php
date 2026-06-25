<?php

namespace Larafusion\Fields;

use Larafusion\Schema\Serializer;

class Repeater extends Field
{
    protected array  $subFields    = [];
    protected ?int   $minRows      = null;
    protected ?int   $maxRows      = null;
    protected string $addLabel     = 'Add Row';
    protected int    $defaultItems = 0;
    protected ?int   $columns      = null;

    // ── Item controls ─────────────────────────────────────────────────────────
    protected bool   $addable      = true;
    protected bool   $deletable    = true;
    protected bool   $cloneable    = false;
    protected bool   $reorderable  = true;
    protected bool   $collapsible  = false;
    protected bool   $collapsed    = false;

    public function getType(): string { return 'repeater'; }

    // ── Schema ────────────────────────────────────────────────────────────────

    public function schema(array $fields): static { $this->subFields = $fields; return $this; }

    // ── Row limits ────────────────────────────────────────────────────────────

    public function minRows(int $n): static  { $this->minRows = $n; return $this; }
    public function maxRows(int $n): static  { $this->maxRows = $n; return $this; }

    /** Alias for minRows() — Filament-style name. */
    public function minItems(int $n): static { $this->minRows = $n; return $this; }

    /** Alias for maxRows() — Filament-style name. */
    public function maxItems(int $n): static { $this->maxRows = $n; return $this; }

    // ── Defaults & layout ─────────────────────────────────────────────────────

    /** Number of empty rows pre-populated when the form first loads. */
    public function defaultItems(int $n): static   { $this->defaultItems = $n;   return $this; }

    /** Number of columns in the sub-field grid inside each row. */
    public function columns(int $n): static        { $this->columns = $n;        return $this; }

    /** Custom label for the "add row" button. */
    public function addLabel(string $label): static { $this->addLabel = $label;  return $this; }

    // ── Item controls ─────────────────────────────────────────────────────────

    public function addable(bool $v = true): static     { $this->addable     = $v; return $this; }
    public function deletable(bool $v = true): static   { $this->deletable   = $v; return $this; }

    /** Allow cloning (duplicating) a row with a single click. */
    public function cloneable(bool $v = true): static   { $this->cloneable   = $v; return $this; }

    /** Show up/down reorder buttons on each row (default: true). */
    public function reorderable(bool $v = true): static { $this->reorderable = $v; return $this; }

    /** Allow rows to be collapsed to save space. */
    public function collapsible(bool $v = true): static { $this->collapsible = $v; return $this; }

    /** Collapse all rows by default (implies collapsible). */
    public function collapsed(bool $v = true): static   { $this->collapsed = $v; if ($v) $this->collapsible = true; return $this; }

    // ── Validation ────────────────────────────────────────────────────────────

    public function getRules(): array
    {
        $rules = parent::getRules();
        foreach ($this->subFields as $subField) {
            $subRules = $subField->getRules();
            if (!empty($subRules)) {
                $rules["{$this->name}.*.{$subField->getName()}"] = $subRules;
            }
        }
        return $rules;
    }

    // ── Serialization ─────────────────────────────────────────────────────────

    public function toArray(): array
    {
        $arr = array_merge(parent::toArray(), [
            'subFields'    => Serializer::fields($this->subFields),
            'minRows'      => $this->minRows,
            'maxRows'      => $this->maxRows,
            'addLabel'     => $this->addLabel,
            'defaultItems' => $this->defaultItems,
            'addable'      => $this->addable,
            'deletable'    => $this->deletable,
            'cloneable'    => $this->cloneable,
            'reorderable'  => $this->reorderable,
            'collapsible'  => $this->collapsible,
            'collapsed'    => $this->collapsed,
        ]);
        if ($this->columns !== null) $arr['columns'] = $this->columns;
        return $arr;
    }
}
