import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { router } from '@inertiajs/react';
import { X, Filter, RotateCcw, ChevronDown, ChevronUp, Check, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { colorClass } from '../lib/colors';
import { resolveIcon } from '../lib/icons';
import { Column } from '../types';

// Per-option metadata (icon / color / description) — populated from an enum's
// HasColor / HasIcon / HasDescription contracts, or from manual maps.
export interface OptionMeta {
    color?: string;
    icon?: string;
    description?: string;
}

// Merge separate value→color / value→icon / value→description maps into a single
// value→{color,icon,description} lookup. Returns undefined when there's nothing,
// so callers can cheaply tell "plain options" from "enum-style options".
function buildOptionMeta(
    colors?: Record<string, string>,
    icons?: Record<string, string>,
    descriptions?: Record<string, string>,
): Record<string, OptionMeta> | undefined {
    if (!colors && !icons && !descriptions) return undefined;
    const out: Record<string, OptionMeta> = {};
    const add = (map: Record<string, string> | undefined, key: keyof OptionMeta) => {
        if (!map) return;
        for (const [v, val] of Object.entries(map)) {
            (out[v] ??= {})[key] = val;
        }
    };
    add(colors, 'color');
    add(icons, 'icon');
    add(descriptions, 'description');
    return Object.keys(out).length ? out : undefined;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StandaloneFilter {
    name: string;
    label: string;
    type: 'boolean' | 'select' | 'date_range' | 'ternary' | 'trashed' | string;
    options?: Record<string, string>;
    optionColors?: Record<string, string>;
    optionIcons?: Record<string, string>;
    optionDescriptions?: Record<string, string>;
    multiple?: boolean;
    searchable?: boolean;
    trueLabel?: string;
    falseLabel?: string;
    placeholder?: string;
    default?: string | string[] | null;
    indicator?: string | null;
}

export type FiltersLayout =
    | 'dropdown'
    | 'drawer' | 'modal'
    | 'above' | 'above_collapsible' | 'below'
    | 'before_content' | 'before_content_collapsible'
    | 'after_content'  | 'after_content_collapsible';

export interface FilterValues {
    [field: string]: string | { from?: string; to?: string } | string[];
}

interface FilterPanelProps {
    resourceSlug: string;
    columns: Column[];
    standaloneFilters?: StandaloneFilter[];
    layout?: FiltersLayout;
    formColumns?: number;
    formWidth?: string;
    formMaxHeight?: string;
    hideIndicators?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFilterParams(filters: FilterValues): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [field, val] of Object.entries(filters)) {
        if (Array.isArray(val)) {
            if (val.length > 0) out[`filter[${field}]`] = val.join(',');
        } else if (typeof val === 'object') {
            if (val.from) out[`filter[${field}][from]`] = val.from;
            if (val.to)   out[`filter[${field}][to]`]   = val.to;
        } else if (val !== '') {
            out[`filter[${field}]`] = val;
        }
    }
    return out;
}

function countActive(filters: FilterValues): number {
    return Object.values(filters).filter(v => {
        if (v === null || v === undefined) return false;
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'object') return !!(v.from || v.to);
        return v !== '';
    }).length;
}

function parseFiltersFromUrl(
    filterableColumns: Column[],
    standaloneFilters: StandaloneFilter[],
): FilterValues {
    const params = new URLSearchParams(window.location.search);
    const out: FilterValues = {};
    for (const col of filterableColumns) {
        const type = col.filterType ?? 'text';
        if (type === 'date' || type === 'number') {
            out[col.name] = {
                from: params.get(`filter[${col.name}][from]`) ?? undefined,
                to:   params.get(`filter[${col.name}][to]`)   ?? undefined,
            };
        } else if (type === 'select') {
            const v = params.get(`filter[${col.name}]`);
            out[col.name] = v ? v.split(',') : [];
        } else {
            out[col.name] = params.get(`filter[${col.name}]`) ?? '';
        }
    }
    for (const f of standaloneFilters) {
        if (f.type === 'date_range') {
            out[f.name] = {
                from: params.get(`filter[${f.name}][from]`) ?? undefined,
                to:   params.get(`filter[${f.name}][to]`)   ?? undefined,
            };
        } else if (f.type === 'select' && f.multiple) {
            // Multi-select → string[]
            const v = params.get(`filter[${f.name}]`);
            out[f.name] = v ? v.split(',') : (Array.isArray(f.default) ? f.default : []);
        } else if (f.type === 'select') {
            // Single select → string
            out[f.name] = params.get(`filter[${f.name}]`)
                ?? (typeof f.default === 'string' ? f.default : '');
        } else {
            out[f.name] = params.get(`filter[${f.name}]`)
                ?? (typeof f.default === 'string' ? f.default : '');
        }
    }
    return out;
}

