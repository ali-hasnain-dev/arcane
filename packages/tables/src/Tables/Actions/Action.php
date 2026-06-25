<?php

namespace Larafusion\Tables\Actions;

use Illuminate\Database\Eloquent\Model;

/**
 * A Filament-style table action that lives inside recordActions().
 * Supports server-side callbacks, URL navigation, confirmation dialogs,
 * tooltips, badges, display modes, and notifications.
 */
class Action
{
    protected string  $key;
    protected string  $label;
    protected ?string $icon               = null;
    protected string  $color              = 'default';
    protected string  $display            = 'icon';   // icon | text | button
    protected ?string $confirm            = null;
    protected ?string $confirmHeading     = null;
    protected ?string $confirmDescription = null;
    protected ?string $confirmSubmitLabel = null;
    protected ?string $tooltip            = null;
    protected ?string $badge              = null;
    protected ?string $badgeColor         = null;
    protected bool    $hidden             = false;
    protected mixed   $visibleWhen        = null;
    protected mixed   $actionCallback     = null;
    protected mixed   $urlValue           = null;
    protected bool    $newTab             = false;
    protected ?string $successNotificationTitle = null;
    protected ?string $failureNotificationTitle = null;

    public function __construct(string $key)
    {
        $this->key   = $key;
        $this->label = ucwords(str_replace(['_', '-'], ' ', $key));
    }

    public static function make(string $key): static
    {
        return new static($key);
    }

    // ── Basic ─────────────────────────────────────────────────────────────────

    public function label(string $label): static    { $this->label   = $label;   return $this; }
    public function icon(string $icon): static      { $this->icon    = $icon;    return $this; }
    public function color(string $color): static    { $this->color   = $color;   return $this; }
    public function tooltip(string $tip): static    { $this->tooltip = $tip;     return $this; }

    // ── Color shortcuts ───────────────────────────────────────────────────────

    public function primary(): static { return $this->color('primary'); }
    public function success(): static { return $this->color('success'); }
    public function warning(): static { return $this->color('warning'); }
    public function danger(): static  { return $this->color('danger');  }

    // ── Display modes ─────────────────────────────────────────────────────────

    public function display(string $mode): static { $this->display = $mode; return $this; }
    public function iconOnly(): static            { return $this->display('icon');   }
    public function textOnly(): static            { return $this->display('text');   }
    public function button(): static              { return $this->display('button'); }

    // ── Confirmation ──────────────────────────────────────────────────────────

    public function requiresConfirmation(bool $v = true): static
    {
        if ($v) $this->confirm ??= 'Are you sure?';
        return $this;
    }

    public function confirm(?string $message = null): static
    {
        $this->confirm = $message ?? 'Are you sure?';
        return $this;
    }

    public function modalHeading(string $heading): static
    {
        $this->confirmHeading = $heading;
        return $this;
    }

    public function modalDescription(string $description): static
    {
        $this->confirmDescription = $description;
        return $this;
    }

    public function modalSubmitActionLabel(string $label): static
    {
        $this->confirmSubmitLabel = $label;
        return $this;
    }

    // ── Visibility ────────────────────────────────────────────────────────────

    public function hidden(bool $v = true): static { $this->hidden = $v; return $this; }

    public function visible(callable $callback): static
    {
        $this->visibleWhen = $callback;
        return $this;
    }

    // ── Badge ─────────────────────────────────────────────────────────────────

    public function badge(string $badge, string $color = 'primary'): static
    {
        $this->badge      = $badge;
        $this->badgeColor = $color;
        return $this;
    }

    // ── Action / URL ──────────────────────────────────────────────────────────

    public function action(callable $callback): static
    {
        $this->actionCallback = $callback;
        return $this;
    }

    public function url(string|callable $url): static
    {
        $this->urlValue = $url;
        return $this;
    }

    public function openUrlInNewTab(bool $v = true): static
    {
        $this->newTab = $v;
        return $this;
    }

    // ── Notifications ─────────────────────────────────────────────────────────

    public function successNotificationTitle(string $title): static
    {
        $this->successNotificationTitle = $title;
        return $this;
    }

    public function failureNotificationTitle(string $title): static
    {
        $this->failureNotificationTitle = $title;
        return $this;
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    public function getKey(): string    { return $this->key; }
    public function isHidden(): bool    { return $this->hidden; }
    public function getSuccessMessage(): ?string { return $this->successNotificationTitle; }
    public function getRedirectTo(): ?string     { return null; }

    public function visibleFor(Model $record): bool
    {
        if ($this->hidden) return false;
        if ($this->visibleWhen !== null) {
            return (bool) call_user_func($this->visibleWhen, $record);
        }
        return true;
    }

    public function execute(Model $record, array $data = []): mixed
    {
        if ($this->actionCallback) {
            return call_user_func($this->actionCallback, $record, $data);
        }
        return null;
    }

    public function resolveUrl(Model $record): ?string
    {
        if (is_callable($this->urlValue)) {
            return (string) call_user_func($this->urlValue, $record);
        }
        return $this->urlValue ? (string) $this->urlValue : null;
    }

    public function toArray(): array
    {
        // Closures can't be serialised; only static strings travel to the frontend.
        $url = is_string($this->urlValue) ? $this->urlValue : null;

        return [
            'type'               => 'action',
            'key'                => $this->key,
            'label'              => $this->label,
            'icon'               => $this->icon,
            'color'              => $this->color,
            'display'            => $this->display,
            'confirm'            => $this->confirm,
            'confirmHeading'     => $this->confirmHeading,
            'confirmDescription' => $this->confirmDescription,
            'confirmSubmitLabel' => $this->confirmSubmitLabel,
            'tooltip'            => $this->tooltip,
            'badge'              => $this->badge,
            'badgeColor'         => $this->badgeColor,
            'url'                => $url,
            'newTab'             => $this->newTab,
            'isLink'             => $url !== null,
        ];
    }
}
