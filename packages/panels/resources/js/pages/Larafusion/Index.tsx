import React, { useState } from 'react';
import { usePage, Deferred } from '@inertiajs/react';
import AdminLayout from '../../components/layout/AdminLayout';
import Breadcrumb from '../../components/ui/Breadcrumb';
import PageHeaderActions from '../../components/ui/PageHeaderActions';
import WidgetGrid from '../../components/widgets/WidgetGrid';
import FormModal from '../../components/form/FormModal';
import { IndexPageProps } from '../../types';
import type { ResourceMeta, FormSchemaItem, Column, RecordAction, TableConfig } from '@larafusion/support';

// @larafusion/table is an optional add-on package; null = use built-in BasicTable
const AdvancedTableComponent: React.ComponentType<Record<string, unknown>> | null = null;

import BasicTable from '../../components/table/BasicTable';

// Must be a separate component — hooks cannot be called inside Deferred render callbacks.
function DeferredWidgets() {
    const { widgets } = usePage<IndexPageProps>().props;
    return <WidgetGrid widgets={widgets ?? []} />;
}

/**
 * Loading placeholder shown while ->deferLoading()'s initial fetch is in
 * flight. Sized from data we already have synchronously — real column count
 * and the resource's configured per-page count — so the page doesn't jump
 * once the real table swaps in.
 */
