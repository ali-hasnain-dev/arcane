import React from 'react';
import { usePage, Link, Deferred } from '@inertiajs/react';
import { usePrefetchProps } from '../../hooks/usePrefetchProps';
import AdminLayout from '../../components/layout/AdminLayout';
import WidgetGrid from '../../components/widgets/WidgetGrid';
import { LarafusionSharedProps, NavigationItem, WidgetData } from '../../types';
import { ArrowRight, Users, Activity } from 'lucide-react';

type DashboardPageProps = LarafusionSharedProps & {
    stats?: { total: number; counts: Record<string, number> };
    widgets?: WidgetData[];
};

// ─── Skeleton shown while deferred stats are loading ─────────────────────────
function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 animate-pulse">
                    <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded mb-3" />
                    <div className="h-7 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
                </div>
            ))}
        </div>
    );
}

// ─── Deferred child components ────────────────────────────────────────────────
// Must be separate components — hooks cannot be called inside render callbacks.

function DeferredWidgets() {
    const { widgets } = usePage<DashboardPageProps>().props;
    return <WidgetGrid widgets={widgets ?? []} />;
}

function DeferredStats() {
    const { stats, larafusion } = usePage<DashboardPageProps>().props;
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1">Total Records</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats?.total ?? 0}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                    <Users className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                    <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Resources</p>
                </div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{larafusion.navigation.length}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                    <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Status</p>
                </div>
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">● Online</p>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { larafusion } = usePage<LarafusionSharedProps>().props;
    const prefetchProps = usePrefetchProps();

    return (
        <AdminLayout pageTitle="Dashboard">
            {/* Widgets — deferred; fallback={<></>} renders nothing while loading */}
            <Deferred data="widgets" fallback={<></>}>
                <DeferredWidgets />
            </Deferred>

            {/* Stats — show skeleton while loading, then real counts from the server */}
            <Deferred data="stats" fallback={<StatsSkeleton />}>
                <DeferredStats />
            </Deferred>

            {/* Resource cards — available immediately, no deferral needed */}
            {larafusion.navigation.length === 0 ? (
                <div className="text-center py-20 text-zinc-400 dark:text-zinc-500">
                    <p className="text-lg font-medium">No resources registered yet.</p>
                    <p className="text-sm mt-1">
                        Add resources to your <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs">LarafusionServiceProvider</code>
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {larafusion.navigation.filter((item): item is NavigationItem => item.type === 'item').map(item => (
                        <Link
                            key={item.slug}
                            href={item.url}
                            {...prefetchProps}
                            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:border-[var(--larafusion-primary,#18181b)]/30 dark:hover:border-zinc-600 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">{item.label}</h3>
                                <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-[var(--larafusion-primary,#18181b)] dark:group-hover:text-zinc-300 transition-colors" />
                            </div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                Manage {item.label.toLowerCase()}
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
