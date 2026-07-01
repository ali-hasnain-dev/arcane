import React, { useState, useRef, useEffect } from 'react';
import { Link, router, Deferred, usePage } from '@inertiajs/react';
import { Card } from '@larafusion/support';
import {
    Plus, Search, Pencil, Eye, Trash2, RotateCcw, Flame,
    ChevronUp, ChevronDown, ChevronsUpDown,
    Check, X,
    RefreshCw, AlignJustify, Loader2,
    CheckCircle, XCircle,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Download, Upload,
} from 'lucide-react';
import { resolveIcon } from '../lib/icons';
import type { ResourceMeta, LarafusionField, IndexPageProps, FormValues, RecordAction, FormSchemaItem, Column, LarafusionSharedProps, TableConfig } from '@larafusion/support';
import type { BuiltinRecordAction, ToolbarAction, BuiltinBulkAction, BulkActionGroupDef } from '../types';
import { cn } from '../lib/utils';

type LinkProps = React.ComponentProps<typeof Link>;

/** Parse '30s' / '1m' / '2h' / '500ms' (bare numbers default to seconds) into milliseconds. */
function parsePollingInterval(value: string): number {
    const match = /^(\d+(?:\.\d+)?)(ms|s|m|h)?$/.exec(value.trim());
    if (!match) return 0;
    const amount = parseFloat(match[1]);
    const unit = match[2] ?? 's';
    const multiplier = { ms: 1, s: 1000, m: 60_000, h: 3_600_000 }[unit] ?? 1000;
    return amount * multiplier;
}

function usePrefetchProps(): Partial<LinkProps> {
    const { larafusion } = usePage<LarafusionSharedProps>().props;
    const config = larafusion?.panel?.prefetch;
    if (!config?.enabled) return {};
    return { prefetch: config.strategy as LinkProps['prefetch'], cacheFor: config.cacheFor as LinkProps['cacheFor'] };
}

// ─── Color helpers ────────────────────────────────────────────────────────────
const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
    primary: { bg: 'bg-[var(--larafusion-primary,#18181b)]/10', text: 'text-[var(--larafusion-primary,#18181b)]', border: 'border-[var(--larafusion-primary,#18181b)]/20' },
    success: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
    danger: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
    info: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800' },
    gray: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400', border: 'border-zinc-200 dark:border-zinc-700' },
};
function badgeClasses(color?: string) {
    const c = COLOR_CLASSES[color ?? 'gray'] ?? COLOR_CLASSES.gray;
    return `inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`;
}
import FilterPanel, { SideFilterSidebar } from './BasicFilterPanel';
import type { StandaloneFilter } from './BasicFilterPanel';

// ─── Read a (possibly dotted) column value from a record ───────────────────────
// Relationship columns use dot notation (e.g. 'category.name'); the backend
// eager-loads the relation so `record.category.name` is present. Walk the path
// safely so a missing/null relation yields undefined (rendered as an em dash).
function resolveCellValue(record: Record<string, unknown>, name: string): unknown {
    if (!name.includes('.')) return record[name];
    return name.split('.').reduce<unknown>(
        (acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]),
        record,
    );
}

// ─── Flatten layout items to fields ───────────────────────────────────────────
function flattenFields(items: FormSchemaItem[]): LarafusionField[] {
    const out: LarafusionField[] = [];
    for (const item of items) {
        if (item.type === 'section') { flattenFields(item.fields).forEach(f => out.push(f)); }
        else if (item.type === 'tabs') { item.tabs.forEach(t => flattenFields(t.fields).forEach(f => out.push(f))); }
        else if (item.type === 'grid') { flattenFields(item.fields).forEach(f => out.push(f)); }
        else out.push(item);
    }
    return out;
}

// ─── Sort icon ────────────────────────────────────────────────────────────────
function SortIcon({ field, current, dir }: { field: string; current: string; dir: string }) {
    if (field !== current) return <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-400 transition-colors" />;
    return dir === 'asc'
        ? <ChevronUp className="w-3.5 h-3.5 text-[var(--larafusion-primary,#18181b)]" />
        : <ChevronDown className="w-3.5 h-3.5 text-[var(--larafusion-primary,#18181b)]" />;
}

