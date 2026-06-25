import React, { useState, useRef } from 'react';
import { router, Link } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { HybridFieldRenderer, runClientValidation } from '@larafusion/forms';
import { cn } from '../../lib/utils';
import type { FormSchemaItem, LarafusionField, FormValues, FormErrors, SectionSchemaType, TabsSchemaType, GridSchemaType } from '../../types';

interface DynamicFormProps {
    schema: FormSchemaItem[];
    initialValues?: FormValues;
    submitUrl?: string;
    method?: 'post' | 'put' | 'patch';
    submitLabel?: string;
    cancelUrl?: string;
    resourceSlug?: string;
    recordId?: string | number | null;
    rememberKey?: string;
    onSubmit?: (values: FormValues) => void;
    onCancel?: () => void;
    onSuccess?: () => void;
}

function flattenFields(items: FormSchemaItem[]): LarafusionField[] {
    const out: LarafusionField[] = [];
    for (const item of items) {
        if ((item as SectionSchemaType).type === 'section') {
            flattenFields((item as SectionSchemaType).fields).forEach(f => out.push(f));
        } else if ((item as TabsSchemaType).type === 'tabs') {
            (item as TabsSchemaType).tabs.forEach(t => flattenFields(t.fields).forEach(f => out.push(f)));
        } else if ((item as GridSchemaType).type === 'grid') {
            flattenFields((item as GridSchemaType).fields).forEach(f => out.push(f));
        } else {
            out.push(item as LarafusionField);
        }
    }
    return out;
}

function buildDefaults(schema: FormSchemaItem[], initialValues: FormValues): FormValues {
    const values: FormValues = {};
    flattenFields(schema).forEach(f => {
        if (f.name in initialValues) {
            values[f.name] = initialValues[f.name];
        } else if (f.default !== null && f.default !== undefined) {
            values[f.name] = f.default;
        } else {
            values[f.name] = f.type === 'toggle' ? false : '';
        }
    });
    return values;
}

export default function DynamicForm({
    schema,
    initialValues = {},
    submitUrl,
    method = 'post',
    submitLabel = 'Save',
    cancelUrl,
    resourceSlug = '',
    recordId = null,
    onSubmit,
    onCancel,
    onSuccess,
}: DynamicFormProps) {
    const defaults = useRef<FormValues>(buildDefaults(schema, initialValues));

    const [values, setValues]             = useState<FormValues>(() => ({ ...defaults.current }));
    const [serverErrors, setServerErrors] = useState<FormErrors>({});
    const [clientErrors, setClientErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting]     = useState(false);

    const isDirty   = JSON.stringify(values) !== JSON.stringify(defaults.current);
    const hasErrors = Object.keys(serverErrors).length > 0 || Object.keys(clientErrors).length > 0;

    const setField = (name: string, value: unknown) => {
        setValues(prev => ({ ...prev, [name]: value }));
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

        const allFields = flattenFields(schema);
        const errors: FormErrors = {};
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

        setSubmitting(true);
        type RouterPayload = NonNullable<Parameters<typeof router.post>[1]>;
        router[method](submitUrl!, values as unknown as RouterPayload, {
            preserveScroll: true,
            onError: (errs: FormErrors) => {
                setServerErrors(errs);
                setSubmitting(false);
                scrollToFirstError();
            },
            onSuccess: () => {
                setSubmitting(false);
                onSuccess?.();
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const fields = flattenFields(schema);
    const errors = { ...serverErrors, ...clientErrors };

    return (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {fields.map(field => (
                <div
                    key={field.name}
                    data-field-error={!!errors[field.name] || undefined}
                >
                    <HybridFieldRenderer
                        field={field}
                        value={values[field.name] ?? ''}
                        error={errors[field.name]}
                        onChange={v => setField(field.name, v)}
                        resourceSlug={resourceSlug}
                        recordId={recordId}
                    />
                </div>
            ))}

            <div className={cn('flex items-center gap-3 pt-2', cancelUrl || onCancel ? 'justify-between' : 'justify-end')}>
                {cancelUrl && (
                    <Link
                        href={cancelUrl}
                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </Link>
                )}
                {onCancel && !cancelUrl && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                )}

                <div className="flex items-center gap-3">
                    {isDirty && !submitting && (
                        <button
                            type="button"
                            onClick={() => { setValues({ ...defaults.current }); setClientErrors({}); setServerErrors({}); }}
                            className="px-4 py-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                        >
                            Reset
                        </button>
                    )}
                    {hasErrors && (
                        <button
                            type="button"
                            onClick={() => { setClientErrors({}); setServerErrors({}); }}
                            className="text-xs text-red-500 dark:text-red-400 hover:underline"
                        >
                            Clear errors
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg text-white bg-[var(--larafusion-primary,#18181b)] hover:opacity-90 disabled:opacity-60 transition-colors"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {submitLabel}
                    </button>
                </div>
            </div>
        </form>
    );
}
