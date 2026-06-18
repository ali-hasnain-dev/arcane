import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { router } from '@inertiajs/react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

// Module-level: single router.on('flash') listener registered once for the app lifetime.
// Inertia v3 fires 'flash' ONLY when the server actually sent Inertia::flash() data —
// partial reloads (pagination, filters) never trigger it, so no duplicate toasts.
let flashUnsubscribe: (() => void) | null = null;
let onFlash: ((type: 'success' | 'error', title: string) => void) | null = null;

// ─── Types ─────────────────────────────────────────────────────────────────────

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    duration?: number;   // ms; 0 = persistent
    persistent?: boolean;
}

interface NotificationContextValue {
    notify: (n: Omit<Notification, 'id'>) => string;
    dismiss: (id: string) => void;
    success: (title: string, message?: string) => string;
    error:   (title: string, message?: string) => string;
    warning: (title: string, message?: string) => string;
    info:    (title: string, message?: string) => string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotify(): NotificationContextValue {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotify must be used inside <NotificationProvider>');
    return ctx;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const typeConfig: Record<NotificationType, {
    icon: React.ComponentType<{ className?: string }>;
    iconCls: string;
    borderCls: string;
    bgCls: string;
}> = {
    success: { icon: CheckCircle,    iconCls: 'text-green-500',  borderCls: 'border-green-200 dark:border-green-800',  bgCls: 'bg-white dark:bg-zinc-900' },
    error:   { icon: AlertCircle,    iconCls: 'text-red-500',    borderCls: 'border-red-200 dark:border-red-800',      bgCls: 'bg-white dark:bg-zinc-900' },
    warning: { icon: AlertTriangle,  iconCls: 'text-amber-500',  borderCls: 'border-amber-200 dark:border-amber-800',  bgCls: 'bg-white dark:bg-zinc-900' },
    info:    { icon: Info,           iconCls: 'text-blue-500',   borderCls: 'border-blue-200 dark:border-blue-800',    bgCls: 'bg-white dark:bg-zinc-900' },
};

// ─── Single toast item ────────────────────────────────────────────────────────

function Toast({ notification, onDismiss }: {
    notification: Notification;
    onDismiss: (id: string) => void;
}) {
    const [visible, setVisible] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const cfg  = typeConfig[notification.type];
    const Icon = cfg.icon;

    // Animate in
    useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

    const dismiss = useCallback(() => {
        setLeaving(true);
        setTimeout(() => onDismiss(notification.id), 300);
    }, [notification.id, onDismiss]);

    // Auto-dismiss
    useEffect(() => {
        const duration = notification.duration ?? (notification.persistent ? 0 : 4500);
        if (duration === 0) return;
        const t = setTimeout(dismiss, duration);
        return () => clearTimeout(t);
    }, [dismiss, notification.duration, notification.persistent]);

    return (
        <div
            className={cn(
                'flex items-start gap-3 w-80 max-w-full px-4 py-3.5 rounded-xl shadow-lg border',
                'transition-all duration-300',
                cfg.bgCls, cfg.borderCls,
                visible && !leaving ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
            )}
            role="alert"
        >
            <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', cfg.iconCls)} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 leading-snug">{notification.title}</p>
                {notification.message && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">{notification.message}</p>
                )}
            </div>
            <button
                type="button"
                onClick={dismiss}
                className="shrink-0 p-0.5 rounded text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

// ─── Provider + stack ─────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const counter = useRef(0);

    const notify = useCallback((n: Omit<Notification, 'id'>): string => {
        const id = `n-${++counter.current}`;
        setNotifications(prev => [...prev.slice(-4), { ...n, id }]); // cap at 5
        return id;
    }, []);

    const dismiss = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const success = useCallback((title: string, message?: string) => notify({ type: 'success', title, message }), [notify]);
    const error   = useCallback((title: string, message?: string) => notify({ type: 'error',   title, message }), [notify]);
    const warning = useCallback((title: string, message?: string) => notify({ type: 'warning', title, message }), [notify]);
    const info    = useCallback((title: string, message?: string) => notify({ type: 'info',    title, message }), [notify]);

    // Keep a stable ref to the latest success/error so the module-level navigate
    // handler can call them directly without needing to re-register on each render.
    const successRef = useRef(success);
    const errorRef   = useRef(error);
    useEffect(() => { successRef.current = success; }, [success]);
    useEffect(() => { errorRef.current   = error;   }, [error]);

    // Wire up the module-level flash listener once per app lifetime.
    // router.on('flash') fires ONLY when the server included Inertia::flash() data
    // in the response. It does NOT fire on partial reloads (pagination, sorting,
    // filters) so the same toast can never re-appear after the first navigation.
    useEffect(() => {
        onFlash = (type, title) => {
            if (type === 'success') successRef.current(title);
            else                    errorRef.current(title);
        };

        if (!flashUnsubscribe) {
            flashUnsubscribe = router.on('flash', (event) => {
                const flash = event.detail.flash as { success?: string; error?: string } | undefined;
                if (flash?.success) onFlash?.('success', flash.success);
                if (flash?.error)   onFlash?.('error',   flash.error);
            });
        }

        return () => { onFlash = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <NotificationContext.Provider value={{ notify, dismiss, success, error, warning, info }}>
            {children}
            {/* Stack — top-right */}
            <div className="fixed top-6 right-6 z-50 flex flex-col gap-2.5 items-end pointer-events-none">
                {notifications.map(n => (
                    <div key={n.id} className="pointer-events-auto">
                        <Toast notification={n} onDismiss={dismiss} />
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
}
