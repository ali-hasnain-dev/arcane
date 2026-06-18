<?php

namespace Arcane\Fields;

use Arcane\Schema\Serializer;

class BuilderBlock
{
    protected string  $key;
    protected string  $label;
    protected ?string $icon   = null;
    protected array   $schema = [];

    public function __construct(string $key)
    {
        $this->key   = $key;
        $this->label = ucwords(str_replace(['_', '-'], ' ', $key));
    }

    public static function make(string $key): static
    {
        return new static($key);
    }

    public function label(string $label): static  { $this->label = $label; return $this; }
    public function icon(string $icon): static    { $this->icon  = $icon;  return $this; }

    public function schema(array $fields): static
    {
        $this->schema = $fields;
        return $this;
    }

    public function getKey(): string   { return $this->key; }
    public function getSchema(): array { return $this->schema; }

    public function toArray(): array
    {
        return [
            'key'    => $this->key,
            'label'  => $this->label,
            'icon'   => $this->icon,
            'fields' => Serializer::fields($this->schema),
        ];
    }
}
