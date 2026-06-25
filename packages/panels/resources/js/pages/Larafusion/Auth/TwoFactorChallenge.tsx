import React, { useRef } from 'react';
import { useForm, Link } from '@inertiajs/react';
import AuthLayout from '../../../components/auth/AuthLayout';
import { Loader2, ShieldCheck } from 'lucide-react';

interface Props {
    loginSlug?: string;
    errors?:    Record<string, string>;
}

export default function TwoFactorChallenge({ loginSlug = 'login', errors = {} }: Props) {
    const form      = useForm<{ code: string }>({ code: '' });
    const inputRef  = useRef<HTMLInputElement>(null);
    const adminPath = window.location.pathname.replace(/\/two-factor\/challenge$/, '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`${adminPath}/two-factor/challenge`, {
            onError: () => { form.reset('code'); inputRef.current?.focus(); },
        });
    };

    const hasError = !!(form.errors.code || errors.code);

    return (
        <AuthLayout title="Two-factor authentication">
            <div className="mb-5 flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--larafusion-primary,#18181b)]/10 dark:bg-[var(--larafusion-primary,#18181b)]/20">
                    <ShieldCheck className="h-6 w-6 text-[var(--larafusion-primary,#18181b)] dark:text-zinc-300" />
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Enter the 6-digit code from your authenticator app, or paste a recovery code.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Authentication code
                    </label>
                    <input
                        ref={inputRef}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        autoFocus
                        maxLength={8}
                        value={form.data.code}
                        onChange={e => form.setData('code', e.target.value.replace(/\s/g, ''))}
                        placeholder="000000"
                        className={[
                            'w-full px-3 py-2.5 text-sm rounded-lg border outline-none transition-colors text-center tracking-[0.3em] font-mono',
                            'text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
                            hasError
                                ? 'border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-800 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-900'
                                : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)]/20 focus:border-[var(--larafusion-primary,#18181b)]',
                        ].join(' ')}
                    />
                    {hasError && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                            {form.errors.code ?? errors.code}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={form.processing || form.data.code.length < 6}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--larafusion-primary,#18181b)] hover:opacity-90 text-white transition-opacity disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)]"
                >
                    {form.processing && <Loader2 className="w-4 h-4 animate-spin" />}
                    Verify
                </button>

                <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                    <Link
                        href={`${adminPath}/${loginSlug}`}
                        className="text-[var(--larafusion-primary,#18181b)] dark:text-zinc-300 hover:underline"
                    >
                        Back to login
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
