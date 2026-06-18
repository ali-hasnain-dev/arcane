<?php

namespace Arcane\Navigation;

class UserMenuItem
{
    protected string   $name;
    protected string   $label;
    protected ?string  $url         = null;
    protected ?string  $icon        = null;
    protected bool     $postToUrl   = false;
    protected bool     $openUrlInNewTab = false;

    /** @var bool|\Closure|null */
    protected mixed $visibleFn = null;

    /** @var bool|\Closure|null */
    protected mixed $hiddenFn  = null;

    public function __construct(string $name)
    {
        $this->name  = $name;
        $this->label = $name;
    }

    public static function make(string $name): static
    {
        return new static($name);
    }

    // ── Fluent setters ────────────────────────────────────────────────────────

    public function label(string $label): static
    {
        $this->label = $label;
        return $this;
    }

    public function url(string|\Closure $url, bool $openInNewTab = false): static
    {
        $this->url              = is_callable($url) ? $url() : $url;
        $this->openUrlInNewTab  = $openInNewTab;
        return $this;
    }

    public function icon(string $icon): static
    {
        $this->icon = $icon;
        return $this;
    }

    /**
     * Issue a POST request when the item is clicked, instead of a GET navigation.
     * Useful for actions like "lock session" that must not be bookmarkable.
     */
    public function postToUrl(bool $post = true): static
    {
        $this->postToUrl = $post;
        return $this;
    }

    /**
     * Pass true / false or a closure that returns bool.
     * When false (or the closure returns false), the item is omitted from the menu.
     */
    public function visible(bool|\Closure $condition = true): static
    {
        $this->visibleFn = $condition;
        return $this;
    }

    /**
     * Inverse of visible(). When true (or the closure returns true), the item is hidden.
     */
    public function hidden(bool|\Closure $condition = true): static
    {
        $this->hiddenFn = $condition;
        return $this;
    }

    // ── Evaluation ────────────────────────────────────────────────────────────

    /**
     * Returns false if this item should be hidden for the current request.
     */
    public function isVisible(): bool
    {
        if ($this->hiddenFn !== null) {
            $hidden = is_callable($this->hiddenFn) ? ($this->hiddenFn)() : $this->hiddenFn;
            if ($hidden) return false;
        }

        if ($this->visibleFn !== null) {
            $visible = is_callable($this->visibleFn) ? ($this->visibleFn)() : $this->visibleFn;
            return (bool) $visible;
        }

        return true;
    }

    public function getName(): string   { return $this->name; }

    public function toArray(): array
    {
        return [
            'name'        => $this->name,
            'label'       => $this->label,
            'url'         => $this->url,
            'icon'        => $this->icon,
            'method'      => $this->postToUrl ? 'post' : 'get',
            'newTab'      => $this->openUrlInNewTab,
        ];
    }
}
