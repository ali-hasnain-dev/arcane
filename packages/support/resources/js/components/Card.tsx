import React from 'react';
import { cn } from '../lib/utils';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

interface CardHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}

export function Card({ children, className }: CardProps) {
    return (
        <div className={cn('bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm', className)}>
            {children}
        </div>
    );
}

export function CardHeader({ title, description, actions }: CardHeaderProps) {
    return (
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
                <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">{title}</h2>
                {description && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
                )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}

export function CardBody({ children, className }: CardProps) {
    return (
        <div className={cn('p-6', className)}>
            {children}
        </div>
    );
}
