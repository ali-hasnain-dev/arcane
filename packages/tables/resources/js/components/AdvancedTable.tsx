import React, { useMemo, useState } from 'react';
import { Link, Deferred, router } from '@inertiajs/react';
import { setLayoutProps } from '@inertiajs/react';
import { ConfirmDialog } from './ConfirmDialog';
import { Plus, Search, Filter, Pencil, Eye, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, Loader2 } from 'lucide-react';
import { AdvancedTableProps, TableColumn } from '../types';
import { useTableState } from '../hooks/useTableState';
import FilterPanel from './FilterPanel';
import BulkActionBar from './BulkActionBar';
import ColumnVisibilityMenu from './ColumnVisibilityMenu';
import ExportMenu from './ExportMenu';
import Pagination from './Pagination';
import { cn } from '../lib/utils';

// ─── Sort icon ────────────────────────────────────────────────────────────────
function SortIcon({ field, current, dir }: { field: string; current: string; dir: string }) {
    if (field !== current) return <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-300" />;
    return dir === 'asc'
        ? <ChevronUp   className="w-3.5 h-3.5 text-[var(--arcane-primary,#18181b)]" />
        : <ChevronDown className="w-3.5 h-3.5 text-[var(--arcane-primary,#18181b)]" />;
}

// ─── Default cell renderer ────────────────────────────────────────────────────
function DefaultCell({ col, value }: { col: TableColumn; value: unknown }) {
    if (col.render) return <>{col.render(value, {})}</>;
    if (value === null || value === undefined || value === '') {
        return <span className="text-zinc-300">—</span>;
    }
    if (typeof value === 'boolean') {
        return value
            ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Yes</span>
            : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-500">No</span>;
    }
    return <span className="text-zinc-700">{String(value)}</span>;
}

// ─── Table skeleton ───────────────────────────────────────────────────────────
function Skeleton({ cols }: { cols: number }) {
    return (
        <div className="animate-pulse p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                    {Array.from({ length: cols + 2 }).map((_, j) => (
                        <div key={j} className={cn('h-4 bg-zinc-100 rounded', j === 0 ? 'w-6' : 'flex-1')} />
                    ))}
                </div>
            ))}
        </div>
    );
}

