<?php

namespace Larafusion\Widgets;

class Stat
{
    protected string           $label;
    protected string|int|float $value;
    protected ?string          $description         = null;
    protected ?string          $descriptionIcon     = null;
    protected string           $descriptionIconPosition = 'after'; // 'before' | 'after'
    protected ?string          $descriptionColor    = null;
    protected ?string          $icon                = null;
    protected string           $color               = 'default'; // default|primary|success|warning|danger|info
    protected ?float           $trend               = null;      // positive = up, negative = down
    protected array            $chart               = [];        // sparkline data points
    protected array            $extraAttributes     = [];
    protected ?string          $backgroundColor     = null;

    public function __construct(string $label, string|int|float $value)
    {
        $this->label = $label;
        $this->value = $value;
    }

    public static function make(string $label, string|int|float $value): static
    {
        return new static($label, $value);
    }

    public function description(string $d): static                   { $this->description             = $d;        return $this; }
    public function descriptionIcon(string $icon): static            { $this->descriptionIcon         = $icon;     return $this; }
    public function descriptionIconPosition(string $pos): static     { $this->descriptionIconPosition = $pos;      return $this; }
    public function descriptionColor(string $color): static          { $this->descriptionColor        = $color;    return $this; }
    public function icon(string $i): static                          { $this->icon                    = $i;        return $this; }
    public function color(string $c): static                         { $this->color                   = $c;        return $this; }
    public function trend(float $t): static                          { $this->trend                   = $t;        return $this; }

    /**
     * Array of numeric values for the sparkline chart displayed inside the stat card.
     * Example: ->chart([40, 60, 55, 70, 90, 80, 100])
     */
    public function chart(array $data): static                       { $this->chart                   = $data;     return $this; }
    public function extraAttributes(array $attrs): static            { $this->extraAttributes         = $attrs;    return $this; }

    /**
     * Override the card background color. Accepts any CSS color value (hex, rgb, Tailwind-style, etc.).
     * Example: ->backgroundColor('#f0fdf4') or ->backgroundColor('oklch(0.97 0.02 145)')
     */
    public function backgroundColor(string $color): static         { $this->backgroundColor         = $color;    return $this; }

    public function toArray(): array
    {
        return [
            'label'                   => $this->label,
            'value'                   => $this->value,
            'description'             => $this->description,
            'descriptionIcon'         => $this->descriptionIcon,
            'descriptionIconPosition' => $this->descriptionIconPosition,
            'descriptionColor'        => $this->descriptionColor,
            'icon'                    => $this->icon,
            'color'                   => $this->color,
            'trend'                   => $this->trend,
            'chart'                   => $this->chart,
            'extraAttributes'         => $this->extraAttributes,
            'backgroundColor'         => $this->backgroundColor,
        ];
    }
}
