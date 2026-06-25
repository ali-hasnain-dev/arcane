import React, { useState, useRef, useEffect, useCallback, useMemo, useTransition } from 'react';
import { Check, ChevronDown, X, Search, Loader2 } from 'lucide-react';
import FieldWrapper from './FieldWrapper';
import { cn } from '../../lib/utils';
import { SelectField } from '../../types';

// ─── Option helpers ────────────────────────────────────────────────────────────

type GroupedOptions = Record<string, string | Record<string, string>>;

interface FlatOption { value: string; label: string; group?: string; disabled: boolean; }

function flattenOptions(options: GroupedOptions, disabled: string[] = []): FlatOption[] {
    const out: FlatOption[] = [];
    for (const [key, val] of Object.entries(options)) {
        if (typeof val === 'object') {
            // Grouped
            for (const [k, v] of Object.entries(val)) {
                out.push({ value: k, label: v, group: key, disabled: disabled.includes(k) });
            }
        } else {
            out.push({ value: key, label: val, disabled: disabled.includes(key) });
        }
    }
    return out;
}

function hasGroups(options: GroupedOptions): boolean {
    return Object.values(options).some(v => typeof v === 'object');
}

// ─── Icon helper ──────────────────────────────────────────────────────────────

import { resolveIcon } from '../../lib/icons';

function ResolvedIcon({ name, className }: { name?: string | null; className?: string }) {
    if (!name) return null;
    const Icon = resolveIcon(name);
    // resolveIcon falls back to Circle for unknown names; render null for truly unknown
    // icons so affixes don't show an unrelated placeholder icon.
    return <Icon className={className} />;
}

// ─── Shared styles ─────────────────────────────────────────────────────────────

const inputBase = [
    'w-full text-sm rounded-lg border outline-none transition-colors',
    'text-zinc-900 dark:text-zinc-100',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-zinc-50 dark:disabled:bg-zinc-900',
].join(' ');

