import React from 'react';
import { usePage } from '@inertiajs/react';
import AdminLayout from '../../components/layout/AdminLayout';
import WidgetGrid from '../../components/widgets/WidgetGrid';
import { LarafusionSharedProps, WidgetMeta } from '../../types';
import { ExternalLink } from 'lucide-react';

type DashboardPageProps = LarafusionSharedProps & {
    widgetsMeta?: WidgetMeta[];
    showDefaultCards?: boolean;
};

// Repo for the "built with Larafusion" card — update to your own project's repo if desired.
const LARAFUSION_GITHUB_URL = 'https://github.com/ali-hasnain-dev/arcane';

export default function Dashboard() {
    const { larafusion, auth, widgetsMeta, showDefaultCards } = usePage<DashboardPageProps>().props;

    // Build the widget data URL from the panel path (e.g. /admin/_widgets/data)
    const widgetDataUrl = `/${larafusion.panel.path ?? 'admin'}/_widgets/data`;

    return (
        <AdminLayout pageTitle="Dashboard">
            {/* Widgets — each fetches and polls independently; shows skeleton while loading.
                Empty by default until the developer registers widgets on the panel. */}
            {widgetsMeta && widgetsMeta.length > 0 && (
                <WidgetGrid widgets={widgetsMeta} widgetDataUrl={widgetDataUrl} />
            )}

            {/* Static default dashboard content — no deferral, no server round trip.
                Only shows while ->widgets([]) is present but empty on the Panel; remove
                that call (or add real widgets) in your PanelProvider to turn it off.
                4-column grid so these two cards stay compact (half the row) instead of
                stretching full width. */}
            {showDefaultCards && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-8">
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
                        <ExternalLink className="w-5 h-5 text-zinc-400 dark:text-zinc-500 group-hover:text-[var(--larafusion-primary,#18181b)] dark:group-hover:text-zinc-300 transition-colors" />
                    </a>
                </div>
            )}
        </AdminLayout>
    );
}