function applyFilters(resourceSlug: string, filters: FilterValues) {
    const params = new URLSearchParams(window.location.search);
    for (const key of [...params.keys()]) {
        if (key.startsWith('filter[')) params.delete(key);
    }
    for (const [k, v] of Object.entries(buildFilterParams(filters))) {
        params.set(k, v);
    }
    params.delete('page');
    router.get(`/admin/${resourceSlug}`, Object.fromEntries(params), {
        preserveState: true, replace: true,
        only: ['records'],
    });
}

function blankFilters(filterableColumns: Column[], standaloneFilters: StandaloneFilter[]): FilterValues {
    const blank: FilterValues = {};
    for (const col of filterableColumns) {
        const type = col.filterType ?? 'text';
        blank[col.name] = (type === 'date' || type === 'number') ? {} : type === 'select' ? [] : '';
    }
    for (const f of standaloneFilters) {
        blank[f.name] = f.type === 'date_range' ? {} : (f.type === 'select' && f.multiple) ? [] : '';
    }
    return blank;
}

// ─── Active indicator chips ───────────────────────────────────────────────────

function formatIndicatorValue(
    name: string,
    val: FilterValues[string],
    filterableColumns: Column[],
    standaloneFilters: StandaloneFilter[],
): string | null {
    if (Array.isArray(val)) {
        if (val.length === 0) return null;
        // Try to resolve labels from standaloneFilter options
        const sf = standaloneFilters.find(f => f.name === name);
        if (sf?.options) {
            return val.map(v => sf.options![v] ?? v).join(', ');
        }
        const col = filterableColumns.find(c => c.name === name);
        if (col?.filterOptions) {
            return val.map(v => col.filterOptions!.find(o => String(o.value) === v)?.label ?? v).join(', ');
        }
        return val.join(', ');
    }
    if (typeof val === 'object') {
        const parts: string[] = [];
        if (val.from) parts.push(`from ${val.from}`);
        if (val.to)   parts.push(`to ${val.to}`);
        return parts.length > 0 ? parts.join(' ') : null;
    }
    if (!val) return null;

    const sf = standaloneFilters.find(f => f.name === name);
    if (sf?.type === 'ternary') {
        if (val === 'true')  return sf.trueLabel  ?? 'Yes';
        if (val === 'false') return sf.falseLabel ?? 'No';
    }
    if (val === 'true')  return 'Yes';
    if (val === 'false') return 'No';
    return val;
}

