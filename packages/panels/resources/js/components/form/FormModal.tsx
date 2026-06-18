import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import DynamicForm from './DynamicForm';
import type { FormSchemaItem, FormValues, ArcaneField } from '../../types';

interface FormModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    resourceSlug: string;
    schema: FormSchemaItem[];
    record: Record<string, unknown> | null;
    recordId: string | number | null;
}

function useModalAnimation(open: boolean, exitMs = 160) {
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

function flattenFields(items: FormSchemaItem[]): ArcaneField[] {
    const out: ArcaneField[] = [];
    for (const item of items) {
        if (item.type === 'section') { flattenFields(item.fields).forEach(f => out.push(f)); }
        else if (item.type === 'tabs') { item.tabs.forEach(t => flattenFields(t.fields).forEach(f => out.push(f))); }
        else if (item.type === 'grid') { flattenFields(item.fields).forEach(f => out.push(f)); }
        else out.push(item as ArcaneField);
    }
    return out;
}

export default function FormModal({ open, onClose, title, resourceSlug, schema, record, recordId }: FormModalProps) {
    const { rendered, exiting } = useModalAnimation(open);
    if (!rendered) return null;

    const isEdit = recordId !== null;
    const submitUrl = isEdit
        ? `/admin/${resourceSlug}/${recordId}`
        : `/admin/${resourceSlug}`;
    const method = isEdit ? 'put' : 'post';

    const initialValues: FormValues = record ? { ...record } : {};
    if (record) {
        flattenFields(schema).forEach(f => {
            if (f.type === 'password') initialValues[f.name] = '';
        });
    }

    return (
        <div className={cn(
            'fixed inset-0 z-50 flex items-center justify-center p-4',
            exiting ? 'animate-arcane-overlay-out' : 'animate-arcane-overlay-in',
        )}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className={cn(
                'relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col',
                exiting ? 'animate-arcane-modal-out' : 'animate-arcane-modal-in',
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <DynamicForm
                        schema={schema}
                        initialValues={initialValues}
                        submitUrl={submitUrl}
                        method={method}
                        submitLabel={isEdit ? 'Update' : 'Create'}
                        resourceSlug={resourceSlug}
                        recordId={recordId}
                        onSuccess={onClose}
                    />
                </div>
            </div>
        </div>
    );
}
