import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AuthLayout from '../../../components/auth/AuthLayout';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface ResetPasswordProps {
    token:                string;
    email:                string;
    revealablePasswords?: boolean;
    loginSlug?:           string;
    resetPasswordSlug?:   string;
}

export default function ResetPassword({
    token,
    email,
    revealablePasswords = true,
    resetPasswordSlug   = 'reset-password',
}: ResetPasswordProps) {
    const form = useForm<{
        token: string; email: string;
        password: string; password_confirmation: string;
    }>({ token, email, password: '', password_confirmation: '' });

    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm,  setShowConfirm]  = useState(false);

    const adminPath = window.location.pathname.replace(new RegExp(`/${resetPasswordSlug}/[^/]+$`), '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const errs: Record<string, string> = {};
        if (!form.data.password) {
            errs.password = 'The password field is required.';
        } else if (form.data.password.length < 8) {
            errs.password = 'The password must be at least 8 characters.';
        }
        if (!form.data.password_confirmation) {
            errs.password_confirmation = 'Please confirm your password.';
        } else if (form.data.password_confirmation !== form.data.password) {
            errs.password_confirmation = 'The password confirmation does not match.';
        }

        if (Object.keys(errs).length > 0) {
            setClientErrors(errs);
            return;
        }

        setClientErrors({});
        form.post(`${adminPath}/${resetPasswordSlug}`, {
            onError: () => form.reset('password', 'password_confirmation'),
        });
    };

    const allErrors = { ...form.errors, ...clientErrors };

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
        <AuthLayout title="Set a new password">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Email (pre-filled, informational) */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email address</label>
                    <input
                        type="email"
                        value={form.data.email}
                        onChange={e => form.setData('email', e.target.value)}
                        autoComplete="email"
                        className={inputClass('email')}
                    />
                    {allErrors.email && <p className="text-xs text-red-600 dark:text-red-400">{allErrors.email}</p>}
                </div>

                {/* New password */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">New password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={form.data.password}
                            onChange={e => { form.setData('password', e.target.value); clearClientError('password'); }}
                            placeholder="Min. 8 characters"
                            autoComplete="new-password"
                            autoFocus
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
                    {allErrors.password && <p className="text-xs text-red-600 dark:text-red-400">{allErrors.password}</p>}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Confirm new password</label>
                    <div className="relative">
                        <input
                            type={showConfirm ? 'text' : 'password'}
                            value={form.data.password_confirmation}
                            onChange={e => { form.setData('password_confirmation', e.target.value); clearClientError('password_confirmation'); }}
                            placeholder="Repeat your password"
                            autoComplete="new-password"
                            className={inputClass('password_confirmation') + (revealablePasswords ? ' pr-10' : '')}
                        />
                        {revealablePasswords && (
                            <button
                                type="button"
                                onClick={() => setShowConfirm(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                            >
                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        )}
                    </div>
                    {allErrors.password_confirmation && (
                        <p className="text-xs text-red-600 dark:text-red-400">{allErrors.password_confirmation}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={form.processing}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--larafusion-primary,#18181b)] hover:opacity-90 text-white transition-opacity disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)]"
                >
                    {form.processing && <Loader2 className="w-4 h-4 animate-spin" />}
                    Reset password
                </button>
            </form>
        </AuthLayout>
    );
}
