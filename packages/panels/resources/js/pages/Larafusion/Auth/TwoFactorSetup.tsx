import React, { useState } from 'react';
import { useForm, Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import AuthLayout from '../../../components/auth/AuthLayout';
import { Loader2, QrCode, Copy, Check } from 'lucide-react';

interface Props {
    qrUri:       string;
    secret:      string;
    manageRoute: string;
}

export default function TwoFactorSetup({ qrUri, secret, manageRoute }: Props) {
    const form         = useForm<{ code: string }>({ code: '' });
    const adminPath    = window.location.pathname.replace(/\/two-factor\/setup$/, '');
    const [copied, setCopied] = useState(false);

    // Build a QR code URL using the free API (no tracking — just generates SVG from uri)
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUri)}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(secret).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`${adminPath}/two-factor/setup`);
    };

    const hasError = !!form.errors.code;

    return (
        <AuthLayout title="Set up two-factor authentication">
            <div className="space-y-6">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Scan the QR code below with your authenticator app (Google Authenticator,
                    Authy, 1Password, etc.), then enter the 6-digit code to confirm setup.
                </p>

                {/* QR Code */}
                <div className="flex justify-center">
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white p-3">
                        <img src={qrImageUrl} alt="2FA QR code" className="h-48 w-48" />
                    </div>
                </div>

                {/* Manual secret */}
                <div className="space-y-1.5">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                        Or enter this secret manually
                    </p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs font-mono text-zinc-700 dark:text-zinc-300 break-all">
                            {secret}
                        </code>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="flex-shrink-0 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                            aria-label="Copy secret"
                        >
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* Confirm code */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Confirmation code
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            autoFocus
                            maxLength={6}
                            value={form.data.code}
                            onChange={e => form.setData('code', e.target.value.replace(/\D/g, ''))}
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
                            <p className="text-xs text-red-600 dark:text-red-400">{form.errors.code}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={form.processing || form.data.code.length < 6}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--larafusion-primary,#18181b)] hover:opacity-90 text-white transition-opacity disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)]"
                    >
                        {form.processing && <Loader2 className="w-4 h-4 animate-spin" />}
                        Activate two-factor authentication
                    </button>
                </form>

                <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                    <Link href={manageRoute} className="text-[var(--larafusion-primary,#18181b)] dark:text-zinc-300 hover:underline">
                        Skip for now
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
