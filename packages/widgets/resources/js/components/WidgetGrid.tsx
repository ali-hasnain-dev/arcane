import React, { useState, useEffect, useCallback, useRef } from 'react';
import StatsOverview from './StatsOverview';
import ChartWidgetComponent from './ChartWidget';
import TableWidgetComponent from './TableWidget';
import type { WidgetMeta, WidgetData } from '../types';
import { WidgetAnimationStyles } from '../lib/animations';

// ── Polling interval parser ───────────────────────────────────────────────────
function parseMs(value: string | null | undefined): number | null {
    if (!value) return null;
    const m = value.match(/^(\d+(?:\.\d+)?)(s|m|h)$/);
    if (!m) return null;
    const n = parseFloat(m[1]);
    if (m[2] === 's') return n * 1_000;
    if (m[2] === 'm') return n * 60_000;
    if (m[2] === 'h') return n * 3_600_000;
    return null;
}

// ── Column span helper ────────────────────────────────────────────────────────
function colSpanClass(span: number | string | undefined): string {
    if (span === 'full' || span === 2) return 'col-span-full';
    return 'col-span-1';
}

// ── Initial-load skeletons (full placeholder including header area) ────────────

function StatsOverviewSkeleton({ count = 3 }: { count: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 animate-pulse">
                    <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded mb-3" />
                    <div className="h-7 w-24 bg-zinc-100 dark:bg-zinc-800 rounded mb-2" />
                    <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
                </div>
            ))}
        </div>
    );
}

function ChartSkeleton() {
    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 animate-pulse flex flex-col">
            <div className="h-3 w-28 bg-zinc-100 dark:bg-zinc-800 rounded mb-4 shrink-0" />
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded h-48" />
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 animate-pulse">
            <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded mb-4" />
            <div className="space-y-2">
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-3 bg-zinc-50 dark:bg-zinc-800/60 rounded w-full" />
                ))}
            </div>
        </div>
    );
}

function WidgetFullSkeleton({ type, count }: { type: string; count: number }) {
    if (type === 'stats_overview') return <StatsOverviewSkeleton count={count} />;
    if (type === 'chart')          return <ChartSkeleton />;
    if (type === 'table')          return <TableSkeleton />;
    return <ChartSkeleton />;
}

// ── Poll skeletons (real heading stays, only body is skeletonized) ────────────
// Each matches the card shell of the actual widget component so the
// locked container height is filled correctly without layout shift.

function StatsOverviewPollSkeleton({ meta, count }: { meta: WidgetMeta; count: number }) {
    return (
        <>
            {(meta.heading || meta.description) && (
                <div className="mb-3">
                    {meta.heading && (
                        <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                            {meta.heading}
                        </h3>
                    )}
                    {meta.description && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{meta.description}</p>
                    )}
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 animate-pulse">
                        <div className="h-7 w-24 bg-zinc-100 dark:bg-zinc-800 rounded mb-2" />
                        <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
                    </div>
                ))}
            </div>
        </>
    );
}

function ChartPollSkeleton({ meta }: { meta: WidgetMeta }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-full">
            {(meta.heading || meta.description) && (
                <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2 shrink-0">
                    <div className="min-w-0 flex-1">
                        {meta.heading && (
                            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 leading-tight">{meta.heading}</p>
                        )}
                        {meta.description && (
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{meta.description}</p>
                        )}
                    </div>
                </div>
            )}
            <div className="flex-1 px-4 pb-4 pt-1 animate-pulse min-h-0">
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded h-full min-h-[12rem]" />
            </div>
        </div>
    );
}

function TablePollSkeleton({ meta }: { meta: WidgetMeta }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            {(meta.heading || meta.description) && (
                <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                    {meta.heading && (
                        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{meta.heading}</p>
                    )}
                    {meta.description && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{meta.description}</p>
                    )}
                </div>
            )}
            <div className="p-5 animate-pulse space-y-2">
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-3 bg-zinc-50 dark:bg-zinc-800/60 rounded w-full" />
                ))}
            </div>
        </div>
    );
}

function WidgetPollSkeleton({ type, meta, count }: { type: string; meta: WidgetMeta; count: number }) {
    if (type === 'stats_overview') return <StatsOverviewPollSkeleton meta={meta} count={count} />;
    if (type === 'chart')          return <ChartPollSkeleton meta={meta} />;
    if (type === 'table')          return <TablePollSkeleton meta={meta} />;
    return <ChartPollSkeleton meta={meta} />;
}

// ── Widget renderer ───────────────────────────────────────────────────────────

