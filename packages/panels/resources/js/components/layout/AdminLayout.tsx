import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { ArcaneSharedProps, NavigationNode, NavigationGroupNode, NavigationItem, ThemeConfig, PanelConfig, UserMenuItemConfig, UserMenuConfig } from '../../types';
import { usePrefetchProps } from '../../hooks/usePrefetchProps';
import {
    ChevronRight, ChevronDown, PanelLeft, PanelLeftClose, PanelRightClose, Bell, LogOut, Circle,
    Sun, Moon, Monitor, ExternalLink, User,
} from 'lucide-react';
import { resolveIcon } from '../../lib/icons';
import { cn } from '../../lib/utils';
import ThemeProvider, { useTheme } from '../theme/ThemeProvider';
import { PluginProvider, PluginSlot } from '../theme/PluginRegistry';
import GlobalSearch from './GlobalSearch';
import { NotificationProvider } from '../ui/Notifications';
import { BreadcrumbPortalProvider, useBreadcrumbPortal } from '../../lib/breadcrumbPortal';

// ─── Layout props (set by child pages) ───────────────────────────────────────
export interface ArcaneLayoutProps {
    pageTitle: string;
    fullBleed: boolean;
}

// ─── Icon renderer ────────────────────────────────────────────────────────────
function NavIcon({ name, className }: { name: string; className?: string }) {
    const Icon = resolveIcon(name, Circle);
    return <Icon className={className} />;
}

// ─── CSS vars for nav items — dark/light mode aware ───────────────────────────
// These override the global arcane theme vars to produce correct nav colours
// in both light and dark modes without JS dark-mode detection in each component.
function NavModeStyles() {
    return (
        <style>{`
            :root {
                --nav-text:           #52525b;
                --nav-hover-bg:       rgba(0,0,0,0.04);
                --nav-hover-text:     #18181b;
                --nav-active-bg:      color-mix(in srgb, var(--arcane-primary,#18181b) 8%, transparent);
                --nav-active-text:    var(--arcane-primary, #18181b);
                --nav-group-text:     #a1a1aa;
                --sidebar-border:     rgba(0,0,0,0.06);
                --sidebar-bg-light:   var(--arcane-sidebar-bg-light, #fafafa);
            }
            .dark {
                --nav-text:           var(--arcane-sidebar-text, #a8a29e);
                --nav-hover-bg:       rgba(255,255,255,0.05);
                --nav-hover-text:     #ffffff;
                --nav-active-bg:      rgba(255,255,255,0.10);
                --nav-active-text:    #ffffff;
                --nav-group-text:     var(--arcane-sidebar-text, #a8a29e);
                --sidebar-border:     rgba(255,255,255,0.07);
            }
        `}</style>
    );
}