// ─── Cell value ────────────────────────────────────────────────────────────────
function CellValue({ col, field, value }: { col: Column; field?: LarafusionField; value: unknown }) {
    const empty = value === null || value === undefined || value === '';
    if (empty) return <span className="text-zinc-300 dark:text-zinc-600">—</span>;

    const str = String(value);

    // ── badge type (BadgeColumn) ──────────────────────────────────────────────
    if (col.type === 'badge') {
        const label = col.labels?.[str] ?? str;
        const color = col.colors?.[str];
        const iconName = col.icons?.[str];
        const BadgeIcon = iconName ? resolveIcon(iconName) : null;
        return (
            <span className={badgeClasses(color)}>
                {BadgeIcon && <BadgeIcon className="w-3 h-3 shrink-0" />}
                {label}
            </span>
        );
    }

    // ── icon type (IconColumn) ────────────────────────────────────────────────
    if (col.type === 'icon') {
        if (col.boolean) {
            const on = value === true || value === 1 || value === '1' || value === 'true';
            const color = on ? (col.trueColor ?? 'success') : (col.falseColor ?? 'danger');
            const cls = COLOR_CLASSES[color] ?? COLOR_CLASSES.gray;
            return on
                ? <CheckCircle className={cn('w-4 h-4', cls.text)} />
                : <XCircle className={cn('w-4 h-4', cls.text)} />;
        }
        const iconName = col.icons?.[str];
        const color = col.colors?.[str];
        const cls = color ? (COLOR_CLASSES[color] ?? COLOR_CLASSES.gray) : null;
        return <span className={cn('text-xs font-mono', cls?.text ?? 'text-zinc-500 dark:text-zinc-400')}>{iconName ?? str}</span>;
    }

    // ── boolean type (BooleanColumn, toggle field) ────────────────────────────
    if (col.type === 'boolean' || (field?.type === 'toggle')) {
        const on = value === true || value === 1 || value === '1' || value === 'true';
        const trueColor = col.trueColor ?? 'success';
        const falseColor = col.falseColor ?? 'danger';
        const color = on ? trueColor : falseColor;
        const cls = COLOR_CLASSES[color] ?? COLOR_CLASSES.gray;
        const label = on ? (col.trueLabel ?? 'Yes') : (col.falseLabel ?? 'No');
        return (
            <span className={badgeClasses(color)}>
                {on ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {label}
            </span>
        );
    }

    // ── select field ──────────────────────────────────────────────────────────
    if (field?.type === 'select') {
        const opts = (field as { options: Record<string, string | Record<string, string>> }).options as Record<string, string>;
        const label = opts[str] ?? str;
        const color = col.colors?.[str] ?? col.colors?.[label];
        return <span className={badgeClasses(color ?? 'primary')}>{label}</span>;
    }

    // ── date type (DateColumn) ────────────────────────────────────────────────
    if (col.type === 'date') {
        try {
            const d = new Date(str);
            if (isNaN(d.getTime())) return <span className="text-zinc-800 dark:text-zinc-200">{str}</span>;
            if (col.since) {
                const diff = Date.now() - d.getTime();
                const secs = Math.floor(diff / 1000);
                const mins = Math.floor(secs / 60);
                const hrs = Math.floor(mins / 60);
                const days = Math.floor(hrs / 24);
                const mos = Math.floor(days / 30);
                const yrs = Math.floor(days / 365);
                const rel = yrs > 0 ? `${yrs}y ago` : mos > 0 ? `${mos}mo ago` : days > 0 ? `${days}d ago` : hrs > 0 ? `${hrs}h ago` : mins > 0 ? `${mins}m ago` : 'just now';
                return <span className="text-zinc-600 dark:text-zinc-400 text-xs" title={d.toLocaleDateString()}>{rel}</span>;
            }
            const formatted = col.dateTime
                ? d.toLocaleString()
                : col.time
                    ? d.toLocaleTimeString()
                    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
            return <span className="text-zinc-700 dark:text-zinc-300 text-sm">{formatted}</span>;
        } catch { return <span className="text-zinc-800 dark:text-zinc-200">{str}</span>; }
    }

    // ── image type (ImageColumn) ──────────────────────────────────────────────
    if (col.type === 'image' && value) {
        const src = str.startsWith('http') ? str : `/storage/${str}`;
        const size = col.size ?? '2rem';
        return (
            <img
                src={src}
                alt=""
                style={{ width: size, height: size }}
                className={cn('object-cover border border-zinc-200 dark:border-zinc-700 shadow-sm', col.circular ? 'rounded-full' : 'rounded-lg')}
            />
        );
    }

    // ── color field ───────────────────────────────────────────────────────────
    if (field?.type === 'color' && value) {
        return (
            <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: str }} />
                <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{str}</span>
            </div>
        );
    }

    // ── text type (TextColumn) ────────────────────────────────────────────────
    const display = (() => {
        let out = str;
        if (col.prefix) out = col.prefix + out;
        if (col.suffix) out = out + col.suffix;
        if (col.limit && !col.lineClamp && out.length > col.limit) out = out.slice(0, col.limit) + '…';
        return out;
    })();

    const textCls = cn(
        col.wrap ? 'whitespace-normal break-words' : 'truncate max-w-[240px] block',
        col.weight === 'bold' ? 'font-bold' : col.weight === 'semibold' ? 'font-semibold' : col.weight === 'medium' ? 'font-medium' : '',
        'text-zinc-800 dark:text-zinc-200',
    );

    if (col.badge) {
        const enumLabel = col.enumLabels?.[str];
        const enumColor = col.enumColors?.[str];
        return <span className={badgeClasses(enumColor ?? 'gray')}>{enumLabel ?? display}</span>;
    }

    if (col.copyable) {
        return (
            <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(str)}
                title="Copy"
                className={cn(textCls, 'cursor-copy hover:text-[var(--larafusion-primary,#18181b)] transition-colors group')}
            >
                {display}
            </button>
        );
    }

    if (col.description) {
        return (
            <div>
                <div className={textCls}>{display}</div>
                <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{col.description}</div>
            </div>
        );
    }

    return <span className={textCls}>{display}</span>;
}

// CheckCircle / XCircle imported at the top

// ─── Inline-editable cell ─────────────────────────────────────────────────────
function InlineCell({ field, value, resourceSlug, id }: {
    field: LarafusionField; value: unknown; resourceSlug: string; id: string | number;
}) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(String(value ?? ''));
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const save = () => {
        setSaving(true);
        fetch(`/admin/${resourceSlug}/${id}/inline`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '', 'Accept': 'application/json' },
            body: JSON.stringify({ field: field.name, value: val }),
        })
            .then(r => r.json())
            .then(data => { if (data.success) setEditing(false); })
            .finally(() => setSaving(false));
    };

    if (!editing) {
        return (
            <button type="button" onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 30); }}
                className="text-left text-sm text-zinc-800 dark:text-zinc-200 truncate max-w-[200px] hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded px-1 -ml-1 cursor-text group flex items-center gap-1.5">
                {String(value ?? '—')}
                <Pencil className="w-3 h-3 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 shrink-0" />
            </button>
        );
    }

    return (
        <input
            ref={inputRef}
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={save}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
            disabled={saving}
            className="w-full px-2 py-1 text-sm border border-[var(--larafusion-primary,#18181b)] rounded-md outline-none focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)]/30 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
        />
    );
}

// resolveIcon is imported from ../lib/icons (shared registry)
import { ConfirmDialog, useModalAnimation } from './ConfirmDialog';

// ─── Action row button (Filament-style text+icon) ─────────────────────────────
interface ActionButtonProps {
    action: RecordAction;
    resourceSlug: string;
    id: string | number;
    openConfirm: (title: string, message: string, onConfirm: () => void, variant?: 'danger' | 'default') => void;
}

