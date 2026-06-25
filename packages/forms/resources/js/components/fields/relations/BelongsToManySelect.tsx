import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, Check, ChevronDown } from 'lucide-react';
import FieldWrapper from '../FieldWrapper';
import { ValidationStatus } from '../../../types';
import { cn } from '../../../lib/utils';

interface Option {
    value: string | number;
    label: string;
}

interface BelongsToManyFieldSchema {
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

interface BelongsToManySelectProps {
    field: BelongsToManyFieldSchema;
    resourceSlug: string;
    value: (string | number)[];
    error?: string;
    status?: ValidationStatus;
    onChange: (val: (string | number)[]) => void;
    onBlur?: () => void;
}

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
    let t: ReturnType<typeof setTimeout>;
    return ((...args: Parameters<T>) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }) as T;
}

export default function BelongsToManySelect({
    field, resourceSlug, value = [], error, status = 'idle', onChange, onBlur,
}: BelongsToManySelectProps) {
    const [open, setOpen]         = useState(false);
    const [search, setSearch]     = useState('');
    const [options, setOptions]   = useState<Option[]>(field.preloadedOptions ?? []);
    const [loading, setLoading]   = useState(false);
    const [selected, setSelected] = useState<Option[]>([]);
    const containerRef            = useRef<HTMLDivElement>(null);
    const inputRef                = useRef<HTMLInputElement>(null);

    const selectedValues = Array.isArray(value) ? value : [];

    const fetchOptions = useCallback(async (q: string) => {
        setLoading(true);
        try {
            const url = new URL(
                `/admin/${resourceSlug}/relations/${field.name}/options`,
                window.location.origin
            );
            url.searchParams.set('search', q);
            const res  = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
            const data = await res.json();
            setOptions(data.options);
        } catch {}
        finally { setLoading(false); }
    }, [resourceSlug, field.name]);

    const debouncedFetch = useCallback(debounce(fetchOptions, 250), [fetchOptions]);

    const handleOpen = () => {
        if (field.disabled) return;
        setOpen(o => !o);
        if (!field.preload || options.length === 0) fetchOptions('');
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleSearch = (q: string) => {
        setSearch(q);
        debouncedFetch(q);
    };

    const toggleOption = (opt: Option) => {
        const exists = selectedValues.some(v => String(v) === String(opt.value));
        const next   = exists
            ? selectedValues.filter(v => String(v) !== String(opt.value))
            : [...selectedValues, opt.value];
        onChange(next);

        // Update selected labels
        setSelected(prev =>
            exists ? prev.filter(s => String(s.value) !== String(opt.value)) : [...prev, opt]
        );
    };

    const removeSelected = (val: string | number, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selectedValues.filter(v => String(v) !== String(val)));
        setSelected(prev => prev.filter(s => String(s.value) !== String(val)));
        onBlur?.();
    };

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
                onBlur?.();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onBlur]);

    // Resolve initial labels
    useEffect(() => {
        if (!selectedValues.length) { setSelected([]); return; }
        if (options.length > 0) {
            setSelected(options.filter(o => selectedValues.some(v => String(v) === String(o.value))));
        }
    }, []);

    return (
        <FieldWrapper label={field.label} required={field.required} hint={field.hint} error={error} status={status}>
            <div className="relative" ref={containerRef}>
                {/* Trigger + selected chips */}
                <div
                    onClick={handleOpen}
                    className={cn(
                        'flex flex-wrap items-center gap-1.5 min-h-[38px] px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors',
                        field.disabled && 'opacity-50 cursor-not-allowed',
                        open
                            ? 'border-[var(--larafusion-primary,#18181b)] ring-2 ring-[var(--larafusion-primary,#18181b)]/20'
                            : status === 'invalid'
                            ? 'border-red-400 bg-red-50'
                            : 'border-zinc-300 bg-white hover:border-zinc-400',
                    )}
                >
                    {/* Selected chips */}
                    {selected.map(opt => (
                        <span
                            key={opt.value}
                            className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md text-xs font-medium bg-[var(--larafusion-primary,#18181b)]/10 text-[var(--larafusion-primary,#18181b)] border border-[var(--larafusion-primary,#18181b)]/20"
                        >
                            {opt.label}
                            {!field.disabled && (
                                <button
                                    type="button"
                                    onClick={e => removeSelected(opt.value, e)}
                                    className="hover:opacity-70 transition-opacity ml-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </span>
                    ))}

                    {selected.length === 0 && (
                        <span className="text-zinc-400 text-sm">Select {field.label}…</span>
                    )}

                    <ChevronDown className={cn('w-4 h-4 text-zinc-400 ml-auto shrink-0 transition-transform', open && 'rotate-180')} />
                </div>

                {/* Dropdown */}
                {open && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-zinc-200 rounded-xl shadow-lg animate-in fade-in-0 zoom-in-95">
                        {/* Search */}
                        <div className="p-2 border-b border-zinc-100">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={search}
                                    onChange={e => handleSearch(e.target.value)}
                                    placeholder="Search…"
                                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-zinc-200 rounded-lg outline-none focus:border-[var(--larafusion-primary,#18181b)] focus:ring-1 focus:ring-[var(--larafusion-primary,#18181b)]/20"
                                />
                            </div>
                        </div>

                        {/* Options */}
                        <div className="max-h-52 overflow-y-auto py-1">
                            {loading && options.length === 0 ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                                </div>
                            ) : options.length === 0 ? (
                                <p className="text-center py-6 text-sm text-zinc-400">No options found</p>
                            ) : (
                                options.map(opt => {
                                    const isSelected = selectedValues.some(v => String(v) === String(opt.value));
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => toggleOption(opt)}
                                            className={cn(
                                                'flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors',
                                                isSelected ? 'bg-[var(--larafusion-primary,#18181b)]/5 text-[var(--larafusion-primary,#18181b)]' : 'text-zinc-700 hover:bg-zinc-50'
                                            )}
                                        >
                                            {/* Checkbox indicator */}
                                            <span className={cn(
                                                'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                                                isSelected ? 'bg-[var(--larafusion-primary,#18181b)] border-[var(--larafusion-primary,#18181b)]' : 'border-zinc-300'
                                            )}>
                                                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                            </span>
                                            {opt.label}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        {selectedValues.length > 0 && (
                            <div className="px-3 py-2 border-t border-zinc-100 flex items-center justify-between">
                                <span className="text-xs text-zinc-500">{selectedValues.length} selected</span>
                                <button
                                    type="button"
                                    onClick={() => { onChange([]); setSelected([]); }}
                                    className="text-xs text-red-500 hover:text-red-700 hover:underline"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </FieldWrapper>
    );
}
