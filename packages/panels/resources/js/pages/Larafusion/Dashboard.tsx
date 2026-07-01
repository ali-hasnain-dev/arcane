import React from 'react';
import { usePage, Link } from '@inertiajs/react';
import { usePrefetchProps } from '../../hooks/usePrefetchProps';
import AdminLayout from '../../components/layout/AdminLayout';
import WidgetGrid from '../../components/widgets/WidgetGrid';
import { LarafusionSharedProps, NavigationItem, WidgetMeta } from '../../types';
import { ArrowRight, Github } from 'lucide-react';

type DashboardPageProps = LarafusionSharedProps & {
    widgetsMeta?: WidgetMeta[];
};

// Repo for the "built with Larafusion" card — update to your own project's repo if desired.
const LARAFUSION_GITHUB_URL = 'https://github.com/ali-hasnain-dev/arcane';

export default function Dashboard() {
    const { larafusion, auth, widgetsMeta } = usePage<DashboardPageProps>().props;
    const prefetchProps = usePrefetchProps();

    // Build the widget data URL from the panel path (e.g. /admin/_widgets/data)
    const widgetDataUrl = `/${larafusion.panel.path ?? 'admin'}/_widgets/data`;

    return (
        <AdminLayout pageTitle="Dashboard">
            {/* Widgets — each fetches and polls independently; shows skeleton while loading.
                Empty by default until the developer registers widgets on the panel. */}
            {widgetsMeta && widgetsMeta.length > 0 && (
                <WidgetGrid widgets={widgetsMeta} widgetDataUrl={widgetDataUrl} />
            )}

            {/* Static default dashboard content — no deferral, no server round trip. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                    <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        Welcome{auth.user?.name ? `, ${auth.user.name}` : ''}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Good to see you back.
                    </p>
                </div>

                <a
                    href={LARAFUSION_GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:border-[var(--larafusion-primary,#18181b)]/30 dark:hover:border-zinc-600 hover:shadow-md transition-all group flex items-center justify-between"
                >
                    <div>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Built with Larafusion</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">View the project on GitHub</p>
                    </div>
                    <Github className="w-5 h-5 text-zinc-400 dark:text-zinc-500 group-hover:text-[var(--larafusion-primary,#18181b)] dark:group-hover:text-zinc-300 transition-colors" />
                </a>
            </div>

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
