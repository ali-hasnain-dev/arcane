import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Shared context that lets page-level Breadcrumb components "teleport"
 * their content up into the AdminLayout Topbar when the panel is configured
 * with breadcrumbsPosition: 'header'.
 *
 * Lives in the support package so both support (Breadcrumb) and panels
 * (AdminLayout) can import it without circular dependencies.
 */

interface BreadcrumbPortalValue {
    /** The content registered by the most-recently rendered Breadcrumb. */
    content: React.ReactNode;
    /** Where the panel is configured to show breadcrumbs. */
    position: 'page' | 'header';
    /** Pages call this to register their breadcrumb content. */
    register: (node: React.ReactNode) => void;
}

const BreadcrumbPortalContext = createContext<BreadcrumbPortalValue | null>(null);

/** Wrap AdminLayoutInner with this provider. */
export function BreadcrumbPortalProvider({
    children,
    position = 'page',
}: {
    children: React.ReactNode;
    position?: 'page' | 'header';
}) {
    const [content, setContent] = useState<React.ReactNode>(null);
    const register = useCallback((node: React.ReactNode) => setContent(node), []);
    return (
        <BreadcrumbPortalContext.Provider value={{ content, position, register }}>
            {children}
        </BreadcrumbPortalContext.Provider>
    );
}

/** Read the breadcrumb portal state. Returns null when used outside the provider. */
export function useBreadcrumbPortal(): BreadcrumbPortalValue | null {
    return useContext(BreadcrumbPortalContext);
}
