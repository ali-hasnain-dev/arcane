import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { usePrefetchProps } from '../../hooks/usePrefetchProps';
import AdminLayout from '../../components/layout/AdminLayout';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ArcanePageProps, FormValues, ArcaneField, FormSchemaItem } from '../../types';

function flattenFields(items: FormSchemaItem[]): ArcaneField[] {
    const out: ArcaneField[] = [];
    for (const item of items) {
        if (item.type === 'section') { flattenFields(item.fields).forEach(f => out.push(f)); }
        else if (item.type === 'tabs') { item.tabs.forEach(t => flattenFields(t.fields).forEach(f => out.push(f))); }
        else if (item.type === 'grid') { flattenFields(item.fields).forEach(f => out.push(f)); }
        else out.push(item);
    }
    return out;
}
import { Pencil, Trash2, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';

// ─── Cell value renderer for Show page ───────────────────────────────────────
function FieldValue({ field, value }: { field: ArcaneField; value: unknown }) {
    if (value === null || value === undefined || value === '') {
        return <span className="text-zinc-300 dark:text-zinc-600">—</span>;
    }

    switch (field.type) {
        case 'toggle':
            return value
                ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Yes</span>
                : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">No</span>;

        case 'select': {
            const opts = (field as never as { options: Record<string, string> }).options;
            const label = opts[value as string] ?? (value as string);
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--arcane-primary,#18181b)]/10 text-[var(--arcane-primary,#18181b)] dark:text-white">{label}</span>;
        }

        case 'tags': {
            const tags = Array.isArray(value) ? value : (value as string).split(',');
            return (
                <div className="flex flex-wrap gap-1.5">
                    {tags.map((t: string) => (
                        <span key={t} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[var(--arcane-primary,#18181b)]/10 text-[var(--arcane-primary,#18181b)] dark:text-white border border-[var(--arcane-primary,#18181b)]/20">
                            {t}
                        </span>
                    ))}
                </div>
            );
        }

        case 'color':
            return (
                <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md border border-black/10 shrink-0" style={{ backgroundColor: value as string }} />
                    <span className="text-zinc-700 dark:text-zinc-300 font-mono text-sm">{value as string}</span>
                </div>
            );

        case 'image': {
            // value can be a path string or JSON array of paths
            const paths: string[] = (() => {
                try {
                    const parsed = JSON.parse(value as string);
                    return Array.isArray(parsed) ? parsed : [value as string];
                } catch { return [value as string]; }
            })();
            return (
                <div className="flex flex-wrap gap-2">
                    {paths.map(p => (
                        <a key={p} href={`/storage/${p}`} target="_blank" rel="noopener noreferrer">
                            <img
                                src={`/storage/${p}`}
                                alt=""
                                className="w-20 h-20 rounded-lg object-cover border border-zinc-200 hover:opacity-80 transition-opacity"
                            />
                        </a>
                    ))}
                </div>
            );
        }

        case 'file': {
            const paths: string[] = (() => {
                try {
                    const parsed = JSON.parse(value as string);
                    return Array.isArray(parsed) ? parsed : [value as string];
                } catch { return [value as string]; }
            })();
            return (
                <div className="space-y-1.5">
                    {paths.map(p => (
                        <a
                            key={p}
                            href={`/storage/${p}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-[var(--arcane-primary,#18181b)] dark:text-zinc-300 hover:opacity-80 hover:underline"
                        >
                            <FileText className="w-4 h-4" />
                            {p.split('/').pop()}
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    ))}
                </div>
            );
        }

        default:
            return <span className="text-zinc-800 dark:text-zinc-200">{String(value)}</span>;
    }
}

export default function Show({ resource, schema: rawSchema, record }: ArcanePageProps) {
    const schema = flattenFields(rawSchema);
    const data   = record as FormValues;
    const id     = data?.id as string | number;
    const prefetchProps = usePrefetchProps();

    const [deleteOpen, setDeleteOpen] = useState(false);

    return (
        <AdminLayout pageTitle={`${resource.label} #${id}`}>
            <Breadcrumb
                crumbs={[
                    { label: resource.navigationLabel, href: `/admin/${resource.slug}` },
                    { label: `#${id}` },
                ]}
                heading={`${resource.label} #${id}`}
            />

            <Card>
                <CardHeader
                    title={`${resource.label} #${id}`}
                    description="Record details"
                    actions={
                        <>
                            {resource.can?.edit !== false && (
                                <Link
                                    href={`/admin/${resource.slug}/${id}/edit`}
                                    {...prefetchProps}
                                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-[var(--arcane-primary,#18181b)] hover:opacity-90 text-white transition-colors"
                                >
                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                </Link>
                            )}
                            {resource.can?.delete !== false && (
                                <button
                                    type="button"
                                    onClick={() => setDeleteOpen(true)}
                                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                            )}
                        </>
                    }
                />

                <CardBody>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {schema.map(field => {
                            if (field.type === 'password' || field.hidden) return null;

                            // Full-width fields
                            const fullWidth = ['textarea', 'repeater', 'tags', 'file', 'image'].includes(field.type);

                            return (
                                <div key={field.name} className={fullWidth ? 'md:col-span-2' : ''}>
                                    <dt className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
                                        {field.label}
                                    </dt>
                                    <dd>
                                        <FieldValue field={field} value={data[field.name]} />
                                    </dd>
                                </div>
                            );
                        })}
                    </dl>
                </CardBody>
            </Card>
            <ConfirmDialog
                open={deleteOpen}
                title={`Delete ${resource.label}`}
                message={`Are you sure you want to delete this ${resource.label.toLowerCase()}? This action cannot be undone.`}
                variant="danger"
                confirmLabel="Delete"
                onConfirm={() => router.delete(`/admin/${resource.slug}/${id}`, { preserveScroll: false })}
                onCancel={() => setDeleteOpen(false)}
            />
        </AdminLayout>
    );
}
