import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import AuthLayout from '../../../components/auth/AuthLayout';
import { Copy, Check, ShieldAlert } from 'lucide-react';

interface Props {
    codes: string[];
}

export default function TwoFactorRecoveryCodes({ codes }: Props) {
    const adminPath  = window.location.pathname.replace(/\/two-factor\/.*$/, '');
    const [copied, setCopied]   = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(codes.join('\n')).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <AuthLayout title="Recovery codes">
            <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
                    <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                        Store these recovery codes in a safe place. Each code can only be used once
                        to regain access if you lose your authenticator device.
                    </p>
                </div>

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-4">
                    <div className="grid grid-cols-2 gap-2">
                        {codes.map((code, i) => (
                            <code key={i} className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                                {code}
                            </code>
                        ))}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleCopy}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy all codes'}
                </button>

                <Link
                    href={adminPath}
                    className="block w-full text-center px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--arcane-primary,#18181b)] hover:opacity-90 text-white transition-opacity"
                >
                    Done — go to dashboard
                </Link>
            </div>
        </AuthLayout>
    );
}
