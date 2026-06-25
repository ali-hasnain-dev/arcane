import React, { createContext, useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { LarafusionSharedProps, ThemeConfig } from '../../types';

// Re-export so existing imports from ThemeProvider keep working
export type { ThemeConfig };

const ThemeContext = createContext<ThemeConfig | null>(null);

export function useTheme(): ThemeConfig {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { larafusion } = usePage<LarafusionSharedProps>().props;
    const theme = larafusion?.theme as ThemeConfig | undefined;
    const panel = larafusion?.panel;

    // Track the previously applied theme name to detect colour-theme switches.
    const prevThemeNameRef = useRef<string | undefined>(undefined);

    // useLayoutEffect fires synchronously after DOM mutations but BEFORE the browser
    // paints. This ensures CSS vars land in the same frame as Tailwind dark: class
    // changes — no stagger where one set of colours updates a frame later than the
    // other. The previous useEffect caused two paints: one with old CSS vars + new
    // React DOM, then another after the effect ran.
    useLayoutEffect(() => {
        if (!theme?.cssVars) return;
        const root = document.documentElement;

        // Only animate when the colour theme itself is switching (not on every
        // navigation where the same theme is re-delivered). Use the same
        // larafusion-theme-transition + forced-reflow pattern as applyMode() so that
        // CSS-var-driven colours cross-fade in sync with Tailwind dark: transitions.
        const switching = prevThemeNameRef.current !== undefined
            && theme.name !== prevThemeNameRef.current;
        prevThemeNameRef.current = theme.name;

        // Compute effective dark mode before any DOM mutations.
        const storedMode = (typeof localStorage !== 'undefined'
            ? localStorage.getItem('larafusion_theme_mode')
            : null) as 'light' | 'dark' | 'system' | null;
        const defaultMode = storedMode ?? panel?.defaultThemeMode ?? theme.defaultThemeMode ?? 'light';
        let isDark = theme.darkMode;
        if (defaultMode === 'system') {
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        } else if (defaultMode === 'dark') {
            isDark = true;
        } else if (defaultMode === 'light') {
            isDark = false;
        }

        const applyVarsAndDark = () => {
            Object.entries(theme.cssVars!).forEach(([key, value]) => {
                root.style.setProperty(key, value);
            });
            root.classList.toggle('dark', isDark);
            // Cache so the FOUC-prevention script can apply .dark before first paint.
            try { localStorage.setItem('larafusion_dark', isDark ? '1' : '0'); } catch (_) {}
        };

        if (switching && 'startViewTransition' in document) {
            // View Transitions API: the browser takes a full-page screenshot of the
            // current paint (old theme), runs the callback (new CSS vars + .dark),
            // then cross-fades all pixels simultaneously — zero per-element stagger.
            (document as Document & { startViewTransition(cb: () => void): void })
                .startViewTransition(applyVarsAndDark);
        } else if (switching) {
            // Firefox fallback: manual larafusion-theme-transition + forced reflow.
            root.classList.add('larafusion-theme-transition');
            void root.offsetHeight;
            applyVarsAndDark();
            const id = window.setTimeout(() => root.classList.remove('larafusion-theme-transition'), 300);
            return () => window.clearTimeout(id);
        } else {
            // Same theme on regular navigation — apply instantly (no animation).
            applyVarsAndDark();
        }
    }, [theme, panel]);

    // Re-apply when OS colour-scheme changes (only when mode is 'system')
    useEffect(() => {
        const storedMode = (typeof localStorage !== 'undefined'
            ? localStorage.getItem('larafusion_theme_mode')
            : null) as 'light' | 'dark' | 'system' | null;
        const mode = storedMode ?? panel?.defaultThemeMode ?? theme?.defaultThemeMode ?? 'light';
        if (mode !== 'system') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => {
            document.documentElement.classList.toggle('dark', e.matches);
            try { localStorage.setItem('larafusion_dark', e.matches ? '1' : '0'); } catch (_) {}
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [panel?.defaultThemeMode, theme?.defaultThemeMode]);

    if (!theme) return <>{children}</>;

    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
}
