import React, { useCallback, useState, useEffect } from 'react';
import { Plus, Trash2, Copy, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { RepeaterField, RepeaterRow } from '../../types';
import { ValidationStatus } from '../../types';
import FieldWrapper from './FieldWrapper';
import { cn } from '../../lib/utils';

import { FieldRenderer } from '.';
import { ArcaneField } from '@arcane/core';

interface RepeaterProps {
    field: RepeaterField;
    value: RepeaterRow[];
    error?: string;
    status?: ValidationStatus;
    onChange: (val: RepeaterRow[]) => void;
}

function generateKey() {
    return Math.random().toString(36).slice(2, 9);
}

function buildEmptyRow(subFields: ArcaneField[]): RepeaterRow {
    const row: RepeaterRow = { _key: generateKey() };
    subFields.forEach(f => {
        row[f.name] = f.default ?? (f.type === 'toggle' ? false : '');
    });
    return row;
}

export default function Repeater({ field, value = [], error, status = 'idle', onChange }: RepeaterProps) {
    const rows   = Array.isArray(value) ? value : [];
    const maxRows = field.maxRows ?? null;
    const minRows = field.minRows ?? null;
    const canAdd  = (field.addable !== false) && (!maxRows || rows.length < maxRows);
    const canDel  = (field.deletable !== false) && (!minRows || rows.length > minRows);
    const isCloneable  = field.cloneable  === true;
    const isReorderable = field.reorderable !== false;
    const isCollapsible = field.collapsible === true;
    const cols = field.columns ?? 2;

    // Track collapsed state per row key
    const [collapsedRows, setCollapsedRows] = useState<Record<string, boolean>>(() => {
        if (!field.collapsed) return {};
        const init: Record<string, boolean> = {};
        rows.forEach(r => { init[r._key] = true; });
        return init;
    });

    // Seed default items on first render
    useEffect(() => {
        if (rows.length === 0 && field.defaultItems > 0) {
            const defaults = Array.from({ length: field.defaultItems }, () => buildEmptyRow(field.subFields));
            onChange(defaults);
        }
    }, []);

    const toggleCollapse = (key: string) => {
        setCollapsedRows(c => ({ ...c, [key]: !c[key] }));
    };

    const addRow = useCallback(() => {
        onChange([...rows, buildEmptyRow(field.subFields)]);
    }, [rows, field.subFields, onChange]);

    const removeRow = useCallback((idx: number) => {
        onChange(rows.filter((_, i) => i !== idx));
    }, [rows, onChange]);

    const cloneRow = useCallback((idx: number) => {
        const clone = { ...rows[idx], _key: generateKey() };
        const next = [...rows];
        next.splice(idx + 1, 0, clone);
        onChange(next);
    }, [rows, onChange]);

    const updateRow = useCallback((idx: number, name: string, val: unknown) => {
        onChange(rows.map((r, i) => i === idx ? { ...r, [name]: val } : r));
    }, [rows, onChange]);

    const moveRow = useCallback((idx: number, dir: -1 | 1) => {
        const next = [...rows];
        const target = idx + dir;
        if (target < 0 || target >= rows.length) return;
        [next[idx], next[target]] = [next[target], next[idx]];
        onChange(next);
    }, [rows, onChange]);

    // Grid column class based on `cols` prop
    const gridCls = cols === 1 ? 'grid grid-cols-1 gap-4'
        : cols === 3 ? 'grid grid-cols-1 md:grid-cols-3 gap-4'
        : 'grid grid-cols-1 md:grid-cols-2 gap-4';

    return (
        <FieldWrapper label={field.label} required={field.required} hint={field.hint} error={error} status={status}>
            <div className="space-y-3">
                {rows.length === 0 && (
                    <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
                        No rows yet. Click "{field.addLabel ?? 'Add Row'}" to get started.
                    </div>
                )}

                {rows.map((row, idx) => {
                    const isRowCollapsed = isCollapsible && collapsedRows[row._key];
                    return (
                        <div
                            key={row._key}
                            className="border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50/40 dark:bg-zinc-800/30"
                        >
                            {/* Row header */}
                            <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 rounded-t-xl">
                                <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
                                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                        {field.label} #{idx + 1}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {/* Collapse toggle */}
                                    {isCollapsible && (
                                        <button
                                            type="button"
                                            onClick={() => toggleCollapse(row._key)}
                                            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                                            title={isRowCollapsed ? 'Expand' : 'Collapse'}
                                        >
                                            <ChevronsUpDown className="w-4 h-4" />
                                        </button>
                                    )}
                                    {/* Reorder */}
                                    {isReorderable && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => moveRow(idx, -1)}
                                                disabled={idx === 0}
                                                className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 transition-colors"
                                                title="Move up"
                                            >
                                                <ChevronUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveRow(idx, 1)}
                                                disabled={idx === rows.length - 1}
                                                className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 transition-colors"
                                                title="Move down"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                    {/* Clone */}
                                    {isCloneable && (!maxRows || rows.length < maxRows) && (
                                        <button
                                            type="button"
                                            onClick={() => cloneRow(idx)}
                                            className="p-1 rounded text-zinc-400 hover:text-[var(--arcane-primary,#18181b)] transition-colors"
                                            title="Duplicate row"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    )}
                                    {/* Delete */}
                                    {canDel && (
                                        <button
                                            type="button"
                                            onClick={() => removeRow(idx)}
                                            className="p-1 rounded text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                            title="Remove row"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Row sub-fields */}
                            {!isRowCollapsed && (
                                <div className={cn('p-4', gridCls)}>
                                    {field.subFields.map(subField => (
                                        <div
                                            key={subField.name}
                                            className={subField.type === 'textarea' || subField.type === 'rich_text' || subField.type === 'markdown' ? 'md:col-span-full' : ''}
                                        >
                                            <FieldRenderer
                                                field={subField}
                                                value={row[subField.name] ?? ''}
                                                onChange={val => updateRow(idx, subField.name, val)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Add row button */}
                {canAdd && (
                    <button
                        type="button"
                        onClick={addRow}
                        className={cn(
                            'flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border-2 border-dashed text-sm font-medium transition-colors',
                            'border-[var(--arcane-primary,#18181b)]/40 text-[var(--arcane-primary,#18181b)] hover:bg-[var(--arcane-primary,#18181b)]/5 hover:border-[var(--arcane-primary,#18181b)]/60',
                        )}
                    >
                        <Plus className="w-4 h-4" />
                        {field.addLabel ?? `Add ${field.label}`}
                    </button>
                )}

                {maxRows && (
                    <p className="text-xs text-zinc-400 text-right">
                        {rows.length} / {maxRows} rows
                    </p>
                )}
            </div>
        </FieldWrapper>
    );
}
