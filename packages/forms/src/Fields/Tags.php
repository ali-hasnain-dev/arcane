<?php

namespace Arcane\Fields;

class Tags extends Field
{
    protected array   $suggestions = [];
    protected ?int    $maxTags     = null;
    protected string  $separator   = ',';
    protected array   $splitKeys   = ['Enter', ','];
    protected ?string $tagPrefix   = null;
    protected ?string $tagSuffix   = null;
    protected ?string $color       = null;
    protected bool    $trim        = true;
    protected bool    $reorderable = false;

    public function getType(): string { return 'tags'; }

    public function suggestions(array $suggestions): static { $this->suggestions = $suggestions; return $this; }
    public function maxTags(int $max): static               { $this->maxTags     = $max;          return $this; }

    /** Character used to split a pasted string into multiple tags (default: ','). */
    public function separator(string $char): static         { $this->separator = $char;    return $this; }

    /**
     * Keyboard keys that commit the current input as a new tag.
     * Default: ['Enter', ',']. Common extras: 'Tab', ' ' (space).
     */
    public function splitKeys(array $keys): static          { $this->splitKeys = $keys;    return $this; }

    /** Decorative prefix shown before each tag chip (not stored). */
    public function tagPrefix(string $prefix): static       { $this->tagPrefix = $prefix;  return $this; }

    /** Decorative suffix shown after each tag chip (not stored). */
    public function tagSuffix(string $suffix): static       { $this->tagSuffix = $suffix;  return $this; }

    /** Tag chip color: primary | success | warning | danger | info | gray */
    public function color(string $color): static            { $this->color = $color;       return $this; }

    /** Auto-trim whitespace from each tag (default: true). */
    public function trim(bool $v = true): static            { $this->trim = $v;            return $this; }

    /** Allow drag-to-reorder of tags. */
    public function reorderable(bool $v = true): static     { $this->reorderable = $v;     return $this; }

    public function toArray(): array
    {
        $arr = array_merge(parent::toArray(), [
            'suggestions' => $this->suggestions,
            'maxTags'     => $this->maxTags,
            'separator'   => $this->separator,
            'splitKeys'   => $this->splitKeys,
            'trim'        => $this->trim,
            'reorderable' => $this->reorderable,
        ]);
        if ($this->tagPrefix !== null) $arr['tagPrefix'] = $this->tagPrefix;
        if ($this->tagSuffix !== null) $arr['tagSuffix'] = $this->tagSuffix;
        if ($this->color     !== null) $arr['color']     = $this->color;
        return $arr;
    }
}
