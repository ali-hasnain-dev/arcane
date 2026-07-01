import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronDown as SelectArrow } from 'lucide-react';
import { cn } from '../lib/utils';
import { useReveal } from '../lib/animations';

// ── Color palette ─────────────────────────────────────────────────────────────

const PALETTE = ['#18181b', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#0ea5e9', '#84cc16'];

/** Read --larafusion-primary from CSS vars at runtime so it tracks the active theme. */
function getPrimaryColor(): string {
    if (typeof document !== 'undefined') {
        const v = getComputedStyle(document.documentElement).getPropertyValue('--larafusion-primary').trim();
        if (v) return v;
    }
    return '#292524';
}

const SEMANTIC_STATIC: Record<string, string> = {
    success: '#10b981',
    warning: '#f59e0b',
    danger:  '#ef4444',
    info:    '#0ea5e9',
    gray:    '#a1a1aa',
};

function resolveColor(token: string, fallback: string): string {
    if (token === 'primary') return getPrimaryColor();
    return SEMANTIC_STATIC[token] ?? (token.startsWith('#') ? token : fallback);
}

// ── Shared types ──────────────────────────────────────────────────────────────

interface Dataset {
    label?: string;
    data: number[] | Array<{ x: number; y: number; r?: number }>;
    color?: string;
}

interface ChartWidgetData {
    heading?: string | null;
    description?: string | null;
    chartType: string;
    color?: string;
    labels: string[];
    datasets: Dataset[];
    filterOptions?: Record<string, string>;
    activeFilter?: string | null;
    hasDeferredFilters?: boolean;
    maxHeight?: string | null;
    options?: Record<string, unknown>;
    isCollapsible?: boolean;
    isCollapsed?: boolean;
}

// ── Smooth bezier path builder ────────────────────────────────────────────────

function smoothPath(points: [number, number][]): string {
    if (points.length < 2) return '';
    const tension = 0.35;
    let d = `M${points[0][0]},${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
        const [x0, y0] = points[i];
        const [x1, y1] = points[i + 1];
        const dx = (x1 - x0) * tension;
        d += ` C${x0 + dx},${y0} ${x1 - dx},${y1} ${x1},${y1}`;
    }
    return d;
}

// ── Cartesian chart (line / bar) ──────────────────────────────────────────────

function CartesianChart({ widget, color, animated }: { widget: ChartWidgetData; color: string; animated: boolean }) {
    const W = 480, H = 200;
    const PAD = { top: 12, right: 12, bottom: 32, left: 40 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const allValues = widget.datasets.flatMap(d => d.data as number[]);
    const minVal = Math.min(0, ...allValues);
    const maxVal = Math.max(...allValues, 1);
    const range = maxVal - minVal || 1;

    const labels = widget.labels;
    const n = labels.length;
    const isBar = widget.chartType === 'bar';
    const step = isBar ? innerW / n : innerW / Math.max(n - 1, 1);

    const xPos = (i: number) => isBar ? PAD.left + i * step + step / 2 : PAD.left + i * step;
    const yPos = (v: number) => PAD.top + innerH - ((v - minVal) / range) * innerH;
    const baseY = yPos(0);

    const ticks = [0, 0.5, 1].map(t => ({
        y: PAD.top + innerH * (1 - t),
        label: (() => {
            const v = minVal + range * t;
            return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v));
        })(),
    }));

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
            <defs>
                {widget.datasets.map((ds, di) => {
                    const c = resolveColor(ds.color ?? color, PALETTE[di % PALETTE.length]);
                    return (
                        <linearGradient key={di} id={`cg-${di}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={c} stopOpacity="0.18" />
                            <stop offset="100%" stopColor={c} stopOpacity="0" />
                        </linearGradient>
                    );
                })}
            </defs>
            {/* grid lines */}
            {ticks.map((t, i) => (
                <g key={i}>
                    <line x1={PAD.left} y1={t.y} x2={PAD.left + innerW} y2={t.y}
                        className="stroke-zinc-200 dark:stroke-zinc-800"
                        strokeWidth="1" strokeDasharray={i === 0 ? '' : '4 3'} />
                    <text x={PAD.left - 6} y={t.y + 4} textAnchor="end"
                        fontSize="9" className="fill-zinc-400 dark:fill-zinc-500">{t.label}</text>
                </g>
            ))}
            {/* x labels */}
            {labels.map((lbl, i) => (
                <text key={i} x={xPos(i)} y={H - PAD.bottom + 13}
                    textAnchor="middle" fontSize="9" className="fill-zinc-400 dark:fill-zinc-500">
                    {lbl.length > 8 ? lbl.slice(0, 7) + '…' : lbl}
                </text>
            ))}
            {/* datasets */}
            {widget.datasets.map((ds, di) => {
                const c = resolveColor(ds.color ?? color, PALETTE[di % PALETTE.length]);
                const data = ds.data as number[];

                if (isBar) {
                    const totalSets = widget.datasets.length;
                    const barW = Math.max(6, (step * 0.7) / totalSets);
                    const groupW = barW * totalSets + (totalSets - 1) * 3;
                    const offsetX = (di - (totalSets - 1) / 2) * (barW + 3);
                    return (
                        <g key={di}>
                            {data.map((v, i) => {
                                const by = yPos(Math.max(v, 0));
                                const bh = Math.max(baseY - by, 2);
                                const bx = xPos(i) + offsetX - barW / 2;
                                return (
                                    <rect key={i} x={bx} y={by} width={barW} height={bh}
                                        fill={c} rx="3" opacity="0.9"
                                        {...(animated ? {
                                            'data-lf-anim': '',
                                            style: {
                                                transformBox: 'fill-box',
                                                transformOrigin: 'center bottom',
                                                animation: 'lf-grow-up .7s cubic-bezier(.21,1.02,.73,1) both',
                                                animationDelay: `${i * 40}ms`,
                                            },
                                        } : {})} />
                                );
                            })}
                        </g>
                    );
                }

                const pts = data.map((v, i) => [xPos(i), yPos(v)] as [number, number]);
                const linePath = smoothPath(pts);
                const areaPath = linePath
                    + ` L${pts[pts.length - 1][0]},${baseY} L${pts[0][0]},${baseY} Z`;

                // The line + area are clipped by a rect that wipes open left→right,
                // so the whole series appears to grow across the chart. Points then
                // pop in just behind the leading edge for a polished finish.
                const clipId = `wipe-${di}`;
                return (
                    <g key={di}>
                        {animated && (
                            <clipPath id={clipId}>
                                <rect x={PAD.left} y="0" width={innerW} height={H}
                                    data-lf-anim=""
                                    style={{
                                        transformBox: 'fill-box',
                                        transformOrigin: 'left',
                                        animation: 'lf-wipe 1s cubic-bezier(.22,.61,.36,1) both',
                                    }} />
                            </clipPath>
                        )}
                        <g clipPath={animated ? `url(#${clipId})` : undefined}>
                            <path d={areaPath} fill={`url(#cg-${di})`} />
                            <path d={linePath} fill="none" stroke={c} strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                        {pts.map(([cx, cy], i) => (
                            <circle key={i} cx={cx} cy={cy} r="3"
                                fill="white" stroke={c} strokeWidth="2" className="dark:fill-zinc-900"
                                {...(animated ? {
                                    'data-lf-anim': '',
                                    style: {
                                        transformBox: 'fill-box',
                                        transformOrigin: 'center',
                                        animation: 'lf-pop .32s cubic-bezier(.34,1.56,.64,1) both',
                                        animationDelay: `${(i / Math.max(pts.length - 1, 1)) * 0.9}s`,
                                    },
                                } : {})} />
                        ))}
                    </g>
                );
            })}
        </svg>
    );
}

