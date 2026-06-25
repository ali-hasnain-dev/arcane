import React, { useState } from 'react';
import { useForm, Link } from '@inertiajs/react';
import AuthLayout from '../../../components/auth/AuthLayout';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface RegisterProps {
    revealablePasswords?: boolean;
    loginSlug?:           string;
}

export default function Register({ revealablePasswords = true, loginSlug = 'login' }: RegisterProps) {
    const form = useForm<{
        name: string; email: string;
        password: string; password_confirmation: string;
    }>({ name: '', email: '', password: '', password_confirmation: '' });

    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm,  setShowConfirm]  = useState(false);

    const adminPath = window.location.pathname.replace(/\/register$/, '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const errs: Record<string, string> = {};
        if (!form.data.name.trim()) {
            errs.name = 'The name field is required.';
        }
        if (!form.data.email.trim()) {
            errs.email = 'The email field is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.data.email)) {
            errs.email = 'The email must be a valid email address.';
        }
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
        form.post(`${adminPath}/register`, {
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

    const PasswordInput = ({
        field, value, show, onToggle, placeholder, autoComplete, autoFocus,
    }: {
        field: 'password' | 'password_confirmation';
        value: string; show: boolean; onToggle: () => void;
        placeholder?: string; autoComplete?: string; autoFocus?: boolean;
    }) => (
        <div className="relative">
            <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={e => { form.setData(field, e.target.value); clearClientError(field); }}
                placeholder={placeholder}
                autoComplete={autoComplete}
                autoFocus={autoFocus}
                className={inputClass(field) + (revealablePasswords ? ' pr-10' : '')}
            />
            {revealablePasswords && (
                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    aria-label={show ? 'Hide password' : 'Show password'}
                >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            )}
        </div>
    );

    return (
        <AuthLayout title="Create your account" subtitle="Join today — it's free">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Full name</label>
                    <input
                        type="text"
                        value={form.data.name}
                        onChange={e => { form.setData('name', e.target.value); clearClientError('name'); }}
                        placeholder="John Doe"
                        autoComplete="name"
                        autoFocus
                        className={inputClass('name')}
                    />
                    {allErrors.name && <p className="text-xs text-red-600 dark:text-red-400">{allErrors.name}</p>}
                </div>

                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email address</label>
                    <input
                        type="email"
                        value={form.data.email}
                        onChange={e => { form.setData('email', e.target.value); clearClientError('email'); }}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className={inputClass('email')}
                    />
                    {allErrors.email && <p className="text-xs text-red-600 dark:text-red-400">{allErrors.email}</p>}
                </div>

                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                    <PasswordInput
                        field="password"
                        value={form.data.password}
                        show={showPassword}
                        onToggle={() => setShowPassword(v => !v)}
                        placeholder="Min. 8 characters"
                        autoComplete="new-password"
                    />
                    {allErrors.password && <p className="text-xs text-red-600 dark:text-red-400">{allErrors.password}</p>}
                </div>

                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Confirm password</label>
                    <PasswordInput
                        field="password_confirmation"
                        value={form.data.password_confirmation}
                        show={showConfirm}
                        onToggle={() => setShowConfirm(v => !v)}
                        placeholder="Repeat your password"
                        autoComplete="new-password"
                    />
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
                    Create account
                </button>

                <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Already have an account?{' '}
                    <Link
                        href={`${adminPath}/${loginSlug}`}
                        className="font-medium text-[var(--larafusion-primary,#18181b)] dark:text-zinc-300 hover:underline"
                    >
                        Sign in
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
