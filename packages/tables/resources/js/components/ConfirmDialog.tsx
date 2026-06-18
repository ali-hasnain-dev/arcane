import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

// ─── Animation hook for open/close transitions ────────────────────────────────
export function useModalAnimation(open: boolean, exitMs = 160) {
    const [rendered, setRendered] = useState(open);
    const [exiting, setExiting] = useState(false);
    useEffect(() => {
        if (open) {
            setRendered(true);
            setExiting(false);
        } else if (rendered) {
            setExiting(true);
            const t = window.setTimeout(() => { setRendered(false); setExiting(false); }, exitMs);
            return () => window.clearTimeout(t);
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
    return { rendered, exiting };
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────
export interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'default';
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    open, title, message, confirmLabel, variant = 'default', onConfirm, onCancel,
}: ConfirmDialogProps) {
    const { rendered, exiting } = useModalAnimation(open, 160);
    if (!rendered) return null;
    const isDanger = variant === 'danger';
    return (
        <div className={cn(
            'fixed inset-0 z-50 flex items-center justify-center p-4',
            exiting ? 'animate-arcane-overlay-out' : 'animate-arcane-overlay-in',
        )}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className={cn(
                'relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm p-6',
                exiting ? 'animate-arcane-modal-out' : 'animate-arcane-modal-in',
            )}>
                <div className={cn(
                    'w-11 h-11 rounded-full flex items-center justify-center mb-4 mx-auto',
                    isDanger ? 'bg-red-100 dark:bg-red-950/40' : 'bg-amber-100 dark:bg-amber-950/40',
                )}>
                    <AlertTriangle className={cn(
                        'w-5 h-5',
                        isDanger ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400',
                    )} />
                </div>
                <h3 className="text-center text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                    {title}
                </h3>
                <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                    {message}
                </p>
                <div className="flex items-center gap-2.5">
                    <button type="button" onClick={onCancel}
                        className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button type="button" onClick={() => { onConfirm(); onCancel(); }}
                        className={cn(
                            'w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors text-white',
                            isDanger
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-[var(--arcane-primary,#18181b)] hover:opacity-90',
                        )}>
                        {confirmLabel ?? (isDanger ? 'Delete' : 'Confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
}
