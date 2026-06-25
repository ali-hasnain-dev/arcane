<?php

namespace Larafusion\Actions;

use Illuminate\Database\Eloquent\Model;

/**
 * A client-side navigation action — renders as an anchor tag.
 * The URL can be a static string or a closure that receives the record.
 */
class LinkAction extends Action
{
    protected $url    = null;
    protected bool $newTab = false;

    public function getType(): string { return 'link'; }

    public function url(string|callable $url): static
    {
        $this->url = $url;
        return $this;
    }

    public function openInNewTab(bool $newTab = true): static
    {
        $this->newTab = $newTab;
        return $this;
    }

    public function resolveUrl(Model $record): string
    {
        if (is_callable($this->url)) {
            return call_user_func($this->url, $record);
        }
        return (string) ($this->url ?? '#');
    }

    public function execute(Model $record, array $data = []): mixed
    {
        // Link actions never execute server-side; the browser handles navigation.
        return null;
    }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'newTab' => $this->newTab,
        ]);
    }
}
