<?php

namespace Arcane\Fields;

/**
 * Base class for user-defined custom field types.
 *
 * Usage (PHP):
 *
 *   class StarRatingField extends CustomField
 *   {
 *       public function __construct(string $name)
 *       {
 *           parent::__construct($name, 'star_rating');
 *       }
 *
 *       public function maxStars(int $n): static
 *       {
 *           return $this->componentData(['maxStars' => $n, ...$this->getComponentData()]);
 *       }
 *   }
 *
 * Usage (JS — register once, e.g. in app.tsx):
 *
 *   import { registerField } from '@arcane/forms';
 *   import StarRatingComponent from './StarRatingComponent';
 *   registerField('star_rating', StarRatingComponent);
 *
 * The React component receives: { field, value, error, onChange }
 * where field.componentData contains whatever was passed from PHP.
 */
class CustomField extends Field
{
    protected string $customType;
    protected array  $componentData = [];

    public function __construct(string $name, string $type)
    {
        parent::__construct($name);
        $this->customType = $type;
    }

    /**
     * Factory method — create a custom field with the given type string.
     *
     * CustomField::make('rating', 'star_rating')
     *     ->componentData(['maxStars' => 5])
     */
    public static function make(string $name, string $type = 'custom'): static
    {
        return new static($name, $type);
    }

    public function getType(): string { return $this->customType; }

    /**
     * Pass arbitrary configuration to the React component.
     * Merged with any existing componentData.
     *
     * ->componentData(['maxStars' => 5, 'color' => 'gold'])
     */
    public function componentData(array $data): static
    {
        $this->componentData = array_merge($this->componentData, $data);
        return $this;
    }

    /**
     * Read the current componentData (useful in subclass methods).
     */
    public function getComponentData(): array
    {
        return $this->componentData;
    }

    public function toArray(): array
    {
        $arr = parent::toArray();
        if (!empty($this->componentData)) {
            $arr['componentData'] = $this->componentData;
        }
        return $arr;
    }
}
