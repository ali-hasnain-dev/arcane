import React, { useState, useRef, useEffect } from 'react';
import { TableColumn } from '../types';
import { Columns, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface ColumnVisibilityMenuProps {
    columns: TableColumn[];
    visibleColumns: string[];
    onToggle: (key: string) => void;
}

export default function ColumnVisibilityMenu({ columns, visibleColumns, onToggle }: ColumnVisibilityMenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                    open
                        ? 'bg-zinc-100 border-zinc-300 text-zinc-800'
                        : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50'
                )}
                title="Toggle columns"
            >
                <Columns className="w-4 h-4" />
                <span className="hidden sm:inline">Columns</span>
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-zinc-200 rounded-xl shadow-lg z-30 py-1.5 animate-in fade-in-0 zoom-in-95">
                    <p className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                        Visible columns
                    </p>
                    {columns.map(col => {
                        const isVisible = visibleColumns.includes(col.key);
                        return (
                            <button
                                key={col.key}
                                onClick={() => onToggle(col.key)}
                                className="flex items-center justify-between w-full px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                            >
                                <span>{col.label}</span>
                                {isVisible && <Check className="w-4 h-4 text-[var(--larafusion-primary,#18181b)]" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
