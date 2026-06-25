import React, { useState } from 'react';
import { useForm, Link } from '@inertiajs/react';
import AuthLayout from '../../../components/auth/AuthLayout';
import { Loader2, ShieldCheck, ShieldOff } from 'lucide-react';

interface Props {
    enabled:  boolean;
    setupUrl: string;
}

export default function TwoFactorManage({ enabled, setupUrl }: Props) {
    const adminPath  = window.location.pathname.replace(/\/two-factor\/manage$/, '');
    const disableForm = useForm<{ password: string }>({ password: '' });
    const regenForm   = useForm<{ password: string }>({ password: '' });
    const [showDisable, setShowDisable]  = useState(false);
    const [showRegen,   setShowRegen]    = useState(false);

    const handleDisable = (e: React.FormEvent) => {
        e.preventDefault();
        disableForm.delete(`${adminPath}/two-factor`, { onSuccess: () => setShowDisable(false) });
    };

    const handleRegen = (e: React.FormEvent) => {
        e.preventDefault();
        regenForm.post(`${adminPath}/two-factor/recovery-codes`, { onSuccess: () => setShowRegen(false) });
    };

    return (
        <AuthLayout title="Two-factor authentication">
            <div className="space-y-6">
                <div className={[
                    'flex items-center gap-3 rounded-xl border p-4',
                    enabled
                        ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30'
                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800',
                ].join(' ')}>
                    {enabled
                        ? <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                        : <ShieldOff className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />}
                    <div>
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            {enabled ? 'Two-factor authentication is enabled' : 'Two-factor authentication is not enabled'}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {enabled
                                ? 'Your account is protected with TOTP two-factor authentication.'
                                : 'Add an extra layer of security to your account.'}
                        </p>
                    </div>
                </div>

                {!enabled && (
                    <Link href={setupUrl} className="block w-full text-center px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--larafusion-primary,#18181b)] hover:opacity-90 text-white transition-opacity">
                        Enable two-factor authentication
                    </Link>
                )}

                {enabled && (
                    <div className="space-y-3">
                        {/* Regenerate recovery codes */}
                        <button
                            type="button"
                            onClick={() => { setShowRegen(v => !v); setShowDisable(false); }}
                            className="w-full text-left px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Regenerate recovery codes
                        </button>

                        {showRegen && (
                            <form onSubmit={handleRegen} className="space-y-3 pl-4 border-l-2 border-zinc-200 dark:border-zinc-700">
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Confirm your password to regenerate recovery codes. Your old codes will be invalidated.
                                </p>
                                <input
                                    type="password"
                                    value={regenForm.data.password}
                                    onChange={e => regenForm.setData('password', e.target.value)}
                                    placeholder="Current password"
                                    autoComplete="current-password"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)]/20"
                                />
                                {regenForm.errors.password && <p className="text-xs text-red-600">{regenForm.errors.password}</p>}
                                <button type="submit" disabled={regenForm.processing} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--larafusion-primary,#18181b)] hover:opacity-90 text-white disabled:opacity-60">
                                    {regenForm.processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    Regenerate
                                </button>
                            </form>
                        )}

                        {/* Disable 2FA */}
                        <button
                            type="button"
                            onClick={() => { setShowDisable(v => !v); setShowRegen(false); }}
                            className="w-full text-left px-4 py-3 rounded-lg border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                            Disable two-factor authentication
                        </button>

                        {showDisable && (
                            <form onSubmit={handleDisable} className="space-y-3 pl-4 border-l-2 border-red-200 dark:border-red-800">
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Confirm your password to disable two-factor authentication.
                                </p>
                                <input
                                    type="password"
                                    value={disableForm.data.password}
                                    onChange={e => disableForm.setData('password', e.target.value)}
                                    placeholder="Current password"
                                    autoComplete="current-password"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-700"
                                />
                                {disableForm.errors.password && <p className="text-xs text-red-600">{disableForm.errors.password}</p>}
                                <button type="submit" disabled={disableForm.processing} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-60">
                                    {disableForm.processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    Disable
                                </button>
                            </form>
                        )}
                    </div>
                )}

                <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                    <Link href={adminPath} className="text-[var(--larafusion-primary,#18181b)] dark:text-zinc-300 hover:underline">
                        Back to dashboard
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
