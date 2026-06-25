<?php

namespace Larafusion\Concerns;

trait HasAffixes
{
    protected ?string $prefixText      = null;
    protected ?string $suffixText      = null;
    protected ?string $prefixIcon      = null;
    protected ?string $suffixIcon      = null;
    protected ?string $prefixIconColor = null;
    protected ?string $suffixIconColor = null;
    /** 'separated' = icon in its own bordered cell (default); 'inline' = icon floats inside the input */
    protected string  $iconLayout      = 'separated';

    public function prefix(string $text): static
    {
        $this->prefixText = $text;
        return $this;
    }

    public function suffix(string $text): static
    {
        $this->suffixText = $text;
        return $this;
    }

    public function prefixIcon(string $icon, ?string $color = null): static
    {
        $this->prefixIcon = $icon;
        if ($color !== null) $this->prefixIconColor = $color;
        return $this;
    }

    public function suffixIcon(string $icon, ?string $color = null): static
    {
        $this->suffixIcon = $icon;
        if ($color !== null) $this->suffixIconColor = $color;
        return $this;
    }

    public function prefixIconColor(string $color): static
    {
        $this->prefixIconColor = $color;
        return $this;
    }

    public function suffixIconColor(string $color): static
    {
        $this->suffixIconColor = $color;
        return $this;
    }

    /**
     * Control how icons are rendered relative to the input.
     *
     * 'separated' (default) — icon lives in its own bordered cell beside the input.
     * 'inline'              — icon is positioned inside the input, no dividing border.
     */
    public function iconLayout(string $layout): static
    {
        $this->iconLayout = $layout;
        return $this;
    }

    protected function affixesToArray(): array
    {
        $arr = [];
        if ($this->prefixText !== null)      $arr['prefixText']      = $this->prefixText;
        if ($this->suffixText !== null)      $arr['suffixText']      = $this->suffixText;
        if ($this->prefixIcon !== null)      $arr['prefixIcon']      = $this->prefixIcon;
        if ($this->suffixIcon !== null)      $arr['suffixIcon']      = $this->suffixIcon;
        if ($this->prefixIconColor !== null) $arr['prefixIconColor'] = $this->prefixIconColor;
        if ($this->suffixIconColor !== null) $arr['suffixIconColor'] = $this->suffixIconColor;
        if ($this->iconLayout !== 'separated') $arr['iconLayout']   = $this->iconLayout;
        return $arr;
    }
}
