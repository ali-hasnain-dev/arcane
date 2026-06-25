<?php

namespace Larafusion\Fields;

class KeyValue extends Field
{
    protected string  $keyLabel         = 'Key';
    protected string  $valueLabel       = 'Value';
    protected ?string $keyPlaceholder   = null;
    protected ?string $valuePlaceholder = null;
    protected bool    $reorderable      = false;
    protected bool    $addable          = true;
    protected bool    $deletable        = true;
    protected bool    $editableKeys     = true;
    protected bool    $editableValues   = true;

    public function __construct(string $name)
    {
        parent::__construct($name);
        $this->default = [];
    }

    public function getType(): string { return 'key_value'; }

    public function keyLabel(string $label): static        { $this->keyLabel       = $label; return $this; }
    public function valueLabel(string $label): static      { $this->valueLabel     = $label; return $this; }
    public function keyPlaceholder(string $p): static      { $this->keyPlaceholder   = $p;  return $this; }
    public function valuePlaceholder(string $p): static    { $this->valuePlaceholder = $p;  return $this; }
    public function reorderable(bool $v = true): static    { $this->reorderable    = $v;    return $this; }

    /** Allow adding new rows (default: true). */
    public function addable(bool $v = true): static        { $this->addable        = $v;    return $this; }

    /** Allow deleting rows (default: true). */
    public function deletable(bool $v = true): static      { $this->deletable      = $v;    return $this; }

    /** Allow editing key inputs (default: true). Set false to lock keys. */
    public function editableKeys(bool $v = true): static   { $this->editableKeys   = $v;    return $this; }

    /** Allow editing value inputs (default: true). Set false for read-only values. */
    public function editableValues(bool $v = true): static { $this->editableValues = $v;    return $this; }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'keyLabel'         => $this->keyLabel,
            'valueLabel'       => $this->valueLabel,
            'keyPlaceholder'   => $this->keyPlaceholder,
            'valuePlaceholder' => $this->valuePlaceholder,
            'reorderable'      => $this->reorderable,
            'addable'          => $this->addable,
            'deletable'        => $this->deletable,
            'editableKeys'     => $this->editableKeys,
            'editableValues'   => $this->editableValues,
        ]);
    }
}
