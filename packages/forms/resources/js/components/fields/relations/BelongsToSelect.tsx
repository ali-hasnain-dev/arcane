import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronDown, X, Loader2, Check } from 'lucide-react';
import FieldWrapper from '../FieldWrapper';
import { ValidationStatus } from '../../../types';
import { cn } from '../../../lib/utils';

interface Option {
    value: string | number;
    label: string;
}

interface BelongsToFieldSchema {
    name: string;
    label: string;
    required?: boolean;
    hint?: string | null;
    disabled?: boolean;
    searchable?: boolean;
    preload?: boolean;
    preloadedOptions?: Option[];
    optionsUrl: string;
}

interface BelongsToSelectProps {
    field: BelongsToFieldSchema;
    // resourceSlug is needed to build the options URL
    resourceSlug: string;
    value: string | number | null;
    error?: string;
    status?: ValidationStatus;
    onChange: (val: string | number | null) => void;
    onBlur?: () => void;
}

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
    let t: ReturnType<typeof setTimeout>;
    return ((...args: Parameters<T>) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }) as T;
}

export default function BelongsToSelect({
    field, resourceSlug, value, error, status = 'idle', onChange, onBlur,
}: BelongsToSelectProps) {
    const [open, setOpen]             = useState(false);
    const [openUp, setOpenUp]         = useState(false);
    const [search, setSearch]         = useState('');
    const [options, setOptions]       = useState<Option[]>(field.preloadedOptions ?? []);
    const [loading, setLoading]       = useState(false);
    const [hasMore, setHasMore]       = useState(false);
    const [selected, setSelected]     = useState<Option | null>(null);
    const containerRef                = useRef<HTMLDivElement>(null);
    const inputRef                    = useRef<HTMLInputElement>(null);

    // Fetch options from server
    const fetchOptions = useCallback(async (q: string, page = 1) => {
        setLoading(true);
        try {
            const url = new URL(
                `/admin/${resourceSlug}/relations/${field.name}/options`,
                window.location.origin
            );
            url.searchParams.set('search', q);
            url.searchParams.set('page', String(page));

            const res  = await fetch(url.toString(), {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = await res.json();
            setOptions(page === 1 ? data.options : prev => [...prev, ...data.options]);
            setHasMore(data.hasMore);
        } catch {}
        finally { setLoading(false); }
    }, [resourceSlug, field.name]);

    const debouncedFetch = useCallback(debounce(fetchOptions, 250), [fetchOptions]);

    // Open dropdown
    const handleOpen = () => {
        if (field.disabled) return;
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            setOpenUp(spaceBelow < 280 && spaceAbove > spaceBelow);
        }
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
        if (!field.preload || options.length === 0) fetchOptions('');
    };

    // Search input change
    const handleSearch = (q: string) => {
        setSearch(q);
        debouncedFetch(q);
    };

    // Select an option
    const handleSelect = (opt: Option) => {
        setSelected(opt);
        onChange(opt.value);
        setOpen(false);
        setSearch('');
        onBlur?.();
    };

    // Clear selection
    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelected(null);
        onChange(null);
        onBlur?.();
    };

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Resolve initial value label
    useEffect(() => {
        if (!value) { setSelected(null); return; }

        // Check preloaded options first
        const found = options.find(o => String(o.value) === String(value));
        if (found) { setSelected(found); return; }

        // Fetch the specific record by id
        fetch(`/admin/${resourceSlug}/relations/${field.name}/options?search=&page=1`, {
            headers: { Accept: 'application/json' },
        })
            .then(r => r.json())
            .then(data => {
                const match = data.options.find((o: Option) => String(o.value) === String(value));
                if (match) setSelected(match);
            })
            .catch(() => {});
    }, [value]);

    const displayValue = selected ? selected.label : '';

    return (
        <FieldWrapper label={field.label} required={field.required} hint={field.hint} error={error} status={status}>
            <div className="relative" ref={containerRef}>
                {/* Trigger */}
                <div
                    onClick={handleOpen}
                    className={cn(
                        'flex items-center gap-2 w-full px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors min-h-[38px]',
                        field.disabled && 'opacity-50 cursor-not-allowed',
                        open
                            ? 'border-[var(--larafusion-primary,#18181b)] ring-2 ring-[var(--larafusion-primary,#18181b)]/20 bg-white dark:bg-zinc-800'
                            : status === 'invalid'
                            ? 'border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-800'
                            : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600',
                    )}
                >
                    {displayValue ? (
                        <span className="flex-1 text-zinc-900 dark:text-zinc-100 truncate">{displayValue}</span>
                    ) : (
                        <span className="flex-1 text-zinc-400 dark:text-zinc-500">Select {field.label}…</span>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                        {selected && !field.disabled && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <ChevronDown className={cn('w-4 h-4 text-zinc-400 transition-transform', open && 'rotate-180')} />
                    </div>
                </div>

                {/* Dropdown */}
                {open && (
                    <div className={cn(
                        'absolute left-0 right-0 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg animate-in fade-in-0 zoom-in-95',
                        openUp ? 'bottom-full mb-1' : 'top-full mt-1',
                    )}>
                        {/* Search input */}
                        {field.searchable !== false && (
                            <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={search}
                                        onChange={e => handleSearch(e.target.value)}
                                        placeholder={`Search ${field.label}…`}
                                        className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:border-[var(--larafusion-primary,#18181b)] focus:ring-1 focus:ring-[var(--larafusion-primary,#18181b)]/20"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Options list */}
                        <div className="max-h-52 overflow-y-auto py-1">
                            {loading && options.length === 0 ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                                </div>
                            ) : options.length === 0 ? (
                                <p className="text-center py-6 text-sm text-zinc-400 dark:text-zinc-500">
                                    {search ? `No results for "${search}"` : 'No options found'}
                                </p>
                            ) : (
                                <>
                                    {options.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleSelect(opt)}
                                            className={cn(
                                                'flex items-center justify-between w-full px-3 py-2 text-sm text-left transition-colors',
                                                String(opt.value) === String(value)
                                                    ? 'bg-[var(--larafusion-primary,#18181b)]/5 text-[var(--larafusion-primary,#18181b)] dark:bg-[var(--larafusion-primary,#18181b)]/10 dark:text-white font-medium'
                                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800',
                                            )}
                                        >
                                            <span>{opt.label}</span>
                                            {String(opt.value) === String(value) && (
                                                <Check className="w-4 h-4 text-[var(--larafusion-primary,#18181b)] shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                    {hasMore && (
                                        <p className="text-center py-2 text-xs text-zinc-400 dark:text-zinc-500">
                                            {loading
                                                ? <Loader2 className="w-3 h-3 animate-spin inline" />
                                                : 'Type to search for more…'}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </FieldWrapper>
    );
}
