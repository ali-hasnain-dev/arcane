import React, { useState } from 'react';
import { BulkAction } from '../types';
import { Trash2, Download, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { ConfirmDialog } from './ConfirmDialog';

interface BulkActionBarProps {
    selectedCount: number;
    totalCount: number;
    actions: BulkAction[];
    selectedIds: (string | number)[];
    onClearSelection: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    trash: Trash2,
    download: Download,
};

export default function BulkActionBar({
    selectedCount,
    totalCount,
    actions,
    selectedIds,
    onClearSelection,
}: BulkActionBarProps) {
    const [pending, setPending] = useState<{ action: BulkAction; message: string } | null>(null);

    if (selectedCount === 0) return null;

    const handleAction = (action: BulkAction) => {
        if (action.confirm) {
            setPending({
                action,
                message: action.confirm.replace('{count}', String(selectedCount)),
            });
        } else {
            action.handler(selectedIds);
            onClearSelection();
        }
    };

    const executeConfirmed = () => {
        if (!pending) return;
        pending.action.handler(selectedIds);
        onClearSelection();
    };

    return (
        <>
            <div className="flex items-center gap-3 px-6 py-3 bg-[var(--larafusion-primary,#18181b)]/5 border-b border-[var(--larafusion-primary,#18181b)]/20 animate-in slide-in-from-top-1">
                {/* Selection count */}
                <span className="text-sm font-semibold text-[var(--larafusion-primary,#18181b)]">
                    {selectedCount} of {totalCount} selected
                </span>

                <div className="w-px h-4 bg-[var(--larafusion-primary,#18181b)]/20" />

                {/* Action buttons */}
                {actions.map(action => {
                    const Icon = action.icon ? (iconMap[action.icon] ?? null) : null;
                    return (
                        <button
                            key={action.key}
                            type="button"
                            onClick={() => handleAction(action)}
                            className={cn(
                                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                                action.variant === 'danger'
                                    ? 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-200'
                                    : 'bg-white hover:bg-[var(--larafusion-primary,#18181b)]/5 text-[var(--larafusion-primary,#18181b)] border border-[var(--larafusion-primary,#18181b)]/20'
                            )}
                        >
                            {Icon && <Icon className="w-3.5 h-3.5" />}
                            {action.label}
                        </button>
                    );
                })}

                {/* Clear selection */}
                <button
                    type="button"
                    onClick={onClearSelection}
                    className="ml-auto p-1.5 rounded-md text-zinc-400 hover:text-[var(--larafusion-primary,#18181b)] hover:bg-[var(--larafusion-primary,#18181b)]/5 transition-colors"
                    title="Clear selection"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <ConfirmDialog
                open={!!pending}
                title={pending?.action.label ?? 'Confirm'}
                message={pending?.message ?? ''}
                variant={pending?.action.variant === 'danger' ? 'danger' : 'default'}
                confirmLabel={pending?.action.variant === 'danger' ? 'Delete' : 'Confirm'}
                onConfirm={executeConfirmed}
                onCancel={() => setPending(null)}
            />
        </>
    );
}