function TableSkeleton({ columns, perPage }: { columns: Column[]; perPage?: number }) {
    const rowCount = Math.min(Math.max(perPage ?? 10, 1), 25);
    const colCount = Math.max(columns.length, 1);

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/50">
                        {/* Column labels are already known synchronously (columns isn't
                            deferred) — show the real text instead of a skeleton bar. */}
                        {Array.from({ length: colCount }).map((_, i) => (
                            <th key={i} className="text-left px-4 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                {columns[i]?.label ?? ''}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {Array.from({ length: rowCount }).map((_, r) => (
                        <tr key={r}>
                            {Array.from({ length: colCount }).map((_, c) => (
                                <td key={c} className="px-4 py-3.5">
                                    <div
                                        className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"
                                        style={{ width: `${60 + ((r + c) % 3) * 15}%` }}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Separate component so it can re-read `records` fresh once the deferred fetch
// lands, without calling hooks inside <Deferred>'s render callback.
function DeferredTable(props: {
    resource: ResourceMeta;
    schema: FormSchemaItem[];
    columns: Column[];
    actions: RecordAction[];
    tableConfig?: TableConfig;
    onModalEdit?: (record: Record<string, unknown>) => void;
}) {
    const { records } = usePage<IndexPageProps>().props;
    if (!records) return <TableSkeleton columns={props.columns} perPage={props.resource.perPage} />;
    return <BasicTable key={props.resource.slug} records={records} {...props} />;
}

export default function Index(props: IndexPageProps) {
    // schema is omitted entirely by the server for resources with no inline-editable
    // columns (see ResourceController::index()) — default to [] so flattenFields()
    // downstream doesn't choke on undefined.
    const { resource, schema = [], columns, records, actions = [], tableConfig, headerActions = [] } = props;
    const [modalMode, setModalMode]     = useState<'create' | 'edit' | null>(null);
    const [editRecord, setEditRecord]   = useState<Record<string, unknown> | null>(null);
    const [editRecordId, setEditRecordId] = useState<string | number | null>(null);


    function openCreate() { setEditRecord(null); setEditRecordId(null); setModalMode('create'); }
    function openEdit(record: Record<string, unknown>) {
        setEditRecord(record);
        setEditRecordId(record.id as string | number);
        setModalMode('edit');
    }
    function closeModal() { setModalMode(null); }

    // Build bulk actions wired to the bulk-destroy endpoint
    const bulkActions = [
        {
            key: 'delete',
            label: 'Delete selected',
            icon: 'trash',
            variant: 'danger' as const,
            confirm: 'Delete {count} selected records? This cannot be undone.',
            handler: (ids: (string | number)[]) => {
                import('@inertiajs/react').then(({ router }) => {
                    router.delete(`/admin/${resource.slug}/bulk`, {
                        data: { ids },
                        preserveScroll: true,
                    });
                });
            },
        },
    ];

    // Build ColumnFilter definitions from columns schema
    const filters = columns
        .filter(c => c.filterable)
        .map(c => ({
            field:      c.name,
            type:       (c.filterType ?? 'text') as 'text' | 'select' | 'boolean' | 'date_range' | 'number_range',
            label:      c.label,
            options:    c.filterOptions,
        }));

    // When useModalForms is on, render 'create' actions as modal-open buttons;
    // all other header actions pass through PageHeaderActions normally.
    const nonCreateActions = headerActions.filter(a => a.type !== 'create');
    const createActions    = headerActions.filter(a => a.type === 'create');

    const headerActionsEl = (
        <div className="flex items-center gap-2">
            {resource.useModalForms
                ? createActions.map((action, i) => (
                    <button key={i} type="button" onClick={openCreate}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--larafusion-primary,#18181b)] hover:opacity-90 text-white transition-colors shadow-sm">
                        {action.label}
                    </button>
                ))
                : null
            }
            <PageHeaderActions actions={resource.useModalForms ? nonCreateActions : headerActions} />
        </div>
    );

    // Default is max-w-7xl; only override is 'full' which removes the constraint entirely.
    const contentWidthClass = tableConfig?.contentWidth === 'full'
        ? ''
        : 'max-w-7xl mx-auto w-full';

    return (
        <AdminLayout pageTitle={resource.navigationLabel}>
            <div className={contentWidthClass}>
            <Breadcrumb
                crumbs={[
                    { label: resource.navigationLabel, href: `/admin/${resource.slug}` },
                    { label: 'List' },
                ]}
                heading={tableConfig?.heading ?? resource.navigationLabel}
                description={tableConfig?.description}
                actions={headerActionsEl}
            />

            <Deferred data="widgets" fallback={<></>}>
                <DeferredWidgets />
            </Deferred>

            {AdvancedTableComponent ? (
                // Phase 3: @larafusion/table installed — full featured table
                <AdvancedTableComponent
                    resourceSlug={resource.slug}
                    resourceLabel={resource.label}
                    columns={columns.map(c => ({
                        key:       c.name,
                        label:     c.label,
                        sortable:  resource.sortable.includes(c.name),
                        filterable: c.filterable ?? false,
                        filterType: c.filterType,
                        filterOptions: c.filterOptions,
                        visible:   true,
                    }))}
                    records={records}
                    bulkActions={bulkActions}
                    filters={filters}
                    exportable
                    selectable
                    createUrl={`/admin/${resource.slug}/create`}
                />
            ) : tableConfig?.deferLoading ? (
                // ->deferLoading(): page shell (header, breadcrumb, widgets) renders
                // immediately; records arrive in a follow-up request and the table
                // mounts once they land.
                <Deferred data="records" fallback={<TableSkeleton columns={columns} perPage={resource.perPage} />}>
                    <DeferredTable
                        resource={resource}
                        schema={schema}
                        columns={columns}
                        actions={actions}
                        tableConfig={tableConfig}
                        onModalEdit={resource.useModalForms ? openEdit : undefined}
                    />
                </Deferred>
            ) : (
                // Core only: basic table.
                // key={resource.slug} forces a full remount when the user navigates
                // between resources so stale search / selection / filter state is cleared.
                <BasicTable
                    key={resource.slug}
                    resource={resource}
                    schema={schema}
                    columns={columns}
                    records={records!}
                    actions={actions}
                    tableConfig={tableConfig}
                    onModalEdit={resource.useModalForms ? openEdit : undefined}
                />
            )}

            {/* Modal forms — only rendered when useModalForms is enabled */}
            {resource.useModalForms && (
                <FormModal
                    open={modalMode !== null}
                    onClose={closeModal}
                    title={modalMode === 'edit' ? `Edit ${resource.label}` : `New ${resource.label}`}
                    resourceSlug={resource.slug}
                    schema={schema}
                    record={modalMode === 'edit' ? editRecord : null}
                    recordId={modalMode === 'edit' ? editRecordId : null}
                />
            )}
            </div>
        </AdminLayout>
    );
}
