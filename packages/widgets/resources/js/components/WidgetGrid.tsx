import React from 'react';
import StatsOverview from './StatsOverview';
import ChartWidgetComponent from './ChartWidget';
import TableWidgetComponent from './TableWidget';
import type { WidgetData } from '@larafusion/support';

/** Map columnSpan to Tailwind col-span classes. Supports numbers 1-12 and the "full" string. */
function colSpanClass(span: number | string | undefined): string {
    if (span === 'full') return 'col-span-full';

    const n = Number(span ?? 1);
    const map: Record<number, string> = {
        1:  'col-span-1',
        2:  'col-span-1 md:col-span-2',
        3:  'col-span-1 md:col-span-2 lg:col-span-3',
        4:  'col-span-1 md:col-span-2 lg:col-span-4',
        5:  'col-span-1 md:col-span-3 lg:col-span-5',
        6:  'col-span-1 md:col-span-3 lg:col-span-6',
        7:  'col-span-1 md:col-span-4 lg:col-span-7',
        8:  'col-span-1 md:col-span-4 lg:col-span-8',
        9:  'col-span-1 md:col-span-5 lg:col-span-9',
        10: 'col-span-1 md:col-span-5 lg:col-span-10',
        11: 'col-span-1 md:col-span-6 lg:col-span-11',
        12: 'col-span-full',
    };
    return map[n] ?? 'col-span-1';
}

function WidgetCard({ widget }: { widget: WidgetData }) {
    switch (widget.type) {
        case 'stats_overview':
            return <StatsOverview widget={widget} />;
        case 'chart':
            return <ChartWidgetComponent widget={widget} />;
        case 'table':
            return <TableWidgetComponent widget={widget} />;
        default:
            return null;
    }
}

export default function WidgetGrid({ widgets }: { widgets: WidgetData[] }) {
    if (!widgets || widgets.length === 0) return null;

    // Sort by the `sort` property ascending (widgets without sort default to 0)
    const sorted = [...widgets].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            {sorted.map((w, i) => (
                <div key={i} className={colSpanClass(w.columnSpan)}>
                    <WidgetCard widget={w} />
                </div>
            ))}
        </div>
    );
}
