import React from 'react';
import { PaginatedData } from '../types';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    data: PaginatedData;
    perPage: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
}

const PER_PAGE_OPTIONS = [10, 15, 25, 50, 100];

export default function Pagination({ data, perPage, onPageChange, onPerPageChange }: PaginationProps) {
    const { current_page, last_page, from, to, total } = data;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3 border-t border-zinc-100 text-sm text-zinc-500">
            {/* Left: count + per-page */}
            <div className="flex items-center gap-3">
                <span>
                    Showing <span className="font-semibold text-zinc-700">{from}–{to}</span> of{' '}
                    <span className="font-semibold text-zinc-700">{total}</span>
                </span>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-400">Rows:</span>
                    <select
                        value={perPage}
                        onChange={e => onPerPageChange(Number(e.target.value))}
                        className="text-xs border border-zinc-300 rounded-md px-1.5 py-1 bg-white outline-none focus:ring-1 focus:ring-[var(--arcane-primary,#18181b)]/20 text-zinc-600"
                    >
                        {PER_PAGE_OPTIONS.map(n => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Right: page buttons */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(current_page - 1)}
                    disabled={current_page === 1}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {buildPageRange(current_page, last_page).map((item, i) =>
                    item === '...' ? (
                        <span key={`ellipsis-${i}`} className="px-2 py-1 text-zinc-400">…</span>
                    ) : (
                        <button
                            key={item}
                            onClick={() => onPageChange(item as number)}
                            className={cn(
                                'w-8 h-8 rounded-lg text-sm transition-colors',
                                item === current_page
                                    ? 'bg-[var(--arcane-primary,#18181b)] text-white font-semibold'
                                    : 'text-zinc-600 hover:bg-zinc-100'
                            )}
                        >
                            {item}
                        </button>
                    )
                )}

                <button
                    onClick={() => onPageChange(current_page + 1)}
                    disabled={current_page === last_page}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function buildPageRange(current: number, total: number): (number | '...')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
}
