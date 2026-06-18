import React, { useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useBreadcrumbPortal } from '../lib/breadcrumbPortal';

interface Crumb {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    crumbs: Crumb[];
    actions?: React.ReactNode;
    /** Override the h1 heading. Defaults to the last crumb's label. */
    heading?: string;
    /** Optional subtitle shown below the h1. */
    description?: string;
}

export default function Breadcrumb({ crumbs, actions, heading, description }: BreadcrumbProps) {
    const portal = useBreadcrumbPortal();
    const position = portal?.position ?? 'page';

    if (crumbs.length === 0) return null;

    const trail = crumbs.slice(0, -1);
    const current = crumbs[crumbs.length - 1];
    const title = heading ?? current.label;

    // The markup rendered in either position
    function Trail() {
        if (trail.length === 0) return null;
        return (
            <nav className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                {trail.map((crumb, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-500" />}
                        {crumb.href ? (
                            <Link href={crumb.href} className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                                {crumb.label}
                            </Link>
                        ) : (
                            <span className="text-zinc-500 dark:text-zinc-400">{crumb.label}</span>
                        )}
                    </React.Fragment>
                ))}
                <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                <span className="text-zinc-600 dark:text-zinc-300">{current.label}</span>
            </nav>
        );
    }

    // ── Header position ───────────────────────────────────────────────────────
    // When breadcrumbsPosition === 'header' the Breadcrumb registers its content
    // with the portal context; AdminLayout's Topbar renders it in the header bar.
    if (position === 'header') {
        return (
            <HeaderBreadcrumb
                portal={portal!}
                trail={<Trail />}
                title={title}
                description={description}
                actions={actions}
            />
        );
    }

    // ── Page position (default) ───────────────────────────────────────────────
    return (
        <div className="mb-6">
            <Trail />
            <div className={`flex items-center justify-between gap-4 ${trail.length > 0 ? 'mt-1.5' : ''}`}>
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
                    )}
                </div>
                {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
            </div>
        </div>
    );
}

/**
 * When position=header, register the header-optimised breadcrumb content
 * with the portal context on every render and return null (nothing inline).
 */
function HeaderBreadcrumb({
    portal,
    trail,
    title,
    description,
    actions,
}: {
    portal: NonNullable<ReturnType<typeof useBreadcrumbPortal>>;
    trail: React.ReactNode;
    title: string;
    description?: string;
    actions: React.ReactNode;
}) {
    const { register } = portal;

    // Only the breadcrumb trail (navigation path) goes into the topbar.
    // The h1 heading and action buttons stay in the page content area.
    useEffect(() => {
        register(trail);
        return () => register(null);
    });

    // Heading row stays in the page — without the trail above it
    return (
        <div className="mb-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-2 shrink-0">{actions}</div>
                )}
            </div>
        </div>
    );
}