function ActionButton({ action, resourceSlug, id, openConfirm }: ActionButtonProps) {
    const display = action.display ?? 'icon';
    const Icon = resolveIcon(action.icon);

    const colorCls = (() => {
        switch (action.color) {
            case 'primary': return 'text-[var(--larafusion-primary,#18181b)] hover:text-[var(--larafusion-primary,#18181b)]/80';
            case 'success': return 'text-green-600 hover:text-green-700';
            case 'warning': return 'text-amber-500 hover:text-amber-600';
            case 'danger': return 'text-red-500 hover:text-red-600';
            default: return 'text-zinc-500 hover:text-zinc-700';
        }
    })();

    const execute = () => {
        if (action.type === 'link') {
            window.open(action.url ?? '#', action.newTab ? '_blank' : '_self');
            return;
        }
        router.post(`/admin/${resourceSlug}/${id}/action/${action.key}`, {}, { preserveScroll: true });
    };

    const handleClick = () => {
        if (action.confirm) {
            openConfirm(action.label, action.confirm, execute);
        } else {
            execute();
        }
    };

    if (display === 'button') {
        return (
            <button type="button" onClick={handleClick} title={action.label}
                className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                    action.color === 'danger'
                        ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50'
                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700')}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {action.label}
            </button>
        );
    }

    // text or icon → Filament-style inline text+icon link
    return (
        <button type="button" onClick={handleClick}
            className={cn('inline-flex items-center gap-1 text-xs font-medium transition-colors', colorCls)}>
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {display !== 'icon' && action.label}
        </button>
    );
}

// ─── Explicit record-action cell ─────────────────────────────────────────────
interface RecordActionsCellProps {
    customActions: RecordAction[];
    builtinRecordActions: BuiltinRecordAction[];
    can: { view: boolean; edit: boolean; delete: boolean };
    id: string | number;
    slug: string;
    record: Record<string, unknown>;
    trashed: boolean;
    onModalEdit?: (record: Record<string, unknown>) => void;
    prefetchProps: Partial<LinkProps>;
    openConfirm: (title: string, message: string, onConfirm: () => void, variant?: 'danger' | 'default') => void;
    onDelete: (id: string | number) => void;
    onForceDelete: (id: string | number) => void;
}

function RecordActionsCell({
    customActions, builtinRecordActions, can, id, slug, record,
    trashed, onModalEdit, prefetchProps, openConfirm, onDelete, onForceDelete,
}: RecordActionsCellProps) {
    // Exclude 'view' from builtinNodes — View is always rendered separately below
    // so it shows even when explicit recordActions are defined (no duplication risk).
    const visibleBuiltin = builtinRecordActions.filter(a =>
        a.type === 'action' ||
        (a.type === 'edit' && can.edit) ||
        (a.type === 'delete' && can.delete));

    const builtinNodes = visibleBuiltin.map((act) => {
        let node: React.ReactNode = null;

        if (act.type === 'edit' && can.edit) {
            node = onModalEdit ? (
                <button type="button" onClick={() => onModalEdit(record)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--larafusion-primary,#18181b)] dark:text-[var(--larafusion-primary-ring,#a78bfa)] hover:opacity-80 transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> {act.label}
                </button>
            ) : (
                <Link href={`/admin/${slug}/${id}/edit`} {...prefetchProps}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--larafusion-primary,#18181b)] dark:text-[var(--larafusion-primary-ring,#a78bfa)] hover:opacity-80 transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> {act.label}
                </Link>
            );
        } else if (act.type === 'delete' && can.delete) {
            node = (
                <button type="button" onClick={() => onDelete(id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> {act.label}
                </button>
            );
        } else if (act.type === 'action') {
            // Filament-style custom action — server callback or URL navigation
            const ActionIcon = resolveIcon(act.icon ?? null);
            const display = act.display ?? 'icon';
            const colorCls = (() => {
                switch (act.color) {
                    case 'primary': return 'text-[var(--larafusion-primary,#18181b)] hover:opacity-80';
                    case 'success': return 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300';
                    case 'warning': return 'text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300';
                    case 'danger':  return 'text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300';
                    default:        return 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200';
                }
            })();

            const executeAction = () => {
                if (act.isLink && act.url) {
                    window.open(act.url, act.newTab ? '_blank' : '_self');
                } else {
                    router.post(`/admin/${slug}/${id}/action/${act.key}`, {}, { preserveScroll: true });
                }
            };

            const handleActionClick = () => {
                if (act.confirm) {
                    openConfirm(
                        act.confirmHeading ?? act.label,
                        act.confirmDescription ?? act.confirm,
                        executeAction,
                        act.color === 'danger' ? 'danger' : 'default',
                    );
                } else {
                    executeAction();
                }
            };

            node = display === 'button' ? (
                <button type="button" onClick={handleActionClick} title={act.tooltip ?? act.label}
                    className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                        act.color === 'danger'
                            ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50'
                            : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700',
                    )}>
                    <ActionIcon className="w-3.5 h-3.5 shrink-0" />
                    {act.label}
                </button>
            ) : (
                <button type="button" onClick={handleActionClick}
                    title={act.tooltip ?? (display === 'icon' ? act.label : undefined)}
                    className={cn('inline-flex items-center gap-1 text-xs font-medium transition-colors', colorCls)}>
                    <ActionIcon className="w-3.5 h-3.5 shrink-0" />
                    {display !== 'icon' && act.label}
                </button>
            );
        }

        if (!node) return null;
        return node;
    });

    return (
        <div className="flex items-center justify-end gap-3">
            {/* View always shown when allowed — regardless of explicit recordActions */}
            {can.view && !trashed && (
                <Link href={`/admin/${slug}/${id}`} {...prefetchProps}
                    className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors">
                    <Eye className="w-3.5 h-3.5" /> View
                </Link>
            )}

            {customActions.map((action) => (
                <React.Fragment key={action.key}>
                    <ActionButton action={action} resourceSlug={slug} id={id} openConfirm={openConfirm} />
                </React.Fragment>
            ))}

            {trashed ? (
                <>
                    {can.edit && (
                        <button onClick={() => router.post(`/admin/${slug}/${id}/restore`, {}, { preserveScroll: true })}
                            className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors">
                            <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                    )}
                    {can.delete && (
                        <button onClick={() => onForceDelete(id)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors">
                            <Flame className="w-3.5 h-3.5" /> Delete forever
                        </button>
                    )}
                </>
            ) : (
                builtinNodes
            )}
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ cols }: { cols: number }) {
    return (
        <div className="animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-4 px-4 py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                    <div className="h-4 w-4 bg-zinc-100 dark:bg-zinc-800 rounded" />
                    <div className="h-4 w-10 bg-zinc-100 dark:bg-zinc-800 rounded" />
                    {Array.from({ length: cols }).map((_, j) => (
                        <div key={j} className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded flex-1" />
                    ))}
                    <div className="h-4 w-28 bg-zinc-100 dark:bg-zinc-800 rounded" />
                </div>
            ))}
        </div>
    );
}

