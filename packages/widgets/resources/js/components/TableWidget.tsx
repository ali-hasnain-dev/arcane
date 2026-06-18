import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 5;

interface TableWidgetData {
    heading?: string | null;
    description?: string | null;
    columns: string[];
    rows: string[][];
    pageSize?: number;
}

export default function TableWidget({ widget }: { widget: TableWidgetData }) {
    const pageSize = widget.pageSize ?? PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(widget.rows.length / pageSize));
    const [page, setPage] = useState(0);

    const visibleRows = widget.rows.slice(page * pageSize, (page + 1) * pageSize);
    const hasPagination = widget.rows.length > pageSize;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            {(widget.heading || widget.description) && (
                <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                    {widget.heading && (
                        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{widget.heading}</p>
                    )}
                    {widget.description && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{widget.description}</p>
                    )}
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/60">
                        <tr>
                            {widget.columns.map((col, i) => (
                                <th key={i}
                                    className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide whitespace-nowrap">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {widget.rows.length === 0 ? (
                            <tr>
                                <td colSpan={widget.columns.length}
                                    className="px-4 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
                                    No data
                                </td>
                            </tr>
                        ) : (
                            visibleRows.map((row, ri) => (
                                <tr key={ri} className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    {row.map((cell, ci) => (
                                        <td key={ci} className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {hasPagination && (
                <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {page * pageSize + 1}–{Math.min((page + 1) * pageSize, widget.rows.length)} of {widget.rows.length}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="p-1 rounded-lg text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page === totalPages - 1}
                            className="p-1 rounded-lg text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
