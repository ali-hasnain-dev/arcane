<?php

namespace Arcane\Actions;

use Illuminate\Database\Eloquent\Model;

abstract class Action
{
    protected string  $key;
    protected string  $label;
    protected ?string $icon    = null;
    protected string  $color   = 'default'; // default | primary | success | warning | danger
    protected string  $display = 'icon';    // icon | text | button
    protected ?string $confirm = null;
    protected bool    $hidden  = false;
    protected $visibleWhenCallback = null;

    public function __construct(string $key)
    {
        $this->key   = $key;
        $this->label = ucwords(str_replace(['_', '-'], ' ', $key));
    }

    public static function make(string $key): static
    {
        return new static($key);
    }

    public function label(string $label): static         { $this->label   = $label;   return $this; }
    public function icon(string $icon): static           { $this->icon    = $icon;    return $this; }
    public function color(string $color): static         { $this->color   = $color;   return $this; }
    public function display(string $display): static     { $this->display = $display; return $this; }
    public function iconOnly(): static                   { return $this->display('icon'); }
    public function textOnly(): static                   { return $this->display('text'); }
    public function button(): static                     { return $this->display('button'); }
    public function confirm(?string $message): static    { $this->confirm = $message; return $this; }
    public function hidden(bool $hidden = true): static  { $this->hidden  = $hidden;  return $this; }
    public function visibleWhen(callable $callback): static { $this->visibleWhenCallback = $callback; return $this; }
    public function success(): static                    { return $this->color('success'); }
    public function warning(): static                    { return $this->color('warning'); }
    public function danger(): static                     { return $this->color('danger'); }
    public function primary(): static                    { return $this->color('primary'); }

    public function getKey(): string   { return $this->key; }
    public function isHidden(): bool   { return $this->hidden; }
    public function getType(): string  { return 'button'; }

    /** Override to conditionally hide the action per record. */
    public function visibleFor(Model $record): bool
    {
        if ($this->hidden) return false;
        if ($this->visibleWhenCallback !== null) {
            return (bool) call_user_func($this->visibleWhenCallback, $record);
        }
        return true;
    }

    /** Execute the action. Return array for JSON response or null to redirect back. */
    abstract public function execute(Model $record, array $data = []): mixed;

    public function toArray(): array
    {
        return [
            'key'     => $this->key,
            'label'   => $this->label,
            'icon'    => $this->icon,
            'color'   => $this->color,
            'display' => $this->display,
            'confirm' => $this->confirm,
            'type'    => $this->getType(),
        ];
    }
}