// ─── Per-page selector ────────────────────────────────────────────────────────
const PER_PAGE_OPTIONS = [5, 10, 25, 50];

function PerPageSelector({ current, resourceSlug }: { current: number; resourceSlug: string }) {
    const change = (n: number) => {
        const p = new URLSearchParams(window.location.search);
        p.set('per_page', String(n));
        p.delete('page');
        router.get(`/admin/${resourceSlug}`, Object.fromEntries(p), {
            preserveState: true, replace: true,
            only: ['records'],
        });
    };
    return (
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span>Per page:</span>
            <select
                value={current}
                onChange={e => change(Number(e.target.value))}
                className="border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-1 text-sm text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)]/30 outline-none hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
            >
                {PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
        </div>
    );
}

// ─── Windowed pagination ──────────────────────────────────────────────────────
type PaginationLink = { url: string | null; label: string; active: boolean };

function buildWindow(cur: number, last: number, delta = 1): (number | null)[] {
    if (last <= 1) return [];
    const left = Math.max(2, cur - delta);
    const right = Math.min(last - 1, cur + delta);
    const pages: (number | null)[] = [1];
    if (left > 2) pages.push(null);     // left ellipsis
    for (let p = left; p <= right; p++) pages.push(p);
    if (right < last - 1) pages.push(null);    // right ellipsis
    pages.push(last);
    return pages;
}

function PaginationRow({ records, simple = false }: {
    records: { current_page: number; last_page: number; links: PaginationLink[] };
    simple?: boolean;
}) {
    const { current_page: cur, last_page: last, links } = records;
    if (last <= 1) return null;

    // Build page → url map from Laravel's links array (skip prev/next items)
    const pageUrl: Record<number, string> = {};
    links.forEach(l => {
        const n = parseInt(l.label, 10);
        if (!isNaN(n) && l.url) pageUrl[n] = l.url;
    });

    const prevLink = links[0];
    const nextLink = links[links.length - 1];
    const window = buildWindow(cur, last);

    const base = 'h-8 min-w-[2rem] px-2 inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors select-none';
    const active = 'bg-[var(--larafusion-primary,#18181b)] text-white shadow-sm';
    const ghost = 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200';
    const disabled = 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed';

    return (
        <div className="flex items-center gap-0.5">
            {/* |← First — simple mode only */}
            {simple && (
                cur > 1 && pageUrl[1]
                    ? <Link href={pageUrl[1]} preserveScroll only={['records']}
                        className={cn(base, ghost, 'px-2')} title="First page">
                        <ChevronsLeft className="w-3.5 h-3.5" />
                    </Link>
                    : <span className={cn(base, disabled, 'px-2')} title="First page">
                        <ChevronsLeft className="w-3.5 h-3.5" />
                    </span>
            )}

            {/* ← Prev */}
            {prevLink?.url
                ? <Link href={prevLink.url} preserveScroll only={['records']}
                    className={cn(base, ghost, 'px-2.5 gap-1')}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Prev</span>
                </Link>
                : <span className={cn(base, disabled, 'px-2.5 gap-1')}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Prev</span>
                </span>
            }

            {/* Page numbers with ellipsis — hidden in simple mode */}
            {!simple && window.map((p, i) =>
                p === null
                    ? <span key={`e${i}`} className="h-8 w-5 inline-flex items-center justify-center text-xs text-zinc-400 dark:text-zinc-600">…</span>
                    : pageUrl[p]
                        ? <Link key={p} href={pageUrl[p]} preserveScroll only={['records']}
                            className={cn(base, p === cur ? active : ghost)}>
                            {p}
                        </Link>
                        : <span key={p} className={cn(base, p === cur ? active : disabled)}>{p}</span>
            )}

            {/* Current page indicator — simple mode only */}
            {simple && (
                <span className="px-3 text-xs text-zinc-500 dark:text-zinc-400 select-none tabular-nums">
                    {cur} / {last}
                </span>
            )}

            {/* Next → */}
            {nextLink?.url
                ? <Link href={nextLink.url} preserveScroll only={['records']}
                    className={cn(base, ghost, 'px-2.5 gap-1')}>
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                : <span className={cn(base, disabled, 'px-2.5 gap-1')}>
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </span>
            }

            {/* Last →| — simple mode only */}
            {simple && (
                cur < last && pageUrl[last]
                    ? <Link href={pageUrl[last]} preserveScroll only={['records']}
                        className={cn(base, ghost, 'px-2')} title="Last page">
                        <ChevronsRight className="w-3.5 h-3.5" />
                    </Link>
                    : <span className={cn(base, disabled, 'px-2')} title="Last page">
                        <ChevronsRight className="w-3.5 h-3.5" />
                    </span>
            )}
        </div>
    );
}

// ─── Trash tab strip ──────────────────────────────────────────────────────────
function TrashTabs({ resourceSlug }: { resourceSlug: string }) {
    const params = new URLSearchParams(window.location.search);
    const trashed = params.get('trashed') ?? 'without';
    const go = (v: string) => {
        const p = new URLSearchParams(window.location.search);
        if (v === 'without') p.delete('trashed'); else p.set('trashed', v);
        p.delete('page');
        router.get(`/admin/${resourceSlug}`, Object.fromEntries(p), {
            preserveState: true, replace: true,
            only: ['records'],
        });
    };
    return (
        <div className="flex border-b border-zinc-100 dark:border-zinc-800 px-6 bg-white dark:bg-zinc-900">
            {[['without', 'Active'], ['with', 'All'], ['only', 'Trashed']].map(([val, label]) => (
                <button key={val} type="button" onClick={() => go(val)}
                    className={cn('px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                        trashed === val
                            ? 'border-[var(--larafusion-primary,#18181b)] text-[var(--larafusion-primary,#18181b)]'
                            : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200')}>
                    {label}
                </button>
            ))}
        </div>
    );
}


// Legacy built-in actions (View + Edit + Delete) used when no explicit recordActions defined
const legacyRecordActions: BuiltinRecordAction[] = [
    { type: 'view', key: 'view', label: 'View' },
    { type: 'edit', key: 'edit', label: 'Edit' },
    { type: 'delete', key: 'delete', label: 'Delete' },
];

// ─── Main component ───────────────────────────────────────────────────────────
interface BasicTableProps {
    resource: ResourceMeta;
    schema: FormSchemaItem[];
    // BasicTable itself always expects records to be loaded — Index.tsx is
    // responsible for not rendering this component until that's true (either
    // immediately, or after a deferred fetch completes via <Deferred>).
    records: NonNullable<IndexPageProps['records']>;
    actions?: RecordAction[];
    columns?: Column[];
    tableConfig?: TableConfig;
    onModalEdit?: (record: Record<string, unknown>) => void;
}

export default function BasicTable({ resource, schema: rawSchema, records, actions = [], columns = [], tableConfig, onModalEdit }: BasicTableProps) {
    const prefetchProps = usePrefetchProps();
    const { larafusion } = usePage<LarafusionSharedProps>().props;
    const striped = tableConfig?.striped ?? false;
    // Table-level ->pagination(...) wins when explicitly set; otherwise fall back
    // to the panel-level simplePagination default. 'full' / 'simple' / false.
    const paginationMode = tableConfig?.pagination
        ?? (larafusion?.panel?.simplePagination ? 'simple' : 'full');
    const simplePagination  = paginationMode === 'simple';
    const disablePagination = paginationMode === false;

    // ─── Polling: auto-refresh records at the configured interval ───────────────
    useEffect(() => {
        if (!tableConfig?.polling) return;
        const ms = parsePollingInterval(tableConfig.polling);
        if (!ms) return;
        const id = setInterval(() => {
            router.reload({ only: ['records'] });
        }, ms);
        return () => clearInterval(id);
    }, [tableConfig?.polling]);

    const params = new URLSearchParams(window.location.search);
    const sortField = params.get('sort') ?? (tableConfig?.defaultSort?.field ?? 'id');
    const sortDir = params.get('direction') ?? (tableConfig?.defaultSort?.dir ?? 'asc');
    const [search, setSearch] = useState(params.get('search') ?? '');
    const [tableLoading, setTableLoading] = useState(false);
    // searchLoading tracks ONLY search-triggered requests so the spinner
    // inside the search input does not fire during sort / filter / pagination.
    const [searchLoading, setSearchLoading] = useState(false);

    // Table overlay fires for any partial reload; search spinner is separate.
    useEffect(() => {
        const offStart = router.on('start', (event) => {
            const visit = (event as CustomEvent<{ visit?: { only?: string[] } }>).detail?.visit;
            if ((visit?.only?.length ?? 0) > 0) setTableLoading(true);
        });
        const offFinish = router.on('finish', () => {
            setTableLoading(false);
            setSearchLoading(false);
        });
        return () => { offStart(); offFinish(); };
    }, []);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Row selection state
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
    const [selectAllPages, setSelectAllPages] = useState(false);
    const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
    const [bulkConfirming, setBulkConfirming] = useState(false);
    const [bulkActionKey, setBulkActionKey] = useState<string>('delete_bulk');
    const bulkMenuRef = useRef<HTMLDivElement>(null);

    const executeBulkAction = (key: string) => {
        const payload = selectAllPages ? { all: true } : { ids: Array.from(selectedIds) };
        const onSuccess = () => { setSelectedIds(new Set()); setSelectAllPages(false); };
        if (key === 'restore_bulk') {
            router.post(`/admin/${resource.slug}/bulk-restore`, payload, { preserveScroll: true, onSuccess });
        } else if (key === 'force_delete_bulk') {
            router.delete(`/admin/${resource.slug}/bulk-force-delete`, { data: payload, preserveScroll: true, onSuccess });
        } else {
            router.delete(`/admin/${resource.slug}/bulk`, { data: payload, preserveScroll: true, onSuccess });
        }
    };

    // Close bulk menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) {
                setBulkMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ─── Confirm dialog state ─────────────────────────────────────────────────
    const [confirmState, setConfirmState] = useState<{
        open: boolean;
        title: string;
        message: string;
        confirmLabel?: string;
        variant: 'danger' | 'default';
        onConfirm: () => void;
    }>({ open: false, title: '', message: '', variant: 'danger', onConfirm: () => { } });

    const openConfirm = (
        title: string,
        message: string,
        onConfirm: () => void,
        variant: 'danger' | 'default' = 'default',
        confirmLabel?: string,
    ) => setConfirmState({ open: true, title, message, onConfirm, variant, confirmLabel });

    const closeConfirm = () => setConfirmState(s => ({ ...s, open: false }));

    const schema = flattenFields(rawSchema);
    // `can` (viewAny/create/edit/delete) falls back permissively since authorization
    // is moving to its own package. `view` is different — it's `resource.showView`,
    // a feature toggle set by the generated resource's canView() override based on
    // whether a view page was scaffolded, not a permission.
    const can = {
        ...(resource.can ?? { viewAny: true, create: true, edit: true, delete: true, view: true }),
        view: resource.showView ?? true,
    };
    const res = resource as ResourceMeta & { exportable?: boolean; importable?: boolean; softDeletes?: boolean; inlineEditable?: string[] };
    const inlineEditable: string[] = res.inlineEditable ?? [];

    // When the user explicitly defined columns via the Table builder, hide the auto ID column
    const showIdColumn = columns.length === 0;

    // When tableConfig carries explicit action arrays, only render those (opt-in mode).
    // undefined means legacy resource (no explicit recordActions/toolbarActions call).
    const hasExplicitRecordActions = tableConfig?.recordActions !== undefined;
    const hasExplicitToolbarActions = tableConfig?.toolbarActions !== undefined;

    // Show checkbox + bulk toolbar only when there are actual bulk actions to perform.
    // Legacy (undefined) = always show; explicit empty array ([]) = hide.
    const hasBulkActions = !hasExplicitToolbarActions
        || (tableConfig!.toolbarActions!.length > 0);

    // Build index from schema for field-type-aware rendering in CellValue
    const schemaByName = Object.fromEntries(schema.map(f => [f.name, f]));

    // displayColumns: prefer explicit columns from Table builder; fall back to deriving from schema
    const displayColumns: Column[] = columns.length > 0
        ? columns.filter(c => c.visible !== false).slice(0, 8)
        : schema
            .filter(f => !['password', 'file', 'repeater', 'tags'].includes(f.type) && !f.hidden)
            .slice(0, 5)
            .map(f => ({ name: f.name, label: f.label, type: f.type, sortable: resource.sortable.includes(f.name) }));

    // Keep backward-compat alias
    const visibleFields = displayColumns;

    // ─── Filter layout ────────────────────────────────────────────────────────
    const filtersLayout = tableConfig?.filtersLayout ?? 'dropdown';
    const isDrawerOrModal = filtersLayout === 'drawer' || filtersLayout === 'modal' || filtersLayout === 'dropdown';
    const isAboveLayout = filtersLayout === 'above' || filtersLayout === 'above_collapsible';
    const isBelowLayout = filtersLayout === 'below';
    const isBeforeSide = filtersLayout === 'before_content' || filtersLayout === 'before_content_collapsible';
    const isAfterSide = filtersLayout === 'after_content' || filtersLayout === 'after_content_collapsible';
    const isSideLayout = isBeforeSide || isAfterSide;
    const isSideCollapsible = filtersLayout === 'before_content_collapsible' || filtersLayout === 'after_content_collapsible';

    const sideFilterableColumns = columns.filter(c => c.filterable);
    const sideStandaloneFilters = (tableConfig?.standaloneFilters ?? []) as StandaloneFilter[];
    const hasActiveSearch = (params.get('search') ?? '') !== '';
    const hasActiveFilters = Array.from(params.keys()).some(k => k.startsWith('filter['));
    const isTrulyEmpty = records.total === 0 && !hasActiveSearch && !hasActiveFilters;

    const hasSideFilters = !isTrulyEmpty && isSideLayout && (sideFilterableColumns.length > 0 || sideStandaloneFilters.length > 0);

    const filterPanelProps = {
        resourceSlug: resource.slug,
        columns,
        standaloneFilters: tableConfig?.standaloneFilters,
        layout: filtersLayout,
        formColumns: tableConfig?.filtersFormColumns,
        formWidth: tableConfig?.filtersFormWidth,
        formMaxHeight: tableConfig?.filtersFormMaxHeight,
        hideIndicators: tableConfig?.hideFilterIndicators,
    };

    const fireSearch = (value: string) => {
        const params = new URLSearchParams(window.location.search);
        if (value) {
            params.set('search', value);
        } else {
            params.delete('search');
        }
        params.delete('page');
        router.get(`/admin/${resource.slug}`, Object.fromEntries(params), {
            preserveState: true, replace: true, preserveScroll: true,
            only: ['records'],
        });
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setTableLoading(true);    // overlay the table immediately on keypress
        setSearchLoading(true);   // spinner inside the search input
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fireSearch(value), 400);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTableLoading(true);
        setSearchLoading(true);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        fireSearch(search);
    };


    const sortableNames = new Set([
        ...resource.sortable,
        ...displayColumns.filter(c => c.sortable).map(c => c.name),
        'id',
    ]);

    const handleSort = (field: string) => {
        if (!sortableNames.has(field)) return;
        const dir = sortField === field && sortDir === 'asc' ? 'desc' : 'asc';
        setSelectedIds(new Set());
        setSelectAllPages(false);
        router.get(`/admin/${resource.slug}`, { sort: field, direction: dir, search }, {
            preserveState: true, replace: true,
            only: ['records'],
        });
    };

    const handleDelete = (id: string | number) => {
        openConfirm(
            `Delete ${resource.label}`,
            `Are you sure you want to delete this ${resource.label.toLowerCase()}? This action cannot be undone.`,
            () => router.optimistic<{ records: typeof records }>(p => ({
                records: { ...p.records, data: p.records.data.filter(r => (r as FormValues).id !== id), total: p.records.total - 1 },
            })).delete(`/admin/${resource.slug}/${id}`, { preserveScroll: true }),
            'danger',
            'Delete',
        );
    };

    const handleForceDelete = (id: string | number) => {
        openConfirm(
            'Permanently Delete',
            'This record will be permanently removed and cannot be recovered.',
            () => router.delete(`/admin/${resource.slug}/${id}/force`, { preserveScroll: true }),
            'danger',
            'Delete Forever',
        );
    };

    // ─── Row selection helpers ────────────────────────────────────────────────
    const allIds = records.data.map(r => (r as FormValues).id as string | number);
    const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));
    const someSelected = allIds.some(id => selectedIds.has(id));

    const toggleAll = () => {
        if (allSelected) {
            setSelectedIds(prev => { const n = new Set(prev); allIds.forEach(id => n.delete(id)); return n; });
        } else {
            setSelectedIds(prev => { const n = new Set(prev); allIds.forEach(id => n.add(id)); return n; });
        }
    };

    const toggleRow = (id: string | number) => {
        setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    };

    const exportUrl = (() => {
        const p = new URLSearchParams(window.location.search);
        p.delete('page');
        return `/admin/${resource.slug}/export?${p.toString()}`;
    })();

    // Total cols: optional checkbox + optional ID + fields + actions
    const totalCols = (hasBulkActions ? 1 : 0) + (showIdColumn ? 1 : 0) + visibleFields.length + 1;

    return (
        <>
            <ConfirmDialog
                open={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                confirmLabel={confirmState.confirmLabel}
                variant={confirmState.variant}
                onConfirm={confirmState.onConfirm}
                onCancel={closeConfirm}
            />

            {/* Side-layout wrapper — only adds flex container when before/after_content */}
            <div className={hasSideFilters ? 'flex items-stretch rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden' : undefined}>

                {/* Before-content filter sidebar */}
                {hasSideFilters && isBeforeSide && (
                    <SideFilterSidebar
                        resourceSlug={resource.slug}
                        filterableColumns={sideFilterableColumns}
                        standaloneFilters={sideStandaloneFilters}
                        formColumns={tableConfig?.filtersFormColumns ?? 1}
                        formMaxHeight={tableConfig?.filtersFormMaxHeight}
                        collapsible={isSideCollapsible}
                    />
                )}

                <Card className={hasSideFilters ? 'flex-1 min-w-0 rounded-none border-0 shadow-none' : undefined}>
                    {/* ── Smart toolbar: bulk mode when rows selected, normal otherwise ── */}
                    <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3 h-[55px]">
                        {selectedIds.size > 0 ? (
                            <>
                                {/* Bulk confirm dialog */}
                                <ConfirmDialog
                                    open={bulkConfirming}
                                    title={
                                        bulkActionKey === 'restore_bulk'
                                            ? (selectAllPages ? `Restore all ${records.total} records` : `Restore ${selectedIds.size} record${selectedIds.size !== 1 ? 's' : ''}`)
                                            : (selectAllPages ? `Delete all ${records.total} records` : `Delete ${selectedIds.size} record${selectedIds.size !== 1 ? 's' : ''}`)
                                    }
                                    message="This action cannot be undone."
                                    confirmLabel={bulkActionKey === 'restore_bulk' ? 'Restore' : 'Delete'}
                                    variant={bulkActionKey === 'restore_bulk' ? 'default' : 'danger'}
                                    onConfirm={() => executeBulkAction(bulkActionKey)}
                                    onCancel={() => setBulkConfirming(false)}
                                />

                                {/* Bulk actions dropdown */}
                                <div className="relative" ref={bulkMenuRef}>
                                    <button
                                        type="button"
                                        onClick={() => setBulkMenuOpen(o => !o)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        <AlignJustify className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                        Bulk actions
                                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                                    </button>
                                    {bulkMenuOpen && (
                                        <div className="absolute left-0 top-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50 min-w-[160px] py-1 overflow-hidden">
                                            {hasExplicitToolbarActions ? (
                                                // Explicit toolbar actions from Table builder
                                                (tableConfig!.toolbarActions as ToolbarAction[])
                                                    .filter((g): g is BulkActionGroupDef => g.type === 'bulk_group')
                                                    .flatMap((g: BulkActionGroupDef): BuiltinBulkAction[] => g.actions)
                                                    .map((act: BuiltinBulkAction) => {
                                                        const isRestore = act.type === 'restore_bulk';
                                                        const BulkIcon = isRestore ? RotateCcw : Trash2;
                                                        return (
                                                            <button
                                                                key={act.key}
                                                                type="button"
                                                                onClick={() => { setBulkMenuOpen(false); setBulkActionKey(act.type); setBulkConfirming(true); }}
                                                                className={cn(
                                                                    'flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors',
                                                                    isRestore
                                                                        ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20'
                                                                        : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20',
                                                                )}
                                                            >
                                                                <BulkIcon className="w-3.5 h-3.5" />
                                                                {act.label}
                                                            </button>
                                                        );
                                                    })
                                            ) : (
                                                // Legacy: hardcoded delete
                                                can.delete && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setBulkMenuOpen(false); setBulkActionKey('delete_bulk'); setBulkConfirming(true); }}
                                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete selected
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>

                                <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 shrink-0" />

                                {/* Selection count */}
                                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                    {selectAllPages
                                        ? `All ${records.total} records selected`
                                        : `${selectedIds.size} record${selectedIds.size !== 1 ? 's' : ''} selected`}
                                </span>

                                <div className="flex-1" />

                                {/* Select all pages — only shown when there are multiple pages */}
                                {!selectAllPages && selectedIds.size > 0 && records.last_page > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectAllPages(true)}
                                        className="text-sm font-medium text-[var(--larafusion-primary,#18181b)] dark:text-[var(--larafusion-primary-ring,#a78bfa)] hover:opacity-80 transition-colors"
                                    >
                                        Select all {records.total}
                                    </button>
                                )}

                                {/* Deselect all */}
                                <button
                                    type="button"
                                    onClick={() => { setSelectedIds(new Set()); setSelectAllPages(false); }}
                                    className="text-sm font-medium text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                                >
                                    Deselect all
                                </button>

                                {/* Search stays visible in bulk mode */}
                                {resource.searchable.length > 0 && (
                                    <form onSubmit={handleSearchSubmit} className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={e => handleSearchChange(e.target.value)}
                                            placeholder="Search…"
                                            className="pl-9 pr-4 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)]/30 focus:border-[var(--larafusion-primary,#18181b)] outline-none w-48 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                                        />
                                    </form>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="flex-1" />

                                {!isTrulyEmpty && resource.searchable.length > 0 && (
                                    <form onSubmit={handleSearchSubmit} className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={e => handleSearchChange(e.target.value)}
                                            placeholder="Search…"
                                            className="pl-9 pr-9 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)]/30 focus:border-[var(--larafusion-primary,#18181b)] outline-none w-52 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                                        />
                                        {searchLoading ? (
                                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none animate-spin" />
                                        ) : search.length > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => handleSearchChange('')}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        ) : null}
                                    </form>
                                )}

                                {!isTrulyEmpty && isDrawerOrModal && (
                                    <FilterPanel {...filterPanelProps} />
                                )}

                                {res.exportable && (
                                    <a href={exportUrl} download
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                        <Download className="w-4 h-4" /> Export
                                    </a>
                                )}
                                {res.importable && can.create && (
                                    <Link href={`/admin/${resource.slug}/import`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                        <Upload className="w-4 h-4" /> Import
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    {/* Above-content inline filter panel */}
                    {!isTrulyEmpty && isAboveLayout && <FilterPanel {...filterPanelProps} />}

                    {res.softDeletes && <TrashTabs resourceSlug={resource.slug} />}

                    <Deferred data="records" fallback={<Skeleton cols={visibleFields.length} />}>
                        <div className="relative">
                            <div className={cn('overflow-x-auto transition-opacity duration-150 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-zinc-100 dark:[&::-webkit-scrollbar-track]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-600', tableLoading && 'opacity-50 pointer-events-none select-none')}>
                                <table className="w-full text-sm">
                                    <thead>
                                        {/* ── Column header row ── */}
                                        <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/50">
                                            {/* Checkbox — hidden when no bulk actions defined or table is empty */}
                                            {hasBulkActions && !isTrulyEmpty && (
                                                <th className="w-10 px-4 py-3.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={allSelected}
                                                        ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                                        onChange={toggleAll}
                                                        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 cursor-pointer accent-[var(--larafusion-primary,#18181b)]"
                                                    />
                                                </th>
                                            )}
                                            {/* ID — only when no explicit columns defined */}
                                            {showIdColumn && (
                                                <th
                                                    onClick={() => !isTrulyEmpty && handleSort('id')}
                                                    className={cn(
                                                        'group text-left px-4 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 w-16 select-none transition-colors outline-none',
                                                        !isTrulyEmpty && 'cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200',
                                                    )}>
                                                    <span className="flex items-center gap-1.5">
                                                        ID {!isTrulyEmpty && <SortIcon field="id" current={sortField} dir={sortDir} />}
                                                    </span>
                                                </th>
                                            )}
                                            {/* Field columns */}
                                            {visibleFields.map(col => (
                                                <th key={col.name}
                                                    onClick={() => !isTrulyEmpty && sortableNames.has(col.name) && handleSort(col.name)}
                                                    className={cn(
                                                        'group text-left px-4 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 select-none transition-colors outline-none',
                                                        !isTrulyEmpty && sortableNames.has(col.name) && 'cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200',
                                                    )}>
                                                    <span className="flex items-center gap-1.5">
                                                        {col.label}
                                                        {!isTrulyEmpty && sortableNames.has(col.name) && <SortIcon field={col.name} current={sortField} dir={sortDir} />}
                                                    </span>
                                                </th>
                                            ))}
                                            {/* Actions column — header intentionally left blank */}
                                            <th className="text-right px-4 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400" />
                                        </tr>

                                    </thead>

                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {visibleFields.length === 0 ? (
                                            <tr>
                                                <td colSpan={totalCols} className="text-center py-16 text-zinc-400 dark:text-zinc-500">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Search className="w-8 h-8 text-zinc-200" />
                                                        <span className="text-sm font-medium">No columns configured yet</span>
                                                        <span className="text-xs">Add columns in this resource's Table class, or fields in its Form class.</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : records.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={totalCols} className="text-center py-16 text-zinc-400 dark:text-zinc-500">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Search className="w-8 h-8 text-zinc-200" />
                                                        <span className="text-sm">No records found</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : records.data.map((record, rowIndex) => {
                                            const id = (record as FormValues).id as string | number;
                                            const trashed = !!(record as FormValues).deleted_at;
                                            const isSelected = selectedIds.has(id);

                                            return (
                                                <tr
                                                    key={id}
                                                    className={cn(
                                                        'group transition-colors',
                                                        isSelected
                                                            ? 'bg-[var(--larafusion-primary,#18181b)]/5'
                                                            : striped && rowIndex % 2 !== 0
                                                                ? 'bg-zinc-100/80 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                                                                : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50',
                                                        trashed && 'opacity-60',
                                                    )}>
                                                    {/* Checkbox — hidden when no bulk actions defined */}
                                                    {hasBulkActions && (
                                                        <td className="w-10 px-4 py-3.5 relative">
                                                            <span className={cn('absolute inset-y-0 left-0 w-[3px] transition-colors', isSelected ? 'bg-[var(--larafusion-primary,#18181b)]' : 'bg-transparent')} />
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleRow(id)}
                                                                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 cursor-pointer accent-[var(--larafusion-primary,#18181b)]"
                                                            />
                                                        </td>
                                                    )}
                                                    {/* ID — only when no explicit columns defined */}
                                                    {showIdColumn && (
                                                        <td className="px-4 py-3.5 font-mono text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                                                            {id}
                                                        </td>
                                                    )}
                                                    {/* Fields */}
                                                    {visibleFields.map(col => {
                                                        const field = schemaByName[col.name];
                                                        return (
                                                            <td key={col.name} className="px-4 py-3.5">
                                                                {inlineEditable.includes(col.name) && !trashed && field
                                                                    ? <InlineCell field={field} value={(record as FormValues)[col.name]} resourceSlug={resource.slug} id={id} />
                                                                    : <CellValue col={col} field={field} value={resolveCellValue(record as Record<string, unknown>, col.name)} />
                                                                }
                                                            </td>
                                                        );
                                                    })}
                                                    {/* Actions */}
                                                    <td className="px-4 py-3.5">
                                                        <RecordActionsCell
                                                            customActions={actions}
                                                            builtinRecordActions={
                                                                hasExplicitRecordActions
                                                                    ? (tableConfig!.recordActions as BuiltinRecordAction[])
                                                                    : legacyRecordActions
                                                            }
                                                            can={can}
                                                            id={id}
                                                            slug={resource.slug}
                                                            record={record as Record<string, unknown>}
                                                            trashed={trashed}
                                                            onModalEdit={onModalEdit}
                                                            prefetchProps={prefetchProps}
                                                            openConfirm={openConfirm}
                                                            onDelete={handleDelete}
                                                            onForceDelete={handleForceDelete}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer: results left | per-page centre | pagination right */}
                            {/* Hidden when empty, pagination disabled, or no search/filter and everything fits on one page */}
                            {!isTrulyEmpty && !disablePagination && (hasActiveSearch || hasActiveFilters || records.last_page > 1) && <div className="px-6 py-3.5 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-3 items-center gap-4 bg-zinc-50/50 dark:bg-zinc-800/30">
                                {/* Left — result count */}
                                <div>
                                    {records.total > 0 && (
                                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                            Showing <span className="font-medium text-zinc-700 dark:text-zinc-300">{records.from}</span>–<span className="font-medium text-zinc-700 dark:text-zinc-300">{records.to}</span> of <span className="font-medium text-zinc-700 dark:text-zinc-300">{records.total}</span> results
                                        </span>
                                    )}
                                </div>

                                {/* Centre — rows per page (always centred) */}
                                <div className="flex justify-center">
                                    <PerPageSelector current={records.per_page} resourceSlug={resource.slug} />
                                </div>

                                {/* Right — pagination */}
                                <div className="flex justify-end">
                                    <PaginationRow records={records} simple={simplePagination} />
                                </div>
                            </div>}
                        </div>{/* /relative overlay wrapper */}
                    </Deferred>

                    {/* Below-content inline filter panel */}
                    {!isTrulyEmpty && isBelowLayout && <FilterPanel {...filterPanelProps} />}
                </Card>

                {/* After-content filter sidebar */}
                {hasSideFilters && isAfterSide && (
                    <SideFilterSidebar
                        resourceSlug={resource.slug}
                        filterableColumns={sideFilterableColumns}
                        standaloneFilters={sideStandaloneFilters}
                        formColumns={tableConfig?.filtersFormColumns ?? 1}
                        formMaxHeight={tableConfig?.filtersFormMaxHeight}
                        collapsible={isSideCollapsible}
                    />
                )}

            </div>{/* /side-layout wrapper */}
        </>
    );
}
