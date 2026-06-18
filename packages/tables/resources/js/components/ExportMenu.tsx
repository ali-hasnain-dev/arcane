import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileJson } from 'lucide-react';
import { ExportOptions, PaginatedData } from '../types';
import { cn } from '../lib/utils';

interface ExportMenuProps {
    records: PaginatedData;
    visibleColumns: string[];
    filename: string;
    onExport: (options: ExportOptions) => void;
}

export default function ExportMenu({ records, visibleColumns, filename, onExport }: ExportMenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleExport = (format: 'csv' | 'json') => {
        onExport({ format, filename, columns: visibleColumns });
        setOpen(false);
    };

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
                title="Export data"
            >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-zinc-200 rounded-xl shadow-lg z-30 py-1.5 animate-in fade-in-0 zoom-in-95">
                    <p className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                        Export {records.total} records
                    </p>
                    <button
                        onClick={() => handleExport('csv')}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                        <FileText className="w-4 h-4 text-green-600" />
                        CSV (.csv)
                    </button>
                    <button
                        onClick={() => handleExport('json')}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                        <FileJson className="w-4 h-4 text-blue-600" />
                        JSON (.json)
                    </button>
                </div>
            )}
        </div>
    );
}
