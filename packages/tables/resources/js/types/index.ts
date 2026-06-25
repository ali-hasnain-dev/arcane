export type { Column } from '@larafusion/support';

// ─── Filter types ─────────────────────────────────────────────────────────────

export type FilterType = 'text' | 'select' | 'boolean' | 'date_range' | 'number_range';

export interface FilterOption {
    label: string;
    value: string | number | boolean;
}

export interface ColumnFilter {
    field: string;
    type: FilterType;
    label: string;
    options?: FilterOption[];     // for select filter
    placeholder?: string;
}

export interface ActiveFilter {
    field: string;
    value: unknown;
    label: string;
}

// ─── Column definition ────────────────────────────────────────────────────────

export type ColumnAlign = 'left' | 'center' | 'right';

export interface TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    filterable?: boolean;
    filterType?: FilterType;
    filterOptions?: FilterOption[];
    visible?: boolean;
    align?: ColumnAlign;
    width?: string;
    render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

// ─── Bulk action ──────────────────────────────────────────────────────────────

export interface BulkAction {
    key: string;
    label: string;
    icon?: string;
    variant?: 'default' | 'danger';
    confirm?: string;
    handler: (selectedIds: (string | number)[]) => void;
}

// ─── Table state ──────────────────────────────────────────────────────────────

export interface TableState {
    search: string;
    sortField: string;
    sortDirection: 'asc' | 'desc';
    filters: Record<string, unknown>;
    page: number;
    perPage: number;
    selectedIds: (string | number)[];
    visibleColumns: string[];
}

// ─── Paginated response ───────────────────────────────────────────────────────

export interface PaginatedData<T = Record<string, unknown>> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

// ─── Export ───────────────────────────────────────────────────────────────────

export type ExportFormat = 'csv' | 'json';

export interface ExportOptions {
    format: ExportFormat;
    filename?: string;
    columns?: string[];  // if empty, exports all visible columns
}

// ─── Built-in table record / toolbar action types ────────────────────────────

export interface BuiltinRecordAction {
    type: 'edit' | 'delete' | 'view' | 'action';
    key: string;
    label: string;
    color?: string;
    confirm?: string | null;
    // Extra fields used when type === 'action'
    icon?: string | null;
    display?: 'icon' | 'text' | 'button';
    confirmHeading?: string | null;
    confirmDescription?: string | null;
    confirmSubmitLabel?: string | null;
    tooltip?: string | null;
    badge?: string | null;
    badgeColor?: string | null;
    url?: string | null;
    newTab?: boolean;
    isLink?: boolean;
}

export type BulkActionItemType = 'delete_bulk' | 'force_delete_bulk' | 'restore_bulk';

export interface BuiltinBulkAction {
    type: BulkActionItemType;
    key: string;
    label: string;
}

export interface BulkActionGroupDef {
    type: 'bulk_group';
    key: string;
    label: string;
    actions: BuiltinBulkAction[];
}

export type ToolbarAction = BulkActionGroupDef;

// ─── AdvancedTable props ──────────────────────────────────────────────────────

export interface AdvancedTableProps {
    resourceSlug: string;
    resourceLabel: string;
    columns: TableColumn[];
    records: PaginatedData;
    bulkActions?: BulkAction[];
    filters?: ColumnFilter[];
    exportable?: boolean;
    selectable?: boolean;
    createUrl?: string;
}