// ── Doughnut / Pie ─────────────────────────────────────────────────────────────

function PieChart({ widget, color, isDoughnut, animated }: { widget: ChartWidgetData; color: string; isDoughnut: boolean; animated: boolean }) {
    const cx = 100, cy = 100, R = 75, r = isDoughnut ? 44 : 0;
    const data = widget.datasets.map((ds, i) => ({
        label: ds.label ?? `Series ${i + 1}`,
        value: (ds.data as number[])[0] ?? 0,
        color: resolveColor(ds.color ?? color, PALETTE[i % PALETTE.length]),
    }));
    const total = data.reduce((s, d) => s + d.value, 0) || 1;

    let angle = -Math.PI / 2;
    const slices = data.map(d => {
        const sweep = (d.value / total) * 2 * Math.PI;
        const start = angle;
        angle += sweep;
        return { ...d, start, sweep };
    });

    const arc = (cx: number, cy: number, R: number, r: number, start: number, sweep: number) => {
        const x1 = cx + R * Math.cos(start);
        const y1 = cy + R * Math.sin(start);
        const x2 = cx + R * Math.cos(start + sweep);
        const y2 = cy + R * Math.sin(start + sweep);
        const large = sweep > Math.PI ? 1 : 0;
        if (r === 0) {
            return `M${cx} ${cy} L${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
        }
        const ix1 = cx + r * Math.cos(start + sweep);
        const iy1 = cy + r * Math.sin(start + sweep);
        const ix2 = cx + r * Math.cos(start);
        const iy2 = cy + r * Math.sin(start);
        return `M${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} L${ix1} ${iy1} A${r} ${r} 0 ${large} 0 ${ix2} ${iy2} Z`;
    };

    // Slices sweep around clockwise together: a single revealed angle grows from
    // the 12-o'clock start to a full turn, and each slice draws only the portion
    // that has been reached. The doughnut centre total counts up in lock-step.
    const progress = useReveal(animated);
    const startBase = -Math.PI / 2;
    const revealedEnd = startBase + progress * 2 * Math.PI;

    return (
        <div className="flex items-center gap-6">
            <svg viewBox="0 0 200 200" className="w-36 h-36 flex-shrink-0">
                {slices.map((s, i) => {
                    const drawn = Math.max(0, Math.min(s.sweep, revealedEnd - s.start));
                    if (drawn <= 0.0001) return null;
                    return <path key={i} d={arc(cx, cy, R, r, s.start, drawn)} fill={s.color} />;
                })}
                {isDoughnut && (
                    <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fontWeight="bold"
                        className="fill-zinc-900 dark:fill-zinc-50">
                        {Math.round(total * progress)}
                    </text>
                )}
            </svg>
            <div className="space-y-1.5 min-w-0">
                {slices.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{s.label}</span>
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 ml-auto pl-2">
                            {s.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Radar chart ───────────────────────────────────────────────────────────────

function RadarChart({ widget, color, animated }: { widget: ChartWidgetData; color: string; animated: boolean }) {
    const cx = 110, cy = 110, R = 85;
    const axes = widget.labels.length || 5;
    // Grow the plotted series out from the centre — the grid/axes stay put while
    // the data polygon expands to its true radius.
    const progress = useReveal(animated);
    const points = (values: number[], max: number) =>
        Array.from({ length: axes }, (_, i) => {
            const angle = (i / axes) * 2 * Math.PI - Math.PI / 2;
            const r = ((values[i] ?? 0) / max) * R * progress;
            return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as [number, number];
        });

    const allVals = widget.datasets.flatMap(d => d.data as number[]);
    const maxVal = Math.max(...allVals, 1);

    const gridLevels = [0.25, 0.5, 0.75, 1];

    return (
        <svg viewBox="0 0 220 220" className="w-full h-auto" style={{ maxHeight: 220 }}>
            {/* Grid rings */}
            {gridLevels.map((lv, li) => {
                const ring = Array.from({ length: axes }, (_, i) => {
                    const angle = (i / axes) * 2 * Math.PI - Math.PI / 2;
                    return `${cx + R * lv * Math.cos(angle)},${cy + R * lv * Math.sin(angle)}`;
                }).join(' ');
                return <polygon key={li} points={ring} fill="none" className="stroke-zinc-200 dark:stroke-zinc-700" strokeWidth="1" />;
            })}
            {/* Axes */}
            {Array.from({ length: axes }, (_, i) => {
                const angle = (i / axes) * 2 * Math.PI - Math.PI / 2;
                return (
                    <g key={i}>
                        <line x1={cx} y1={cy}
                            x2={cx + R * Math.cos(angle)} y2={cy + R * Math.sin(angle)}
                            className="stroke-zinc-200 dark:stroke-zinc-700" strokeWidth="1" />
                        <text
                            x={cx + (R + 12) * Math.cos(angle)}
                            y={cy + (R + 12) * Math.sin(angle)}
                            textAnchor="middle" dominantBaseline="middle"
                            fontSize="9" className="fill-zinc-400 dark:fill-zinc-500">
                            {widget.labels[i] ?? `A${i + 1}`}
                        </text>
                    </g>
                );
            })}
            {/* Datasets */}
            {widget.datasets.map((ds, di) => {
                const c = resolveColor(ds.color ?? color, PALETTE[di % PALETTE.length]);
                const pts = points(ds.data as number[], maxVal)
                    .map(([x, y]) => `${x},${y}`).join(' ');
                return (
                    <g key={di}>
                        <polygon points={pts} fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1.5" />
                        {points(ds.data as number[], maxVal).map(([x, y], i) => (
                            <circle key={i} cx={x} cy={y} r="3" fill={c} stroke="white" strokeWidth="1" />
                        ))}
                    </g>
                );
            })}
        </svg>
    );
}

// ── Polar area chart ──────────────────────────────────────────────────────────

function PolarAreaChart({ widget, color, animated }: { widget: ChartWidgetData; color: string; animated: boolean }) {
    const cx = 100, cy = 100;
    const data = widget.datasets.flatMap((ds, di) =>
        (ds.data as number[]).map((v, i) => ({
            value: v,
            label: widget.labels[i] ?? ds.label ?? `Slice ${i + 1}`,
            color: resolveColor(ds.color ?? color, PALETTE[(di * 10 + i) % PALETTE.length]),
        }))
    );
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const n = data.length;
    // Wedges grow out from the centre to their real radius.
    const progress = useReveal(animated);

    return (
        <div className="flex items-center gap-4">
            <svg viewBox="0 0 200 200" className="w-36 h-36 flex-shrink-0">
                {data.map((d, i) => {
                    const startAngle = (i / n) * 2 * Math.PI - Math.PI / 2;
                    const endAngle = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
                    const R = (d.value / maxVal) * 80 * progress;
                    const x1 = cx + R * Math.cos(startAngle);
                    const y1 = cy + R * Math.sin(startAngle);
                    const x2 = cx + R * Math.cos(endAngle);
                    const y2 = cy + R * Math.sin(endAngle);
                    const large = (1 / n) > 0.5 ? 1 : 0;
                    return (
                        <path key={i}
                            d={`M${cx} ${cy} L${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`}
                            fill={d.color} opacity="0.85" />
                    );
                })}
            </svg>
            <div className="space-y-1 min-w-0">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{d.label}</span>
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 ml-auto pl-1">{d.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Bubble / Scatter chart ────────────────────────────────────────────────────

function ScatterChart({ widget, color, isBubble, animated }: { widget: ChartWidgetData; color: string; isBubble: boolean; animated: boolean }) {
    const W = 480, H = 220;
    const PAD = { top: 16, right: 16, bottom: 36, left: 44 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    type Point = { x: number; y: number; r?: number };
    const allPoints = widget.datasets.flatMap(d => d.data as Point[]);
    const xs = allPoints.map(p => p.x);
    const ys = allPoints.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs, 1);
    const minY = Math.min(0, ...ys), maxY = Math.max(...ys, 1);
    const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1;

    const xPos = (x: number) => PAD.left + ((x - minX) / rangeX) * innerW;
    const yPos = (y: number) => PAD.top + innerH - ((y - minY) / rangeY) * innerH;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
            {[0, 0.5, 1].map((t, i) => (
                <g key={i}>
                    <line x1={PAD.left} y1={PAD.top + innerH * (1 - t)}
                        x2={PAD.left + innerW} y2={PAD.top + innerH * (1 - t)}
                        className="stroke-zinc-200 dark:stroke-zinc-700" strokeWidth="1" />
                    <text x={PAD.left - 6} y={PAD.top + innerH * (1 - t) + 4}
                        textAnchor="end" fontSize="10" className="fill-zinc-400 dark:fill-zinc-500">
                        {Math.round(minY + rangeY * t)}
                    </text>
                </g>
            ))}
            {widget.datasets.map((ds, di) => {
                const c = resolveColor(ds.color ?? color, PALETTE[di % PALETTE.length]);
                return (ds.data as Point[]).map((pt, pi) => (
                    <circle key={`${di}-${pi}`}
                        cx={xPos(pt.x)} cy={yPos(pt.y)}
                        r={isBubble ? Math.max(3, (pt.r ?? 5)) : 4}
                        fill={c} fillOpacity="0.7" stroke="white" strokeWidth="1"
                        {...(animated ? {
                            'data-lf-anim': '',
                            style: {
                                transformBox: 'fill-box',
                                transformOrigin: 'center',
                                animation: 'lf-pop .4s cubic-bezier(.34,1.56,.64,1) both',
                                animationDelay: `${(pi % 20) * 30}ms`,
                            },
                        } : {})} />
                ));
            })}
        </svg>
    );
}

// ── Filter dropdown ───────────────────────────────────────────────────────────

function FilterSelect({
    options,
    value,
    onChange,
    deferred,
    onApply,
}: {
    options: Record<string, string>;
    value: string | null;
    onChange: (v: string) => void;
    deferred: boolean;
    onApply?: () => void;
}) {
    const [pending, setPending] = useState(value);

    if (!options || Object.keys(options).length === 0) return null;

    const handleChange = (v: string) => {
        if (deferred) {
            setPending(v);
        } else {
            onChange(v);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <div className="relative">
                <select
                    value={deferred ? (pending ?? '') : (value ?? '')}
                    onChange={e => handleChange(e.target.value)}
                    className="appearance-none text-xs border border-zinc-200 dark:border-zinc-700 rounded-md pl-2.5 pr-7 py-1.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[var(--larafusion-primary,#292524)]"
                >
                    {Object.entries(options).map(([k, label]) => (
                        <option key={k} value={k}>{label}</option>
                    ))}
                </select>
                <SelectArrow className="w-3 h-3 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {deferred && (
                <button
                    onClick={() => { onChange(pending ?? ''); onApply?.(); }}
                    className="text-xs px-2.5 py-1.5 bg-[var(--larafusion-primary,#292524)] text-white rounded-md hover:opacity-90 transition-opacity"
                >
                    Apply
                </button>
            )}
        </div>
    );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ChartWidgetComponent({ widget, animated = false }: { widget: ChartWidgetData; animated?: boolean }) {
    const [collapsed, setCollapsed] = useState(widget.isCollapsed ?? false);
    const [activeFilter, setActiveFilter] = useState<string | null>(widget.activeFilter ?? null);

    const mainColor = resolveColor(widget.color ?? 'primary', PALETTE[0]);
    const chartType = widget.chartType ?? 'line';

    const hasFilters = widget.filterOptions && Object.keys(widget.filterOptions).length > 0;
    const maxH = widget.maxHeight ? { maxHeight: widget.maxHeight, overflow: 'hidden' } : {};

    function renderChart() {
        switch (chartType) {
            case 'doughnut':
                return <PieChart widget={widget} color={mainColor} isDoughnut={true} animated={animated} />;
            case 'pie':
                return <PieChart widget={widget} color={mainColor} isDoughnut={false} animated={animated} />;
            case 'radar':
                return <RadarChart widget={widget} color={mainColor} animated={animated} />;
            case 'polar-area':
            case 'polarArea':
                return <PolarAreaChart widget={widget} color={mainColor} animated={animated} />;
            case 'bubble':
                return <ScatterChart widget={widget} color={mainColor} isBubble={true} animated={animated} />;
            case 'scatter':
                return <ScatterChart widget={widget} color={mainColor} isBubble={false} animated={animated} />;
            default:
                return <CartesianChart widget={widget} color={mainColor} animated={animated} />;
        }
    }

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            {/* Header */}
            {(widget.heading || widget.description || hasFilters || widget.isCollapsible) && (
                <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
                    <div className="min-w-0 flex-1">
                        {widget.heading && (
                            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 leading-tight">{widget.heading}</p>
                        )}
                        {widget.description && (
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{widget.description}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {hasFilters && (
                            <FilterSelect
                                options={widget.filterOptions!}
                                value={activeFilter}
                                onChange={setActiveFilter}
                                deferred={widget.hasDeferredFilters ?? false}
                            />
                        )}
                        {widget.isCollapsible && (
                            <button
                                onClick={() => setCollapsed(c => !c)}
                                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                aria-label={collapsed ? 'Expand' : 'Collapse'}
                            >
                                {collapsed
                                    ? <ChevronDown className="w-4 h-4" />
                                    : <ChevronUp className="w-4 h-4" />}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Chart body */}
            {!collapsed && (
                <div style={maxH} className="px-4 pb-4 pt-1">
                    {renderChart()}

                    {/* Legend for multi-dataset charts */}
                    {['line', 'bar'].includes(chartType) && widget.datasets.length > 1 && (
                        <div className="flex flex-wrap gap-4 mt-3 px-1">
                            {widget.datasets.map((ds, i) => (
                                <span key={i} className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                    <span className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ background: resolveColor(ds.color ?? widget.color ?? 'primary', PALETTE[i % PALETTE.length]) }} />
                                    {ds.label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
