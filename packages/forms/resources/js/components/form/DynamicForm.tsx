import React, { useState, useRef } from 'react';
import { router, Link } from '@inertiajs/react';
import { LarafusionField, FormValues } from '../../types';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import FormLayout, { SchemaItem, SectionSchema, TabsSchema, GridSchema } from './FormLayout';
import { runClientValidation } from '../../engine/validator';

interface DynamicFormProps {
    schema: SchemaItem[];
    initialValues?: FormValues;
    // URL-based submission (default, used by Create/Edit pages)
    submitUrl?: string;
    method?: 'post' | 'put' | 'patch';
    // Callback-based submission (used by FormModal)
    onSubmit?: (values: FormValues) => void;
    onCancel?: () => void;
    submitLabel?: string;
    cancelUrl?: string;
    // Accepted for API compatibility but not used (no history-state memory needed)
    rememberKey?: string;
    // Relation fields (BelongsTo, etc.) need these to build options URLs
    resourceSlug?: string;
    recordId?: string | number | null;
}

function collectFields(items: SchemaItem[]): LarafusionField[] {
    const out: LarafusionField[] = [];
    for (const item of items) {
        if ((item as SectionSchema).type === 'section') {
            collectFields((item as SectionSchema).fields).forEach(f => out.push(f));
        } else if ((item as TabsSchema).type === 'tabs') {
            (item as TabsSchema).tabs.forEach(tab =>
                collectFields(tab.fields).forEach(f => out.push(f))
            );
        } else if ((item as GridSchema).type === 'grid') {
            collectFields((item as GridSchema).fields).forEach(f => out.push(f));
        } else {
            out.push(item as LarafusionField);
        }
    }
    return out;
}

function buildInitialValues(schema: SchemaItem[], override: FormValues = {}): FormValues {
    const out: FormValues = {};
    collectFields(schema).forEach(field => {
        if (field.name in override) {
            out[field.name] = override[field.name];
        } else if (field.default !== null && field.default !== undefined) {
            out[field.name] = field.default;
        } else {
            out[field.name] = field.type === 'toggle' ? false : '';
        }
    });
    return out;
}

export default function DynamicForm({
    schema,
    initialValues = {},
    submitUrl,
    method = 'post',
    onSubmit,
    onCancel,
    submitLabel = 'Save',
    cancelUrl,
    resourceSlug = '',
    recordId = null,
}: DynamicFormProps) {
    // Freeze defaults on first render so isDirty comparison stays stable
    const defaults = useRef<FormValues>(buildInitialValues(schema, initialValues));

    const [values, setValues]           = useState<FormValues>(() => ({ ...defaults.current }));
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing]   = useState(false);

    const isDirty   = JSON.stringify(values) !== JSON.stringify(defaults.current);
    const hasErrors = Object.keys(serverErrors).length > 0 || Object.keys(clientErrors).length > 0;

    const setField = (name: string, value: unknown) => {
        setValues(prev => ({ ...prev, [name]: value }));
        // Clear stale errors for the edited field
        if (clientErrors[name]) setClientErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
        if (serverErrors[name]) setServerErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    };

    const scrollToFirstError = () => {
        setTimeout(() => {
            const el = document.querySelector('[data-field-error="true"]');
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Run client-side validation before touching the server
        const allFields = collectFields(schema);
        const errors: Record<string, string> = {};
        for (const field of allFields) {
            const rules: string[] = field.validation?.client?.length
                ? field.validation.client
                : (field.validation?.rules ?? []);
            if (rules.length === 0) continue;
            const error = runClientValidation(field, values[field.name], rules, values);
            if (error) errors[field.name] = error;
        }

        if (Object.keys(errors).length > 0) {
            setClientErrors(errors);
            scrollToFirstError();
            return;
        }

        setClientErrors({});

        if (onSubmit) {
            onSubmit(values);
            return;
        }

        setProcessing(true);
        router[method](submitUrl!, values as never, {
            preserveScroll: true,
            onError: (errs: Record<string, string>) => {
                setServerErrors(errs);
                setProcessing(false);
                scrollToFirstError();
            },
            onSuccess: () => setProcessing(false),
            onFinish: () => setProcessing(false),
        });
    };

    const handleReset = () => {
        setValues({ ...defaults.current });
        setClientErrors({});
        setServerErrors({});
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <FormLayout
                schema={schema}
                data={values}
                errors={{ ...serverErrors, ...clientErrors }}
                onChange={setField}
                resourceSlug={resourceSlug}
                recordId={recordId}
            />

            <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                    type="submit"
                    disabled={processing}
                    className={cn(
                        'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium',
                        'bg-[var(--larafusion-primary,#18181b)] hover:opacity-90 text-white transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)] focus:ring-offset-1',
                        'disabled:opacity-60 disabled:cursor-not-allowed',
                    )}
                >
                    {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitLabel}
                </button>

                {isDirty && !processing && (
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Reset
                    </button>
                )}

                {cancelUrl && (
                    <Link
                        href={cancelUrl}
                        className="px-5 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </Link>
                )}

                {onCancel && !cancelUrl && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-5 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </button>
                )}

                {hasErrors && (
                    <button
                        type="button"
                        onClick={() => { setClientErrors({}); setServerErrors({}); }}
                        className="ml-auto text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline"
                    >
                        Clear errors
                    </button>
                )}
            </div>
        </form>
    );
}
