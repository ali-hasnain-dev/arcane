import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { resolveIcon } from '@larafusion/support';
import { cn } from '../../lib/utils';
import type { PageHeaderAction } from '@larafusion/support';
import { ConfirmDialog } from './ConfirmDialog';

// ── Color → class map ─────────────────────────────────────────────────────────

const colorCls: Record<string, string> = {
    primary: 'bg-[var(--larafusion-primary,#18181b)] hover:opacity-90 text-white shadow-sm',
    danger:  'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm',
    gray:    'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700',
};

// ── Main component ────────────────────────────────────────────────────────────

interface PageHeaderActionsProps {
    actions: PageHeaderAction[];
}

interface ConfirmState {
    title: string;
    message: string;
    isDanger: boolean;
    onConfirm: () => void;
}

export default function PageHeaderActions({ actions }: PageHeaderActionsProps) {
    const [confirm, setConfirm] = useState<ConfirmState | null>(null);

    if (!actions.length) return null;

    const handleAction = (action: PageHeaderAction) => {
        const execute = () => {
            if (!action.url || !action.method) return;
            router[action.method](action.url, {}, { preserveScroll: false });
        };

        if (action.confirm) {
            setConfirm({
                title: action.color === 'danger' ? 'Confirm Delete' : 'Confirm Action',
                message: action.confirm,
                isDanger: action.color === 'danger',
                onConfirm: execute,
            });
        } else {
            execute();
        }
    };

    return (
        <>
            <div className="flex items-center gap-2">
                {actions.map((action, i) => {
                    const cls = cn(
                        'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
                        colorCls[action.color] ?? colorCls.primary,
                    );
                    const Icon = action.icon ? resolveIcon(action.icon) : null;

                    if (action.type === 'create' && action.href) {
                        return (
                            <Link key={i} href={action.href} className={cls}>
                                {Icon && <Icon className="w-4 h-4" />}
                                {action.label}
                            </Link>
                        );
                    }

                    return (
                        <button key={i} type="button" onClick={() => handleAction(action)} className={cls}>
                            {Icon && <Icon className="w-4 h-4" />}
                            {action.label}
                        </button>
                    );
                })}
            </div>

            <ConfirmDialog
                open={!!confirm}
                title={confirm?.title ?? ''}
                message={confirm?.message ?? ''}
                variant={confirm?.isDanger ? 'danger' : 'default'}
                confirmLabel={confirm?.isDanger ? 'Delete' : 'Confirm'}
                onConfirm={confirm?.onConfirm ?? (() => {})}
                onCancel={() => setConfirm(null)}
            />
        </>
    );
}
