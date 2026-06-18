/**
 * Priority-3 field components: Hidden, Radio, CheckboxList, Slider,
 * RichText, Markdown, KeyValue, Builder, MorphTo
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2, GripVertical, Eye, EyeOff, Bold, Italic, Underline,
         Strikethrough, List, ListOrdered, Quote, Link, Heading2, Heading3,
         ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type {
    ArcaneField, RadioField, CheckboxListField, SliderField,
    ToggleButtonsField, RichTextField, MarkdownField,
    KeyValueField, BuilderField, BuilderBlockSchema, MorphToField,
} from '@arcane/core';
import { FieldRenderer } from './index';

// ─── Shared helpers (duplicated here to avoid circular import) ────────────────
function Label({ text, required }: { text: string; required?: boolean }) {
    return (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            {text}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
    );
}
function FieldError({ error }: { error?: string }) {
    return error ? <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{error}</p> : null;
}
function FieldHint({ hint, error }: { hint?: string | null; error?: string }) {
    return (!error && hint) ? <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p> : null;
}
function inputCls(error?: string, extra?: string) {
    return cn(
        'w-full px-3 py-2 text-sm rounded-lg border outline-none transition-colors',
        'text-zinc-900 dark:text-zinc-100',
        error
            ? 'border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-800 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900'
            : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--arcane-primary,#18181b)]/30 focus:border-[var(--arcane-primary,#18181b)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        extra,
    );
}

// ─── 1. Hidden ────────────────────────────────────────────────────────────────
export function HiddenFieldComponent({ field, value, onChange }: {
    field: ArcaneField; value: unknown; onChange: (v: unknown) => void;
}) {
    // Sync default on mount
    useEffect(() => { if (value === '' && field.default !== null) onChange(field.default); }, []);
    return null;
}

// ─── 2. Radio ─────────────────────────────────────────────────────────────────
export function RadioFieldComponent({ field, value, error, onChange }: {
    field: RadioField; value: string; error?: string; onChange: (v: string) => void;
}) {
    const disabledOpts: string[] = field.disabledOptions ?? [];

    const layoutCls = field.layout === 'horizontal'
        ? 'flex flex-wrap gap-x-6 gap-y-2'
        : field.layout === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 gap-2'
            : 'space-y-2';

    return (
        <div>
            <Label text={field.label} required={field.required} />
            <div className={layoutCls}>
                {Object.entries<string>(field.options).map(([k, label]) => {
                    const isDisabled = field.disabled || disabledOpts.includes(k);
                    const isChecked  = value === k;
                    const desc: string | undefined = field.descriptions?.[k];
                    return (
                        <label key={k} className={cn(
                            'flex items-start gap-2.5 cursor-pointer',
                            field.layout === 'grid' && 'px-3 py-2 rounded-lg border transition-colors',
                            field.layout === 'grid' && (isChecked
                                ? 'border-[var(--arcane-primary,#18181b)] bg-[var(--arcane-primary,#18181b)]/5'
                                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'),
                            isDisabled && 'opacity-50 cursor-not-allowed',
                        )}>
                            <input
                                type="radio"
                                name={field.name}
                                value={k}
                                checked={isChecked}
                                onChange={() => !isDisabled && onChange(k)}
                                disabled={isDisabled}
                                className="mt-0.5 w-4 h-4 shrink-0 text-[var(--arcane-primary,#18181b)] border-zinc-300 dark:border-zinc-600 focus:ring-[var(--arcane-primary,#18181b)]"
                            />
                            <span className="flex flex-col">
                                <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
                                {desc && <span className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{desc}</span>}
                            </span>
                        </label>
                    );
                })}
            </div>
            <FieldError error={error} />
            <FieldHint hint={field.hint} error={error} />
        </div>
    );
}

// ─── 3. CheckboxList ──────────────────────────────────────────────────────────
export function CheckboxListFieldComponent({ field, value, error, onChange }: {
    field: CheckboxListField; value: string[]; error?: string; onChange: (v: string[]) => void;
}) {
    const [search, setSearch] = React.useState('');
    const selected: string[]     = Array.isArray(value) ? value : [];
    const disabledOpts: string[] = field.disabledOptions ?? [];
    const allKeys                = Object.keys(field.options) as string[];

    const filteredEntries = Object.entries<string>(field.options).filter(([k, v]) =>
        !search || v.toLowerCase().includes(search.toLowerCase())
    );

    const cols    = field.columns ?? (allKeys.length > 6 ? 3 : 2);
    const gridCls = cols === 1 ? 'space-y-2' : cols === 3 ? 'grid grid-cols-2 sm:grid-cols-3 gap-2' : 'grid grid-cols-2 gap-2';

    const toggle = (k: string) => {
        if (disabledOpts.includes(k)) return;
        const next = selected.includes(k) ? selected.filter(x => x !== k) : [...selected, k];
        onChange(next);
    };

    const selectAll   = () => onChange(allKeys.filter(k => !disabledOpts.includes(k)));
    const deselectAll = () => onChange([]);

    return (
        <div>
            <Label text={field.label} required={field.required} />

            {/* Bulk toggle row */}
            {field.bulkToggleable && (
                <div className="flex gap-3 mb-2">
                    <button type="button" onClick={selectAll}
                        className="text-xs text-[var(--arcane-primary,#18181b)] hover:underline">
                        Select all
                    </button>
                    <span className="text-xs text-zinc-300 dark:text-zinc-600">·</span>
                    <button type="button" onClick={deselectAll}
                        className="text-xs text-[var(--arcane-primary,#18181b)] hover:underline">
                        Deselect all
                    </button>
                </div>
            )}

            {/* Search */}
            {field.searchable && (
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={field.searchPrompt ?? 'Search options…'}
                    className="w-full mb-2 px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-[var(--arcane-primary,#18181b)]/30 focus:border-[var(--arcane-primary,#18181b)]"
                />
            )}

            {filteredEntries.length === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500 py-2">
                    {field.noSearchResultsMessage ?? 'No results found.'}
                </p>
            ) : (
                <div className={gridCls}>
                    {filteredEntries.map(([k, label]) => {
                        const isDisabled = field.disabled || disabledOpts.includes(k);
                        const isSelected = selected.includes(k);
                        const desc: string | undefined = field.descriptions?.[k];
                        return (
                            <label key={k} className={cn(
                                'flex items-start gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors',
                                isSelected
                                    ? 'border-[var(--arcane-primary,#18181b)] bg-[var(--arcane-primary,#18181b)]/5'
                                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600',
                                isDisabled && 'opacity-50 cursor-not-allowed',
                            )}>
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggle(k)}
                                    disabled={isDisabled}
                                    className="mt-0.5 w-4 h-4 shrink-0 rounded text-[var(--arcane-primary,#18181b)] border-zinc-300 dark:border-zinc-600 focus:ring-[var(--arcane-primary,#18181b)]"
                                />
                                <span className="flex flex-col">
                                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
                                    {desc && <span className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{desc}</span>}
                                </span>
                            </label>
                        );
                    })}
                </div>
            )}

            {field.max && (
                <p className="mt-1 text-xs text-zinc-400">{selected.length}/{field.max} selected</p>
            )}
            <FieldError error={error} />
            <FieldHint hint={field.hint} error={error} />
        </div>
    );
}

