import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../lib/utils';

// ── Dark-mode detection ────────────────────────────────────────────────────────
// Watches the `dark` class on <html> so custom backgroundColor is suppressed
// in dark mode (light pastels look out of place on dark backgrounds).
function useDarkMode(): boolean {
    const [dark, setDark] = useState(
        () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
    );
    useEffect(() => {
        const el = document.documentElement;
        const obs = new MutationObserver(() => setDark(el.classList.contains('dark')));
        obs.observe(el, { attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);
    return dark;
}

// ── Color maps ────────────────────────────────────────────────────────────────

const bgMap: Record<string, string> = {
    default: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
    primary: 'bg-[var(--arcane-primary,#18181b)]/10 text-[var(--arcane-primary,#18181b)] dark:text-white',
    success: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    warning: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    danger:  'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300',
    info:    'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
    gray:    'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
};

const dotMap: Record<string, string> = {
    default: 'bg-zinc-400',
    primary: 'bg-[var(--arcane-primary,#18181b)]',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    danger:  'bg-red-500',
    info:    'bg-sky-500',
    gray:    'bg-zinc-400',
};

const descColorMap: Record<string, string> = {
    default: 'text-zinc-400 dark:text-zinc-500',
    primary: 'text-[var(--arcane-primary,#18181b)]',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger:  'text-red-500 dark:text-red-400',
    info:    'text-sky-600 dark:text-sky-400',
    gray:    'text-zinc-400 dark:text-zinc-500',
};

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
    if (!data || data.length < 2) return null;

    const W = 80, H = 28;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const n = data.length;
    const xStep = W / (n - 1);

    const pts = data
        .map((v, i) => `${i * xStep},${H - ((v - min) / range) * H}`)
        .join(' ');

    const fillPts = [
        `0,${H}`,
        ...data.map((v, i) => `${i * xStep},${H - ((v - min) / range) * H}`),
        `${W},${H}`,
    ].join(' ');

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-20 h-7 flex-shrink-0" preserveAspectRatio="none">
            <polygon points={fillPts} fill={color} opacity="0.12" />
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    );
}

// ── Lucide icon resolver (subset) ─────────────────────────────────────────────

function resolveIconSvg(icon: string | null | undefined): string | null {
    if (!icon) return null;
    // Strip heroicon prefix — fallback to showing a generic circle
    return icon.replace(/^heroicon-[ms]-/, '');
}

function InlineIcon({ name, className }: { name: string; className?: string }) {
    const normalized = resolveIconSvg(name) ?? name;
    // Render as a small text symbol using Lucide class convention
    // Since we can't import all Lucide icons dynamically, render a placeholder circle with a letter
    return (
        <svg viewBox="0 0 24 24" className={cn('w-3 h-3 inline-block', className)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <text x="12" y="16" textAnchor="middle" fontSize="10" stroke="none" fill="currentColor" fontWeight="bold">
                {normalized.charAt(0).toUpperCase()}
            </text>
        </svg>
    );
}

// ── Stat types ─────────────────────────────────────────────────────────────────

interface StatData {
    label: string;
    value: string | number;
    description?: string | null;
    descriptionIcon?: string | null;
    descriptionIconPosition?: 'before' | 'after';
    descriptionColor?: string | null;
    icon?: string | null;
    color?: string;
    trend?: number | null;
    chart?: number[];
    extraAttributes?: Record<string, string>;
    backgroundColor?: string | null;
}

interface StatsOverviewWidgetData {
    heading?: string | null;
    description?: string | null;
    stats: StatData[];
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ stat }: { stat: StatData }) {
    const isDark = useDarkMode();
    const color = stat.color ?? 'default';
    const dotColor = dotMap[color] ?? dotMap.default;
    const bgClass = bgMap[color] ?? bgMap.default;
    // Suppress custom backgroundColor in dark mode — light pastel hex values look
    // jarring on a dark background and would invert text contrast.
    const cardStyle = (stat.backgroundColor && !isDark) ? { backgroundColor: stat.backgroundColor } : undefined;

    // Description color — from explicit descriptionColor, or default zinc
    const descColorKey = stat.descriptionColor ?? 'default';
    const descClass = descColorMap[descColorKey] ?? descColorMap.default;

    // Sparkline stroke color derived from semantic color token.
    // Primary reads the live CSS variable so it tracks the active theme.
    const sparkColors: Record<string, string> = {
        success: '#10b981', warning: '#f59e0b',
        danger: '#ef4444',  info: '#0ea5e9',    default: '#a1a1aa',
    };
    const sparkColor = color === 'primary'
        ? (typeof document !== 'undefined'
            ? getComputedStyle(document.documentElement).getPropertyValue('--arcane-primary').trim() || '#292524'
            : '#292524')
        : (sparkColors[color] ?? sparkColors.default);

    const hasTrend = stat.trend !== null && stat.trend !== undefined;

    return (
        <div
            className={cn(
                'rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm flex items-start gap-4',
                stat.backgroundColor ? '' : 'bg-white dark:bg-zinc-900',
            )}
            style={cardStyle}
            {...(stat.extraAttributes ?? {})}
        >
            {/* Icon badge */}
            {stat.icon && (
                <div className={cn('p-2 rounded-lg flex-shrink-0 mt-0.5', bgClass)}>
                    <span className={cn('block w-2 h-2 rounded-full', dotColor)} />
                </div>
            )}

            {/* Content */}
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">{stat.label}</p>
                <div className="flex items-end justify-between gap-2 mt-0.5">
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 leading-none">{stat.value}</p>
                    {stat.chart && stat.chart.length >= 2 && (
                        <Sparkline data={stat.chart} color={sparkColor} />
                    )}
                </div>

                {/* Trend + description row */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {hasTrend && (
                        <span className={cn(
                            'inline-flex items-center gap-0.5 text-xs font-semibold',
                            stat.trend! > 0 ? 'text-green-600 dark:text-green-400'
                                : stat.trend! < 0 ? 'text-red-500 dark:text-red-400'
                                    : 'text-zinc-400',
                        )}>
                            {stat.trend! > 0
                                ? <TrendingUp className="w-3 h-3" />
                                : stat.trend! < 0
                                    ? <TrendingDown className="w-3 h-3" />
                                    : <Minus className="w-3 h-3" />
                            }
                            {Math.abs(stat.trend!)}%
                        </span>
                    )}

                    {stat.description && (
                        <span className={cn('text-xs flex items-center gap-0.5', descClass)}>
                            {stat.descriptionIcon && stat.descriptionIconPosition !== 'after' && (
                                <InlineIcon name={stat.descriptionIcon} />
                            )}
                            {stat.description}
                            {stat.descriptionIcon && stat.descriptionIconPosition === 'after' && (
                                <InlineIcon name={stat.descriptionIcon} />
                            )}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function StatsOverview({ widget }: { widget: StatsOverviewWidgetData }) {
    return (
        <div className="col-span-full">
            {(widget.heading || widget.description) && (
                <div className="mb-3">
                    {widget.heading && (
                        <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                            {widget.heading}
                        </h3>
                    )}
                    {widget.description && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{widget.description}</p>
                    )}
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {widget.stats.map((stat, i) => (
                    <StatCard key={i} stat={stat} />
                ))}
            </div>
        </div>
    );
}