export function ActiveFilterIndicators({
    resourceSlug,
    filters,
    setFilters,
    filterableColumns,
    standaloneFilters,
}: {
    resourceSlug: string;
    filters: FilterValues;
    setFilters: (f: FilterValues) => void;
    filterableColumns: Column[];
    standaloneFilters: StandaloneFilter[];
}) {
    const chips: { key: string; label: string; value: string }[] = [];

    const allDefs = [
        ...filterableColumns.map(c => ({ name: c.name, label: c.label, indicator: null as string | null | undefined })),
        ...standaloneFilters.map(f => ({ name: f.name, label: f.indicator ?? f.label, indicator: f.indicator })),
    ];

    for (const def of allDefs) {
        const val = filters[def.name];
        if (!val) continue;
        const displayVal = formatIndicatorValue(def.name, val, filterableColumns, standaloneFilters);
        if (!displayVal) continue;
        chips.push({ key: def.name, label: def.label, value: displayVal });
    }

    if (chips.length === 0) return null;

    const removeOne = (key: string) => {
        const blank = blankFilters(filterableColumns, standaloneFilters);
        const next = { ...filters, [key]: blank[key] ?? '' };
        setFilters(next);
        applyFilters(resourceSlug, next);
    };

    const removeAll = () => {
        const blank = blankFilters(filterableColumns, standaloneFilters);
        setFilters(blank);
        applyFilters(resourceSlug, blank);
    };

    return (
        <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center flex-wrap gap-2">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 shrink-0">Active filters:</span>
            {chips.map(chip => (
                <span
                    key={chip.key}
                    className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full text-xs font-medium bg-[var(--larafusion-primary,#18181b)]/10 text-[var(--larafusion-primary,#18181b)] border border-[var(--larafusion-primary,#18181b)]/20"
                >
                    <span>{chip.label}: <span className="font-semibold">{chip.value}</span></span>
                    <button
                        type="button"
                        onClick={() => removeOne(chip.key)}
                        className="ml-0.5 w-3.5 h-3.5 rounded-full hover:bg-[var(--larafusion-primary,#18181b)]/20 flex items-center justify-center transition-colors"
                        aria-label={`Remove ${chip.label} filter`}
                    >
                        <X className="w-2.5 h-2.5" />
                    </button>
                </span>
            ))}
            <button
                type="button"
                onClick={removeAll}
                className="inline-flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors ml-1"
            >
                <RotateCcw className="w-3 h-3" /> Reset all
            </button>
        </div>
    );
}

// ─── Individual filter controls ───────────────────────────────────────────────

function TextFilterInput({ name, label, value, onChange }: { name: string; label: string; value: string; onChange: (v: string) => void }) {
    return (
        <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={`Filter ${label}…`}
            className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)]/30 focus:border-[var(--larafusion-primary,#18181b)] outline-none bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
        />
    );
}

function BooleanButtons({ value, onChange, labels }: { value: string; onChange: (v: string) => void; labels?: [string, string, string] }) {
    const [all, yes, no] = labels ?? ['Any', 'Yes', 'No'];
    return (
        <div className="flex gap-1">
            {([['', all], ['true', yes], ['false', no]] as [string, string][]).map(([v, lbl]) => (
                <button key={v} type="button" onClick={() => onChange(v)}
                    className={cn(
                        'flex-1 min-w-0 px-2 py-1.5 text-xs font-medium rounded-lg border transition-colors truncate',
                        value === v
                            ? 'bg-[var(--larafusion-primary,#18181b)] text-white border-[var(--larafusion-primary,#18181b)]'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800',
                    )}>
                    {lbl}
                </button>
            ))}
        </div>
    );
}

// Searchable select dropdown for filters — mirrors the form Select field
// (`->native(false)->searchable()`): trigger shows selected values as pill chips
// (or a single label), opening a position-aware popover with a search box and a
// checkmarked option list. Supports single and multiple selection.
function SearchableSelect({
    options, value, onChange, searchable, multiple = true, placeholder = 'All', optionMeta,
}: {
    options: { label: string; value: string }[];
    value: string[] | string;
    onChange: (v: string[] | string) => void;
    searchable?: boolean;
    multiple?: boolean;
    placeholder?: string;
    optionMeta?: Record<string, OptionMeta>;
}) {
    const metaOf = (v: string): OptionMeta | undefined => optionMeta?.[v];
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    // Fixed-position coords for the portaled popover (escapes the filter panel's
    // overflow-y-auto clipping instead of being trapped inside it).
    const [coords, setCoords] = useState<{
        left: number; width: number; top?: number; bottom?: number; listMax: number;
    } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selected: string[] = multiple
        ? (Array.isArray(value) ? value : value ? [value as string] : [])
        : (value ? [value as string] : []);

    const computePosition = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const gap = 6;
        const spaceBelow = window.innerHeight - r.bottom - gap;
        const spaceAbove = r.top - gap;
        const openUp = spaceBelow < 240 && spaceAbove > spaceBelow;
        const avail = Math.max(140, Math.min(320, (openUp ? spaceAbove : spaceBelow) - 8));
        const searchH = searchable ? 52 : 0;
        setCoords({
            left: r.left,
            width: r.width,
            top: openUp ? undefined : r.bottom + gap,
            bottom: openUp ? window.innerHeight - r.top + gap : undefined,
            listMax: Math.max(96, avail - searchH),
        });
    }, [searchable]);

    // Reposition while open (the filter panel itself scrolls).
    useEffect(() => {
        if (!open) return;
        computePosition();
        const id = setTimeout(() => inputRef.current?.focus(), 30);
        const reflow = () => computePosition();
        window.addEventListener('scroll', reflow, true);
        window.addEventListener('resize', reflow);
        return () => {
            clearTimeout(id);
            window.removeEventListener('scroll', reflow, true);
            window.removeEventListener('resize', reflow);
        };
    }, [open, computePosition]);

    // Outside-click: ignore clicks on the trigger and inside the portaled popover.
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const t = e.target as Node;
            if (containerRef.current?.contains(t)) return;
            if (popoverRef.current?.contains(t)) return;
            setOpen(false);
            setSearch('');
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const visible = search
        ? options.filter(o =>
            o.label.toLowerCase().includes(search.toLowerCase()) ||
            o.value.toLowerCase().includes(search.toLowerCase()))
        : options;

    const isSelected = (v: string) => selected.includes(v);

    const toggle = (v: string) => {
        if (multiple) {
            onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
        } else {
            onChange(v);
            setOpen(false);
            setSearch('');
        }
    };

    const removeChip = (v: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(multiple ? selected.filter(x => x !== v) : '');
    };

    const clearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(multiple ? [] : '');
    };

    const selectedOptions = options.filter(o => selected.includes(o.value));

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger */}
            <div
                onClick={() => (open ? (setOpen(false), setSearch('')) : setOpen(true))}
                className={cn(
                    'flex items-center gap-2 w-full min-h-[38px] px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors',
                    open
                        ? 'border-[var(--larafusion-primary,#18181b)] ring-2 ring-[var(--larafusion-primary,#18181b)]/20 bg-white dark:bg-zinc-800'
                        : 'border-zinc-300 bg-white dark:bg-zinc-800 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600',
                )}
            >
                <div className="flex-1 flex flex-wrap gap-1 min-w-0">
                    {selectedOptions.length > 0
                        ? selectedOptions.map(o => {
                            const meta = metaOf(o.value);
                            const ChipIcon = meta?.icon ? resolveIcon(meta.icon) : null;
                            const cc = meta?.color ? colorClass(meta.color) : null;
                            return (
                                <span
                                    key={o.value}
                                    className={cn(
                                        'inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs font-medium',
                                        cc ? cn(cc.bg, cc.text) : 'bg-[var(--larafusion-primary,#18181b)]/10 text-[var(--larafusion-primary,#18181b)] dark:text-white',
                                    )}
                                >
                                    {ChipIcon && <ChipIcon className="w-3 h-3 shrink-0" />}
                                    {o.label}
                                    <button type="button" onClick={e => removeChip(o.value, e)} className="hover:opacity-70 transition-opacity">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            );
                        })
                        : <span className="text-zinc-400 dark:text-zinc-500 truncate">{placeholder}</span>}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {selected.length > 0 && (
                        <button
                            type="button"
                            onClick={clearAll}
                            aria-label="Clear"
                            className="p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <ChevronDown className={cn('w-4 h-4 text-zinc-400 transition-transform duration-150', open && 'rotate-180')} />
                </div>
            </div>

            {/* Dropdown — portaled to <body> with fixed positioning so it floats
                above the filter panel instead of being clipped by its scroll area. */}
            {open && coords && createPortal(
                <div
                    ref={popoverRef}
                    data-lf-portal=""
                    style={{
                        position: 'fixed',
                        left: coords.left,
                        width: coords.width,
                        top: coords.top,
                        bottom: coords.bottom,
                        zIndex: 9999,
                    }}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden animate-larafusion-drop-in"
                >
                    {searchable && (
                        <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search…"
                                    className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:border-[var(--larafusion-primary,#18181b)] focus:ring-1 focus:ring-[var(--larafusion-primary,#18181b)]/20"
                                />
                            </div>
                        </div>
                    )}

                    <div className="overflow-y-auto py-1" style={{ maxHeight: coords.listMax }}>
                        {visible.length === 0 ? (
                            <p className="text-center py-6 text-sm text-zinc-400 dark:text-zinc-500">
                                {search ? `No results for "${search}"` : 'No options available'}
                            </p>
                        ) : (
                            visible.map(opt => {
                                const meta = metaOf(opt.value);
                                const OptIcon = meta?.icon ? resolveIcon(meta.icon) : null;
                                const cc = meta?.color ? colorClass(meta.color) : null;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => toggle(opt.value)}
                                        className={cn(
                                            'flex items-center justify-between gap-2 w-full px-3 py-2 text-sm text-left transition-colors',
                                            isSelected(opt.value)
                                                ? 'bg-[var(--larafusion-primary,#18181b)]/5 text-[var(--larafusion-primary,#18181b)] dark:bg-[var(--larafusion-primary,#18181b)]/10 dark:text-white font-medium'
                                                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700',
                                        )}
                                    >
                                        <span className="flex items-start gap-2 min-w-0">
                                            {OptIcon && (
                                                <OptIcon className={cn('w-4 h-4 shrink-0 mt-0.5', cc?.text ?? 'text-zinc-400 dark:text-zinc-500')} />
                                            )}
                                            <span className="flex flex-col min-w-0">
                                                <span className="break-words">{opt.label}</span>
                                                {meta?.description && (
                                                    <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500 break-words">{meta.description}</span>
                                                )}
                                            </span>
                                        </span>
                                        {isSelected(opt.value) && (
                                            <Check className="w-3.5 h-3.5 text-[var(--larafusion-primary,#18181b)] shrink-0 mt-0.5" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>,
                document.body,
            )}
        </div>
    );
}

function DateRangeInputs({ value, onChange }: {
    value: { from?: string; to?: string };
    onChange: (v: { from?: string; to?: string }) => void;
}) {
    return (
        <div className="flex gap-2">
            <div className="flex-1">
                <label className="block text-xs text-zinc-400 dark:text-zinc-500 mb-1">From</label>
                <input type="date" value={value.from ?? ''} onChange={e => onChange({ ...value, from: e.target.value || undefined })}
                    className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)]/30 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
            </div>
            <div className="flex-1">
                <label className="block text-xs text-zinc-400 dark:text-zinc-500 mb-1">To</label>
                <input type="date" value={value.to ?? ''} onChange={e => onChange({ ...value, to: e.target.value || undefined })}
                    className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)]/30 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
            </div>
        </div>
    );
}

function NumberRangeInputs({ value, onChange }: {
    value: { from?: string; to?: string };
    onChange: (v: { from?: string; to?: string }) => void;
}) {
    return (
        <div className="flex gap-2">
            <input type="number" placeholder="Min" value={value.from ?? ''} onChange={e => onChange({ ...value, from: e.target.value || undefined })}
                className="flex-1 px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)]/30 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" />
            <input type="number" placeholder="Max" value={value.to ?? ''} onChange={e => onChange({ ...value, to: e.target.value || undefined })}
                className="flex-1 px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)]/30 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" />
        </div>
    );
}

// ─── Render a single standalone filter control ────────────────────────────────

function StandaloneFilterControl({
    filter, value, onChange,
}: {
    filter: StandaloneFilter;
    value: FilterValues[string];
    onChange: (v: FilterValues[string]) => void;
}) {
    if (filter.type === 'ternary') {
        return (
            <BooleanButtons
                value={value as string}
                onChange={onChange as (v: string) => void}
                labels={[filter.placeholder ?? 'All', filter.trueLabel ?? 'Yes', filter.falseLabel ?? 'No']}
            />
        );
    }
    if (filter.type === 'boolean') {
        return <BooleanButtons value={value as string} onChange={onChange as (v: string) => void} />;
    }
    if (filter.type === 'select') {
        const opts = Object.entries(filter.options ?? {}).map(([v, l]) => ({ value: v, label: l }));
        const optionMeta = buildOptionMeta(filter.optionColors, filter.optionIcons, filter.optionDescriptions);
        const hasMeta = optionMeta !== undefined;

        // Multi-select, or a single select that is searchable / carries enum
        // metadata → rich dropdown (mirrors the form Select field, shows chips,
        // per-option icons/colors/descriptions).
        if (filter.multiple || filter.searchable || hasMeta) {
            return (
                <SearchableSelect
                    options={opts}
                    value={filter.multiple ? (value as string[]) : (value as string)}
                    onChange={onChange as (v: string[] | string) => void}
                    searchable={filter.searchable}
                    multiple={!!filter.multiple}
                    optionMeta={optionMeta}
                />
            );
        }

        // Plain single select → native dropdown (simple + fast).
        return (
            <select
                value={(value as string) ?? ''}
                onChange={e => (onChange as (v: string) => void)(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)]/30 focus:border-[var(--larafusion-primary,#18181b)] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            >
                <option value="">All</option>
                {opts.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        );
    }
    if (filter.type === 'date_range') {
        return (
            <DateRangeInputs
                value={value as { from?: string; to?: string }}
                onChange={onChange as (v: { from?: string; to?: string }) => void}
            />
        );
    }
    return null;
}

// ─── Column filter control ────────────────────────────────────────────────────

function ColumnFilterControl({ col, value, onChange }: {
    col: Column; value: FilterValues[string]; onChange: (v: FilterValues[string]) => void;
}) {
    const type = col.filterType ?? 'text';
    if (type === 'boolean') return <BooleanButtons value={value as string} onChange={onChange as (v: string) => void} />;
    if (type === 'select') {
        const opts = (col.filterOptions ?? []).map(o => ({ value: String(o.value), label: String(o.label) }));
        const optionMeta = buildOptionMeta(col.colors, col.icons);
        return (
            <SearchableSelect
                options={opts}
                value={value as string[]}
                onChange={onChange as (v: string[] | string) => void}
                searchable={opts.length > 8}
                multiple
                optionMeta={optionMeta}
            />
        );
    }
    if (type === 'date') return <DateRangeInputs value={value as { from?: string; to?: string }} onChange={onChange as (v: { from?: string; to?: string }) => void} />;
    if (type === 'number') return <NumberRangeInputs value={value as { from?: string; to?: string }} onChange={onChange as (v: { from?: string; to?: string }) => void} />;
    return <TextFilterInput name={col.name} label={col.label} value={value as string} onChange={onChange as (v: string) => void} />;
}

// ─── Shared filter form (used in both drawer and above/below layouts) ─────────

function FilterForm({
    filterableColumns,
    standaloneFilters,
    filters,
    setFilters,
    columns: gridColumns,
}: {
    filterableColumns: Column[];
    standaloneFilters: StandaloneFilter[];
    filters: FilterValues;
    setFilters: (f: FilterValues) => void;
    columns: number;
}) {
    const set = (name: string) => (v: FilterValues[string]) => setFilters({ ...filters, [name]: v });
    const gridClass = gridColumns > 1
        ? `grid gap-x-4 gap-y-5 grid-cols-${gridColumns}`
        : 'space-y-4';

    // Deduplicate: skip column-level filters that already have a standalone filter for the same field.
    // This prevents duplicates when ->enum() auto-registers a column filter AND an explicit
    // SelectFilter is also defined for the same field.
    const standaloneNames = new Set(standaloneFilters.map(f => f.name));
    const uniqueColumnFilters = filterableColumns.filter(c => !standaloneNames.has(c.name));

    return (
        <div className={gridClass}>
            {standaloneFilters.map(f => (
                <div key={f.name}>
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">{f.label}</label>
                    <StandaloneFilterControl filter={f} value={filters[f.name]} onChange={set(f.name)} />
                </div>
            ))}
            {uniqueColumnFilters.map(col => (
                <div key={col.name}>
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">{col.label}</label>
                    <ColumnFilterControl col={col} value={filters[col.name]} onChange={set(col.name)} />
                </div>
            ))}
        </div>
    );
}

// ─── Above / Below inline layout ─────────────────────────────────────────────

function InlineFiltersPanel({
    resourceSlug, filterableColumns, standaloneFilters, filters, setFilters, formColumns, collapsible,
}: {
    resourceSlug: string;
    filterableColumns: Column[];
    standaloneFilters: StandaloneFilter[];
    filters: FilterValues;
    setFilters: (f: FilterValues) => void;
    formColumns: number;
    collapsible: boolean;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const activeCount = countActive(filters);

    const apply = () => applyFilters(resourceSlug, filters);
    const reset = () => {
        const blank = blankFilters(filterableColumns, standaloneFilters);
        setFilters(blank);
        applyFilters(resourceSlug, blank);
    };

    return (
        <div className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
            {collapsible && (
                <button type="button" onClick={() => setCollapsed(c => !c)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                    <span className="flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filters
                        {activeCount > 0 && (
                            <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-[var(--larafusion-primary,#18181b)] text-white">{activeCount}</span>
                        )}
                    </span>
                    {collapsed ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronUp className="w-4 h-4 text-zinc-400" />}
                </button>
            )}

            {!collapsed && (
                <div className="px-4 py-4">
                    <FilterForm
                        filterableColumns={filterableColumns}
                        standaloneFilters={standaloneFilters}
                        filters={filters}
                        setFilters={setFilters}
                        columns={formColumns}
                    />
                    <div className="flex gap-2 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                        <button type="button" onClick={reset}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <RotateCcw className="w-3.5 h-3.5" /> Reset
                        </button>
                        <button type="button" onClick={apply}
                            className="flex-1 px-4 py-1.5 rounded-lg text-sm font-medium bg-[var(--larafusion-primary,#18181b)] hover:opacity-90 text-white transition-colors">
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Shared animation hook ────────────────────────────────────────────────────
function useModalAnimation(open: boolean, exitMs = 160) {
    const [rendered, setRendered] = useState(open);
    const [exiting,  setExiting]  = useState(false);
    useEffect(() => {
        if (open) {
            setRendered(true);
            setExiting(false);
        } else if (rendered) {
            setExiting(true);
            const t = window.setTimeout(() => { setRendered(false); setExiting(false); }, exitMs);
            return () => window.clearTimeout(t);
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
    return { rendered, exiting };
}

// ─── Drawer / Modal panel ─────────────────────────────────────────────────────

function DrawerPanel({
    open, onClose, resourceSlug, filterableColumns, standaloneFilters, filters, setFilters, formColumns, formMaxHeight, isModal,
}: {
    open: boolean;
    onClose: () => void;
    resourceSlug: string;
    filterableColumns: Column[];
    standaloneFilters: StandaloneFilter[];
    filters: FilterValues;
    setFilters: (f: FilterValues) => void;
    formColumns: number;
    formMaxHeight?: string;
    isModal: boolean;
}) {
    const { rendered, exiting } = useModalAnimation(open, isModal ? 160 : 200);
    if (!rendered) return null;

    const apply = () => { applyFilters(resourceSlug, filters); onClose(); };
    const reset = () => { const b = blankFilters(filterableColumns, standaloneFilters); setFilters(b); };

    const body = (
        <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">Filters</span>
                <button type="button" onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4" style={formMaxHeight ? { maxHeight: formMaxHeight } : {}}>
                <FilterForm
                    filterableColumns={filterableColumns}
                    standaloneFilters={standaloneFilters}
                    filters={filters}
                    setFilters={setFilters}
                    columns={formColumns}
                />
            </div>
            <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                <button type="button" onClick={reset}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
                <button type="button" onClick={apply}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--larafusion-primary,#18181b)] hover:opacity-90 text-white transition-colors">
                    Apply Filters
                </button>
            </div>
        </>
    );

    if (isModal) {
        return (
            <div className={cn(
                'fixed inset-0 z-40 flex items-center justify-center p-4',
                exiting ? 'animate-larafusion-overlay-out' : 'animate-larafusion-overlay-in',
            )}>
                <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm" onClick={onClose} />
                <div className={cn(
                    'relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]',
                    exiting ? 'animate-larafusion-modal-out' : 'animate-larafusion-modal-in',
                )}>
                    {body}
                </div>
            </div>
        );
    }

    // Slide-in drawer
    return (
        <div className={cn(
            'fixed inset-0 z-40 flex',
            exiting ? 'animate-larafusion-overlay-out' : 'animate-larafusion-overlay-in',
        )}>
            <div className="absolute inset-0 bg-black/20 dark:bg-black/40" onClick={onClose} />
            <div className={cn(
                'relative ml-auto w-80 bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col',
                exiting ? 'animate-larafusion-drawer-out' : 'animate-larafusion-drawer-in',
            )}>
                {body}
            </div>
        </div>
    );
}

// ─── Side-content filter sidebar (before_content / after_content) ────────────

export function SideFilterSidebar({
    resourceSlug,
    filterableColumns,
    standaloneFilters,
    formColumns = 1,
    formMaxHeight,
    collapsible,
}: {
    resourceSlug: string;
    filterableColumns: Column[];
    standaloneFilters: StandaloneFilter[];
    formColumns?: number;
    formMaxHeight?: string;
    collapsible: boolean;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const [filters, setFilters] = useState<FilterValues>(() =>
        parseFiltersFromUrl(filterableColumns, standaloneFilters));
    const activeCount = countActive(filters);

    if (filterableColumns.length + standaloneFilters.length === 0) return null;

    const apply = () => applyFilters(resourceSlug, filters);
    const reset = () => {
        const blank = blankFilters(filterableColumns, standaloneFilters);
        setFilters(blank);
        applyFilters(resourceSlug, blank);
    };

    return (
        <div className="w-64 shrink-0 flex flex-col bg-zinc-50/50 dark:bg-zinc-800/20">
            {collapsible ? (
                <button
                    type="button"
                    onClick={() => setCollapsed(c => !c)}
                    className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
                >
                    <span className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        <Filter className="w-4 h-4" />
                        Filters
                        {activeCount > 0 && (
                            <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-[var(--larafusion-primary,#18181b)] text-white">
                                {activeCount}
                            </span>
                        )}
                    </span>
                    {collapsed
                        ? <ChevronDown className="w-4 h-4 text-zinc-400" />
                        : <ChevronUp   className="w-4 h-4 text-zinc-400" />
                    }
                </button>
            ) : (
                <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                    <Filter className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Filters</span>
                    {activeCount > 0 && (
                        <span className="ml-auto px-1.5 py-0.5 text-xs font-bold rounded-full bg-[var(--larafusion-primary,#18181b)] text-white">
                            {activeCount}
                        </span>
                    )}
                </div>
            )}
            {!collapsed && (
                <>
                    <div
                        className="flex-1 overflow-y-auto px-4 py-4"
                        style={formMaxHeight ? { maxHeight: formMaxHeight } : {}}
                    >
                        <FilterForm
                            filterableColumns={filterableColumns}
                            standaloneFilters={standaloneFilters}
                            filters={filters}
                            setFilters={setFilters}
                            columns={formColumns}
                        />
                    </div>
                    <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                        <button type="button" onClick={reset}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <RotateCcw className="w-3.5 h-3.5" /> Reset
                        </button>
                        <button type="button" onClick={apply}
                            className="flex-1 px-4 py-1.5 rounded-lg text-sm font-medium bg-[var(--larafusion-primary,#18181b)] hover:opacity-90 text-white transition-colors">
                            Apply
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Dropdown popover layout (Filament default style) ────────────────────────

function DropdownFilterPanel({
    resourceSlug,
    filterableColumns,
    standaloneFilters,
    filters,
    setFilters,
    formColumns,
    formWidth,
    formMaxHeight,
}: {
    resourceSlug: string;
    filterableColumns: Column[];
    standaloneFilters: StandaloneFilter[];
    filters: FilterValues;
    setFilters: (f: FilterValues) => void;
    formColumns: number;
    formWidth?: string;
    formMaxHeight?: string;
}) {
    const [open, setOpen] = useState(false);
    const { rendered: dropRendered, exiting: dropExiting } = useModalAnimation(open, 100);
    const ref = useRef<HTMLDivElement>(null);
    const activeCount = countActive(filters);

    // Close when clicking outside — but ignore clicks inside a portaled popover
    // (e.g. a SearchableSelect option list rendered to <body>), which lives
    // outside this panel's DOM subtree yet is logically part of it.
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('[data-lf-portal]')) return;
            if (ref.current && !ref.current.contains(target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const apply = () => { applyFilters(resourceSlug, filters); setOpen(false); };
    const reset = () => {
        const blank = blankFilters(filterableColumns, standaloneFilters);
        setFilters(blank);
        applyFilters(resourceSlug, blank);
    };

    return (
        <div className="relative" ref={ref}>
            {/* Icon-only trigger button with badge */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={cn(
                    'relative inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-colors',
                    activeCount > 0 || open
                        ? 'bg-[var(--larafusion-primary,#18181b)] text-white border-[var(--larafusion-primary,#18181b)]'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800',
                )}
                aria-label="Filters"
            >
                <Filter className="w-4 h-4" />
                {activeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-[1.1rem] flex items-center justify-center rounded-full text-[10px] font-bold bg-white text-[var(--larafusion-primary,#18181b)] border border-[var(--larafusion-primary,#18181b)] leading-none px-0.5">
                        {activeCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel — kept in DOM during close animation */}
            {dropRendered && (
                <div
                    className={cn(
                        'absolute top-full right-0 mt-1.5 z-50 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col origin-top-right',
                        dropExiting ? 'animate-larafusion-drop-out' : 'animate-larafusion-drop-in',
                    )}
                    style={{ width: formWidth ?? '20rem' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Filters</span>
                        {activeCount > 0 && (
                            <button
                                type="button"
                                onClick={reset}
                                className="text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    {/* Filter form — always single column inside the dropdown
                        (multi-column layouts belong in above/below/side layouts) */}
                    <div
                        className="overflow-y-auto px-4 py-3"
                        style={formMaxHeight ? { maxHeight: formMaxHeight } : { maxHeight: '28rem' }}
                    >
                        <FilterForm
                            filterableColumns={filterableColumns}
                            standaloneFilters={standaloneFilters}
                            filters={filters}
                            setFilters={setFilters}
                            columns={1}
                        />
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={apply}
                            className="w-full py-2 rounded-lg text-sm font-medium bg-[var(--larafusion-primary,#18181b)] hover:opacity-90 text-white transition-colors"
                        >
                            Apply filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Trigger button ───────────────────────────────────────────────────────────

export function FilterTriggerButton({
    activeCount, onClick, formWidth,
}: {
    activeCount: number;
    onClick: () => void;
    formWidth?: string;
}) {
    return (
        <button type="button" onClick={onClick}
            style={formWidth ? { minWidth: formWidth } : {}}
            className={cn(
                'relative inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                activeCount > 0
                    ? 'bg-[var(--larafusion-primary,#18181b)] text-white border-[var(--larafusion-primary,#18181b)]'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800',
            )}>
            <Filter className="w-4 h-4" />
            Filters
            {activeCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 text-xs font-bold rounded-full bg-white/20">
                    {activeCount}
                </span>
            )}
        </button>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function FilterPanel({
    resourceSlug,
    columns,
    standaloneFilters = [],
    layout = 'dropdown',
    formColumns = 1,
    formWidth,
    formMaxHeight,
    hideIndicators = false,
}: FilterPanelProps) {
    const filterableColumns = columns.filter(c => c.filterable);
    const hasAnyFilters = filterableColumns.length > 0 || standaloneFilters.length > 0;

    const [open, setOpen]       = useState(false);
    const [filters, setFilters] = useState<FilterValues>(() =>
        parseFiltersFromUrl(filterableColumns, standaloneFilters));

    const activeCount = countActive(filters);

    // Side layouts are handled by SideFilterSidebar rendered directly in the table layout
    if (layout === 'before_content' || layout === 'before_content_collapsible' ||
        layout === 'after_content'  || layout === 'after_content_collapsible') {
        return null;
    }

    // Inline layouts render differently — no trigger button needed
    if (layout === 'above' || layout === 'above_collapsible' || layout === 'below') {
        if (!hasAnyFilters) return null;
        return (
            <>
                {/* Active indicator chips (shown before inline filters for 'above' layout) */}
                {!hideIndicators && (
                    <ActiveFilterIndicators
                        resourceSlug={resourceSlug}
                        filters={filters}
                        setFilters={setFilters}
                        filterableColumns={filterableColumns}
                        standaloneFilters={standaloneFilters}
                    />
                )}
                <InlineFiltersPanel
                    resourceSlug={resourceSlug}
                    filterableColumns={filterableColumns}
                    standaloneFilters={standaloneFilters}
                    filters={filters}
                    setFilters={setFilters}
                    formColumns={formColumns}
                    collapsible={layout === 'above_collapsible'}
                />
            </>
        );
    }

    if (!hasAnyFilters) return null;

    // Dropdown popover layout (Filament default style)
    if (layout === 'dropdown') {
        return (
            <DropdownFilterPanel
                resourceSlug={resourceSlug}
                filterableColumns={filterableColumns}
                standaloneFilters={standaloneFilters}
                filters={filters}
                setFilters={setFilters}
                formColumns={formColumns}
                formWidth={formWidth}
                formMaxHeight={formMaxHeight}
            />
        );
    }

    // Drawer / Modal layouts
    return (
        <>
            <FilterTriggerButton activeCount={activeCount} onClick={() => setOpen(true)} formWidth={formWidth} />
            <DrawerPanel
                open={open}
                onClose={() => setOpen(false)}
                resourceSlug={resourceSlug}
                filterableColumns={filterableColumns}
                standaloneFilters={standaloneFilters}
                filters={filters}
                setFilters={setFilters}
                formColumns={formColumns}
                formMaxHeight={formMaxHeight}
                isModal={layout === 'modal'}
            />
        </>
    );
}
