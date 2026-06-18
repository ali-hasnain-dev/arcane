<?php

namespace Arcane\Pages\Actions;

/**
 * Page header action that restores a soft-deleted record.
 *
 * Only renders when the resource has soft deletes enabled AND the record is trashed.
 */
class RestoreAction extends PageAction
{
    protected string  $color = 'success';
    protected ?string $icon  = 'rotate-ccw';

    public function toArray(string $resourceSlug, mixed $record = null, string $resourceClass = ''): ?array
    {
        if ($resourceClass && !$resourceClass::softDeletes()) {
            return null;
        }

        if (!$record || !method_exists($record, 'trashed') || !$record->trashed()) {
            return null;
        }

        $id = $record->getKey();

        return [
            'type'    => 'restore',
            'label'   => $this->label ?? 'Restore',
            'color'   => $this->color,
            'icon'    => $this->icon,
            'url'     => "/admin/{$resourceSlug}/{$id}/restore",
            'method'  => 'post',
        ];
    }
}
