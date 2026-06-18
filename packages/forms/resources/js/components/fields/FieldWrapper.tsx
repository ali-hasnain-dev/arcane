import React from 'react';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { ValidationStatus } from '../../types';
import { cn } from '../../lib/utils';

interface FieldWrapperProps {
    label: string;
    required?: boolean;
    hint?: string | null;
    error?: string;
    status?: ValidationStatus;
    children: React.ReactNode;
}

// Status indicator — shown at right of label
function StatusIcon({ status }: { status: ValidationStatus }) {
    switch (status) {
        case 'validating':
            return <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />;
        case 'valid':
            return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
        case 'invalid':
            return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
        default:
            return null;
    }
}

export default function FieldWrapper({
    label, required, hint, error, status = 'idle', children,
}: FieldWrapperProps) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                {/* Hybrid validation: live status shown next to label */}
                <StatusIcon status={status} />
            </div>

            {children}

            {/* Always rendered to prevent layout shift when error/hint appears */}
            <div className="min-h-[1rem]">
                {error ? (
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {error}
                    </p>
                ) : hint ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
                ) : null}
            </div>
        </div>
    );
}

// Shared input classes based on validation state
export function inputClasses(status: ValidationStatus, extra = '') {
    return cn(
        'w-full px-3 py-2 text-sm rounded-lg border outline-none transition-colors',
        'text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-zinc-50 dark:disabled:bg-zinc-800',
        status === 'invalid'
            ? 'border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-800 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900 focus:border-red-400'
            : status === 'valid'
            ? 'border-green-400 bg-white dark:bg-zinc-800 dark:border-green-700 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-900 focus:border-green-400'
            : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--arcane-primary,#18181b)]/20 focus:border-[var(--arcane-primary,#18181b)]',
        extra,
    );
}
