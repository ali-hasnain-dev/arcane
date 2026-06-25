import React, { useState } from 'react';
import { useForm, Link } from '@inertiajs/react';
import AuthLayout from '../../../components/auth/AuthLayout';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
    hasRegistration?:     boolean;
    hasForgotPassword?:   boolean;
    revealablePasswords?: boolean;
    loginSlug?:           string;
    registrationSlug?:    string;
    forgotPasswordSlug?:  string;
    errors?:              Record<string, string>;
}

export default function Login({
    hasRegistration    = false,
    hasForgotPassword  = false,
    revealablePasswords = true,
    loginSlug          = 'login',
    registrationSlug   = 'register',
    forgotPasswordSlug = 'forgot-password',
    errors             = {},
}: LoginProps) {
    const form = useForm<{ email: string; password: string; remember: boolean }>({
        email: '', password: '', remember: false,
    });

    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);

    const adminPath = window.location.pathname.replace(new RegExp(`/${loginSlug}$`), '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const errs: Record<string, string> = {};
        if (!form.data.email.trim()) {
            errs.email = 'The email field is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.data.email)) {
            errs.email = 'The email must be a valid email address.';
        }
        if (!form.data.password) {
            errs.password = 'The password field is required.';
        }

        if (Object.keys(errs).length > 0) {
            setClientErrors(errs);
            return;
        }

        setClientErrors({});
        form.post(`${adminPath}/${loginSlug}`, {
            onError: () => form.reset('password'),
        });
    };

    const allErrors = { ...errors, ...form.errors, ...clientErrors };

    const inputClass = (field: string) => [
        'w-full px-3 py-2.5 text-sm rounded-lg border outline-none transition-colors',
        'text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
        allErrors[field]
            ? 'border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-800 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-900'
            : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)]/20 focus:border-[var(--larafusion-primary,#18181b)]',
    ].join(' ');

    const clearClientError = (field: string) => {
        if (clientErrors[field]) setClientErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    return (
        <AuthLayout title="Sign in to your account">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Email */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
                    <input
                        type="email"
                        value={form.data.email}
                        onChange={e => { form.setData('email', e.target.value); clearClientError('email'); }}
                        placeholder="you@example.com"
                        autoComplete="email"
                        autoFocus
                        className={inputClass('email')}
                    />
                    {allErrors.email && (
                        <p className="text-xs text-red-600 dark:text-red-400">{allErrors.email}</p>
                    )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                        {hasForgotPassword && (
                            <Link
                                href={`${adminPath}/${forgotPasswordSlug}`}
                                className="text-xs text-[var(--larafusion-primary,#18181b)] dark:text-zinc-300 hover:underline"
                            >
                                Forgot password?
                            </Link>
                        )}
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={form.data.password}
                            onChange={e => { form.setData('password', e.target.value); clearClientError('password'); }}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className={inputClass('password') + (revealablePasswords ? ' pr-10' : '')}
                        />
                        {revealablePasswords && (
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        )}
                    </div>
                    {allErrors.password && (
                        <p className="text-xs text-red-600 dark:text-red-400">{allErrors.password}</p>
                    )}
                </div>

                {/* Remember me */}
                <div className="flex items-center">
                    <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.data.remember}
                            onChange={e => form.setData('remember', e.target.checked)}
                            className="rounded border-zinc-300 dark:border-zinc-600 accent-[var(--larafusion-primary,#18181b)] focus:ring-[var(--larafusion-primary,#18181b)]/20"
                        />
                        Remember me
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={form.processing}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--larafusion-primary,#18181b)] hover:opacity-90 text-white transition-opacity disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)]"
                >
                    {form.processing && <Loader2 className="w-4 h-4 animate-spin" />}
                    Sign in
                </button>

                {hasRegistration && (
                    <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                        Don't have an account?{' '}
                        <Link
                            href={`${adminPath}/${registrationSlug}`}
                            className="font-medium text-[var(--larafusion-primary,#18181b)] dark:text-zinc-300 hover:underline"
                        >
                            Create account
                        </Link>
                    </p>
                )}
            </form>
        </AuthLayout>
    );
}
