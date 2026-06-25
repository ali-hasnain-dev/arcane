import React, { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { LarafusionSharedProps } from '../../types';
import { injectGoogleFont } from '../layout/AdminLayout';

export default function AuthLayout({ children, title, subtitle }: {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}) {
    const page      = usePage<LarafusionSharedProps>();
    const theme     = page.props?.larafusion?.theme;
    const panel     = page.props?.larafusion?.panel;
    const brand     = theme?.brand;

    const brandName  = brand?.name || 'Larafusion';
    const logoSrc    = brand?.logo ?? null;
    const logoHeight = panel?.brandLogoHeight ?? brand?.logoHeight ?? '2rem';

    // Inject Google Font on auth pages (same as AdminLayout does for the panel)
    const fontFamily = panel?.font ?? theme?.font ?? null;
    const fontWeight = panel?.fontWeight ?? theme?.fontWeight ?? '300..900';
    useEffect(() => {
        if (!fontFamily) return;
        injectGoogleFont(fontFamily, fontWeight);
    }, [fontFamily, fontWeight]);

    // Apply theme CSS vars and dark mode to :root so auth pages respect the active theme
    useEffect(() => {
        if (!theme?.cssVars) return;
        const root = document.documentElement;
        Object.entries(theme.cssVars).forEach(([k, v]) => root.style.setProperty(k, v as string));
        const storedMode = (typeof localStorage !== 'undefined'
            ? localStorage.getItem('larafusion_theme_mode')
            : null) as 'light' | 'dark' | 'system' | null;
        const defaultMode = storedMode ?? panel?.defaultThemeMode ?? 'light';
        let isDark = theme.darkMode ?? false;
        if (defaultMode === 'system') isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        else if (defaultMode === 'dark') isDark = true;
        else if (defaultMode === 'light') isDark = false;
        root.classList.toggle('dark', isDark);
    }, [theme, panel]);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Brand */}
                <div className="text-center mb-8">
                    {logoSrc ? (
                        <img
                            src={logoSrc}
                            alt={brandName}
                            style={{ height: logoHeight, display: 'inline-block' }}
                            className="w-auto object-contain mb-2"
                        />
                    ) : (
                        <span className="text-3xl">🪄</span>
                    )}
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">{brandName}</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{subtitle ?? 'Admin Panel'}</p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
                    <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-6">{title}</h2>
                    {children}
                </div>
            </div>
        </div>
    );
}
