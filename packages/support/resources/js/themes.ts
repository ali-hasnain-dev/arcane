// ─── Theme token definitions ──────────────────────────────────────────────────

export interface ThemeTokens {
    primary:       string;
    primaryHover:  string;
    primaryLight:  string;
    primaryRing:   string;
    sidebarBg:     string;
    sidebarText:   string;
    sidebarActive: string;
}

export const themes: Record<string, ThemeTokens> = {
    violet: {
        primary:       '#7c3aed',
        primaryHover:  '#6d28d9',
        primaryLight:  '#ede9fe',
        primaryRing:   '#c4b5fd',
        sidebarBg:     '#18181b',
        sidebarText:   '#a1a1aa',
        sidebarActive: '#7c3aed',
    },
    slate: {
        primary:       '#475569',
        primaryHover:  '#334155',
        primaryLight:  '#f1f5f9',
        primaryRing:   '#94a3b8',
        sidebarBg:     '#0f172a',
        sidebarText:   '#94a3b8',
        sidebarActive: '#475569',
    },
    rose: {
        primary:       '#e11d48',
        primaryHover:  '#be123c',
        primaryLight:  '#fff1f2',
        primaryRing:   '#fda4af',
        sidebarBg:     '#1c0a0e',
        sidebarText:   '#fb7185',
        sidebarActive: '#e11d48',
    },
    emerald: {
        primary:       '#059669',
        primaryHover:  '#047857',
        primaryLight:  '#ecfdf5',
        primaryRing:   '#6ee7b7',
        sidebarBg:     '#022c22',
        sidebarText:   '#6ee7b7',
        sidebarActive: '#059669',
    },
    amber: {
        primary:       '#d97706',
        primaryHover:  '#b45309',
        primaryLight:  '#fffbeb',
        primaryRing:   '#fcd34d',
        sidebarBg:     '#1c1400',
        sidebarText:   '#fcd34d',
        sidebarActive: '#d97706',
    },
    sky: {
        primary:       '#0284c7',
        primaryHover:  '#0369a1',
        primaryLight:  '#e0f2fe',
        primaryRing:   '#7dd3fc',
        sidebarBg:     '#082f49',
        sidebarText:   '#7dd3fc',
        sidebarActive: '#0284c7',
    },
};

export const themeNames = Object.keys(themes) as (keyof typeof themes)[];

/**
 * Convert a ThemeTokens object to CSS custom property map.
 * Used server-side (ThemeManager) and client-side (testing/custom themes).
 */
export function tokensToCssVars(tokens: ThemeTokens): Record<string, string> {
    return {
        '--arcane-primary':        tokens.primary,
        '--arcane-primary-hover':  tokens.primaryHover,
        '--arcane-primary-light':  tokens.primaryLight,
        '--arcane-primary-ring':   tokens.primaryRing,
        '--arcane-sidebar-bg':     tokens.sidebarBg,
        '--arcane-sidebar-text':   tokens.sidebarText,
        '--arcane-sidebar-active': tokens.sidebarActive,
    };
}
