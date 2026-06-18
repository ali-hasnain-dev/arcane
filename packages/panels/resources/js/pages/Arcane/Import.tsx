import React, { useState, useRef } from 'react';
import { router, Link } from '@inertiajs/react';
import AdminLayout from '../../components/layout/AdminLayout';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Upload, FileText, CheckCircle, AlertCircle, ChevronRight, X } from 'lucide-react';
import { ResourceMeta } from '../../types';
import { cn } from '../../lib/utils';

interface ImportPageProps {
    resource: ResourceMeta;
    columns: Record<string, string>; // { 'Header Label' => 'db_column' }
}

interface PreviewData {
    headers: string[];
    preview: Record<string, string>[];
    totalRows: number;
    importCols: Record<string, string>;
}

export default function Import({ resource, columns }: ImportPageProps) {
    const [file, setFile]           = useState<File | null>(null);
    const [dragging, setDragging]   = useState(false);
    const [preview, setPreview]     = useState<PreviewData | null>(null);
    const [mapping, setMapping]     = useState<Record<string, string>>({});
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const dbColumns = Object.values(columns);
    const dbLabels  = Object.fromEntries(Object.entries(columns).map(([k, v]) => [v, k]));

    const handleFile = (f: File) => {
        setFile(f);
        setPreview(null);
        setError(null);
        setMapping({});
    };

    const fetchPreview = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        const form = new FormData();
        form.append('file', file);
        form.append('_token', (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '');
        try {
            const res  = await fetch(`/admin/${resource.slug}/import/preview`, { method: 'POST', body: form });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? 'Preview failed.'); return; }
            setPreview(data);
            // Auto-map headers that match db columns (case-insensitive)
            const auto: Record<string, string> = {};
            for (const h of data.headers) {
                const match = dbColumns.find(c => c.toLowerCase() === h.toLowerCase());
                if (match) auto[h] = match;
            }
            setMapping(auto);
        } finally {
            setLoading(false);
        }
    };

    const commit = () => {
        if (!file) return;
        const form = new FormData();
        form.append('file', file);
        for (const [k, v] of Object.entries(mapping)) {
            if (v) form.append(`mapping[${k}]`, v);
        }
        router.post(`/admin/${resource.slug}/import/commit`, form);
    };

    return (
        <AdminLayout pageTitle={`Import ${resource.navigationLabel}`}>
            <Breadcrumb
                crumbs={[
                    { label: resource.navigationLabel, href: `/admin/${resource.slug}` },
                    { label: 'Import' },
                ]}
                heading={`Import ${resource.navigationLabel}`}
            />

            <div className="space-y-6">
                {/* Step 1: Upload */}
                <Card>
                    <CardHeader title="Step 1 — Upload CSV" description="Select a CSV file to import." />
                    <CardBody>
                        <div
                            onDragOver={e => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                            onClick={() => inputRef.current?.click()}
                            className={cn(
                                'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
                                dragging ? 'border-[var(--arcane-primary,#18181b)] bg-[var(--arcane-primary,#18181b)]/5' : 'border-zinc-200 hover:border-zinc-300',
                            )}
                        >
                            <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                            {file ? (
                                <div className="flex items-center justify-center gap-3">
                                    <FileText className="w-8 h-8 text-[var(--arcane-primary,#18181b)]" />
                                    <div className="text-left">
                                        <p className="font-medium text-zinc-800">{file.name}</p>
                                        <p className="text-sm text-zinc-400">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <button type="button" onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); }}
                                        className="ml-4 p-1 rounded-full hover:bg-zinc-100 text-zinc-400">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload className="w-10 h-10 text-zinc-300 mx-auto" />
                                    <p className="text-sm font-medium text-zinc-600">Drop CSV here or click to browse</p>
                                    <p className="text-xs text-zinc-400">Max 10 MB</p>
                                </div>
                            )}
                        </div>
                        {error && <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{error}</p>}
                        {file && !preview && (
                            <button type="button" onClick={fetchPreview} disabled={loading}
                                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[var(--arcane-primary,#18181b)] hover:opacity-90 text-white transition-colors disabled:opacity-60">
                                {loading ? 'Loading preview…' : <>Preview <ChevronRight className="w-4 h-4" /></>}
                            </button>
                        )}
                    </CardBody>
                </Card>

                {/* Step 2: Column mapping */}
                {preview && (
                    <Card>
                        <CardHeader
                            title="Step 2 — Map Columns"
                            description={`${preview.totalRows} rows detected. Map your CSV headers to database columns.`}
                        />
                        <CardBody>
                            <div className="space-y-3">
                                {preview.headers.map(h => (
                                    <div key={h} className="flex items-center gap-4">
                                        <div className="w-40 shrink-0 text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate" title={h}>{h}</div>
                                        <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0" />
                                        <select
                                            value={mapping[h] ?? ''}
                                            onChange={e => setMapping(m => ({ ...m, [h]: e.target.value }))}
                                            className="flex-1 px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[var(--arcane-primary,#18181b)]/30 focus:border-[var(--arcane-primary,#18181b)] outline-none bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                        >
                                            <option value="">— skip —</option>
                                            {dbColumns.map(col => (
                                                <option key={col} value={col}>{dbLabels[col] ?? col}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Step 3: Preview rows */}
                {preview && (
                    <Card>
                        <CardHeader title="Step 3 — Preview" description={`Showing first ${preview.preview.length} of ${preview.totalRows} rows.`} />
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                                        {preview.headers.map(h => (
                                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                                                {h}
                                                {mapping[h] && <span className="ml-1 text-[var(--arcane-primary,#18181b)]">→ {mapping[h]}</span>}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {preview.preview.map((row, i) => (
                                        <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                            {preview.headers.map(h => (
                                                <td key={h} className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">{row[h] ?? '—'}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                            <button type="button" onClick={commit}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors">
                                <CheckCircle className="w-4 h-4" /> Import {preview.totalRows} rows
                            </button>
                            <Link href={`/admin/${resource.slug}`} className="px-4 py-2.5 rounded-lg text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                Cancel
                            </Link>
                        </div>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}