function WidgetContent({ widget, animated }: { widget: WidgetData; animated: boolean }) {
    switch (widget.type) {
        // `animated` flows into the data itself: stat numbers count up, chart
        // lines draw in / bars grow. The card is never animated as a whole.
        case 'stats_overview': return <StatsOverview widget={widget as any} animated={animated} />;
        case 'chart':          return <ChartWidgetComponent widget={widget as any} animated={animated} />;
        case 'table':          return <TableWidgetComponent widget={widget as any} />;
        default:               return null;
    }
}

// ── Per-widget card ───────────────────────────────────────────────────────────

function WidgetCard({ meta, widgetDataUrl, animate }: {
    meta: WidgetMeta;
    widgetDataUrl: string;
    animate: boolean;
}) {
    const [data, setData]           = useState<WidgetData | null>(null);
    const [loading, setLoading]     = useState(true);
    // Track actual stat count from first payload so skeleton always matches.
    const [statCount, setStatCount] = useState<number>(3);
    // Data animations play once, the first time real content is revealed — not
    // on polling refreshes (which would make numbers re-count / lines redraw).
    const [entered, setEntered]     = useState(false);
    const wrapperRef                = useRef<HTMLDivElement>(null);
    const lockedHeight              = useRef<number | null>(null);
    const abortRef                  = useRef<AbortController | null>(null);
    // Flip to true after the first successful fetch so we know polling is active.
    const hasLoadedOnce             = useRef(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        try {
            const url = `${widgetDataUrl}?class=${encodeURIComponent(meta.widgetClass)}`;
            const res = await fetch(url, {
                signal: abortRef.current.signal,
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!res.ok) return;
            const payload = await res.json();
            // Keep stat count in sync so the poll skeleton renders the right number of cards.
            if (Array.isArray(payload.stats)) {
                setStatCount(payload.stats.length);
            }
            setData({ ...meta, ...payload });
            hasLoadedOnce.current = true;
        } catch (e: unknown) {
            if (e instanceof Error && e.name !== 'AbortError') {
                console.error('[WidgetCard] fetch error', e);
            }
        } finally {
            setLoading(false);
            lockedHeight.current = null;
        }
    }, [meta.widgetClass, widgetDataUrl]);

    // Initial fetch
    useEffect(() => {
        fetchData();
        return () => abortRef.current?.abort();
    }, [fetchData]);

    // Mark the data animation as spent once it has had time to play, so polling
    // refreshes re-render without replaying it. The delay comfortably covers the
    // count-up (~0.9s) and chart draw (~0.9s).
    useEffect(() => {
        if (!animate || entered || !data) return;
        const t = setTimeout(() => setEntered(true), 1300);
        return () => clearTimeout(t);
    }, [animate, entered, data]);

    // Polling — snapshot height just before replacing content with skeleton
    useEffect(() => {
        if (!meta.pollingInterval) return;
        const ms = parseMs(meta.pollingInterval);
        if (!ms) return;
        const timer = setInterval(() => {
            if (wrapperRef.current) {
                lockedHeight.current = wrapperRef.current.offsetHeight;
            }
            fetchData();
        }, ms);
        return () => clearInterval(timer);
    }, [meta.pollingInterval, fetchData]);

    // isPolling = we are loading AND we have already shown real content once.
    // The distinction matters: initial load shows a full placeholder skeleton,
    // while polling shows the real heading + a body-only skeleton to prevent
    // heading text from disappearing mid-refresh.
    const isPolling = loading && hasLoadedOnce.current;

    // Animate the data only on the first reveal (entered stays false until the
    // timer above fires), never on polling refreshes.
    const animateNow = animate && !entered;

    return (
        <div
            ref={wrapperRef}
            style={isPolling && lockedHeight.current !== null
                ? { height: lockedHeight.current, overflow: 'hidden' }
                : undefined}
        >
            {loading
                ? isPolling
                    ? <WidgetPollSkeleton type={meta.type} meta={meta} count={statCount} />
                    : <WidgetFullSkeleton type={meta.type} count={statCount} />
                : data
                    ? <WidgetContent widget={data} animated={animateNow} />
                    : null
            }
        </div>
    );
}

// ── Grid ──────────────────────────────────────────────────────────────────────

export default function WidgetGrid({ widgets, widgetDataUrl, animate = false }: {
    widgets: WidgetMeta[];
    widgetDataUrl: string;
    /** Animate the data inside each widget on first load. Off by default. */
    animate?: boolean;
}) {
    if (!widgets || widgets.length === 0) return null;

    const sorted = [...widgets].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

    return (
        <>
            {animate && <WidgetAnimationStyles />}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                {sorted.map((meta, i) => (
                    <div key={meta.widgetClass ?? i} className={colSpanClass(meta.columnSpan)}>
                        <WidgetCard meta={meta} widgetDataUrl={widgetDataUrl} animate={animate} />
                    </div>
                ))}
            </div>
        </>
    );
}
