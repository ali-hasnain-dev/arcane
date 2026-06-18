import { usePage } from '@inertiajs/react';
import { ArcaneSharedProps, PrefetchConfig } from '../types';

/**
 * Returns ready-to-spread Link props controlled by the panel's prefetch config.
 *
 * Usage:
 *   const prefetch = usePrefetchProps();
 *   <Link href="..." {...prefetch}>...</Link>
 *
 * When prefetch is disabled in the panel provider, returns {} (no prefetching).
 * When enabled, returns { prefetch: strategy, cacheFor: duration }.
 */
export function usePrefetchProps(): {
    prefetch?: PrefetchConfig['strategy'] | boolean;
    cacheFor?: PrefetchConfig['cacheFor'];
} {
    const { arcane } = usePage<ArcaneSharedProps>().props;
    const config = arcane?.panel?.prefetch;

    if (!config?.enabled) return {};

    return {
        prefetch: config.strategy as PrefetchConfig['strategy'],
        cacheFor: config.cacheFor,
    };
}
