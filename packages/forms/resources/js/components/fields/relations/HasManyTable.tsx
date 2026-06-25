import React, { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { ExternalLink, Loader2, Plus } from 'lucide-react';
import FieldWrapper from '../FieldWrapper';
import { ValidationStatus } from '../../../types';
import { cn } from '../../../lib/utils';

interface HasManyFieldSchema {
    name: string;
    label: string;
    hint?: string | null;
    relatedResource?: string;
    displayColumns: string[];
    limit: number;
}

interface HasManyTableProps {
    field: HasManyFieldSchema;
    resourceSlug: string;
    recordId: string | number | null;
    error?: string;
    status?: ValidationStatus;
}

export default function HasManyTable({
    field, resourceSlug, recordId, error, status = 'idle',
}: HasManyTableProps) {
    const [records, setRecords] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!recordId) return;

        setLoading(true);
        fetch(`/admin/${resourceSlug}/${recordId}/relations/${field.name}`, {
            headers: { Accept: 'application/json' },
        })
            .then(r => r.json())
            .then(data => setRecords(data.records ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [recordId, resourceSlug, field.name]);

    const cols = field.displayColumns.length > 0
        ? field.displayColumns
        : ['id'];

    return (
        <FieldWrapper label={field.label} hint={field.hint} error={error} status={status}>
            <div className="border border-zinc-200 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                    </div>
                ) : records.length === 0 ? (
                    <div className="text-center py-8 text-sm text-zinc-400">
                        <p>No related {field.label.toLowerCase()} yet.</p>
                        {field.relatedResource && (
                            <Link
                                href={`/admin/${field.relatedResource}/create`}
                                className="inline-flex items-center gap-1 mt-2 text-[var(--larafusion-primary,#18181b)] hover:opacity-80 hover:underline text-xs font-medium"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add {field.label}
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200">
                                    {cols.map(col => (
                                        <th
                                            key={col}
                                            className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide"
                                        >
                                            {col.replace(/_/g, ' ')}
                                        </th>
                                    ))}
                                    {field.relatedResource && (
                                        <th className="w-8 px-4 py-2.5" />
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {records.map((rec, i) => (
                                    <tr key={i} className="hover:bg-zinc-50/70 transition-colors">
                                        {cols.map(col => (
                                            <td key={col} className="px-4 py-2.5 text-zinc-700 truncate max-w-[200px]">
                                                {String(rec[col] ?? '—')}
                                            </td>
                                        ))}
                                        {field.relatedResource && (
                                            <td className="px-4 py-2.5">
                                                <Link
                                                    href={`/admin/${field.relatedResource}/${rec.id}`}
                                                    className="p-1 rounded text-zinc-400 hover:text-[var(--larafusion-primary,#18181b)] transition-colors"
                                                    title="View"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </Link>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Footer with count + link */}
                        {field.relatedResource && (
                            <div className="px-4 py-2.5 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                <span className="text-xs text-zinc-400">
                                    Showing {records.length}{records.length === field.limit ? '+' : ''} {field.label.toLowerCase()}
                                </span>
                                <Link
                                    href={`/admin/${field.relatedResource}`}
                                    className="text-xs text-[var(--larafusion-primary,#18181b)] hover:opacity-80 hover:underline font-medium"
                                >
                                    View all →
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </FieldWrapper>
    );
}
