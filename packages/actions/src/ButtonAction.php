<?php

namespace Arcane\Actions;

use Illuminate\Database\Eloquent\Model;

/**
 * A server-side action that fires a callback when clicked.
 * The callback receives the Eloquent record and returns a redirect or JSON.
 */
class ButtonAction extends Action
{
    protected $handler = null;
    protected ?string $successMessage = null;
    protected ?string $redirectTo     = null;

    public function using(callable $handler): static
    {
        $this->handler = $handler;
        return $this;
    }

    public function successMessage(string $message): static
    {
        $this->successMessage = $message;
        return $this;
    }

    public function redirectTo(string $url): static
    {
        $this->redirectTo = $url;
        return $this;
    }

    public function execute(Model $record, array $data = []): mixed
    {
        if ($this->handler) {
            return call_user_func($this->handler, $record, $data);
        }
        return null;
    }

    public function getSuccessMessage(): ?string { return $this->successMessage; }
    public function getRedirectTo(): ?string     { return $this->redirectTo; }
}
