<?php

namespace Larafusion\Pages\Actions;

/**
 * Page header action that permanently deletes a soft-deleted record.
 *
 * Only renders when the resource has soft deletes enabled AND the record is trashed.
 */
class ForceDeleteAction extends PageAction
{
    protected string  $color = 'danger';
    protected ?string $icon  = 'flame';

    public function toArray(string $resourceSlug, mixed $record = null, string $resourceClass = ''): ?array
    {
        // Only available when resource supports soft deletes
        if ($resourceClass && !$resourceClass::softDeletes()) {
            return null;
        }

        // Only available when the record is currently trashed
        if (!$record || !method_exists($record, 'trashed') || !$record->trashed()) {
            return null;
        }

        if ($resourceClass && !$resourceClass::canDelete()) {
            return null;
        }

        $id = $record->getKey();

        return [
            'type'    => 'force_delete',
            'label'   => $this->label ?? 'Delete permanently',
            'color'   => $this->color,
            'icon'    => $this->icon,
            'confirm' => $this->confirm ?? 'This will permanently delete the record and cannot be undone.',
            'url'     => "/admin/{$resourceSlug}/{$id}/force-delete",
            'method'  => 'delete',
        ];
    }
}
