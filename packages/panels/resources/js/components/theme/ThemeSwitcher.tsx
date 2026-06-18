import React, { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { useTheme } from './ThemeProvider';
import { Palette, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

// Preview swatch colors for each theme
const THEME_SWATCHES: Record<string, string> = {
    violet:  '#7c3aed',
    slate:   '#475569',
    rose:    '#e11d48',
    emerald: '#059669',
    amber:   '#d97706',
    sky:     '#0284c7',
};

export default function ThemeSwitcher() {
    const theme       = useTheme();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const switchTheme = (name: string) => {
        // POST to a theme-switch endpoint (or store in localStorage as preference)
        // For now update via localStorage + page reload
        localStorage.setItem('arcane_theme', name);

        // Apply CSS var immediately for instant feedback
        const root = document.documentElement;
        root.setAttribute('data-theme-switching', name);

        // Navigate with theme param — server reads it and updates shared data
        router.get(window.location.pathname, { _theme: name }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });

        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                    open
                        ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                )}
                title="Switch theme"
            >
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline capitalize">{theme.name}</span>
                {/* Active swatch */}
                <span
                    className="w-3 h-3 rounded-full border border-black/10"
                    style={{ backgroundColor: THEME_SWATCHES[theme.name] ?? '#18181b' }}
                />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-50 py-1.5 animate-in fade-in-0 zoom-in-95">
                    <p className="px-3 py-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                        Theme
                    </p>
                    {theme.available.map(name => (
                        <button
                            key={name}
                            onClick={() => switchTheme(name)}
                            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <span
                                className="w-5 h-5 rounded-full border border-black/10 shrink-0"
                                style={{ backgroundColor: THEME_SWATCHES[name] ?? '#18181b' }}
                            />
                            <span className="capitalize flex-1 text-left">{name}</span>
                            {name === theme.name && (
                                <Check className="w-4 h-4 text-[var(--arcane-primary,#18181b)] dark:text-white shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
