import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { X } from 'lucide-react';

type RouterData = NonNullable<Parameters<typeof router.post>[1]>;
import { cn } from '../../lib/utils';
import DynamicForm from './DynamicForm';
import { FormSchemaItem } from '../../types';

function useModalAnimation(open: boolean, exitMs = 160) {
    const [rendered, setRendered] = useState(open);
    const [exiting,  setExiting]  = useState(false);
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

interface FormModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    resourceSlug: string;
    schema: FormSchemaItem[];
    record?: Record<string, unknown> | null; // null = create, object = edit
    recordId?: string | number | null;
}

export default function FormModal({
    open, onClose, title, resourceSlug, schema, record = null, recordId = null,
}: FormModalProps) {
    const { rendered, exiting } = useModalAnimation(open, 160);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Close on Escape
    useEffect(() => {
        if (!rendered) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [rendered, onClose]);

    // Prevent body scroll while open (including during close animation)
    useEffect(() => {
        document.body.style.overflow = rendered ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [rendered]);

    if (!rendered) return null;

    const isEdit = record !== null && recordId !== null;
    const url    = isEdit
        ? `/admin/${resourceSlug}/${recordId}`
        : `/admin/${resourceSlug}`;

    function handleSubmit(values: Record<string, unknown>) {
        const method = isEdit ? 'put' : 'post';
        router[method](url, values as unknown as RouterData, {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                router.reload({ only: ['records'] });
            },
        });
    }

    return (
        // Overlay is the scroll container — keeps the panel unclipped so dropdowns show freely
        <div
            ref={overlayRef}
            className={cn(
                'fixed inset-0 z-50 overflow-y-auto',
                exiting ? 'animate-larafusion-overlay-out' : 'animate-larafusion-overlay-in',
            )}
        >
            {/* Backdrop — click to close */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Centering wrapper */}
            <div className="flex min-h-full items-center justify-center p-4">
                {/* Panel — no overflow clipping so dropdown panels are never cut off */}
                <div className={cn(
                    'relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl',
                    exiting ? 'animate-larafusion-modal-out' : 'animate-larafusion-modal-in',
                )}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 rounded-t-2xl">
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Form body — no overflow restriction, dropdown panels extend freely */}
                    <div className="px-6 py-5">
                        <DynamicForm
                            schema={schema}
                            initialValues={record ?? {}}
                            onSubmit={handleSubmit}
                            submitLabel={isEdit ? 'Save Changes' : 'Create'}
                            onCancel={onClose}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
