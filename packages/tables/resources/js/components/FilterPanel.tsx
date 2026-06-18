import React from 'react';
import { ColumnFilter, ActiveFilter } from '../types';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface FilterPanelProps {
    filters: ColumnFilter[];
    activeFilters: Record<string, unknown>;
    onSetFilter: (field: string, value: unknown) => void;
    onClearAll: () => void;
}

// ─── Individual filter input by type ─────────────────────────────────────────
function FilterInput({ filter, value, onChange }: {
    filter: ColumnFilter;
    value: unknown;
    onChange: (v: unknown) => void;
}) {
    const base = 'w-full text-sm border border-zinc-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[var(--arcane-primary,#18181b)]/20 focus:border-[var(--arcane-primary,#18181b)] bg-white';

    switch (filter.type) {
        case 'select':
            return (
                <select
                    value={(value as string) ?? ''}
                    onChange={e => onChange(e.target.value || null)}
                    className={base}
                >
                    <option value="">All</option>
                    {filter.options?.map(opt => (
                        <option key={String(opt.value)} value={String(opt.value)}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            );

        case 'boolean':
            return (
                <select
                    value={value === null || value === undefined ? '' : String(value)}
                    onChange={e => {
                        if (e.target.value === '') onChange(null);
                        else onChange(e.target.value === 'true');
                    }}
                    className={base}
                >
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
            );

        case 'date_range': {
            const range = (value as { from?: string; to?: string }) ?? {};
            return (
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={range.from ?? ''}
                        onChange={e => onChange({ ...range, from: e.target.value || undefined })}
                        className={cn(base, 'flex-1')}
                        placeholder="From"
                    />
                    <span className="text-zinc-400 text-xs shrink-0">to</span>
                    <input
                        type="date"
                        value={range.to ?? ''}
                        onChange={e => onChange({ ...range, to: e.target.value || undefined })}
                        className={cn(base, 'flex-1')}
                        placeholder="To"
                    />
                </div>
            );
        }

        case 'number_range': {
            const range = (value as { min?: number; max?: number }) ?? {};
            return (
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={range.min ?? ''}
                        onChange={e => onChange({ ...range, min: e.target.value ? Number(e.target.value) : undefined })}
                        className={cn(base, 'flex-1')}
                        placeholder="Min"
                    />
                    <span className="text-zinc-400 text-xs shrink-0">–</span>
                    <input
                        type="number"
                        value={range.max ?? ''}
                        onChange={e => onChange({ ...range, max: e.target.value ? Number(e.target.value) : undefined })}
                        className={cn(base, 'flex-1')}
                        placeholder="Max"
                    />
                </div>
            );
        }

        default: // text
            return (
                <input
                    type="text"
                    value={(value as string) ?? ''}
                    onChange={e => onChange(e.target.value || null)}
                    placeholder={filter.placeholder ?? `Filter by ${filter.label.toLowerCase()}…`}
                    className={base}
                />
            );
    }
}

// ─── Active filter chips ──────────────────────────────────────────────────────
function ActiveFilterChips({ filters, activeFilters, onSetFilter }: {
    filters: ColumnFilter[];
    activeFilters: Record<string, unknown>;
    onSetFilter: (field: string, value: unknown) => void;
}) {
    const chips: ActiveFilter[] = Object.entries(activeFilters)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([field, value]) => {
            const filterDef = filters.find(f => f.field === field);
            let label = String(value);
            if (filterDef?.type === 'select') {
                label = filterDef.options?.find(o => String(o.value) === String(value))?.label ?? label;
            } else if (filterDef?.type === 'boolean') {
                label = value ? 'Yes' : 'No';
            }
            return { field, value, label: `${filterDef?.label ?? field}: ${label}` };
        });

    if (chips.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-zinc-100">
            {chips.map(chip => (
                <span
                    key={chip.field}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--arcane-primary,#18181b)]/10 text-[var(--arcane-primary,#18181b)] border border-[var(--arcane-primary,#18181b)]/20"
                >
                    {chip.label}
                    <button
                        onClick={() => onSetFilter(chip.field, null)}
                        className="hover:opacity-70 transition-opacity"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </span>
            ))}
        </div>
    );
}

// ─── FilterPanel ──────────────────────────────────────────────────────────────
export default function FilterPanel({ filters, activeFilters, onSetFilter, onClearAll }: FilterPanelProps) {
    const hasActive = Object.values(activeFilters).some(v => v !== null && v !== undefined && v !== '');

    return (
        <div className="border-t border-zinc-100 bg-zinc-50/60 px-6 py-4 space-y-4">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Filters</span>
                {hasActive && (
                    <button
                        onClick={onClearAll}
                        className="text-xs text-[var(--arcane-primary,#18181b)] hover:opacity-80 hover:underline font-medium"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Filter inputs grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filters.map(filter => (
                    <div key={filter.field} className="space-y-1">
                        <label className="block text-xs font-medium text-zinc-600">{filter.label}</label>
                        <FilterInput
                            filter={filter}
                            value={activeFilters[filter.field]}
                            onChange={v => onSetFilter(filter.field, v)}
                        />
                    </div>
                ))}
            </div>

            {/* Active filter chips */}
            <ActiveFilterChips
                filters={filters}
                activeFilters={activeFilters}
                onSetFilter={onSetFilter}
            />
        </div>
    );
}