// ─── Favicon + Font injector ──────────────────────────────────────────────────
export function injectGoogleFont(family: string, weight: string = '300..900'): void {
    for (const [href, attrs] of [
        ['https://fonts.googleapis.com', {}],
        ['https://fonts.gstatic.com',    { crossOrigin: 'anonymous' }],
    ] as const) {
        if (!document.querySelector(`link[rel="preconnect"][href="${href}"]`)) {
            const pc = document.createElement('link');
            pc.rel = 'preconnect';
            pc.href = href;
            if ('crossOrigin' in attrs) pc.crossOrigin = attrs.crossOrigin;
            document.head.appendChild(pc);
        }
    }
    const linkId = 'arcane-google-font';
    const encodedFamily = encodeURIComponent(family);
    const href = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weight}&display=swap`;
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
        link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
    const styleId = 'arcane-font-override';
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
    }
    style.textContent = [
        `:root { --arcane-font: "${family}", system-ui, sans-serif; }`,
        `body  { font-family: var(--arcane-font) !important; }`,
    ].join('\n');
}

function HeadAssets({ panel, theme }: { panel: PanelConfig; theme: ThemeConfig }) {
    const favicon    = panel.favicon ?? theme.brand?.favicon ?? null;
    const fontFamily = panel.font    ?? theme.font           ?? null;
    const fontWeight = panel.fontWeight ?? theme.fontWeight  ?? '300..900';
    useEffect(() => {
        if (!favicon) return;
        let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
        link.href = favicon;
    }, [favicon]);
    useEffect(() => {
        if (!fontFamily) return;
        injectGoogleFont(fontFamily, fontWeight);
    }, [fontFamily, fontWeight]);
    return null;
}

// ─── Unsaved changes guard ────────────────────────────────────────────────────
function UnsavedChangesGuard({ enabled }: { enabled: boolean }) {
    const isDirtyRef = useRef(false);
    useEffect(() => {
        if (!enabled) return;
        const handleChange = (e: Event) => {
            if ((e.target as HTMLElement)?.closest('form')) isDirtyRef.current = true;
        };
        document.addEventListener('input', handleChange);
        document.addEventListener('change', handleChange);
        const removeFinish = router.on('finish', () => { isDirtyRef.current = false; });
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirtyRef.current) { e.preventDefault(); e.returnValue = ''; }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            document.removeEventListener('input', handleChange);
            document.removeEventListener('change', handleChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            removeFinish();
        };
    }, [enabled]);
    return null;
}

// ─── User menu ────────────────────────────────────────────────────────────────
function UserMenuCustomItem({ item, onClose }: { item: UserMenuItemConfig; onClose: () => void }) {
    const Icon = item.icon ? resolveIcon(item.icon, Circle) : null;
    const cls = "flex items-center gap-3 w-full px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors";
    if (item.method === 'post') {
        return (
            <Link href={item.url ?? '#'} method="post" as="button" onClick={onClose} className={cls}>
                {Icon ? <Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" /> : <Circle className="w-4 h-4 text-zinc-400 shrink-0 opacity-0" />}
                {item.label}
                {item.newTab && <ExternalLink className="w-3 h-3 ml-auto text-zinc-300" />}
            </Link>
        );
    }
    return (
        <Link href={item.url ?? '#'} target={item.newTab ? '_blank' : undefined} rel={item.newTab ? 'noopener noreferrer' : undefined} onClick={onClose} className={cls}>
            {Icon ? <Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" /> : <Circle className="w-4 h-4 text-zinc-400 shrink-0 opacity-0" />}
            {item.label}
            {item.newTab && <ExternalLink className="w-3 h-3 ml-auto text-zinc-300" />}
        </Link>
    );
}

function UserMenuPanel({ panel, onClose }: { panel: PanelConfig; onClose: () => void }) {
    const { auth } = usePage<ArcaneSharedProps>().props;
    const [mode, setMode] = useState<'light' | 'dark' | 'system'>(() => {
        try {
            const stored = localStorage.getItem('arcane_theme_mode');
            return (stored as 'light' | 'dark' | 'system') ?? panel.defaultThemeMode ?? 'light';
        } catch { return panel.defaultThemeMode ?? 'light'; }
    });
    function applyMode(m: 'light' | 'dark' | 'system') {
        setMode(m);
        try { localStorage.setItem('arcane_theme_mode', m); } catch (_) {}
        let isDark = m === 'dark';
        if (m === 'system') isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        try { localStorage.setItem('arcane_dark', isDark ? '1' : '0'); } catch (_) {}
        const root = document.documentElement;

        // View Transitions API gives a guaranteed simultaneous cross-fade at the
        // compositor level — no stagger between elements. The browser screenshots the
        // current paint, applies the DOM change in the callback, then animates between
        // the two screenshots. Falls back to the manual CSS transition trick for
        // Firefox (which does not support View Transitions as of mid-2025).
        if ('startViewTransition' in document) {
            (document as Document & { startViewTransition(cb: () => void): void })
                .startViewTransition(() => { root.classList.toggle('dark', isDark); });
        } else {
            root.classList.add('arcane-theme-transition');
            // Forced reflow commits the transition starting state so the browser
            // knows what colour to animate FROM before the .dark class changes.
            void root.offsetHeight;
            root.classList.toggle('dark', isDark);
            window.setTimeout(() => root.classList.remove('arcane-theme-transition'), 300);
        }
    }
    const user     = auth?.user;
    const initials = user?.name ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'A';
    const cfg         = panel.userMenu ?? { enabled: true, position: 'topbar', profile: null, logout: null, items: [] };
    const logoutUrl   = cfg.logout?.url    ?? `/${panel.path ?? 'admin'}/logout`;
    const logoutLabel = cfg.logout?.label  ?? 'Sign out';
    const logoutMethod = cfg.logout?.method ?? 'post';
    const builtinProfileUrl = panel.hasProfile ? `/${panel.path ?? 'admin'}/${panel.profileSlug ?? 'profile'}` : null;
    const profileUrl  = cfg.profile?.url ?? builtinProfileUrl;
    const profileLabel = cfg.profile?.label ?? user?.name;
    return (
        <>
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
                {user?.avatar
                    ? <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700 shrink-0" />
                    : <div className="w-9 h-9 rounded-full bg-[var(--arcane-primary,#292524)] flex items-center justify-center text-sm font-bold text-white shrink-0">{initials}</div>
                }
                <div className="min-w-0 flex-1">
                    {profileUrl
                        ? <Link href={profileUrl} onClick={onClose} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate hover:underline block">{profileLabel}</Link>
                        : <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{profileLabel}</p>
                    }
                    {user?.email && <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>}
                </div>
            </div>
            {cfg.items && cfg.items.length > 0 && (
                <div className="border-b border-zinc-100 dark:border-zinc-800 py-1">
                    {cfg.items.map((item, i) => <UserMenuCustomItem key={i} item={item} onClose={onClose} />)}
                </div>
            )}
            <div className="px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                    {(['light', 'dark', 'system'] as const).map((m, i) => {
                        const Icon = [Sun, Moon, Monitor][i];
                        return (
                            <button key={m} onClick={() => applyMode(m)} title={m.charAt(0).toUpperCase() + m.slice(1)}
                                className={cn('flex-1 flex items-center justify-center py-1.5 rounded-md transition-colors',
                                    mode === m ? 'bg-white dark:bg-zinc-600 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300')}>
                                <Icon className="w-4 h-4" />
                            </button>
                        );
                    })}
                </div>
            </div>
            {logoutMethod === 'post'
                ? <Link href={logoutUrl} method="post" as="button" onClick={onClose} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"><LogOut className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />{logoutLabel}</Link>
                : <Link href={logoutUrl} onClick={onClose} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"><LogOut className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />{logoutLabel}</Link>
            }
        </>
    );
}

function UserMenu({ panel }: { panel: PanelConfig }) {
    const { auth } = usePage<ArcaneSharedProps>().props;
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const cfg = panel.userMenu ?? { enabled: true, position: 'topbar', profile: null, logout: null, items: [] };
    if (!cfg.enabled) return null;
    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    const user     = auth?.user;
    const initials = user?.name ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'A';
    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(o => !o)}
                className="w-8 h-8 rounded-full bg-[var(--arcane-primary,#292524)] flex items-center justify-center text-xs font-bold text-white hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--arcane-primary,#292524)] focus:ring-offset-1"
                aria-label="User menu" aria-expanded={open}>
                {initials}
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <UserMenuPanel panel={panel} onClose={() => setOpen(false)} />
                </div>
            )}
        </div>
    );
}

function SidebarUserMenu({ panel, collapsed }: { panel: PanelConfig; collapsed: boolean }) {
    const { auth } = usePage<ArcaneSharedProps>().props;
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const cfg = panel.userMenu ?? { enabled: true, position: 'topbar', profile: null, logout: null, items: [] };
    if (!cfg.enabled) return null;
    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    const user     = auth?.user;
    const initials = user?.name ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'A';
    return (
        <div ref={ref} className="relative px-2 py-3 shrink-0 border-t border-zinc-950/[0.07] dark:border-white/[0.07]">
            <button onClick={() => setOpen(o => !o)}
                className={cn('flex items-center gap-3 w-full px-2 py-2 rounded-lg transition-colors', collapsed && 'justify-center')}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--nav-hover-bg)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                aria-label="User menu" aria-expanded={open}>
                {user?.avatar
                    ? <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700 shrink-0" />
                    : <div className="w-7 h-7 rounded-full bg-[var(--arcane-primary,#292524)] flex items-center justify-center text-xs font-bold text-white shrink-0">{initials}</div>
                }
                {!collapsed && (
                    <div className="min-w-0 flex-1 text-left">
                        <p className="text-xs font-semibold truncate leading-tight" style={{ color: 'var(--nav-hover-text)' }}>{user?.name}</p>
                        {user?.email && <p className="text-xs truncate leading-tight" style={{ color: 'var(--nav-text)' }}>{user.email}</p>}
                    </div>
                )}
                {!collapsed && (
                    <ChevronDown className={cn('w-3.5 h-3.5 shrink-0 transition-transform', open && 'rotate-180')} style={{ color: 'var(--nav-text)' }} />
                )}
            </button>
            {open && (
                <div className="absolute left-2 right-2 bottom-full mb-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <UserMenuPanel panel={panel} onClose={() => setOpen(false)} />
                </div>
            )}
        </div>
    );
}

// ─── Nav item ─────────────────────────────────────────────────────────────────
function NavItem({ href, icon, label, active, collapsed, badge, horizontal = false, prefetchProps = {} }: {
    href: string; icon: string; label: string;
    active: boolean; collapsed: boolean; badge?: string | number | null;
    horizontal?: boolean;
    prefetchProps?: Record<string, unknown>;
}) {
    const [hovered, setHovered] = useState(false);

    if (horizontal) {
        return (
            <Link href={href} {...prefetchProps}
                className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                    active
                        ? 'bg-[var(--arcane-primary,#292524)] text-white'
                        : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100',
                )}>
                <NavIcon name={icon} className="w-4 h-4 shrink-0" />
                <span>{label}</span>
                {badge != null && <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-white/20 text-white min-w-[1.25rem] text-center">{badge}</span>}
            </Link>
        );
    }

    // Sidebar mode
    return (
        <div
            className="relative"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <Link
                href={href}
                {...prefetchProps}
                className={cn(
                    'flex items-center py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    collapsed ? 'justify-center px-2' : 'gap-3 px-3',
                )}
                style={{
                    backgroundColor: active
                        ? 'var(--nav-active-bg)'
                        : hovered ? 'var(--nav-hover-bg)' : undefined,
                    color: active
                        ? 'var(--nav-active-text)'
                        : hovered ? 'var(--nav-hover-text)' : 'var(--nav-text)',
                }}
            >
                <NavIcon name={icon} className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="flex-1 truncate">{label}</span>}
                {!collapsed && badge != null && (
                    <span className="ml-auto px-1.5 py-0.5 text-xs font-bold rounded-full bg-[var(--arcane-primary,#292524)] text-white min-w-[1.25rem] text-center">{badge}</span>
                )}
            </Link>

            {/* ── Collapsed tooltip — slides in from the left ───────────── */}
            {collapsed && (
                <div
                    className={cn(
                        'absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50',
                        'pointer-events-none select-none',
                        'transition-all duration-150 ease-out',
                        hovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2',
                    )}
                >
                    {/* Left-pointing caret */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[3px] w-2 h-2 bg-zinc-900 dark:bg-zinc-700 rotate-45 rounded-[1px]" />
                    {/* Label chip */}
                    <div className="bg-zinc-900 dark:bg-zinc-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap ml-1">
                        {label}
                        {badge != null && (
                            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-white/20">{badge}</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Nav Group ────────────────────────────────────────────────────────────────
function NavGroup({ group, path, collapsed: sidebarCollapsed, adminPrefix, prefetchProps }: {
    group: NavigationGroupNode; path: string; collapsed: boolean; adminPrefix: string;
    prefetchProps: Record<string, unknown>;
}) {
    const [open, setOpen] = useState(!group.collapsed);
    if (sidebarCollapsed) {
        return (
            <>
                {group.items.map(item => (
                    <NavItem key={item.slug} href={item.url} icon={item.icon} label={item.label}
                        active={path.startsWith(`/${adminPrefix}/${item.slug}`) || path.startsWith(`/${adminPrefix}/p/${item.slug}`)}
                        collapsed={true} badge={item.badge} prefetchProps={prefetchProps} />
                ))}
            </>
        );
    }
    return (
        <div className="mt-3">
            {group.collapsible ? (
                <button onClick={() => setOpen(o => !o)}
                    className="flex items-center justify-between w-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors"
                    style={{ color: 'var(--nav-group-text)', opacity: 0.65 }}>
                    <span>{group.label}</span>
                    <ChevronDown className={cn('w-3 h-3 transition-transform', open ? 'rotate-0' : '-rotate-90')} />
                </button>
            ) : (
                <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--nav-group-text)', opacity: 0.65 }}>
                    {group.label}
                </p>
            )}
            {open && (
                <div className="mt-0.5 space-y-0.5">
                    {group.items.map(item => (
                        <NavItem key={item.slug} href={item.url} icon={item.icon} label={item.label}
                            active={path.startsWith(`/${adminPrefix}/${item.slug}`) || path.startsWith(`/${adminPrefix}/p/${item.slug}`)}
                            collapsed={false} badge={item.badge} prefetchProps={prefetchProps} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, panel, adminPrefix, showTopbar, onToggle, currentSidebarW }: {
    collapsed: boolean;
    panel: PanelConfig;
    adminPrefix: string;
    showTopbar: boolean;
    onToggle: () => void;
    currentSidebarW: string;
}) {
    const page  = usePage<ArcaneSharedProps>();
    const { arcane } = page.props;
    const nav: NavigationNode[] = arcane?.navigation ?? [];
    const theme = arcane?.theme as ThemeConfig | undefined;
    const brand = theme?.brand;
    const path  = page.url.split('?')[0];
    const prefetchProps = usePrefetchProps();

    const logoSrc = (panel.defaultThemeMode === 'dark' || theme?.darkMode)
        ? (panel.darkModeBrandLogo ?? brand?.darkLogo ?? brand?.logo)
        : brand?.logo;

    // When topbar is hidden, the user menu is always forced to the sidebar bottom
    const showSidebarUserMenu = panel.userMenu?.position === 'sidebar' || !showTopbar;

    return (
        <aside
            style={{ width: collapsed ? (panel.collapsedSidebarWidth ?? '4rem') : (panel.sidebarWidth ?? '16rem') }}
            className="fixed left-0 top-0 h-full flex flex-col z-40 transition-all duration-300 bg-[#fafafa] dark:bg-zinc-900"
        >
            {/* ── Brand ─────────────────────────────────────────────────── */}
            {/* When topbar is hidden, the logo area inherits the sidebar bg
                (no special white/zinc-950 background) so the whole layout is unified */}
            <div
                className={cn(
                    'flex items-center h-16 shrink-0',
                    showTopbar
                        ? 'bg-white dark:bg-zinc-950 border-b border-zinc-950/[0.07] dark:border-white/[0.07]'
                        : 'border-b border-zinc-950/[0.05] dark:border-white/[0.05]',
                    collapsed ? 'justify-center px-3' : 'px-4 gap-2',
                )}
            >
                {/* Logo — always visible */}
                {logoSrc ? (
                    <img
                        src={logoSrc}
                        alt={brand?.name}
                        style={{ height: panel.brandLogoHeight ?? brand?.logoHeight ?? '1.75rem' }}
                        className="w-auto object-contain shrink-0"
                    />
                ) : (
                    <span className="text-xl select-none">🪄</span>
                )}

                {/* Brand name — only when expanded */}
                {!collapsed && (
                    <span className="font-bold text-base tracking-tight truncate text-zinc-900 dark:text-white flex-1 min-w-0">
                        {brand?.name ?? 'Arcane'}
                    </span>
                )}

                {/* Sidebar collapse toggle — shown here when topbar is hidden */}
                {!showTopbar && panel.sidebarCollapsibleOnDesktop !== false && (
                    <button
                        type="button"
                        onClick={onToggle}
                        className="shrink-0 p-1 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors"
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed
                            ? <PanelLeft className="w-4 h-4" />
                            : <PanelLeftClose className="w-4 h-4" />
                        }
                    </button>
                )}
            </div>

            {/* ── Global search — only shown here when topbar is disabled ── */}
            {!showTopbar && panel.globalSearch && !collapsed && (
                <div className="px-2 pt-3 pb-1 shrink-0">
                    <GlobalSearch
                        panel={{
                            ...panel,
                            // Default to 'center' alignment when search lives in the sidebar
                            globalSearchAlignment: panel.globalSearchAlignment ?? 'center',
                        }}
                        sidebarOffset={currentSidebarW}
                        inSidebar
                    />
                </div>
            )}

            {/* ── Navigation ─────────────────────────────────────────────── */}
            {/* overflow-visible when collapsed so tooltips can escape the nav bounds */}
            <nav className={cn(
                'flex-1 px-2 py-3 space-y-0.5',
                collapsed ? 'overflow-visible' : 'overflow-y-auto',
            )}>
                <NavItem href={`/${adminPrefix}`} icon="dashboard" label="Dashboard"
                    active={path === `/${adminPrefix}`} collapsed={collapsed} prefetchProps={prefetchProps} />
                {nav.map((node, i) =>
                    node.type === 'group' ? (
                        <NavGroup key={i} group={node as NavigationGroupNode} path={path}
                            collapsed={collapsed} adminPrefix={adminPrefix} prefetchProps={prefetchProps} />
                    ) : (
                        <NavItem key={(node as NavigationItem).slug}
                            href={(node as NavigationItem).url}
                            icon={(node as NavigationItem).icon}
                            label={(node as NavigationItem).label}
                            active={
                                path.startsWith(`/${adminPrefix}/${(node as NavigationItem).slug}`) ||
                                path.startsWith(`/${adminPrefix}/p/${(node as NavigationItem).slug}`)
                            }
                            collapsed={collapsed} badge={(node as NavigationItem).badge}
                            prefetchProps={prefetchProps} />
                    )
                )}
                {!collapsed && <PluginSlot name="sidebar.nav" />}
            </nav>

            {/* Notification bell — shown in sidebar footer when topbar is disabled */}
            {!showTopbar && panel.notifications && !collapsed && (
                <div className="px-4 py-2 shrink-0 border-t border-zinc-950/[0.05] dark:border-white/[0.05]">
                    <button
                        type="button"
                        className="p-2 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-white/10 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                        title="Notifications"
                    >
                        <Bell className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Sidebar user menu — always shown here when topbar is disabled */}
            {showSidebarUserMenu && (
                <SidebarUserMenu panel={panel} collapsed={collapsed} />
            )}
        </aside>
    );
}

// ─── Top Navigation bar (horizontal mode) ─────────────────────────────────────
function TopNav({ panel, adminPrefix }: { panel: PanelConfig; adminPrefix: string }) {
    const page = usePage<ArcaneSharedProps>();
    const { arcane } = page.props;
    const nav: NavigationNode[] = arcane?.navigation ?? [];
    const theme = arcane?.theme as ThemeConfig | undefined;
    const brand = theme?.brand;
    const path  = page.url.split('?')[0];
    const prefetchProps = usePrefetchProps();
    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800/60 z-40 flex items-center px-6 gap-6">
            <div className="flex items-center gap-2 shrink-0">
                {brand?.logo ? <img src={brand.logo} alt={brand.name} className="h-7 w-auto object-contain" /> : <span className="text-lg">🪄</span>}
                <span className="font-bold text-base text-zinc-900 dark:text-zinc-100 tracking-tight">{brand?.name ?? 'Arcane'}</span>
            </div>
            <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
                <NavItem href={`/${adminPrefix}`} icon="dashboard" label="Dashboard" active={path === `/${adminPrefix}`} collapsed={false} horizontal prefetchProps={prefetchProps} />
                {nav.map((node, i) =>
                    node.type === 'group'
                        ? (node as NavigationGroupNode).items.map(item => (
                            <NavItem key={item.slug} href={item.url} icon={item.icon} label={item.label}
                                active={path.startsWith(`/${adminPrefix}/${item.slug}`)}
                                collapsed={false} horizontal badge={item.badge} prefetchProps={prefetchProps} />
                          ))
                        : <NavItem key={(node as NavigationItem).slug}
                            href={(node as NavigationItem).url} icon={(node as NavigationItem).icon}
                            label={(node as NavigationItem).label}
                            active={path.startsWith(`/${adminPrefix}/${(node as NavigationItem).slug}`)}
                            collapsed={false} horizontal badge={(node as NavigationItem).badge}
                            prefetchProps={prefetchProps} />
                )}
            </nav>
            <div className="flex items-center gap-2 shrink-0">
                {panel.globalSearch && <GlobalSearch panel={panel} />}
                <PluginSlot name="topbar.actions" />
                {panel.notifications && (
                    <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                        <Bell className="w-5 h-5" />
                    </button>
                )}
                {panel.userMenu?.position !== 'sidebar' && <UserMenu panel={panel} />}
            </div>
        </header>
    );
}

// ─── Topbar (sidebar mode) ────────────────────────────────────────────────────
function Topbar({ collapsed, onToggle, sidebarWidth, collapsedSidebarWidth, panel }: {
    collapsed: boolean;
    onToggle: () => void;
    sidebarWidth: string;
    collapsedSidebarWidth: string;
    panel: PanelConfig;
}) {
    // Read portal content — renders breadcrumbs in header when configured
    const portal = useBreadcrumbPortal();
    const showBreadcrumbsInHeader = portal?.position === 'header' && panel.breadcrumbs !== false;

    return (
        <header
            className="fixed top-0 right-0 h-16 bg-white dark:bg-zinc-950 border-b border-zinc-950/[0.07] dark:border-white/[0.07] flex items-center gap-2 px-4 z-30 transition-all duration-300"
            style={{ left: collapsed ? collapsedSidebarWidth : sidebarWidth }}
        >
            {/* Sidebar toggle — leftmost in topbar, beside breadcrumbs */}
            {panel.sidebarCollapsibleOnDesktop !== false && (
                <button
                    onClick={onToggle}
                    className="p-1.5 rounded-lg transition-colors shrink-0 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed
                        ? <PanelRightClose className="w-5 h-5" />
                        : <PanelLeftClose className="w-5 h-5" />
                    }
                </button>
            )}

            {/* Breadcrumbs slot — shown here when breadcrumbsPosition=header */}
            {showBreadcrumbsInHeader && portal?.content && (
                <div className="flex-1 min-w-0 flex items-center">
                    {portal.content}
                </div>
            )}

            {/* Right-side actions — pushed to the end */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
                {panel.globalSearch && (
                    <GlobalSearch
                        panel={panel}
                        sidebarOffset={collapsed ? collapsedSidebarWidth : sidebarWidth}
                    />
                )}
                <PluginSlot name="topbar.actions" />
                {panel.notifications && (
                    <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                        <Bell className="w-5 h-5" />
                    </button>
                )}
                {panel.userMenu?.position !== 'sidebar' && <UserMenu panel={panel} />}
            </div>
        </header>
    );
}

// ─── Plugin asset injector ────────────────────────────────────────────────────
function PluginAssets() {
    const { arcane } = usePage<ArcaneSharedProps>().props;
    const assets = arcane?.assets ?? [];
    return (
        <>
            {assets.map(url => (
                url.endsWith('.css')
                    ? <link key={url} rel="stylesheet" href={url} />
                    : <script key={url} src={url} defer />
            ))}
        </>
    );
}

// ─── AdminLayout ──────────────────────────────────────────────────────────────
function AdminLayoutInner({ children, pageTitle = 'Dashboard', fullBleed = false }: {
    children: React.ReactNode;
    pageTitle?: string;
    fullBleed?: boolean;
}) {
    const { arcane } = usePage<ArcaneSharedProps>().props;
    const theme  = arcane?.theme as ThemeConfig | undefined;
    const panel  = (arcane?.panel ?? {}) as PanelConfig;

    const adminPrefix  = panel.path ?? 'admin';
    const isTopNav     = panel.topNavigation ?? false;
    const showTopbar   = panel.topbar !== false;
    const sidebarW     = panel.sidebarWidth ?? '16rem';
    const collapsedW   = panel.collapsedSidebarWidth ?? '4rem';
    const maxW         = panel.maxContentWidth ?? null;
    // breadcrumbsPosition: 'page' (default) | 'header'
    // 'header' only works in sidebar (vertical) mode; in top-nav it falls back to 'page'
    const bcPosition   = (!isTopNav && panel.breadcrumbsPosition === 'header') ? 'header' : 'page';

    const [collapsed, setCollapsed] = useState(
        () => localStorage.getItem('arcane_sidebar_collapsed') === '1'
    );

    useEffect(() => {
        if (!panel.prefetch?.flushOnNavigate) return;
        return router.on('navigate', () => router.flushAll());
    }, [panel.prefetch?.flushOnNavigate]);

    function toggleSidebar() {
        setCollapsed(c => {
            const next = !c;
            localStorage.setItem('arcane_sidebar_collapsed', next ? '1' : '0');
            return next;
        });
    }

    const mainStyle: React.CSSProperties = {};
    if (!isTopNav) mainStyle.marginLeft = collapsed ? collapsedW : sidebarW;

    // Dynamic content max-width for sidebar layout: base 80rem (max-w-7xl) + freed sidebar space.
    // When sidebar is open: calc(80rem + 16rem - 16rem) = 80rem.
    // When sidebar collapses: calc(80rem + 16rem - 4rem) = 92rem — content can use the freed space.
    const sidebarMaxW = maxW ?? `calc(80rem + ${sidebarW} - ${collapsed ? collapsedW : sidebarW})`;

    const brandName = theme?.brand?.name ?? 'Admin';
    const docTitle  = pageTitle ? `${pageTitle} - ${brandName}` : brandName;

    return (
        // BreadcrumbPortalProvider wraps the whole layout so Topbar and page
        // content both share the same breadcrumb portal state.
        <BreadcrumbPortalProvider position={bcPosition}>
            <NavModeStyles />
            <div className="min-h-screen bg-[#fafafa] dark:bg-zinc-900">
                <Head title={docTitle} />
                <HeadAssets panel={panel} theme={theme!} />
                <UnsavedChangesGuard enabled={panel.unsavedChangesAlerts ?? false} />
                <PluginAssets />

                {isTopNav ? (
                    <>
                        <TopNav panel={panel} adminPrefix={adminPrefix} />
                        <main className="pt-16 min-h-screen">
                            <div
                                className={cn(!fullBleed && 'p-6 w-full mx-auto', !fullBleed && !maxW && 'max-w-7xl')}
                                style={!fullBleed && maxW ? { maxWidth: maxW } : undefined}
                            >
                                <PluginSlot name="page.top" />
                                {children}
                                <PluginSlot name="page.bottom" />
                            </div>
                        </main>
                    </>
                ) : (
                    <>
                        <Sidebar
                            collapsed={collapsed}
                            panel={panel}
                            adminPrefix={adminPrefix}
                            showTopbar={showTopbar}
                            onToggle={toggleSidebar}
                            currentSidebarW={collapsed ? collapsedW : sidebarW}
                        />
                        {showTopbar && (
                            <Topbar collapsed={collapsed} onToggle={toggleSidebar} sidebarWidth={sidebarW} collapsedSidebarWidth={collapsedW} panel={panel} />
                        )}
                        <main className={cn('min-h-screen transition-all duration-300', showTopbar && 'pt-16')}
                            style={mainStyle}>
                            <div
                                className={cn(!fullBleed && 'p-6 w-full mx-auto')}
                                style={!fullBleed ? { maxWidth: sidebarMaxW, transition: 'max-width 300ms' } : undefined}
                            >
                                <PluginSlot name="page.top" />
                                {children}
                                <PluginSlot name="page.bottom" />
                            </div>
                        </main>
                    </>
                )}
            </div>
        </BreadcrumbPortalProvider>
    );
}

export default function AdminLayout({ children, pageTitle, fullBleed }: {
    children: React.ReactNode;
    pageTitle?: string;
    fullBleed?: boolean;
}) {
    return (
        <ThemeProvider>
            <PluginProvider>
                <NotificationProvider>
                    <AdminLayoutInner pageTitle={pageTitle} fullBleed={fullBleed}>
                        {children}
                    </AdminLayoutInner>
                </NotificationProvider>
            </PluginProvider>
        </ThemeProvider>
    );
}