// ─── 4. Slider ────────────────────────────────────────────────────────────────
export function SliderFieldComponent({ field, value, error, onChange }: {
    field: SliderField; value: number | [number, number]; error?: string; onChange: (v: number | [number, number]) => void;
}) {
    const isRange    = field.range;
    const dp         = field.decimalPlaces ?? 0;
    const isVertical = field.vertical === true;
    const doFill     = field.fillTrack !== false;
    const showTip    = field.tooltips !== false;
    const [tip, setTip] = useState<string | null>(null);

    const numVal = isRange
        ? (Array.isArray(value) ? value : [field.min, field.max]) as [number, number]
        : (Number(value) || field.min);

    const fmt  = (v: number) => `${field.prefix ?? ''}${v.toFixed(dp)}${field.suffix ?? ''}`;
    const pct  = (v: number) => ((v - field.min) / (field.max - field.min)) * 100;

    const trackCls = cn('rounded-full accent-[var(--arcane-primary,#18181b)] disabled:opacity-50',
        isVertical ? 'h-24 w-2 cursor-ns-resize writing-mode-vertical' : 'flex-1 h-2');

    const renderSingle = () => (
        <div className={cn('flex items-center gap-3', isVertical && 'flex-col-reverse')}>
            <div className="relative flex-1 flex items-center">
                <input
                    type="range" min={field.min} max={field.max} step={field.step}
                    value={numVal as number}
                    onChange={e => onChange(+e.target.value)}
                    onMouseMove={e => showTip && setTip(fmt(+(e.target as HTMLInputElement).value))}
                    onMouseLeave={() => setTip(null)}
                    disabled={field.disabled}
                    style={doFill ? {
                        background: `linear-gradient(to right, var(--arcane-primary,#18181b) ${pct(numVal as number)}%, #e4e4e7 ${pct(numVal as number)}%)`
                    } : undefined}
                    className={trackCls}
                />
                {showTip && tip && (
                    <span className="absolute -top-6 pointer-events-none text-xs bg-zinc-800 text-white rounded px-1.5 py-0.5"
                        style={{ left: `${pct(numVal as number)}%`, transform: 'translateX(-50%)' }}>
                        {tip}
                    </span>
                )}
            </div>
            {field.showValue && (
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-16 text-right shrink-0">
                    {fmt(numVal as number)}
                </span>
            )}
        </div>
    );

    const renderRange = () => (
        <div className="relative flex items-center gap-4">
            <div className="relative flex-1 flex items-center">
                <input type="range" min={field.min} max={field.max} step={field.step}
                    value={(numVal as [number,number])[0]}
                    onChange={e => {
                        const v = +e.target.value;
                        const hi = (numVal as [number,number])[1];
                        const minDiff = field.minDifference ?? 0;
                        const maxDiff = field.maxDifference;
                        if (v > hi - minDiff) return;
                        if (maxDiff !== undefined && maxDiff !== null && hi - v > maxDiff) return;
                        onChange([v, hi]);
                    }}
                    disabled={field.disabled}
                    style={doFill ? {
                        background: `linear-gradient(to right, #e4e4e7 ${pct((numVal as [number,number])[0])}%, var(--arcane-primary,#18181b) ${pct((numVal as [number,number])[0])}%, var(--arcane-primary,#18181b) ${pct((numVal as [number,number])[1])}%, #e4e4e7 ${pct((numVal as [number,number])[1])}%)`
                    } : undefined}
                    className={cn(trackCls, 'absolute')} />
                <input type="range" min={field.min} max={field.max} step={field.step}
                    value={(numVal as [number,number])[1]}
                    onChange={e => {
                        const v = +e.target.value;
                        const lo = (numVal as [number,number])[0];
                        const minDiff = field.minDifference ?? 0;
                        const maxDiff = field.maxDifference;
                        if (v < lo + minDiff) return;
                        if (maxDiff !== undefined && maxDiff !== null && v - lo > maxDiff) return;
                        onChange([lo, v]);
                    }}
                    disabled={field.disabled}
                    className={cn(trackCls, 'absolute')} />
            </div>
            {field.showValue && (
                <>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 w-12 text-center shrink-0">{fmt((numVal as [number,number])[0])}</span>
                    <span className="text-xs text-zinc-400">–</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 w-12 text-center shrink-0">{fmt((numVal as [number,number])[1])}</span>
                </>
            )}
        </div>
    );

    return (
        <div>
            <Label text={field.label} required={field.required} />
            <div className="px-1 pt-1">
                {isRange ? renderRange() : renderSingle()}
                <div className="flex justify-between mt-1">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">{fmt(field.min)}</span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">{fmt(field.max)}</span>
                </div>
            </div>
            <FieldError error={error} />
            <FieldHint hint={field.hint} error={error} />
        </div>
    );
}