const borderNormal = 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)]/20 focus:border-[var(--larafusion-primary,#18181b)]';
const borderError  = 'border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-800 focus:ring-2 focus:ring-red-200 focus:border-red-400';

// ─── Affix wrapper ─────────────────────────────────────────────────────────────

function iconColorClass(color?: string | null): string {
    switch (color) {
        case 'primary': return 'text-[var(--larafusion-primary,#18181b)]';
        case 'success': return 'text-green-500';
        case 'warning': return 'text-amber-500';
        case 'danger':  return 'text-red-500';
        case 'info':    return 'text-blue-500';
        case 'gray':    return 'text-zinc-400 dark:text-zinc-500';
        default:        return 'text-zinc-400 dark:text-zinc-500';
    }
}

function AffixWrapper({ field, children }: { field: SelectField; children: React.ReactNode }) {
    const hasPre  = field.prefixText  || field.prefixIcon;
    const hasSuf  = field.suffixText  || field.suffixIcon;
    if (!hasPre && !hasSuf) return <>{children}</>;

    // Inline mode: icon floats inside the select via padding + absolute positioning.
    // Only applies when there are no text affixes (text must stay in a separate cell).
    if (field.iconLayout === 'inline' && !field.prefixText && !field.suffixText) {
        return (
            <div className={cn(
                'relative',
                hasPre && '[&_select]:pl-9',
                hasSuf && '[&_select]:pr-9',
            )}>
                {hasPre && (
                    <span className="pointer-events-none select-none absolute left-3 top-1/2 -translate-y-1/2 z-10">
                        <ResolvedIcon name={field.prefixIcon} className={cn('w-4 h-4', iconColorClass(field.prefixIconColor))} />
                    </span>
                )}
                {children}
                {hasSuf && (
                    <span className="pointer-events-none select-none absolute right-8 top-1/2 -translate-y-1/2 z-10">
                        <ResolvedIcon name={field.suffixIcon} className={cn('w-4 h-4', iconColorClass(field.suffixIconColor))} />
                    </span>
                )}
            </div>
        );
    }

    // Separated mode (default): icon in its own bordered cell.
    return (
        <div className="flex items-stretch">
            {hasPre && (
                <span className="inline-flex items-center px-3 gap-1.5 rounded-l-lg border border-r-0 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-500 dark:text-zinc-400 select-none">
                    <ResolvedIcon name={field.prefixIcon} className={cn('w-3.5 h-3.5', iconColorClass(field.prefixIconColor))} />
                    {field.prefixText}
                </span>
            )}
            <div className={cn('flex-1', hasPre && 'rounded-l-none', hasSuf && 'rounded-r-none')}>
                {children}
            </div>
            {hasSuf && (
                <span className="inline-flex items-center px-3 gap-1.5 rounded-r-lg border border-l-0 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-500 dark:text-zinc-400 select-none">
                    {field.suffixText}
                    <ResolvedIcon name={field.suffixIcon} className={cn('w-3.5 h-3.5', iconColorClass(field.suffixIconColor))} />
                </span>
            )}
        </div>
    );
}

// ─── Native select ─────────────────────────────────────────────────────────────
// Used when native={true} (default). Fast, accessible, OS-styled.

function NativeSelect({ field, value, error, onChange }: {
    field: SelectField;
    value: string | string[];
    error?: string;
    onChange: (v: string | string[]) => void;
}) {
    const groups = hasGroups(field.options);
    const disabled = field.disabledOptions ?? [];

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (field.multiple) {
            const selected = Array.from(e.target.selectedOptions).map(o => o.value);
            onChange(selected);
        } else {
            onChange(e.target.value);
        }
    };

    const cls = cn(inputBase, error ? borderError : borderNormal, 'px-3 py-2');

    const renderOptions = () => {
        if (!groups) {
            return Object.entries(field.options as Record<string, string>).map(([k, v]) => (
                <option key={k} value={k} disabled={disabled.includes(k)}>{v}</option>
            ));
        }
        return Object.entries(field.options).map(([groupOrKey, labelOrGroup]) => {
            if (typeof labelOrGroup === 'object' && labelOrGroup !== null) {
                return (
                    <optgroup key={groupOrKey} label={groupOrKey}>
                        {(Object.entries(labelOrGroup) as [string, string][]).map(([k, v]) => (
                            <option key={k} value={k} disabled={disabled.includes(k)}>{v}</option>
                        ))}
                    </optgroup>
                );
            }
            return <option key={groupOrKey} value={groupOrKey} disabled={disabled.includes(groupOrKey)}>{String(labelOrGroup)}</option>;
        });
    };

    const currentValue = field.multiple
        ? (Array.isArray(value) ? value : value ? [value as string] : [])
        : (value as string ?? '');

    return (
        <AffixWrapper field={field}>
            <select
                value={currentValue}
                multiple={field.multiple}
                disabled={field.disabled}
                onChange={handleChange}
                className={cn(cls, field.multiple ? 'min-h-[6rem]' : '')}
            >
                {!field.multiple && (
                    <option value="">{field.placeholder ?? `— Select ${field.label} —`}</option>
                )}
                {renderOptions()}
            </select>
        </AffixWrapper>
    );
}

// ─── Custom JS select ──────────────────────────────────────────────────────────
// Used when native={false}. Supports search, chips, groups, clear, disabled opts.

function CustomSelect({ field, value, error, onChange }: {
    field: SelectField;
    value: string | string[];
    error?: string;
    onChange: (v: string | string[]) => void;
}) {
    const [open, setOpen]           = useState(false);
    const [openUp, setOpenUp]       = useState(false);
    const [search, setSearch]       = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const containerRef              = useRef<HTMLDivElement>(null);
    const inputRef                  = useRef<HTMLInputElement>(null);
    const debounceMs                = field.searchDebounce ?? 0;

    // Debounce search input
    useEffect(() => {
        if (debounceMs <= 0) { setDebouncedSearch(search); return; }
        const t = setTimeout(() => setDebouncedSearch(search), debounceMs);
        return () => clearTimeout(t);
    }, [search, debounceMs]);

    const isSearching = debounceMs > 0 && search !== debouncedSearch;

    const isMulti = field.multiple;
    const selected = isMulti
        ? (Array.isArray(value) ? value : value ? [value as string] : [])
        : (value as string ?? '');

    const allOptions = useMemo(
        () => flattenOptions(field.options, field.disabledOptions ?? []),
        [field.options, field.disabledOptions],
    );

    const limit = field.optionsLimit ?? 50;

    const filtered = useMemo(() => {
        let opts = allOptions;
        if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
            opts = opts.filter(o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
        }
        return opts.slice(0, limit);
    }, [allOptions, debouncedSearch, limit]);

    // Group the filtered options for display
    const grouped = useMemo(() => {
        if (!hasGroups(field.options)) return null;
        const map: Record<string, FlatOption[]> = {};
        filtered.forEach(o => {
            const g = o.group ?? '__ungrouped__';
            (map[g] ??= []).push(o);
        });
        return map;
    }, [filtered, field.options]);

    const labelOf = useCallback((v: string) =>
        allOptions.find(o => o.value === v)?.label ?? v,
    [allOptions]);

    const isSelected = (v: string) => isMulti
        ? (selected as string[]).includes(v)
        : selected === v;

    const toggle = (v: string, optDisabled: boolean) => {
        if (optDisabled) return;
        if (isMulti) {
            const arr = selected as string[];
            const next = arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
            if (field.maxItems && next.length > field.maxItems) return;
            onChange(next);
        } else {
            onChange(v);
            setOpen(false);
            setSearch('');
        }
    };

    const removeChip = (v: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange((selected as string[]).filter(x => x !== v));
    };

    const clearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(isMulti ? [] : '');
    };

    const openDropdown = () => {
        if (field.disabled) return;
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            // Approximate max dropdown height: search bar ~52px + maxItems hint ~32px + options list ~224px
            setOpenUp(spaceBelow < 280 && spaceAbove > spaceBelow);
        }
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 30);
    };

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

    const hasValue = isMulti ? (selected as string[]).length > 0 : !!selected;
    const placeholder = field.placeholder ?? `Select ${field.label}…`;

    const triggerCls = cn(
        'flex items-center gap-2 w-full min-h-[38px] px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors',
        field.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        open  ? 'border-[var(--larafusion-primary,#18181b)] ring-2 ring-[var(--larafusion-primary,#18181b)]/20 bg-white dark:bg-zinc-800'
              : error ? 'border-red-400 bg-red-50 dark:bg-red-950/30'
              : 'border-zinc-300 bg-white dark:bg-zinc-800 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600',
    );

    const wrapLabels = field.wrapOptionLabels !== false;

    const renderOptionList = (opts: FlatOption[]) => opts.map(opt => (
        <button
            key={opt.value}
            type="button"
            disabled={opt.disabled}
            onClick={() => toggle(opt.value, opt.disabled)}
            className={cn(
                'flex items-center justify-between w-full px-3 py-2 text-sm text-left transition-colors',
                opt.disabled ? 'opacity-40 cursor-not-allowed text-zinc-400 dark:text-zinc-500'
                : isSelected(opt.value)
                    ? 'bg-[var(--larafusion-primary,#18181b)]/5 text-[var(--larafusion-primary,#18181b)] dark:bg-[var(--larafusion-primary,#18181b)]/10 dark:text-white font-medium'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700',
            )}
        >
            <span className={wrapLabels ? 'break-words' : 'truncate'}>{opt.label}</span>
            {isSelected(opt.value) && !opt.disabled && (
                <Check className="w-3.5 h-3.5 text-[var(--larafusion-primary,#18181b)] shrink-0 ml-2" />
            )}
        </button>
    ));

    return (
        <FieldWrapper label={field.label} required={field.required} hint={field.hint} error={error}>
            {/* relative wraps trigger + dropdown so the panel aligns with the full control width */}
            <div className="relative" ref={containerRef}>
                {/* ── Trigger ─────────────────────────────────────────── */}
                <div className={triggerCls} onClick={openDropdown}>
                    {/* Inline prefix — rendered inside the trigger so dropdown aligns full-width */}
                    {(field.prefixIcon || field.prefixText) && (
                        <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 shrink-0 select-none">
                            <ResolvedIcon name={field.prefixIcon} className="w-4 h-4" />
                            {field.prefixText}
                        </span>
                    )}

                    <div className="flex-1 flex flex-wrap gap-1 min-w-0">
                        {isMulti && (selected as string[]).length > 0
                            ? (selected as string[]).map(v => (
                                <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--larafusion-primary,#18181b)]/10 text-[var(--larafusion-primary,#18181b)] dark:text-white">
                                    {labelOf(v)}
                                    {!field.disabled && (
                                        <button type="button" onClick={e => removeChip(v, e)}
                                            className="hover:opacity-70 transition-opacity">
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </span>
                            ))
                            : !isMulti && selected
                            ? <span className="text-zinc-900 dark:text-zinc-100 truncate">{labelOf(selected as string)}</span>
                            : <span className="text-zinc-400 dark:text-zinc-500 truncate">{placeholder}</span>
                        }
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        {/* Inline suffix */}
                        {(field.suffixIcon || field.suffixText) && (
                            <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 select-none">
                                {field.suffixText}
                                <ResolvedIcon name={field.suffixIcon} className="w-4 h-4" />
                            </span>
                        )}
                        {field.clearable && hasValue && !field.disabled && (
                            <button type="button" onClick={clearAll}
                                className="p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <ChevronDown className={cn('w-4 h-4 text-zinc-400 transition-transform duration-150', open && 'rotate-180')} />
                    </div>
                </div>

                {/* ── Dropdown ─────────────────────────────────────────── */}
                {open && (
                    <div className={cn(
                        'absolute left-0 right-0 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg',
                        openUp ? 'bottom-full mb-1' : 'top-full mt-1',
                    )}>
                        {/* Search */}
                        {field.searchable && (
                            <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
                                <div className="relative">
                                    {isSearching
                                        ? <Loader2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 animate-spin" />
                                        : <Search  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                                    }
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder={field.searchPrompt ?? 'Search…'}
                                        className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:border-[var(--larafusion-primary,#18181b)] focus:ring-1 focus:ring-[var(--larafusion-primary,#18181b)]/20"
                                    />
                                </div>
                            </div>
                        )}

                        {/* maxItems hint */}
                        {isMulti && field.maxItems && (
                            <div className="px-3 py-1.5 text-xs text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">
                                Select up to {field.maxItems} option{field.maxItems !== 1 ? 's' : ''}
                            </div>
                        )}

                        {/* Options */}
                        <div className="max-h-56 overflow-y-auto py-1">
                            {isSearching ? (
                                <p className="text-center py-6 text-sm text-zinc-400 dark:text-zinc-500 flex items-center justify-center gap-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    {field.searchingMessage ?? 'Searching…'}
                                </p>
                            ) : filtered.length === 0 ? (
                                <p className="text-center py-6 text-sm text-zinc-400 dark:text-zinc-500">
                                    {debouncedSearch
                                        ? (field.noSearchResultsMessage ?? `No results for "${debouncedSearch}"`)
                                        : (field.noOptionsMessage ?? 'No options available')}
                                </p>
                            ) : grouped ? (
                                Object.entries(grouped).map(([group, opts]) => (
                                    <div key={group}>
                                        {group !== '__ungrouped__' && (
                                            <div className="px-3 py-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider bg-zinc-50 dark:bg-zinc-800/60">
                                                {group}
                                            </div>
                                        )}
                                        {renderOptionList(opts)}
                                    </div>
                                ))
                            ) : (
                                renderOptionList(filtered)
                            )}
                        </div>
                    </div>
                )}
            </div>
        </FieldWrapper>
    );
}

// ─── Exported component ────────────────────────────────────────────────────────

export default function SelectFieldComponent({ field, value, error, onChange }: {
    field: SelectField;
    value: string | string[];
    error?: string;
    onChange: (v: string | string[]) => void;
}) {
    // native=false → custom JS dropdown
    if (field.native === false) {
        return (
            <CustomSelect
                field={field}
                value={value}
                error={error}
                onChange={onChange}
            />
        );
    }

    // native=true (default) → native <select> wrapped in FieldWrapper
    return (
        <FieldWrapper label={field.label} required={field.required} hint={field.hint} error={error}>
            <NativeSelect field={field} value={value} error={error} onChange={onChange} />
        </FieldWrapper>
    );
}
