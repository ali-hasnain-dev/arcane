import React, { useState } from 'react';
import { useForm, Link } from '@inertiajs/react';
import AuthLayout from '../../../components/auth/AuthLayout';
import { Loader2, CheckCircle } from 'lucide-react';

interface ForgotPasswordProps {
    status?: string;
}

export default function ForgotPassword({ status }: ForgotPasswordProps) {
    const form = useForm<{ email: string }>({ email: '' });
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    const adminPath = window.location.pathname.replace(/\/forgot-password$/, '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const errs: Record<string, string> = {};
        if (!form.data.email.trim()) {
            errs.email = 'The email field is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.data.email)) {
            errs.email = 'The email must be a valid email address.';
        }

        if (Object.keys(errs).length > 0) {
            setClientErrors(errs);
            return;
        }

        setClientErrors({});
        form.post(`${adminPath}/forgot-password`);
    };

    const allErrors = { ...form.errors, ...clientErrors };

    const emailHasError = !!allErrors.email;

    return (
        <AuthLayout title="Reset your password" subtitle="We'll send a reset link to your email">
            {status && (
                <div className="mb-5 flex items-start gap-3 p-3.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-green-700 dark:text-green-400">{status}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email address</label>
                    <input
                        type="email"
                        value={form.data.email}
                        onChange={e => {
                            form.setData('email', e.target.value);
                            if (clientErrors.email) setClientErrors(prev => { const n = { ...prev }; delete n.email; return n; });
                        }}
                        placeholder="you@example.com"
                        autoComplete="email"
                        autoFocus
                        className={[
                            'w-full px-3 py-2.5 text-sm rounded-lg border outline-none transition-colors',
                            'text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
                            emailHasError
                                ? 'border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-800 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-900'
                                : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--arcane-primary,#18181b)]/20 focus:border-[var(--arcane-primary,#18181b)]',
                        ].join(' ')}
                    />
                    {allErrors.email && <p className="text-xs text-red-600 dark:text-red-400">{allErrors.email}</p>}
                </div>

                <button
                    type="submit"
                    disabled={form.processing}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--arcane-primary,#18181b)] hover:opacity-90 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--arcane-primary,#18181b)]/20"
                >
                    {form.processing && <Loader2 className="w-4 h-4 animate-spin" />}
                    Send reset link
                </button>

                <p className="text-center text-sm">
                    <Link
                        href={`${adminPath}/login`}
                        className="font-medium text-[var(--arcane-primary,#18181b)] dark:text-zinc-300 hover:underline"
                    >
                        ← Back to sign in
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
