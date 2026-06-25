import React, { useState, useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PanelConfig } from '../../types';

interface SearchResult {
    resource: string;
    label: string;
    id: number | string;
    title: string;
    description: string | null;
    url: string;
    editUrl: string;
}

interface Props {
    panel?: Pick<PanelConfig, 'globalSearchMode' | 'globalSearchAlignment' | 'globalSearchSize' | 'path'>;
    /** Current visible sidebar width — used to offset the backdrop/overlay so the sidebar stays visible. */
    sidebarOffset?: string;
    /** True when the component is rendered inside the sidebar (no-topbar layout mode). */
    inSidebar?: boolean;
}

function groupByResource(results: SearchResult[]): Record<string, SearchResult[]> {
    const groups: Record<string, SearchResult[]> = {};
    for (const r of results) {
        if (!groups[r.label]) groups[r.label] = [];
        groups[r.label].push(r);
    }
    return groups;
}

export default function GlobalSearch({ panel, sidebarOffset, inSidebar = false }: Props) {
    const mode      = panel?.globalSearchMode      ?? 'dropdown';
    // When in sidebar, default alignment is 'center' (centred in the content area)
    const alignment = panel?.globalSearchAlignment ?? (inSidebar ? 'center' : 'center');
    const size      = panel?.globalSearchSize      ?? 'default';
    const adminPath = panel?.path                  ?? 'admin';

    const [open, setOpen]           = useState(false);
    const [query, setQuery]         = useState('');
    const [results, setResults]     = useState<SearchResult[]>([]);
    const [loading, setLoading]     = useState(false);
    const [activeIdx, setActiveIdx] = useState(0);

    const inputRef     = useRef<HTMLInputElement>(null);
    const debounce     = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // ── Click-outside to close (dropdown / sidebar modes) ─────────────────────
    useEffect(() => {
        if (mode === 'modal' && !inSidebar) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [mode, inSidebar]);

    // ── Keyboard shortcuts ─────────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (mode === 'modal' && !inSidebar) {
                    setOpen(o => !o);
                } else {
                    inputRef.current?.focus();
                }
            }
            if (e.key === 'Escape') {
                setOpen(false);
                if (mode === 'dropdown' || inSidebar) inputRef.current?.blur();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [mode, inSidebar]);

    // ── Focus input when modal opens; reset on close ──────────────────────────
    useEffect(() => {
        if (mode !== 'modal' || inSidebar) return;
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setResults([]);
            setActiveIdx(0);
        }
    }, [open, mode, inSidebar]);

    // ── Reset state when dropdown/sidebar closes ───────────────────────────────
    useEffect(() => {
        if (mode === 'modal' && !inSidebar) return;
        if (!open) {
            setQuery('');
            setResults([]);
            setActiveIdx(0);
        }
    }, [open, mode, inSidebar]);

    const search = useCallback((q: string) => {
        if (q.length < 2) { setResults([]); setLoading(false); return; }
        setLoading(true);
        fetch(`/${adminPath}/search?q=${encodeURIComponent(q)}`, {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(r => r.json())
            .then((data: SearchResult[]) => { setResults(data); setActiveIdx(0); })
            .finally(() => setLoading(false));
    }, [adminPath]);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (debounce.current) clearTimeout(debounce.current);
        debounce.current = setTimeout(() => search(val), 250);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
        if (e.key === 'Enter' && results[activeIdx]) {
            router.visit(results[activeIdx].url);
            setOpen(false);
        }
    };

    const clearQuery = () => {
        setQuery('');
        setResults([]);
        inputRef.current?.focus();
    };

    const groups = groupByResource(results);

    // ── Widths ─────────────────────────────────────────────────────────────────
    // Topbar dropdown: fixed narrow width
    const dropdownWidthClass = size === 'wide'
        ? 'w-[32rem] max-w-[calc(100vw-2rem)]'
        : 'w-80 max-w-[calc(100vw-2rem)]';

    // Modal: max-w controls the centred panel
    const modalWidthClass = size === 'wide' ? 'w-full max-w-2xl' : 'w-full max-w-xl';

    // Sidebar overlay panel: wider than topbar dropdown, responsive
    const sidebarPanelWidthClass = size === 'wide'
        ? 'w-full max-w-2xl'
        : 'w-full max-w-lg';

    // ── Topbar dropdown alignment (right-edge to right-edge of trigger) ────────
    const dropdownAlignClass =
        alignment === 'left' ? 'left-0 right-auto' :
                               'right-0 left-auto'; // 'right' and 'center' both right-align

    // ── Modal alignment ────────────────────────────────────────────────────────
    const modalAlignClass =
        alignment === 'left'  ? 'justify-start pl-4' :
        alignment === 'right' ? 'justify-end pr-4'   :
                                'justify-center';

    // ── Sidebar overlay alignment (within the content area right of sidebar) ──
    // The overlay container starts at sidebarOffset (left) and spans to the right
    // edge of the viewport. Inside it we align the panel per the panel option.
    const sidebarPanelAlignClass =
        alignment === 'left'  ? 'justify-start pl-4' :
        alignment === 'right' ? 'justify-end pr-4'   :
                                'justify-center';

    // ── Shared results body ────────────────────────────────────────────────────
    const resultsContent = (
        <>
            {results.length > 0 && (
                <div className="max-h-80 overflow-y-auto py-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-600">
                    {Object.entries(groups).map(([groupLabel, items]) => (
                        <div key={groupLabel}>
                            <div className="px-4 py-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                                {groupLabel}
                            </div>
                            {items.map(result => {
                                const idx = results.indexOf(result);
                                return (
                                    <button
                                        key={`${result.resource}-${result.id}`}
                                        type="button"
                                        onClick={() => { router.visit(result.url); setOpen(false); }}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                                            idx === activeIdx
                                                ? 'bg-[var(--larafusion-primary,#18181b)]/5 dark:bg-white/5'
                                                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800',
                                        )}
                                        onMouseEnter={() => setActiveIdx(idx)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{result.title}</p>
                                            {result.description && (
                                                <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{result.description}</p>
                                            )}
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0" />
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}

            {query.length >= 2 && !loading && results.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
                    No results for <span className="font-medium text-zinc-600 dark:text-zinc-300">"{query}"</span>
                </div>
            )}

            {results.length > 0 && (
                <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-2 flex items-center justify-end gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                    <span><kbd className="font-mono bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300 px-1 rounded">↑↓</kbd> navigate</span>
                    <span><kbd className="font-mono bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300 px-1 rounded">↵</kbd> open</span>
                    <span><kbd className="font-mono bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300 px-1 rounded">Esc</kbd> close</span>
                </div>
            )}
        </>
    );

    // ── Shared panel chrome ────────────────────────────────────────────────────
    const panelChrome = (inputPlaceholder: string) => (
        <div className={cn(
            'bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden',
            'border border-zinc-200 dark:border-zinc-800',
        )}>
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
                {loading
                    ? <Loader2 className="w-5 h-5 text-zinc-400 dark:text-zinc-500 shrink-0 animate-spin" />
                    : <Search  className="w-5 h-5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                }
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={inputPlaceholder}
                    className="flex-1 min-w-0 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none bg-transparent"
                />
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            {resultsContent}
        </div>
    );

    // ══════════════════════════════════════════════════════════════════════════
    // ── SIDEBAR MODE ──────────────────────────────────────────────────────────
    // Input is full-width inside the sidebar. Results drop down directly below
    // the input as an absolute-positioned panel (not a modal overlay).
    // ══════════════════════════════════════════════════════════════════════════
    if (inSidebar) {
        const showDropdown = open && (results.length > 0 || (query.length >= 2 && !loading));

        return (
            <>
                {/* Transparent backdrop — closes the dropdown on outside click */}
                {showDropdown && (
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                )}

                <div ref={containerRef} className="w-full relative">
                    {/* Full-width search input */}
                    <div className={cn(
                        'flex items-center gap-2 px-3 py-2',
                        'border border-zinc-200 dark:border-zinc-700 rounded-lg',
                        'bg-white dark:bg-zinc-800/60',
                        'focus-within:border-zinc-300 dark:focus-within:border-zinc-600',
                        'transition-colors w-full overflow-hidden',
                    )}>
                        {loading
                            ? <Loader2 className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500 animate-spin" />
                            : <Search  className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                        }
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={handleInput}
                            onFocus={() => setOpen(true)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search…"
                            className="flex-1 min-w-0 text-sm text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none bg-transparent"
                        />
                        {query ? (
                            <button type="button" onClick={clearQuery} className="shrink-0 p-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                                <X className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                            </button>
                        ) : (
                            <kbd className="shrink-0 text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-400 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
                        )}
                    </div>

                    {/* Dropdown results — drops below the input, wider than the sidebar */}
                    {showDropdown && (
                        <div className={cn(
                            'absolute top-full mt-2 left-0 z-50',
                            'bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden',
                            'border border-zinc-200 dark:border-zinc-800',
                            sidebarPanelWidthClass,
                        )}>
                            {resultsContent}
                        </div>
                    )}
                </div>
            </>
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ── TOPBAR DROPDOWN MODE ──────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════════
    if (mode === 'dropdown') {
        return (
            <>
                <div className="relative" ref={containerRef}>
                    <div className={cn(
                        'hidden md:flex items-center gap-2 px-3 py-1.5',
                        'border border-zinc-200 dark:border-zinc-700 rounded-lg',
                        'bg-white dark:bg-zinc-900',
                        'focus-within:border-zinc-300 dark:focus-within:border-zinc-600',
                        'transition-colors w-48 overflow-hidden',
                    )}>
                        {loading
                            ? <Loader2 className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500 animate-spin" />
                            : <Search  className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                        }
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={handleInput}
                            onFocus={() => setOpen(true)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search…"
                            className="flex-1 min-w-0 text-sm text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none bg-transparent"
                        />
                        {query ? (
                            <button type="button" onClick={clearQuery} className="p-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                <X className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                            </button>
                        ) : (
                            <kbd className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-400 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
                        )}
                    </div>

                    {/* Results dropdown — right-aligned to the search bar */}
                    {open && (results.length > 0 || (query.length >= 2 && !loading)) && (
                        <div className={cn(
                            'absolute top-full mt-2 z-50',
                            'bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden',
                            'border border-zinc-200 dark:border-zinc-800',
                            dropdownAlignClass,
                            dropdownWidthClass,
                        )}>
                            {resultsContent}
                        </div>
                    )}
                </div>

                {/* Transparent backdrop — closes results on outside click */}
                {open && (
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                )}
            </>
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ── MODAL MODE ────────────────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════════
    return (
        <>
            <div ref={containerRef}>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors w-48 bg-white dark:bg-zinc-900"
                >
                    <Search className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">Search…</span>
                    <kbd className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-400 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
                </button>
            </div>

            {open && (
                <div className={cn(
                    'fixed inset-0 z-50 flex items-start pt-[12vh] px-4',
                    modalAlignClass,
                )}>
                    {/* Backdrop — starts after sidebar when sidebarOffset is provided */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        style={sidebarOffset ? { left: sidebarOffset } : undefined}
                        onClick={() => setOpen(false)}
                    />
                    <div className={cn('relative', modalWidthClass)}>
                        {panelChrome('Search across all resources…')}
                    </div>
                </div>
            )}
        </>
    );
}
