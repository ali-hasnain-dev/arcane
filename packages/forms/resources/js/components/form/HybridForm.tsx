import React from 'react';
import { Link } from '@inertiajs/react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { LarafusionField } from '@larafusion/core';
import { ExtendedField } from '../../types';
import { useHybridForm } from '../../hooks/useHybridForm';
import HybridFieldRenderer from '../fields/HybridFieldRenderer';
import { cn } from '../../lib/utils';

interface HybridFormProps {
    schema: ExtendedField[];
    initialValues?: Record<string, unknown>;
    submitUrl: string;
    method?: 'post' | 'put' | 'patch';
    submitLabel?: string;
    cancelUrl?: string;
    layout?: 'auto' | 'single';
    // Phase 6: needed to build relation API URLs
    resourceSlug?: string;
    // Phase 6: needed for HasMany display on edit
    recordId?: string | number | null;
}

// Fields that always span full width
const FULL_WIDTH_TYPES = new Set(['textarea', 'repeater', 'tags', 'file', 'image', 'has_many', 'belongs_to_many']);

export default function HybridForm({
    schema,
    initialValues = {},
    submitUrl,
    method = 'post',
    submitLabel = 'Save',
    cancelUrl,
    layout = 'auto',
    resourceSlug = '',
    recordId = null,
}: HybridFormProps) {
    const form = useHybridForm({
        schema: schema as LarafusionField[],
        initialValues,
        precognitionUrl: submitUrl,
        precognitionMethod: method,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const valid = await form.validateAll();
        if (!valid) {
            document.querySelector('[data-field-invalid="true"]')
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        form.submit(submitUrl, method);
    };

    const gridClass = layout === 'single'
        ? 'grid grid-cols-1 gap-6'
        : 'grid grid-cols-1 md:grid-cols-2 gap-6';

    return (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

            {/* Global error banner */}
            {form.hasErrors && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <p className="font-semibold flex-1">Please fix the errors below before continuing.</p>
                    <button type="button" onClick={() => form.clearErrors()} className="text-red-400 hover:text-red-700 text-xs underline shrink-0">Dismiss</button>
                </div>
            )}

            {/* Fields grid */}
            <div className={gridClass}>
                {schema.map(field => {
                    const fieldState = form.validation[field.name];
                    const full = FULL_WIDTH_TYPES.has(field.type) && layout !== 'single';

                    // HasMany is always shown but not part of form data
                    const isReadOnly = field.type === 'has_many';

                    return (
                        <div
                            key={field.name}
                            data-field-invalid={fieldState?.status === 'invalid' || undefined}
                            className={full ? 'md:col-span-2' : ''}
                        >
                            <HybridFieldRenderer
                                field={field}
                                value={isReadOnly ? null : (form.data[field.name] ?? '')}
                                error={form.errors[field.name]}
                                status={fieldState?.status ?? 'idle'}
                                onChange={val => !isReadOnly && form.setField(field.name, val)}
                                onBlur={() => !isReadOnly && form.validateField(field.name)}
                                resourceSlug={resourceSlug}
                                recordId={recordId}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                    type="submit"
                    disabled={form.isSubmitting}
                    className={cn(
                        'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        'bg-[var(--larafusion-primary,#18181b)] hover:opacity-90 text-white',
                        'focus:outline-none focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)]/30 focus:ring-offset-1',
                        'disabled:opacity-60 disabled:cursor-not-allowed',
                    )}
                >
                    {form.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitLabel}
                </button>

                {form.isDirty && !form.isSubmitting && (
                    <button type="button" onClick={() => form.reset()} className="px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        Reset
                    </button>
                )}

                {cancelUrl && (
                    <Link href={cancelUrl} className="px-5 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        Cancel
                    </Link>
                )}

                {Object.values(form.validation).some(v => v.status === 'validating') && (
                    <span className="ml-auto flex items-center gap-1.5 text-xs text-zinc-400">
                        <Loader2 className="w-3 h-3 animate-spin" /> Validating…
                    </span>
                )}
            </div>
        </form>
    );
}