// ─── AdvancedTable ────────────────────────────────────────────────────────────
export default function AdvancedTable({
    resourceSlug,
    resourceLabel,
    columns,
    records,
    bulkActions = [],
    filters = [],
    exportable = false,
    selectable = true,
    createUrl,
}: AdvancedTableProps) {

    const {
        state,
        sort,
        search,
        setFilter,
        clearFilters,
        activeFilterCount,
        goToPage,
        setPerPage,
        toggleSelect,
        selectAll,
        clearSelection,
        toggleColumnVisibility,
        exportData,
    } = useTableState({
        resourceSlug,
        defaultColumns: columns.filter(c => c.visible !== false).map(c => c.key),
    });

    const [showFilters, setShowFilters] = React.useState(activeFilterCount > 0);

    const [confirmState, setConfirmState] = useState<{
        open: boolean; title: string; message: string; onConfirm: () => void;
    }>({ open: false, title: '', message: '', onConfirm: () => {} });

    const openConfirm = (title: string, message: string, onConfirm: () => void) =>
        setConfirmState({ open: true, title, message, onConfirm });
    const closeConfirm = () => setConfirmState(s => ({ ...s, open: false }));

    // Only render visible columns
    const visibleCols = useMemo(() =>
        columns.filter(c => state.visibleColumns.includes(c.key)),
        [columns, state.visibleColumns]
    );

    // v3: optimistic delete
    const handleDelete = (id: string | number) => {
        openConfirm(
            `Delete ${resourceLabel}`,
            `Are you sure you want to delete this ${resourceLabel.toLowerCase()}? This action cannot be undone.`,
            () => router.optimistic<{ records: typeof records }>(props => ({
                records: {
                    ...props.records,
                    data: props.records.data.filter(r => (r as Record<string, unknown>).id !== id),
                    total: props.records.total - 1,
                },
            })).delete(`/admin/${resourceSlug}/${id}`, { preserveScroll: true }),
        );
    };

    const isAllSelected = records.data.length > 0 &&
        state.selectedIds.length === records.data.length;

    return (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">

            {/* ── Toolbar ──────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-zinc-100">

                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <input
                        type="text"
                        value={state.search}
                        onChange={e => search(e.target.value)}
                        placeholder={`Search ${resourceLabel.toLowerCase()}…`}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[var(--arcane-primary,#18181b)]/20 focus:border-[var(--arcane-primary,#18181b)] outline-none"
                    />
                </div>

                {/* Filter toggle */}
                {filters.length > 0 && (
                    <button
                        onClick={() => setShowFilters(s => !s)}
                        className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                            showFilters || activeFilterCount > 0
                                ? 'bg-[var(--arcane-primary,#18181b)]/5 border-[var(--arcane-primary,#18181b)]/30 text-[var(--arcane-primary,#18181b)]'
                                : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50'
                        )}
                    >
                        <Filter className="w-4 h-4" />
                        <span className="hidden sm:inline">Filters</span>
                        {activeFilterCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--arcane-primary,#18181b)] text-white text-xs font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                )}

                {/* Column visibility */}
                <ColumnVisibilityMenu
                    columns={columns}
                    visibleColumns={state.visibleColumns}
                    onToggle={toggleColumnVisibility}
                />

                {/* Export */}
                {exportable && (
                    <ExportMenu
                        records={records}
                        visibleColumns={state.visibleColumns}
                        filename={resourceSlug}
                        onExport={opts => exportData(records, opts)}
                    />
                )}

                {/* Summary */}
                <span className="text-sm text-zinc-400 hidden md:block">
                    {records.total} {resourceLabel.toLowerCase()}{records.total !== 1 ? 's' : ''}
                </span>

                {/* Create */}
                {createUrl && (
                    <Link
                        href={createUrl}
                        prefetch
                        className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--arcane-primary,#18181b)] hover:opacity-90 text-white transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New {resourceLabel}</span>
                    </Link>
                )}
            </div>

            {/* ── Filter panel (slide-down) ─────────────────────────────────── */}
            {showFilters && filters.length > 0 && (
                <FilterPanel
                    filters={filters}
                    activeFilters={state.filters}
                    onSetFilter={setFilter}
                    onClearAll={clearFilters}
                />
            )}

            {/* ── Bulk action bar ───────────────────────────────────────────── */}
            <BulkActionBar
                selectedCount={state.selectedIds.length}
                totalCount={records.total}
                actions={bulkActions}
                selectedIds={state.selectedIds}
                onClearSelection={clearSelection}
            />

            {/* ── Table (Deferred) ──────────────────────────────────────────── */}
            <Deferred data="records" fallback={<Skeleton cols={visibleCols.length} />}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200">
                                {/* Checkbox column */}
                                {selectable && (
                                    <th className="w-10 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={() => selectAll(records.data as Record<string, unknown>[])}
                                            className="rounded border-zinc-300 accent-[var(--arcane-primary,#18181b)] focus:ring-[var(--arcane-primary,#18181b)]/20 cursor-pointer"
                                        />
                                    </th>
                                )}

                                {visibleCols.map(col => (
                                    <th
                                        key={col.key}
                                        onClick={() => col.sortable && sort(col.key)}
                                        style={{ width: col.width }}
                                        className={cn(
                                            'px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide select-none',
                                            col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                                            col.sortable && 'cursor-pointer hover:text-zinc-800'
                                        )}
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            {col.label}
                                            {col.sortable && (
                                                <SortIcon field={col.key} current={state.sortField} dir={state.sortDirection} />
                                            )}
                                        </span>
                                    </th>
                                ))}

                                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide w-28">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-zinc-100">
                            {records.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={visibleCols.length + (selectable ? 2 : 1)}
                                        className="text-center py-16 text-zinc-400"
                                    >
                                        <p className="font-medium">No {resourceLabel.toLowerCase()}s found.</p>
                                        {activeFilterCount > 0 && (
                                            <button
                                                onClick={clearFilters}
                                                className="text-sm text-[var(--arcane-primary,#18181b)] hover:underline mt-1"
                                            >
                                                Clear filters
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                records.data.map(row => {
                                    const record = row as Record<string, unknown>;
                                    const id     = record.id as string | number;
                                    const isSelected = state.selectedIds.includes(id);

                                    return (
                                        <tr
                                            key={id}
                                            className={cn(
                                                'transition-colors group',
                                                isSelected ? 'bg-[var(--arcane-primary,#18181b)]/5' : 'hover:bg-zinc-50/70'
                                            )}
                                        >
                                            {selectable && (
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelect(id)}
                                                        className="rounded border-zinc-300 accent-[var(--arcane-primary,#18181b)] focus:ring-[var(--arcane-primary,#18181b)]/20 cursor-pointer"
                                                    />
                                                </td>
                                            )}

                                            {visibleCols.map(col => (
                                                <td
                                                    key={col.key}
                                                    className={cn(
                                                        'px-4 py-3',
                                                        col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                                                    )}
                                                >
                                                    <DefaultCell col={col} value={record[col.key]} />
                                                </td>
                                            ))}

                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        href={`/admin/${resourceSlug}/${id}`}
                                                        prefetch
                                                        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    <Link
                                                        href={`/admin/${resourceSlug}/${id}/edit`}
                                                        prefetch
                                                        className="p-1.5 rounded-md text-zinc-400 hover:text-[var(--arcane-primary,#18181b)] hover:bg-[var(--arcane-primary,#18181b)]/5 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(id)}
                                                        className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <Pagination
                    data={records}
                    perPage={state.perPage}
                    onPageChange={goToPage}
                    onPerPageChange={setPerPage}
                />
            </Deferred>

            <ConfirmDialog
                open={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                variant="danger"
                confirmLabel="Delete"
                onConfirm={confirmState.onConfirm}
                onCancel={closeConfirm}
            />
        </div>
    );
}
