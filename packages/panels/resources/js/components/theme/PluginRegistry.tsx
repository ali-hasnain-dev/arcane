import React, { createContext, useContext, lazy, Suspense } from 'react';
import { usePage } from '@inertiajs/react';
import { ArcaneSharedProps } from '../../types';

// ─── Plugin component registry ────────────────────────────────────────────────

type ComponentFactory = () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>;

const registry: Map<string, React.ComponentType<Record<string, unknown>>> = new Map();

/**
 * Register a React component from a plugin.
 * Called by plugin JS bundles on load.
 *
 * Usage in plugin:
 *   import { registerComponent } from '@arcane/core';
 *   registerComponent('analytics.DashboardWidget', () => import('./DashboardWidget'));
 */
export function registerComponent(name: string, factory: ComponentFactory): void {
    const LazyComponent = lazy(factory);
    registry.set(name, (props: Record<string, unknown>) => (
        <Suspense fallback={<div className="animate-pulse h-8 bg-zinc-100 rounded-lg" />}>
            <LazyComponent {...props} />
        </Suspense>
    ));
}

/**
 * Resolve a registered plugin component by name.
 * Returns null if the component isn't registered.
 */
export function resolveComponent(name: string): React.ComponentType<Record<string, unknown>> | null {
    return registry.get(name) ?? null;
}

// ─── PluginSlot — render a named slot that plugins can fill ──────────────────

interface PluginSlotProps {
    name: string;
    [key: string]: unknown;
}

/**
 * Drop a <PluginSlot name="dashboard.header" /> anywhere in your layout.
 * Plugins register components for that slot name and they render here.
 */
export function PluginSlot({ name, ...props }: PluginSlotProps) {
    const Component = resolveComponent(name);
    if (!Component) return null;
    return <Component {...props} />;
}

// ─── Plugin context ───────────────────────────────────────────────────────────

interface PluginInfo {
    id: string;
    name: string;
    version: string;
    description: string;
    components: Record<string, string>;
}

const PluginContext = createContext<PluginInfo[]>([]);

export function usePlugins(): PluginInfo[] {
    return useContext(PluginContext);
}

export function PluginProvider({ children }: { children: React.ReactNode }) {
    const { arcane } = usePage<ArcaneSharedProps>().props;
    const plugins = (arcane?.plugins as PluginInfo[]) ?? [];

    return (
        <PluginContext.Provider value={plugins}>
            {children}
        </PluginContext.Provider>
    );
}
