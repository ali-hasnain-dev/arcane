import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import HybridFieldRenderer from '../fields/HybridFieldRenderer';
import { ArcaneField, FormValues, FormErrors } from '../../types';

// ─── Schema item types ─────────────────────────────────────────────────────────

export interface SectionSchema {
    type: 'section';
    label: string;
    description?: string | null;
    icon?: string | null;
    columns: number;
    collapsible: boolean;
    collapsed: boolean;
    fields: SchemaItem[];
}

export interface TabSchema {
    label: string;
    icon?: string | null;
    columns: number;
    fields: SchemaItem[];
}

export interface TabsSchema {
    type: 'tabs';
    defaultTab: string;
    tabs: TabSchema[];
}

export interface GridSchema {
    type: 'grid';
    columns: number;
    fields: SchemaItem[];
}

export type SchemaItem = ArcaneField | SectionSchema | TabsSchema | GridSchema;

// ─── Props ────────────────────────────────────────────────────────────────────

interface LayoutProps {
    schema: SchemaItem[];
    data: FormValues;
    errors: FormErrors;
    onChange: (name: string, value: unknown) => void;
    resourceSlug?: string;
    recordId?: string | number | null;
}

// ─── Field grid ───────────────────────────────────────────────────────────────

function FieldGrid({ fields, columns, data, errors, onChange, resourceSlug, recordId }: {
    fields: SchemaItem[];
    columns: number;
    data: FormValues;
    errors: FormErrors;
    onChange: (name: string, value: unknown) => void;
    resourceSlug?: string;
    recordId?: string | number | null;
}) {
    const colClass = columns === 1 ? 'grid-cols-1' : columns === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2';

    return (
        <div className={cn('grid gap-5', colClass)}>
            {fields.map((item, i) => {
                const key = (item as ArcaneField).name ?? `layout-${i}`;
                return (
                    <SchemaItemRenderer
                        key={key}
                        item={item}
                        data={data}
                        errors={errors}
                        onChange={onChange}
                        resourceSlug={resourceSlug}
                        recordId={recordId}
                    />
                );
            })}
        </div>
    );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function SectionRenderer({ section, data, errors, onChange, resourceSlug, recordId }: {
    section: SectionSchema;
    data: FormValues;
    errors: FormErrors;
    onChange: (name: string, value: unknown) => void;
    resourceSlug?: string;
    recordId?: string | number | null;
}) {
    const [open, setOpen] = useState(!section.collapsed);

    return (
        <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl">
            {section.label && (
                <div
                    className={cn(
                        'flex items-center gap-2 px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 rounded-t-xl',
                        section.collapsible && 'cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors',
                    )}
                    onClick={() => section.collapsible && setOpen(o => !o)}
                >
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{section.label}</span>
                    {section.description && (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 mr-2">{section.description}</span>
                    )}
                    {section.collapsible && (
                        open
                            ? <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                            : <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                    )}
                </div>
            )}
            {open && (
                <div className="p-5">
                    <FieldGrid
                        fields={section.fields}
                        columns={section.columns}
                        data={data}
                        errors={errors}
                        onChange={onChange}
                        resourceSlug={resourceSlug}
                        recordId={recordId}
                    />
                </div>
            )}
        </div>
    );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function TabsRenderer({ tabs: tabsSchema, data, errors, onChange, resourceSlug, recordId }: {
    tabs: TabsSchema;
    data: FormValues;
    errors: FormErrors;
    onChange: (name: string, value: unknown) => void;
    resourceSlug?: string;
    recordId?: string | number | null;
}) {
    const initial = tabsSchema.defaultTab || tabsSchema.tabs[0]?.label || '';
    const [active, setActive] = useState(initial);
    const currentTab = tabsSchema.tabs.find(t => t.label === active) ?? tabsSchema.tabs[0];

    // Show error indicator on tab if any contained field has an error
    const tabHasError = (tab: TabSchema) =>
        tab.fields.some(f => (f as ArcaneField).name && errors[(f as ArcaneField).name]);

    return (
        <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl">
            <div className="flex border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 overflow-x-auto rounded-t-xl">
                {tabsSchema.tabs.map(tab => (
                    <button
                        key={tab.label}
                        type="button"
                        onClick={() => setActive(tab.label)}
                        className={cn(
                            'px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                            active === tab.label
                                ? 'border-[var(--arcane-primary,#18181b)] text-[var(--arcane-primary,#18181b)] bg-white dark:bg-zinc-900'
                                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700',
                            tabHasError(tab) && active !== tab.label && 'text-red-500',
                        )}
                    >
                        {tab.label}
                        {tabHasError(tab) && active !== tab.label && (
                            <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-red-500 inline-block align-middle" />
                        )}
                    </button>
                ))}
            </div>
            {currentTab && (
                <div className="p-5">
                    <FieldGrid
                        fields={currentTab.fields}
                        columns={currentTab.columns}
                        data={data}
                        errors={errors}
                        onChange={onChange}
                        resourceSlug={resourceSlug}
                        recordId={recordId}
                    />
                </div>
            )}
        </div>
    );
}

// ─── Grid (standalone) ────────────────────────────────────────────────────────

function GridRenderer({ grid, data, errors, onChange, resourceSlug, recordId }: {
    grid: GridSchema;
    data: FormValues;
    errors: FormErrors;
    onChange: (name: string, value: unknown) => void;
    resourceSlug?: string;
    recordId?: string | number | null;
}) {
    return (
        <FieldGrid
            fields={grid.fields}
            columns={grid.columns}
            data={data}
            errors={errors}
            onChange={onChange}
            resourceSlug={resourceSlug}
            recordId={recordId}
        />
    );
}

// ─── Single item dispatcher ────────────────────────────────────────────────────

export function SchemaItemRenderer({ item, data, errors, onChange, resourceSlug, recordId }: {
    item: SchemaItem;
    data: FormValues;
    errors: FormErrors;
    onChange: (name: string, value: unknown) => void;
    resourceSlug?: string;
    recordId?: string | number | null;
}) {
    if ((item as SectionSchema).type === 'section') {
        return <SectionRenderer section={item as SectionSchema} data={data} errors={errors} onChange={onChange} resourceSlug={resourceSlug} recordId={recordId} />;
    }
    if ((item as TabsSchema).type === 'tabs') {
        return <TabsRenderer tabs={item as TabsSchema} data={data} errors={errors} onChange={onChange} resourceSlug={resourceSlug} recordId={recordId} />;
    }
    if ((item as GridSchema).type === 'grid') {
        return <GridRenderer grid={item as GridSchema} data={data} errors={errors} onChange={onChange} resourceSlug={resourceSlug} recordId={recordId} />;
    }

    // Plain field — use HybridFieldRenderer so relation fields (BelongsTo, etc.) work
    const field = item as ArcaneField;
    return (
        <div
            data-field-error={!!errors[field.name] || undefined}
            className={field.type === 'textarea' ? 'md:col-span-2' : ''}
        >
            <HybridFieldRenderer
                field={field}
                value={data[field.name] ?? ''}
                error={errors[field.name]}
                onChange={val => onChange(field.name, val)}
                resourceSlug={resourceSlug}
                recordId={recordId}
            />
        </div>
    );
}

// ─── Top-level layout renderer ────────────────────────────────────────────────

export default function FormLayout({ schema, data, errors, onChange, resourceSlug, recordId }: LayoutProps) {
    // If schema is all flat fields (no layout items), use a simple 2-col grid
    const hasLayout = schema.some(item =>
        (item as SectionSchema).type === 'section' ||
        (item as TabsSchema).type === 'tabs' ||
        (item as GridSchema).type === 'grid'
    );

    if (!hasLayout) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {schema.map((item, i) => {
                    const field = item as ArcaneField;
                    return (
                        <div
                            key={field.name ?? i}
                            data-field-error={!!errors[field.name] || undefined}
                            className={field.type === 'textarea' ? 'md:col-span-2' : ''}
                        >
                            <HybridFieldRenderer
                                field={field}
                                value={data[field.name] ?? ''}
                                error={errors[field.name]}
                                onChange={val => onChange(field.name, val)}
                                resourceSlug={resourceSlug}
                                recordId={recordId}
                            />
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {schema.map((item, i) => (
                <SchemaItemRenderer
                    key={(item as ArcaneField).name ?? `layout-${i}`}
                    item={item}
                    data={data}
                    errors={errors}
                    onChange={onChange}
                    resourceSlug={resourceSlug}
                    recordId={recordId}
                />
            ))}
        </div>
    );
}
