// Shared color palette for table badges, filter option chips, icon columns, etc.
// Single source of truth so a `success`/`danger`/`warning` enum value looks the
// same wherever it renders (BadgeColumn cell, SelectFilter option, boolean icon).

export interface ColorClass {
    bg: string;
    text: string;
    border: string;
}

export const COLOR_CLASSES: Record<string, ColorClass> = {
    primary: { bg: 'bg-[var(--larafusion-primary,#18181b)]/10', text: 'text-[var(--larafusion-primary,#18181b)]', border: 'border-[var(--larafusion-primary,#18181b)]/20' },
    success: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
    danger:  { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
    info:    { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800' },
    gray:    { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400', border: 'border-zinc-200 dark:border-zinc-700' },
};

/** Resolve a color name to its class set, falling back to `gray`. */
export function colorClass(color?: string | null): ColorClass {
    return COLOR_CLASSES[color ?? 'gray'] ?? COLOR_CLASSES.gray;
}

/** Full class string for a pill/badge in the given color. */
export function badgeClasses(color?: string | null): string {
    const c = colorClass(color);
    return `inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`;
}
