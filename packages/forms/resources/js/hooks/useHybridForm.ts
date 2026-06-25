import { useState, useCallback, useRef } from 'react';
import { router } from '@inertiajs/react';
import { LarafusionField, FormValues, FormErrors } from '@larafusion/core';
import { classifyRules, runClientValidation } from '../engine/validator';
import {
    HybridFormHandle,
    FormValidationState,
    FieldValidationState,
    ValidationStatus,
} from '../types';

interface UseHybridFormOptions {
    schema: LarafusionField[];
    initialValues?: FormValues;
    // Precognition endpoint — usually the submit URL
    precognitionUrl: string;
    precognitionMethod?: 'post' | 'put' | 'patch';
}

function buildInitialValues(schema: LarafusionField[], override: FormValues = {}): FormValues {
    const out: FormValues = {};
    schema.forEach(field => {
        out[field.name] = field.name in override
            ? override[field.name]
            : (field.default ?? (field.type === 'toggle' ? false : ''));
    });
    return out;
}

function buildInitialValidation(schema: LarafusionField[]): FormValidationState {
    const state: FormValidationState = {};
    schema.forEach(f => {
        state[f.name] = { status: 'idle', error: undefined, touched: false };
    });
    return state;
}

// Debounce helper
function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
    let timer: ReturnType<typeof setTimeout>;
    return ((...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    }) as T;
}

export function useHybridForm({
    schema,
    initialValues = {},
    precognitionUrl,
    precognitionMethod = 'post',
}: UseHybridFormOptions): HybridFormHandle {
    const defaults = buildInitialValues(schema, initialValues);

    const [data, setData]             = useState<FormValues>(defaults);
    const [errors, setErrors]         = useState<FormErrors>({});
    const [validation, setValidation] = useState<FormValidationState>(buildInitialValidation(schema));
    const [isSubmitting, setSubmitting] = useState(false);

    // Track in-flight Precognition requests per field to cancel stale ones
    const abortControllers = useRef<Record<string, AbortController>>({});

    const updateFieldState = useCallback((name: string, patch: Partial<FieldValidationState>) => {
        setValidation(v => ({ ...v, [name]: { ...v[name], ...patch } }));
    }, []);

    // ── Precognition request (server-side, for unique/exists etc.) ────────────
    const precognitionValidate = useCallback(async (
        name: string,
        value: unknown,
        currentData: FormValues
    ): Promise<string | undefined> => {
        // Cancel any in-flight request for this field
        abortControllers.current[name]?.abort();
        const ctrl = new AbortController();
        abortControllers.current[name] = ctrl;

        try {
            const res = await fetch(precognitionUrl, {
                method: precognitionMethod.toUpperCase(),
                headers: {
                    'Content-Type':    'application/json',
                    'Accept':          'application/json',
                    // Inertia v3 Precognition headers
                    'Precognition':    'true',
                    'Precognition-Validate-Only': name,
                    'X-Inertia':       'true',
                    'X-XSRF-TOKEN':    getCsrfToken(),
                },
                body:   JSON.stringify({ ...currentData, [name]: value }),
                signal: ctrl.signal,
            });

            if (res.status === 204) return undefined; // valid
            if (res.status === 422) {
                const body = await res.json();
                const fieldErrors = body.errors?.[name];
                return Array.isArray(fieldErrors) ? fieldErrors[0] : undefined;
            }
        } catch (e: unknown) {
            if ((e as Error)?.name === 'AbortError') return undefined; // stale, ignore
        }
        return undefined;
    }, [precognitionUrl, precognitionMethod]);

    // ── Validate a single field ───────────────────────────────────────────────
    const validateField = useCallback(async (name: string) => {
        const field = schema.find(f => f.name === name);
        if (!field) return;

        updateFieldState(name, { touched: true, status: 'validating' });

        const value = data[name];
        const { client: clientRules, server: serverRules, hasServerRules } = classifyRules(field.validation.rules);

        // Step 1: instant client-side validation
        const clientError = runClientValidation(field, value, clientRules);
        if (clientError) {
            updateFieldState(name, { status: 'invalid', error: clientError });
            setErrors(e => ({ ...e, [name]: clientError }));
            return;
        }

        // Step 2: server-side only if client passed AND field has server rules
        if (hasServerRules) {
            const serverError = await precognitionValidate(name, value, data);
            if (serverError) {
                updateFieldState(name, { status: 'invalid', error: serverError });
                setErrors(e => ({ ...e, [name]: serverError }));
                return;
            }
        }

        // All clear
        updateFieldState(name, { status: 'valid', error: undefined });
        setErrors(e => { const next = { ...e }; delete next[name]; return next; });
    }, [schema, data, updateFieldState, precognitionValidate]);

    // Debounced version for onChange (300ms)
    const debouncedValidate = useCallback(
        debounce((name: string) => validateField(name), 300),
        [validateField]
    );

    // ── Set a field value ─────────────────────────────────────────────────────
    const setField = useCallback((name: string, value: unknown) => {
        setData(d => ({ ...d, [name]: value }));

        // Only validate if field has been touched
        setValidation(v => {
            if (v[name]?.touched) {
                debouncedValidate(name);
            }
            return v;
        });
    }, [debouncedValidate]);

    // ── Validate all fields before submit ─────────────────────────────────────
    const validateAll = useCallback(async (): Promise<boolean> => {
        await Promise.all(schema.map(f => validateField(f.name)));

        // Re-check using the same rule classifier as validateField so that the
        // pre-classified field.validation.client array being empty (edge case)
        // never incorrectly reports a required field as valid.
        return schema.every(f => {
            const { client } = classifyRules(f.validation.rules);
            return !runClientValidation(f, data[f.name], client);
        });
    }, [schema, validateField, data]);

    // ── Submit ────────────────────────────────────────────────────────────────
    const submit = useCallback((url: string, method: 'post' | 'put' | 'patch') => {
        setSubmitting(true);

        router[method](url, data as never, {
            preserveScroll: true,
            onError: (serverErrors: FormErrors) => {
                setErrors(serverErrors);
                // Mark all errored fields as invalid + touched
                setValidation(v => {
                    const next = { ...v };
                    Object.keys(serverErrors).forEach(name => {
                        next[name] = { status: 'invalid', error: serverErrors[name], touched: true };
                    });
                    return next;
                });
                setSubmitting(false);
            },
            onSuccess: () => setSubmitting(false),
        });
    }, [data]);

    const reset = useCallback(() => {
        setData(defaults);
        setErrors({});
        setValidation(buildInitialValidation(schema));
        setSubmitting(false);
    }, [defaults, schema]);

    const clearErrors = useCallback(() => {
        setErrors({});
        setValidation(v => {
            const next = { ...v };
            Object.keys(next).forEach(k => {
                next[k] = { ...next[k], status: 'idle', error: undefined };
            });
            return next;
        });
    }, []);

    const isDirty    = JSON.stringify(data) !== JSON.stringify(defaults);
    const hasErrors  = Object.keys(errors).length > 0;

    return {
        data, errors, validation,
        isDirty, isSubmitting, hasErrors,
        setField, validateField, validateAll,
        submit, reset, clearErrors,
    };
}

// ─── CSRF helper ──────────────────────────────────────────────────────────────
function getCsrfToken(): string {
    return (document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1] ?? '');
}
