<?php

namespace Arcane\Tables\Filters;

/**
 * A 3-state filter: blank (All) / true (Yes) / false (No).
 * Supports nullable columns, custom query closures per state,
 * and custom labels for each state.
 */
class TernaryFilter extends Filter
{
    protected ?string   $trueLabel   = null;
    protected ?string   $falseLabel  = null;
    protected ?string   $placeholder = null;
    protected bool      $isNullable  = false;
    protected ?\Closure $trueQuery   = null;
    protected ?\Closure $falseQuery  = null;
    protected ?\Closure $blankQuery  = null;

    public function __construct(string $name)
    {
        parent::__construct($name);
        $this->type = 'ternary';
    }

    // ── Labels ────────────────────────────────────────────────────────────────

    public function trueLabel(string $label): static  { $this->trueLabel   = $label; return $this; }
    public function falseLabel(string $label): static { $this->falseLabel  = $label; return $this; }
    public function placeholder(string $label): static { $this->placeholder = $label; return $this; }

    // ── Nullable columns ──────────────────────────────────────────────────────

    /**
     * Filter on null vs non-null instead of true vs false.
     * "Yes" → whereNotNull($column); "No" → whereNull($column).
     */
    public function nullable(bool $v = true): static { $this->isNullable = $v; return $this; }

    // ── Custom per-state queries ───────────────────────────────────────────────

    /**
     * Pass three closures receiving ($query) — one per filter state.
     */
    public function queries(\Closure $true, \Closure $false, ?\Closure $blank = null): static
    {
        $this->trueQuery  = $true;
        $this->falseQuery = $false;
        $this->blankQuery = $blank;
        return $this;
    }

    // ── Application ───────────────────────────────────────────────────────────

    public function applyToQuery($query, mixed $value): void
    {
        $column = $this->getAttribute();

        if ($value === 'true') {
            if ($this->trueQuery) {
                call_user_func($this->trueQuery, $query);
            } elseif ($this->isNullable) {
                $query->whereNotNull($column);
            } else {
                $query->where($column, true);
            }
        } elseif ($value === 'false') {
            if ($this->falseQuery) {
                call_user_func($this->falseQuery, $query);
            } elseif ($this->isNullable) {
                $query->whereNull($column);
            } else {
                $query->where($column, false);
            }
        } elseif ($value === '') {
            if ($this->blankQuery) {
                call_user_func($this->blankQuery, $query);
            }
            // blank = no filter (show all)
        }
    }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'trueLabel'   => $this->trueLabel  ?? 'Yes',
            'falseLabel'  => $this->falseLabel ?? 'No',
            'placeholder' => $this->placeholder ?? 'All',
        ]);
    }
}