// ─── 4b. ToggleButtons ────────────────────────────────────────────────────────

import { resolveIcon as _resolveIcon } from '../../lib/icons';

function toggleBtnColor(colorName?: string): { active: string; base: string } {
    switch (colorName) {
        case 'success': return { active: 'bg-green-500  border-green-500  text-white', base: 'border-green-300  text-green-700  dark:text-green-400  hover:bg-green-50  dark:hover:bg-green-950/30' };
        case 'warning': return { active: 'bg-amber-500  border-amber-500  text-white', base: 'border-amber-300  text-amber-700  dark:text-amber-400  hover:bg-amber-50  dark:hover:bg-amber-950/30' };
        case 'danger':  return { active: 'bg-red-500    border-red-500    text-white', base: 'border-red-300    text-red-700    dark:text-red-400    hover:bg-red-50    dark:hover:bg-red-950/30' };
        case 'info':    return { active: 'bg-blue-500   border-blue-500   text-white', base: 'border-blue-300   text-blue-700   dark:text-blue-400   hover:bg-blue-50   dark:hover:bg-blue-950/30' };
        case 'gray':    return { active: 'bg-zinc-500   border-zinc-500   text-white', base: 'border-zinc-300   text-zinc-700   dark:text-zinc-400   hover:bg-zinc-50   dark:hover:bg-zinc-950/30' };
        default:        return { active: 'bg-[var(--arcane-primary,#18181b)] border-[var(--arcane-primary,#18181b)] text-white', base: 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800' };
    }
}

export function ToggleButtonsFieldComponent({ field, value, error, onChange }: {
    field: ToggleButtonsField; value: string | string[]; error?: string; onChange: (v: string | string[]) => void;
}) {
    const isMulti    = field.multiple === true;
    const isGrouped  = field.grouped  === true;
    const hideLabels = field.hiddenLabels === true;
    const disabledOpts: string[] = field.disabledOptions ?? [];

    const selected: string[] = isMulti
        ? (Array.isArray(value) ? value : value ? [value as string] : [])
        : (value ? [value as string] : []);

    const isSelected = (k: string) => selected.includes(k);

    const toggle = (k: string) => {
        if (disabledOpts.includes(k) || field.disabled) return;
        if (isMulti) {
            const next = isSelected(k) ? selected.filter(v => v !== k) : [...selected, k];
            onChange(next);
        } else {
            onChange(isSelected(k) ? '' : k);
        }
    };

    const layoutCls = field.inline !== false
        ? 'flex flex-wrap gap-2'
        : field.columns
            ? `grid grid-cols-${field.columns} gap-2`
            : 'grid grid-cols-2 sm:grid-cols-3 gap-2';

    const buttonCls = cn(
        'relative inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium border transition-colors',
        isGrouped ? 'first:rounded-l-lg last:rounded-r-lg -ml-px first:ml-0' : 'rounded-lg',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-[var(--arcane-primary,#18181b)]/40',
    );

    return (
        <div>
            <Label text={field.label} required={field.required} />
            <div className={cn(layoutCls, isGrouped && 'flex flex-wrap gap-0')}>
                {Object.entries<string>(field.options ?? {}).map(([k, label]) => {
                    const sel      = isSelected(k);
                    const colorKey = (field.colors ?? {})[k];
                    const colors   = toggleBtnColor(colorKey);
                    const iconName = (field.icons ?? {})[k];
                    const IconComp = iconName ? _resolveIcon(iconName) : null;
                    const tooltip  = (field.tooltips ?? {})[k];
                    const isDisabled = field.disabled || disabledOpts.includes(k);

                    return (
                        <button
                            key={k}
                            type="button"
                            title={tooltip}
                            disabled={isDisabled}
                            onClick={() => toggle(k)}
                            className={cn(buttonCls, sel ? colors.active : cn('bg-white dark:bg-zinc-900', colors.base))}
                        >
                            {IconComp && <IconComp className="w-4 h-4 shrink-0" />}
                            {!hideLabels && <span>{label}</span>}
                        </button>
                    );
                })}
            </div>
            <FieldError error={error} />
            <FieldHint hint={field.hint} error={error} />
        </div>
    );
}

// ─── 5. RichText ──────────────────────────────────────────────────────────────
const RICH_COMMANDS: Record<string, { label: string; icon: React.ReactNode; cmd: string; arg?: string }> = {
    bold:       { label: 'Bold',        icon: <Bold        className="w-3.5 h-3.5" />, cmd: 'bold' },
    italic:     { label: 'Italic',      icon: <Italic      className="w-3.5 h-3.5" />, cmd: 'italic' },
    underline:  { label: 'Underline',   icon: <Underline   className="w-3.5 h-3.5" />, cmd: 'underline' },
    strike:     { label: 'Strikethrough', icon: <Strikethrough className="w-3.5 h-3.5" />, cmd: 'strikeThrough' },
    h2:         { label: 'Heading 2',   icon: <Heading2    className="w-3.5 h-3.5" />, cmd: 'formatBlock', arg: 'h2' },
    h3:         { label: 'Heading 3',   icon: <Heading3    className="w-3.5 h-3.5" />, cmd: 'formatBlock', arg: 'h3' },
    ul:         { label: 'Bullet List', icon: <List        className="w-3.5 h-3.5" />, cmd: 'insertUnorderedList' },
    ol:         { label: 'Numbered List', icon: <ListOrdered className="w-3.5 h-3.5" />, cmd: 'insertOrderedList' },
    blockquote: { label: 'Blockquote',  icon: <Quote       className="w-3.5 h-3.5" />, cmd: 'formatBlock', arg: 'blockquote' },
    link:       { label: 'Link',        icon: <Link        className="w-3.5 h-3.5" />, cmd: 'createLink' },
};

export function RichTextFieldComponent({ field, value, error, onChange }: {
    field: RichTextField; value: string; error?: string; onChange: (v: string) => void;
}) {
    const editorRef = useRef<HTMLDivElement>(null);
    const isInit    = useRef(false);

    // Populate on first render only
    useEffect(() => {
        if (editorRef.current && !isInit.current) {
            editorRef.current.innerHTML = value ?? '';
            isInit.current = true;
        }
    }, []);

    const exec = (cmd: string, arg?: string) => {
        if (cmd === 'createLink') {
            const url = prompt('Enter URL:');
            if (!url) return;
            document.execCommand('createLink', false, url);
        } else {
            document.execCommand(cmd, false, arg);
        }
        editorRef.current?.focus();
        onChange(editorRef.current?.innerHTML ?? '');
    };

    const toolbar: string[] = field.toolbar ?? ['bold', 'italic', 'ul', 'ol'];

    return (
        <div>
            <Label text={field.label} required={field.required} />
            <div className={cn('rounded-lg border overflow-hidden', error ? 'border-red-400' : 'border-zinc-300', 'focus-within:ring-2 focus-within:ring-[var(--arcane-primary,#18181b)]/30 focus-within:border-[var(--arcane-primary,#18181b)]')}>
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-zinc-100 bg-zinc-50">
                    {toolbar.map(key => {
                        const tool = RICH_COMMANDS[key];
                        if (!tool) return null;
                        return (
                            <button key={key} type="button" title={tool.label}
                                onMouseDown={e => { e.preventDefault(); exec(tool.cmd, tool.arg); }}
                                className="p-1.5 rounded hover:bg-zinc-200 text-zinc-600 transition-colors">
                                {tool.icon}
                            </button>
                        );
                    })}
                </div>
                {/* Editable area */}
                <div
                    ref={editorRef}
                    contentEditable={!field.disabled}
                    suppressContentEditableWarning
                    onInput={() => onChange(editorRef.current?.innerHTML ?? '')}
                    style={{ minHeight: field.minHeight ?? 200 }}
                    className="px-3 py-2 text-sm text-zinc-800 outline-none prose prose-sm max-w-none"
                />
            </div>
            <FieldError error={error} />
            <FieldHint hint={field.hint} error={error} />
        </div>
    );
}

// ─── 6. Markdown ──────────────────────────────────────────────────────────────
function renderMarkdown(md: string): string {
    return md
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/^### (.+)$/gm,  '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
        .replace(/^## (.+)$/gm,   '<h2 class="text-lg font-semibold mt-4 mb-1">$1</h2>')
        .replace(/^# (.+)$/gm,    '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g,     '<em>$1</em>')
        .replace(/`(.+?)`/g,       '<code class="bg-zinc-100 px-1 rounded text-xs font-mono">$1</code>')
        .replace(/^> (.+)$/gm,     '<blockquote class="border-l-4 border-zinc-300 pl-3 text-zinc-500 italic">$1</blockquote>')
        .replace(/^- (.+)$/gm,     '<li class="ml-4 list-disc">$1</li>')
        .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-[var(--arcane-primary,#18181b)] underline">$1</a>')
        .replace(/\n\n/g, '</p><p class="mb-2">')
        .replace(/^(?!<[h|b|l|p])(.+)$/gm, '<p class="mb-2">$1</p>');
}

const MD_SHORTCUTS = [
    { label: 'B', title: 'Bold',    wrap: '**' },
    { label: 'I', title: 'Italic',  wrap: '*' },
    { label: 'H2', title: 'H2',     prefix: '## ' },
    { label: 'H3', title: 'H3',     prefix: '### ' },
    { label: '—',  title: 'HR',     insert: '\n---\n' },
];

export function MarkdownFieldComponent({ field, value, error, onChange }: {
    field: MarkdownField; value: string; error?: string; onChange: (v: string) => void;
}) {
    const [preview, setPreview] = useState(field.defaultPreview ?? false);
    const taRef = useRef<HTMLTextAreaElement>(null);

    const insertMarkdown = (shortcut: typeof MD_SHORTCUTS[0]) => {
        const ta  = taRef.current;
        if (!ta) return;
        const s   = ta.selectionStart, e = ta.selectionEnd;
        const sel = value.slice(s, e);
        let insertion = '';
        if (shortcut.wrap) {
            insertion = shortcut.wrap + (sel || 'text') + shortcut.wrap;
        } else if (shortcut.prefix) {
            insertion = shortcut.prefix + (sel || 'Heading');
        } else if (shortcut.insert) {
            insertion = shortcut.insert;
        }
        const next = value.slice(0, s) + insertion + value.slice(e);
        onChange(next);
        requestAnimationFrame(() => {
            ta.focus();
            ta.setSelectionRange(s + insertion.length, s + insertion.length);
        });
    };

    return (
        <div>
            <Label text={field.label} required={field.required} />
            <div className={cn('rounded-lg border overflow-hidden', error ? 'border-red-400' : 'border-zinc-300', 'focus-within:ring-2 focus-within:ring-[var(--arcane-primary,#18181b)]/30 focus-within:border-[var(--arcane-primary,#18181b)]')}>
                {/* Toolbar */}
                <div className="flex items-center gap-1 px-2 py-1.5 border-b border-zinc-100 bg-zinc-50">
                    {!preview && MD_SHORTCUTS.map(s => (
                        <button key={s.label} type="button" title={s.title}
                            onMouseDown={e => { e.preventDefault(); insertMarkdown(s); }}
                            className="px-2 py-1 rounded text-xs font-medium hover:bg-zinc-200 text-zinc-600 transition-colors">
                            {s.label}
                        </button>
                    ))}
                    <div className="ml-auto flex rounded-md overflow-hidden border border-zinc-200">
                        <button type="button" onClick={() => setPreview(false)}
                            className={cn('px-3 py-1 text-xs transition-colors', !preview ? 'bg-white text-zinc-800 font-medium' : 'bg-zinc-50 text-zinc-400 hover:text-zinc-600')}>
                            Write
                        </button>
                        {field.showPreview !== false && (
                            <button type="button" onClick={() => setPreview(true)}
                                className={cn('px-3 py-1 text-xs transition-colors', preview ? 'bg-white text-zinc-800 font-medium' : 'bg-zinc-50 text-zinc-400 hover:text-zinc-600')}>
                                Preview
                            </button>
                        )}
                    </div>
                </div>
                {preview ? (
                    <div
                        className="px-3 py-2 text-sm text-zinc-800 prose prose-sm max-w-none"
                        style={{ minHeight: field.minHeight ?? 200 }}
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(value ?? '') }}
                    />
                ) : (
                    <textarea
                        ref={taRef}
                        value={value ?? ''}
                        onChange={e => onChange(e.target.value)}
                        disabled={field.disabled}
                        placeholder={field.placeholder ?? 'Write markdown…'}
                        style={{ minHeight: field.minHeight ?? 200 }}
                        className="w-full px-3 py-2 text-sm font-mono text-zinc-800 outline-none resize-y bg-white"
                    />
                )}
            </div>
            <FieldError error={error} />
            <FieldHint hint={field.hint} error={error} />
        </div>
    );
}

// ─── 7. KeyValue ─────────────────────────────────────────────────────────────
interface KVPair { key: string; value: string; id: string }

export function KeyValueFieldComponent({ field, value, error, onChange }: {
    field: KeyValueField; value: Record<string, string> | KVPair[]; error?: string;
    onChange: (v: Record<string, string>) => void;
}) {
    const toRows = (v: typeof value): KVPair[] => {
        if (Array.isArray(v)) return v;
        return Object.entries(v ?? {}).map(([k, val]) => ({ key: k, value: val, id: Math.random().toString(36).slice(2) }));
    };
    const [rows, setRows] = useState<KVPair[]>(() => toRows(value));

    const isAddable      = field.addable      !== false;
    const isDeletable    = field.deletable    !== false;
    const keysEditable   = field.editableKeys   !== false;
    const valuesEditable = field.editableValues !== false;

    const emit = (updated: KVPair[]) => {
        setRows(updated);
        const out: Record<string, string> = {};
        updated.forEach(r => { if (r.key) out[r.key] = r.value; });
        onChange(out);
    };

    const add    = () => emit([...rows, { key: '', value: '', id: Math.random().toString(36).slice(2) }]);
    const remove = (id: string) => emit(rows.filter(r => r.id !== id));
    const update = (id: string, patch: Partial<KVPair>) => emit(rows.map(r => r.id === id ? { ...r, ...patch } : r));

    const colCount = isDeletable ? '[1fr_1fr_2rem]' : '[1fr_1fr]';
    const base = 'px-2.5 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-[var(--arcane-primary,#18181b)]/30 focus:border-[var(--arcane-primary,#18181b)] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 disabled:opacity-60 disabled:cursor-not-allowed read-only:bg-zinc-50 dark:read-only:bg-zinc-900/50';

    return (
        <div>
            <Label text={field.label} required={field.required} />
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700">
                {rows.length > 0 && (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        <div className={`grid grid-cols-${colCount} gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide rounded-t-lg`}>
                            <span>{field.keyLabel ?? 'Key'}</span>
                            <span>{field.valueLabel ?? 'Value'}</span>
                            {isDeletable && <span />}
                        </div>
                        {rows.map(row => (
                            <div key={row.id} className={`grid grid-cols-${colCount} gap-2 px-3 py-2 items-center bg-white dark:bg-zinc-900`}>
                                <input
                                    value={row.key}
                                    onChange={e => keysEditable && update(row.id, { key: e.target.value })}
                                    readOnly={!keysEditable}
                                    placeholder={field.keyPlaceholder ?? 'key'}
                                    disabled={field.disabled}
                                    className={base}
                                />
                                <input
                                    value={row.value}
                                    onChange={e => valuesEditable && update(row.id, { value: e.target.value })}
                                    readOnly={!valuesEditable}
                                    placeholder={field.valuePlaceholder ?? 'value'}
                                    disabled={field.disabled}
                                    className={base}
                                />
                                {isDeletable && (
                                    <button type="button" onClick={() => remove(row.id)} disabled={field.disabled}
                                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-40">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {isAddable && (
                    <div className={cn('px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-b-lg', rows.length > 0 && 'border-t border-zinc-100 dark:border-zinc-800')}>
                        <button type="button" onClick={add} disabled={field.disabled}
                            className="inline-flex items-center gap-1.5 text-xs text-[var(--arcane-primary,#18181b)] hover:underline font-medium disabled:opacity-50">
                            <Plus className="w-3.5 h-3.5" /> {field.addActionLabel ?? 'Add row'}
                        </button>
                    </div>
                )}
            </div>
            <FieldError error={error} />
            <FieldHint hint={field.hint} error={error} />
        </div>
    );
}

// ─── 8. Builder ───────────────────────────────────────────────────────────────
export interface BuilderItem { _type: string; _id: string; [key: string]: unknown }

export function BuilderFieldComponent({ field, value, error, onChange }: {
    field: BuilderField; value: BuilderItem[]; error?: string;
    onChange: (v: BuilderItem[]) => void;
}) {
    const [items, setItems] = useState<BuilderItem[]>(() => Array.isArray(value) ? value : []);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [collapsed, setCollapsed]   = useState<Record<string, boolean>>({});

    const emit = (next: BuilderItem[]) => { setItems(next); onChange(next); };

    const addBlock = (blockKey: string) => {
        const block = field.blocks.find((b: BuilderBlockSchema) => b.key === blockKey);
        if (!block) return;
        if (field.maxItems && items.length >= field.maxItems) return;
        const id = Math.random().toString(36).slice(2);
        const defaults: Record<string, unknown> = {};
        (block.fields as ArcaneField[]).forEach(f => { defaults[f.name] = f.default ?? ''; });
        emit([...items, { _type: blockKey, _id: id, ...defaults }]);
        setPickerOpen(false);
    };

    const remove = (id: string) => emit(items.filter(i => i._id !== id));
    const move   = (idx: number, dir: -1 | 1) => {
        const next = [...items];
        [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
        emit(next);
    };
    const updateItem = (id: string, name: string, val: unknown) => {
        emit(items.map(i => i._id === id ? { ...i, [name]: val } : i));
    };
    const toggle = (id: string) => setCollapsed(c => ({ ...c, [id]: !c[id] }));

    return (
        <div>
            <Label text={field.label} required={field.required} />
            <div className="space-y-2">
                {items.map((item, idx) => {
                    const blockDef = field.blocks.find((b: BuilderBlockSchema) => b.key === item._type);
                    if (!blockDef) return null;
                    const isCollapsed = collapsed[item._id];
                    return (
                        <div key={item._id} className="border border-zinc-200 rounded-xl overflow-hidden">
                            {/* Block header */}
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-50 border-b border-zinc-100">
                                <GripVertical className="w-4 h-4 text-zinc-300 shrink-0" />
                                <span className="flex-1 text-sm font-medium text-zinc-700">{blockDef.label}</span>
                                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0}
                                    className="p-1 rounded hover:bg-zinc-200 text-zinc-400 disabled:opacity-30">
                                    <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                                </button>
                                <button type="button" onClick={() => move(idx, 1)} disabled={idx === items.length - 1}
                                    className="p-1 rounded hover:bg-zinc-200 text-zinc-400 disabled:opacity-30">
                                    <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={() => toggle(item._id)}
                                    className="p-1 rounded hover:bg-zinc-200 text-zinc-400">
                                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isCollapsed && '-rotate-90')} />
                                </button>
                                <button type="button" onClick={() => remove(item._id)}
                                    className="p-1 rounded hover:bg-red-50 text-zinc-300 hover:text-red-500">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            {/* Block fields */}
                            {!isCollapsed && (
                                <div className="p-4 grid grid-cols-1 gap-4">
                                    {(blockDef.fields as ArcaneField[]).map(f => (
                                        <FieldRenderer
                                            key={f.name}
                                            field={f}
                                            value={item[f.name] ?? ''}
                                            onChange={v => updateItem(item._id, f.name, v)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Add block button */}
                {(!field.maxItems || items.length < field.maxItems) && (
                    <div className="relative">
                        <button type="button" onClick={() => setPickerOpen(o => !o)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-zinc-200 text-sm text-zinc-500 hover:border-[var(--arcane-primary,#18181b)] hover:text-[var(--arcane-primary,#18181b)] transition-colors">
                            <Plus className="w-4 h-4" /> {field.addLabel ?? 'Add Block'}
                        </button>
                        {pickerOpen && (
                            <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
                                {field.blocks.map((b: BuilderBlockSchema) => (
                                    <button key={b.key} type="button" onClick={() => addBlock(b.key)}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors">
                                        <span className="font-medium text-zinc-800">{b.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <FieldError error={error} />
            <FieldHint hint={field.hint} error={error} />
        </div>
    );
}

// ─── 9. MorphTo ───────────────────────────────────────────────────────────────
export interface MorphValue { type: string; id: string | number }

export function MorphToFieldComponent({ field, value, error, onChange, resourceSlug }: {
    field: MorphToField; value: MorphValue | null; error?: string;
    onChange: (v: MorphValue | null) => void;
    resourceSlug?: string;
}) {
    const current: MorphValue = value && typeof value === 'object' ? value : { type: '', id: '' };
    const [options, setOptions] = useState<{ id: string | number; label: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ]             = useState('');
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    const slug = resourceSlug ?? (window.location.pathname.split('/')[2] ?? '');

    const fetchOptions = useCallback((type: string, query: string) => {
        if (!type) { setOptions([]); return; }
        setLoading(true);
        fetch(`/admin/${slug}/morph/${field.name}/options?type=${encodeURIComponent(type)}&q=${encodeURIComponent(query)}`, {
            headers: { Accept: 'application/json' },
        })
            .then(r => r.json())
            .then(setOptions)
            .finally(() => setLoading(false));
    }, [slug, field.name]);

    useEffect(() => {
        if (current.type) fetchOptions(current.type, q);
    }, [current.type]);

    const handleQuery = (query: string) => {
        setQ(query);
        if (debounce.current) clearTimeout(debounce.current);
        debounce.current = setTimeout(() => fetchOptions(current.type, query), 280);
    };

    return (
        <div>
            <Label text={field.label} required={field.required} />
            <div className="space-y-2">
                {/* Type selector */}
                <select
                    value={current.type}
                    onChange={e => { onChange({ type: e.target.value, id: '' }); setQ(''); setOptions([]); if (e.target.value) fetchOptions(e.target.value, ''); }}
                    disabled={field.disabled}
                    className={inputCls(error)}
                >
                    <option value="">— Select type —</option>
                    {Object.entries<string>(field.types).map(([cls, label]) => (
                        <option key={cls} value={cls}>{label}</option>
                    ))}
                </select>

                {/* Record selector */}
                {current.type && (
                    <div className="space-y-1.5">
                        <input
                            type="text"
                            value={q}
                            onChange={e => handleQuery(e.target.value)}
                            placeholder="Search records…"
                            disabled={field.disabled}
                            className={inputCls(undefined, '')}
                        />
                        {loading && <Loader2 className="w-4 h-4 animate-spin text-zinc-400 mx-auto" />}
                        {!loading && options.length > 0 && (
                            <div className="border border-zinc-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                                {options.map(opt => (
                                    <button key={opt.id} type="button"
                                        onClick={() => { onChange({ type: current.type, id: opt.id }); setQ(String(opt.label)); setOptions([]); }}
                                        className={cn('w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 transition-colors',
                                            String(current.id) === String(opt.id) && 'bg-[var(--arcane-primary,#18181b)]/5 font-medium')}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        {current.id && !options.length && !loading && (
                            <p className="text-xs text-zinc-500">Selected ID: {current.id}</p>
                        )}
                    </div>
                )}
            </div>
            <FieldError error={error} />
            <FieldHint hint={field.hint} error={error} />
        </div>
    );
}
