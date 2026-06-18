import { useState, useCallback, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { TableState, ExportOptions, PaginatedData } from '../types';

interface UseTableStateOptions {
    resourceSlug: string;
    defaultColumns: string[];
    initialPerPage?: number;
}

export function useTableState({ resourceSlug, defaultColumns, initialPerPage = 15 }: UseTableStateOptions) {
    // Bootstrap state from current URL params
    const params = useMemo(() => new URLSearchParams(window.location.search), []);

    const [state, setState] = useState<TableState>({
        search:         params.get('search') ?? '',
        sortField:      params.get('sort') ?? 'id',
        sortDirection:  (params.get('direction') as 'asc' | 'desc') ?? 'desc',
        filters:        parseFilters(params),
        page:           Number(params.get('page') ?? 1),
        perPage:        Number(params.get('per_page') ?? initialPerPage),
        selectedIds:    [],
        visibleColumns: defaultColumns,
    });

    // ── Navigate helper — all table interactions go through this ──────────────
    const navigate = useCallback((patch: Partial<Omit<TableState, 'selectedIds' | 'visibleColumns'>>) => {
        const next = { ...state, ...patch, selectedIds: [] };

        // v3 router.get with preserveState + replace — no history spam, keeps scroll
        router.get(
            `/admin/${resourceSlug}`,
            buildQueryParams(next),
            { preserveState: true, replace: true, preserveScroll: true }
        );

        setState(s => ({ ...s, ...patch, selectedIds: [] }));
    }, [state, resourceSlug]);

    // ── Sort ──────────────────────────────────────────────────────────────────
    const sort = useCallback((field: string) => {
        const direction = state.sortField === field && state.sortDirection === 'asc' ? 'desc' : 'asc';
        navigate({ sortField: field, sortDirection: direction, page: 1 });
    }, [state.sortField, state.sortDirection, navigate]);

    // ── Search ────────────────────────────────────────────────────────────────
    const search = useCallback((value: string) => {
        navigate({ search: value, page: 1 });
    }, [navigate]);

    // ── Column filter ─────────────────────────────────────────────────────────
    const setFilter = useCallback((field: string, value: unknown) => {
        const filters = { ...state.filters };
        if (value === '' || value === null || value === undefined) {
            delete filters[field];
        } else {
            filters[field] = value;
        }
        navigate({ filters, page: 1 });
    }, [state.filters, navigate]);

    const clearFilters = useCallback(() => {
        navigate({ filters: {}, search: '', page: 1 });
    }, [navigate]);

    const activeFilterCount = useMemo(() =>
        Object.keys(state.filters).length + (state.search ? 1 : 0),
        [state.filters, state.search]
    );

    // ── Pagination ────────────────────────────────────────────────────────────
    const goToPage = useCallback((page: number) => {
        navigate({ page });
    }, [navigate]);

    const setPerPage = useCallback((perPage: number) => {
        navigate({ perPage, page: 1 });
    }, [navigate]);

    // ── Selection ─────────────────────────────────────────────────────────────
    const toggleSelect = useCallback((id: string | number) => {
        setState(s => ({
            ...s,
            selectedIds: s.selectedIds.includes(id)
                ? s.selectedIds.filter(x => x !== id)
                : [...s.selectedIds, id],
        }));
    }, []);

    const selectAll = useCallback((records: Record<string, unknown>[]) => {
        setState(s => ({
            ...s,
            selectedIds: s.selectedIds.length === records.length
                ? []
                : records.map(r => r.id as string | number),
        }));
    }, []);

    const clearSelection = useCallback(() => {
        setState(s => ({ ...s, selectedIds: [] }));
    }, []);

    // ── Column visibility ─────────────────────────────────────────────────────
    const toggleColumnVisibility = useCallback((key: string) => {
        setState(s => ({
            ...s,
            visibleColumns: s.visibleColumns.includes(key)
                ? s.visibleColumns.filter(c => c !== key)
                : [...s.visibleColumns, key],
        }));
    }, []);

    // ── Export ────────────────────────────────────────────────────────────────
    const exportData = useCallback((records: PaginatedData, options: ExportOptions) => {
        const cols = options.columns ?? state.visibleColumns;
        const rows = records.data.map(row =>
            Object.fromEntries(cols.map(c => [c, (row as Record<string, unknown>)[c]]))
        );

        if (options.format === 'csv') {
            downloadCSV(rows, cols, options.filename ?? resourceSlug);
        } else {
            downloadJSON(rows, options.filename ?? resourceSlug);
        }
    }, [state.visibleColumns, resourceSlug]);

    return {
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
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseFilters(params: URLSearchParams): Record<string, unknown> {
    const filters: Record<string, unknown> = {};
    params.forEach((value, key) => {
        if (key.startsWith('filter[') && key.endsWith(']')) {
            const field = key.slice(7, -1);
            filters[field] = value;
        }
    });
    return filters;
}

function buildQueryParams(state: Omit<TableState, 'selectedIds' | 'visibleColumns'>): Record<string, string | number> {
    const params: Record<string, string | number> = {};
    if (state.search)          params.search    = state.search;
    if (state.sortField)       params.sort      = state.sortField;
    if (state.sortDirection)   params.direction = state.sortDirection;
    if (state.page > 1)        params.page      = state.page;
    if (state.perPage !== 15)  params.per_page  = state.perPage;
    Object.entries(state.filters).forEach(([k, v]) => {
        if (v !== null && v !== undefined) params[`filter[${k}]`] = String(v);
    });
    return params;
}

function downloadCSV(rows: Record<string, unknown>[], cols: string[], filename: string) {
    const header = cols.join(',');
    const body   = rows.map(row =>
        cols.map(c => JSON.stringify(row[c] ?? '')).join(',')
    ).join('\n');
    download(`${header}\n${body}`, `${filename}.csv`, 'text/csv');
}

function downloadJSON(rows: Record<string, unknown>[], filename: string) {
    download(JSON.stringify(rows, null, 2), `${filename}.json`, 'application/json');
}

function download(content: string, filename: string, mime: string) {
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}
