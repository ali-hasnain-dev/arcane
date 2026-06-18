import React, { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../components/layout/AdminLayout';
import { ArcaneSharedProps } from '../../types';
import { CheckCircle, Eye, EyeOff, Loader2, User } from 'lucide-react';

interface ProfileProps {
    revealablePasswords?: boolean;
    status?:              string;
    password_status?:     string;
}

// ── Shared input style ────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
    return [
        'w-full px-3 py-2.5 text-sm rounded-lg border outline-none transition-colors',
        'text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
        hasError
            ? 'border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-800 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-900'
            : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--arcane-primary,#18181b)]/20 focus:border-[var(--arcane-primary,#18181b)]',
    ].join(' ');
}

function RevealableInput({
    value, onChange, hasError, placeholder, autoComplete, revealable,
}: {
    value: string; onChange: (v: string) => void;
    hasError: boolean; placeholder?: string; autoComplete?: string;
    revealable: boolean;
}) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className={inputCls(hasError) + (revealable ? ' pr-10' : '')}
            />
            {revealable && (
                <button type="button" onClick={() => setShow(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    aria-label={show ? 'Hide' : 'Show'}>
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            )}
        </div>
    );
}

// ── Profile section card ──────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{title}</h3>
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    );
}

function StatusAlert({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400 mb-4">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {message}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Profile({ revealablePasswords = true, status, password_status }: ProfileProps) {
    const { auth, arcane }  = usePage<ArcaneSharedProps>().props;
    const user              = auth?.user;
    const adminPath         = `/${arcane?.panel?.path ?? 'admin'}`;
    const initials          = user?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() ?? 'A';

    // ── Profile form ──────────────────────────────────────────────────────────
    const profileForm = useForm({ name: user?.name ?? '', email: user?.email ?? '' });

    const handleProfile = (e: React.FormEvent) => {
        e.preventDefault();
        profileForm.put(`${adminPath}/profile`);
    };

    // ── Password form ─────────────────────────────────────────────────────────
    const passwordForm = useForm({
        current_password: '', password: '', password_confirmation: '',
    });

    const handlePassword = (e: React.FormEvent) => {
        e.preventDefault();
        passwordForm.put(`${adminPath}/profile/password`, {
            onSuccess: () => passwordForm.reset(),
            onError:   () => passwordForm.reset('current_password', 'password', 'password_confirmation'),
        });
    };

    return (
        <AdminLayout pageTitle="Profile">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Avatar + name header */}
                <div className="flex items-center gap-4">
                    {user?.avatar ? (
                        <img src={user.avatar} alt={user.name}
                            className="w-14 h-14 rounded-full object-cover ring-2 ring-white dark:ring-zinc-900 shadow" />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-[var(--arcane-primary,#18181b)] flex items-center justify-center text-lg font-bold text-white shadow">
                            {initials}
                        </div>
                    )}
                    <div>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{user?.name}</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{user?.email}</p>
                    </div>
                </div>

                {/* Profile info */}
                <Card title="Profile Information">
                    {status && <StatusAlert message={status} />}
                    <form onSubmit={handleProfile} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Full name</label>
                            <input type="text" value={profileForm.data.name}
                                onChange={e => profileForm.setData('name', e.target.value)}
                                autoComplete="name" className={inputCls(!!profileForm.errors.name)} />
                            {profileForm.errors.name && (
                                <p className="text-xs text-red-600 dark:text-red-400">{profileForm.errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email address</label>
                            <input type="email" value={profileForm.data.email}
                                onChange={e => profileForm.setData('email', e.target.value)}
                                autoComplete="email" className={inputCls(!!profileForm.errors.email)} />
                            {profileForm.errors.email && (
                                <p className="text-xs text-red-600 dark:text-red-400">{profileForm.errors.email}</p>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <button type="submit" disabled={profileForm.processing}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--arcane-primary,#18181b)] hover:opacity-90 text-white transition-opacity disabled:opacity-60 disabled:cursor-not-allowed">
                                {profileForm.processing && <Loader2 className="w-4 h-4 animate-spin" />}
                                Save changes
                            </button>
                        </div>
                    </form>
                </Card>

                {/* Change password */}
                <Card title="Update Password">
                    {password_status && <StatusAlert message={password_status} />}
                    <form onSubmit={handlePassword} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Current password</label>
                            <RevealableInput
                                value={passwordForm.data.current_password}
                                onChange={v => passwordForm.setData('current_password', v)}
                                hasError={!!passwordForm.errors.current_password}
                                autoComplete="current-password"
                                revealable={revealablePasswords}
                            />
                            {passwordForm.errors.current_password && (
                                <p className="text-xs text-red-600 dark:text-red-400">{passwordForm.errors.current_password}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">New password</label>
                            <RevealableInput
                                value={passwordForm.data.password}
                                onChange={v => passwordForm.setData('password', v)}
                                hasError={!!passwordForm.errors.password}
                                placeholder="Min. 8 characters"
                                autoComplete="new-password"
                                revealable={revealablePasswords}
                            />
                            {passwordForm.errors.password && (
                                <p className="text-xs text-red-600 dark:text-red-400">{passwordForm.errors.password}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Confirm new password</label>
                            <RevealableInput
                                value={passwordForm.data.password_confirmation}
                                onChange={v => passwordForm.setData('password_confirmation', v)}
                                hasError={!!passwordForm.errors.password_confirmation}
                                placeholder="Repeat your password"
                                autoComplete="new-password"
                                revealable={revealablePasswords}
                            />
                            {passwordForm.errors.password_confirmation && (
                                <p className="text-xs text-red-600 dark:text-red-400">{passwordForm.errors.password_confirmation}</p>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <button type="submit" disabled={passwordForm.processing}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--arcane-primary,#18181b)] hover:opacity-90 text-white transition-opacity disabled:opacity-60 disabled:cursor-not-allowed">
                                {passwordForm.processing && <Loader2 className="w-4 h-4 animate-spin" />}
                                Update password
                            </button>
                        </div>
                    </form>
                </Card>
            </div>
        </AdminLayout>
    );
}
