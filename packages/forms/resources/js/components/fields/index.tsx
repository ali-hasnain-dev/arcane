import React, { useState, useId, useRef, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Copy, Check, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { resolveIcon } from '../../lib/icons';

// ─── Custom field registry ────────────────────────────────────────────────────
type CustomFieldComponent = React.ComponentType<{
    field: LarafusionField;
    value: unknown;
    error?: string;
    onChange: (v: unknown) => void;
}>;
const _customFieldRegistry = new Map<string, CustomFieldComponent>();

/**
 * Register a React component for a custom field type.
 *
 * Call once at app boot (e.g. in app.tsx) before any forms are rendered:
 *
 *   import { registerField } from '@larafusion/forms';
 *   import StarRating from './components/StarRating';
 *   registerField('star_rating', StarRating);
 *
 * The component receives: { field, value, error, onChange }
 * where field.componentData contains whatever was set via ->componentData([]) in PHP.
 */
export function registerField(type: string, component: CustomFieldComponent): void {
    _customFieldRegistry.set(type, component);
}

export function getRegisteredField(type: string): CustomFieldComponent | undefined {
    return _customFieldRegistry.get(type);
}
import {
    LarafusionField, TextField, EmailField, PasswordField,
    TextareaField, SelectField, NumberField, CheckboxField, ToggleField, DateField,
    HiddenField, RadioField, CheckboxListField, SliderField,
    ToggleButtonsField, CodeEditorField,
    RichTextField, MarkdownField, KeyValueField, BuilderField, MorphToField,
} from '../../types';
import SelectFieldComponent from './SelectField';
import CodeEditorFieldComponent from './CodeEditor';
import {
    HiddenFieldComponent,
    RadioFieldComponent,
    CheckboxListFieldComponent,
    SliderFieldComponent,
    ToggleButtonsFieldComponent,
    RichTextFieldComponent,
    MarkdownFieldComponent,
    KeyValueFieldComponent,
    BuilderFieldComponent,
    MorphToFieldComponent,
    type BuilderItem,
    type MorphValue,
} from './extended';

// ─── Shared ───────────────────────────────────────────────────────────────────
function Label({ text, required }: { text: string; required?: boolean }) {
    return (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            {text}
            {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
    );
}

// Always rendered to prevent layout shift when error/hint appears or disappears
function FieldMessage({ error, hint }: { error?: string; hint?: string | null }) {
    return (
        <div className="mt-1 min-h-[1rem]">
            {error ? (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
            ) : hint ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
            ) : null}
        </div>
    );
}

function inputCls(error?: string, extra?: string) {
    return cn(
        'w-full px-3 py-2 text-sm rounded-lg border outline-none transition-colors',
        'text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
        error
            ? 'border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-800 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900 focus:border-red-400'
            : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)]/20 focus:border-[var(--larafusion-primary,#18181b)]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-zinc-50 dark:disabled:bg-zinc-900',
        'read-only:bg-zinc-50 dark:read-only:bg-zinc-900/50 read-only:cursor-default',
        extra,
    );
}

// ─── Affix helpers ────────────────────────────────────────────────────────────

interface AffixProps {
    prefixText?:      string | null;
    suffixText?:      string | null;
    prefixIcon?:      string | null;
    suffixIcon?:      string | null;
    prefixIconColor?: string | null;
    suffixIconColor?: string | null;
    iconLayout?:      'separated' | 'inline';
}

function hasAffixes(field: AffixProps): boolean {
    return !!(field.prefixText || field.suffixText || field.prefixIcon || field.suffixIcon);
}

function iconColorCls(color?: string | null): string {
    switch (color) {
        case 'primary':  return 'text-[var(--larafusion-primary,#18181b)]';
        case 'success':  return 'text-green-500';
        case 'warning':  return 'text-amber-500';
        case 'danger':   return 'text-red-500';
        case 'info':     return 'text-blue-500';
        case 'gray':     return 'text-zinc-400 dark:text-zinc-500';
        default:         return color ? color : 'text-zinc-400 dark:text-zinc-500';
    }
}

function AffixedInput({ field, children, copyable, copyMessage }: {
    field: AffixProps;
    children: React.ReactNode;
    copyable?: boolean;
    copyMessage?: string | null;
}) {
    const [copied, setCopied] = useState(false);

    const hasCopy = copyable;
    const hasLeft  = !!(field.prefixText || field.prefixIcon);
    const hasRight = !!(field.suffixText || field.suffixIcon) || hasCopy;

    if (!hasLeft && !hasRight) return <>{children}</>;

    const PrefixIconComp = field.prefixIcon ? resolveIcon(field.prefixIcon) : null;
    const SuffixIconComp = field.suffixIcon ? resolveIcon(field.suffixIcon) : null;

    const handleCopy = () => {
        const input = document.activeElement as HTMLInputElement | null;
        const val = input?.value ?? '';
        navigator.clipboard.writeText(val).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // ── Inline mode: icons float inside the input, no separate bordered cell ──
    // Only applies when there are icon affixes and no text affixes (text needs its own cell).
    if (field.iconLayout === 'inline' && !field.prefixText && !field.suffixText) {
        return (
            <div className={cn(
                'relative',
                // Use descendant selector so nested inputs (e.g. password wrapper) are padded too
                PrefixIconComp ? '[&_input]:pl-9' : '',
                (SuffixIconComp && !hasCopy) ? '[&_input]:pr-9' : '',
                hasCopy ? '[&_input]:pr-9' : '',
            )}>
                {PrefixIconComp && (
                    <span className="pointer-events-none select-none absolute left-3 top-1/2 -translate-y-1/2 z-10">
                        <PrefixIconComp className={cn('w-4 h-4', iconColorCls(field.prefixIconColor))} />
                    </span>
                )}
                {children}
                {SuffixIconComp && !hasCopy && (
                    <span className="pointer-events-none select-none absolute right-3 top-1/2 -translate-y-1/2 z-10">
                        <SuffixIconComp className={cn('w-4 h-4', iconColorCls(field.suffixIconColor))} />
                    </span>
                )}
                {hasCopy && (
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        title={copyMessage ?? 'Copy to clipboard'}
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                )}
            </div>
        );
    }

    // ── Separated mode (default): icon in its own bordered cell ──
    return (
        <div className="flex rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden focus-within:ring-2 focus-within:ring-[var(--larafusion-primary,#18181b)]/20 focus-within:border-[var(--larafusion-primary,#18181b)]">
            {/* Left affix */}
            {hasLeft && (
                <span className="flex items-center gap-1.5 px-3 bg-zinc-50 dark:bg-zinc-800/70 border-r border-zinc-300 dark:border-zinc-700 text-sm text-zinc-500 dark:text-zinc-400 shrink-0">
                    {PrefixIconComp && (
                        <PrefixIconComp className={cn('w-4 h-4', iconColorCls(field.prefixIconColor))} />
                    )}
                    {field.prefixText}
                </span>
            )}

            {/* Input slot — strip the outer border so the wrapper border shows */}
            <div className="flex-1 min-w-0 [&>input]:border-0 [&>input]:rounded-none [&>input]:ring-0 [&>input]:focus:ring-0 [&>input]:w-full">
                {children}
            </div>

            {/* Right affix / copy button */}
            {hasRight && (
                <span className="flex items-center gap-1.5 px-3 bg-zinc-50 dark:bg-zinc-800/70 border-l border-zinc-300 dark:border-zinc-700 text-sm text-zinc-500 dark:text-zinc-400 shrink-0">
                    {SuffixIconComp && (
                        <SuffixIconComp className={cn('w-4 h-4', iconColorCls(field.suffixIconColor))} />
                    )}
                    {field.suffixText}
                    {hasCopy && (
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="ml-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            title={copyMessage ?? 'Copy to clipboard'}
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                    )}
                </span>
            )}
        </div>
    );
}

// ─── Text ─────────────────────────────────────────────────────────────────────
export function TextFieldComponent({ field, value, error, onChange }: {
    field: TextField; value: string; error?: string; onChange: (v: string) => void;
}) {
    const [copied, setCopied] = useState(false);
    const listId = useId();

    const handleCopy = () => {
        navigator.clipboard.writeText(value ?? '').then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const inputEl = (
        <>
            <input
                type={field.inputType ?? 'text'}
                value={value ?? ''}
                onChange={e => {
                    const v = field.trim ? e.target.value.trim() : e.target.value;
                    onChange(v);
                }}
                onBlur={field.trim ? (e) => onChange(e.target.value.trim()) : undefined}
                placeholder={field.placeholder ?? ''}
                disabled={field.disabled}
                readOnly={field.readOnly}
                maxLength={field.maxLength ?? undefined}
                autoComplete={field.autocomplete ?? undefined}
                inputMode={field.inputMode as React.HTMLAttributes<HTMLInputElement>['inputMode'] ?? undefined}
                list={field.datalist && field.datalist.length > 0 ? listId : undefined}
                className={inputCls(error, field.copyable && !hasAffixes(field) ? 'pr-9' : '')}
            />
            {field.datalist && field.datalist.length > 0 && (
                <datalist id={listId}>
                    {field.datalist.map(opt => <option key={opt} value={opt} />)}
                </datalist>
            )}
        </>
    );

    return (
        <div>
            <Label text={field.label} required={field.required} />
            {hasAffixes(field) ? (
                <AffixedInput field={field} copyable={field.copyable} copyMessage={field.copyMessage}>
                    {inputEl}
                </AffixedInput>
            ) : (
                <div className="relative">
                    {inputEl}
                    {field.copyable && (
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            title={field.copyMessage ?? 'Copy to clipboard'}
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                    )}
                </div>
            )}
            <FieldMessage error={error} hint={field.hint} />
        </div>
    );
}

// ─── Email ────────────────────────────────────────────────────────────────────
export function EmailFieldComponent({ field, value, error, onChange }: {
    field: EmailField; value: string; error?: string; onChange: (v: string) => void;
}) {
    const inputEl = (
        <input
            type="email"
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder ?? 'email@example.com'}
            disabled={field.disabled}
            className={inputCls(error)}
        />
    );

    return (
        <div>
            <Label text={field.label} required={field.required} />
            {hasAffixes(field) ? (
                <AffixedInput field={field}>{inputEl}</AffixedInput>
            ) : inputEl}
            <FieldMessage error={error} hint={field.hint} />
        </div>
    );
}

// ─── Password ─────────────────────────────────────────────────────────────────
export function PasswordFieldComponent({ field, value, error, onChange }: {
    field: PasswordField; value: string; error?: string; onChange: (v: string) => void;
}) {
    const [show, setShow] = useState(false);

    const inputEl = (
        <div className="relative">
            <input
                type={show ? 'text' : 'password'}
                value={value ?? ''}
                onChange={e => onChange(e.target.value)}
                placeholder={field.placeholder ?? '••••••••'}
                disabled={field.disabled}
                className={inputCls(error, field.showToggle ? 'pr-10' : '')}
            />
            {field.showToggle && (
                <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            )}
        </div>
    );

    return (
        <div>
            <Label text={field.label} required={field.required} />
            {hasAffixes(field) ? (
                <AffixedInput field={field}>{inputEl}</AffixedInput>
            ) : inputEl}
            <FieldMessage error={error} hint={field.hint} />
        </div>
    );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function TextareaFieldComponent({ field, value, error, onChange }: {
    field: TextareaField; value: string; error?: string; onChange: (v: string) => void;
}) {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(field.trim ? e.target.value : e.target.value);
    };
    const handleBlur = field.trim
        ? (e: React.FocusEvent<HTMLTextAreaElement>) => onChange(e.target.value.trim())
        : undefined;

    const current = (value ?? '').length;
    const showCounter = field.maxLength || field.minLength;

    return (
        <div>
            <Label text={field.label} required={field.required} />
            <textarea
                value={value ?? ''}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={field.placeholder ?? ''}
                disabled={field.disabled}
                readOnly={field.readOnly}
                rows={field.rows}
                cols={field.cols ?? undefined}
                maxLength={field.maxLength ?? undefined}
                className={cn(
                    inputCls(error, field.autosize ? 'resize-none overflow-hidden' : 'resize-y'),
                    'read-only:bg-zinc-50 dark:read-only:bg-zinc-900/50 read-only:cursor-default',
                )}
                style={field.autosize ? { height: 'auto' } : undefined}
                onInput={field.autosize ? (e) => {
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = `${el.scrollHeight}px`;
                } : undefined}
            />
            {showCounter && (
                <div className="flex justify-between mt-0.5">
                    {field.minLength && current < field.minLength ? (
                        <p className="text-xs text-amber-500">{field.minLength - current} more character{field.minLength - current !== 1 ? 's' : ''} needed</p>
                    ) : <span />}
                    {field.maxLength && (
                        <p className={cn('text-xs', current > field.maxLength * 0.9 ? 'text-amber-500' : 'text-zinc-400 dark:text-zinc-500')}>
                            {current} / {field.maxLength}
                        </p>
                    )}
                </div>
            )}
            <FieldMessage error={error} hint={field.hint} />
        </div>
    );
}

// SelectFieldComponent is imported from ./SelectField and re-exported for external use
export { default as SelectFieldComponent } from './SelectField';

// ─── Number ───────────────────────────────────────────────────────────────────
export function NumberFieldComponent({ field, value, error, onChange }: {
    field: NumberField; value: number | string; error?: string; onChange: (v: string) => void;
}) {
    return (
        <div>
            <Label text={field.label} required={field.required} />
            <input
                type="number"
                value={value ?? ''}
                onChange={e => onChange(e.target.value)}
                placeholder={field.placeholder ?? ''}
                disabled={field.disabled}
                min={field.min ?? undefined}
                max={field.max ?? undefined}
                step={field.step}
                className={inputCls(error)}
            />
            <FieldMessage error={error} hint={field.hint} />
        </div>
    );
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────
export function CheckboxFieldComponent({ field, value, error, onChange }: {
    field: CheckboxField; value: boolean; error?: string; onChange: (v: boolean) => void;
}) {
    const checked = Boolean(value);

    const checkEl = (
        <label className={cn(
            'flex items-center gap-2.5 cursor-pointer group',
            field.disabled && 'opacity-50 cursor-not-allowed',
        )}>
            <span className={cn(
                'w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors',
                checked
                    ? 'bg-[var(--larafusion-primary,#18181b)] border-[var(--larafusion-primary,#18181b)]'
                    : 'border-zinc-400 dark:border-zinc-600 bg-white dark:bg-zinc-800 group-hover:border-[var(--larafusion-primary,#18181b)]',
                error && !checked && 'border-red-400',
            )}>
                {checked && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </span>
            <input
                type="checkbox"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                disabled={field.disabled}
                className="sr-only"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">{field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}</span>
        </label>
    );

    if (field.inline) {
        return (
            <div>
                {checkEl}
                <FieldMessage error={error} hint={field.hint} />
            </div>
        );
    }

    return (
        <div>
            <Label text={field.label} required={field.required} />
            {checkEl}
            <FieldMessage error={error} hint={field.hint} />
        </div>
    );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function toggleTrackColor(on: boolean, onColor?: string | null, offColor?: string | null): string {
    const color = on ? onColor : offColor;
    switch (color) {
        case 'success': return on ? 'bg-green-500'  : 'bg-green-400';
        case 'warning': return on ? 'bg-amber-500'  : 'bg-amber-400';
        case 'danger':  return on ? 'bg-red-500'    : 'bg-red-400';
        case 'info':    return on ? 'bg-blue-500'   : 'bg-blue-400';
        case 'gray':    return on ? 'bg-zinc-500'   : 'bg-zinc-400';
        default:        return on ? 'bg-[var(--larafusion-primary,#18181b)]' : 'bg-zinc-300 dark:bg-zinc-600';
    }
}

export function ToggleFieldComponent({ field, value, error, onChange }: {
    field: ToggleField; value: boolean; error?: string; onChange: (v: boolean) => void;
}) {
    const on = Boolean(value);
    const OnIconComp  = field.onIcon  ? resolveIcon(field.onIcon)  : null;
    const OffIconComp = field.offIcon ? resolveIcon(field.offIcon) : null;
    const CurrentIcon = on ? OnIconComp : OffIconComp;

    const track = (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            disabled={field.disabled}
            onClick={() => onChange(!on)}
            className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-[var(--larafusion-primary,#18181b)] focus:ring-offset-1',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                toggleTrackColor(on, field.onColor, field.offColor),
            )}
        >
            <span className={cn(
                'inline-flex items-center justify-center h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                on ? 'translate-x-6' : 'translate-x-1',
            )}>
                {CurrentIcon && <CurrentIcon className="w-2.5 h-2.5 text-zinc-500" />}
            </span>
        </button>
    );

    if (field.inline) {
        return (
            <div>
                <div className="flex items-center gap-3">
                    {track}
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">{on ? field.onLabel : field.offLabel}</span>
                </div>
                <FieldMessage error={error} hint={field.hint} />
            </div>
        );
    }

    return (
        <div>
            <Label text={field.label} required={field.required} />
            <div className="flex items-center gap-3 mt-1">
                {track}
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{on ? field.onLabel : field.offLabel}</span>
            </div>
            <FieldMessage error={error} hint={field.hint} />
        </div>
    );
}

// ─── Date ─────────────────────────────────────────────────────────────────────
// ─── Custom calendar date picker (used when field.native === false) ───────────

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function parseDate(v: string): Date | null {
    if (!v) return null;
    const d = new Date(v + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
}
function toYMD(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatDisplay(v: string): string {
    const d = parseDate(v);
    if (!d) return '';
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function CustomDatePicker({ value, onChange, minDate, maxDate, disabled, readOnly, error }: {
    value: string; onChange: (v: string) => void;
    minDate?: string; maxDate?: string; disabled?: boolean; readOnly?: boolean; error?: string;
}) {
    const [open, setOpen] = useState(false);
    const [openUp, setOpenUp] = useState(false);
    const today = new Date();
    const selected = parseDate(value);
    const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
    const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleToggle = () => {
        if (disabled || readOnly) return;
        if (!open) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                // Calendar panel needs ~300px height; open upward if not enough space below
                setOpenUp(window.innerHeight - rect.bottom < 310);
            }
        }
        setOpen(o => !o);
    };

    const minD = minDate ? parseDate(minDate) : null;
    const maxD = maxDate ? parseDate(maxDate) : null;

    const isDayDisabled = useCallback((d: Date): boolean => {
        if (minD && d < minD) return true;
        if (maxD && d > maxD) return true;
        return false;
    }, [minD, maxD]);

    const selectDay = (d: Date) => {
        onChange(toYMD(d));
        setOpen(false);
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    // Build grid: days of current month, padded with prev/next month days
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: { date: Date; current: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) {
        cells.push({ date: new Date(viewYear, viewMonth, -i), current: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ date: new Date(viewYear, viewMonth, d), current: true });
    }
    while (cells.length % 7 !== 0) {
        cells.push({ date: new Date(viewYear, viewMonth + 1, cells.length - daysInMonth - firstDay + 1), current: false });
    }

    const todayStr = toYMD(today);
    const selectedStr = value;

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                disabled={disabled || readOnly}
                onClick={handleToggle}
                className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors text-left',
                    'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100',
                    error
                        ? 'border-red-400 focus:ring-red-400'
                        : 'border-zinc-300 dark:border-zinc-700 focus:ring-[var(--larafusion-primary,#18181b)] focus:border-[var(--larafusion-primary,#18181b)]',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    (disabled || readOnly) && 'opacity-60 cursor-default bg-zinc-50 dark:bg-zinc-900/50',
                )}
            >
                <span className={cn('flex-1', !value && 'text-zinc-400 dark:text-zinc-500')}>
                    {value ? formatDisplay(value) : 'Select a date…'}
                </span>
                <Calendar className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500 ml-2" />
            </button>

            {open && (
                <div className={cn(
                    'absolute z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl p-3 w-64',
                    openUp ? 'bottom-full mb-1.5' : 'mt-1.5',
                )}>
                    {/* Month nav */}
                    <div className="flex items-center justify-between mb-3">
                        <button type="button" onClick={prevMonth}
                            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                            {MONTHS[viewMonth]} {viewYear}
                        </span>
                        <button type="button" onClick={nextMonth}
                            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 mb-1">
                        {WEEKDAYS.map(d => (
                            <div key={d} className="text-center text-[10px] font-medium text-zinc-400 dark:text-zinc-500 py-1">{d}</div>
                        ))}
                    </div>
                    {/* Day grid */}
                    <div className="grid grid-cols-7 gap-y-0.5">
                        {cells.map(({ date, current }, i) => {
                            const ymd = toYMD(date);
                            const isSelected = ymd === selectedStr;
                            const isToday = ymd === todayStr;
                            const isDisabled = isDayDisabled(date);
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => !isDisabled && selectDay(date)}
                                    className={cn(
                                        'text-center text-xs py-1.5 rounded-lg transition-colors font-medium',
                                        !current && 'text-zinc-300 dark:text-zinc-600',
                                        current && !isSelected && !isToday && !isDisabled && 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700',
                                        isToday && !isSelected && 'bg-zinc-100 dark:bg-zinc-700 text-[var(--larafusion-primary,#18181b)] dark:text-white font-bold',
                                        isSelected && 'bg-[var(--larafusion-primary,#18181b)] text-white rounded-lg',
                                        isDisabled && 'opacity-40 cursor-not-allowed',
                                    )}
                                >
                                    {date.getDate()}
                                </button>
                            );
                        })}
                    </div>
                    {/* Clear */}
                    {value && (
                        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            <button type="button" onClick={() => { onChange(''); setOpen(false); }}
                                className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors w-full text-center">
                                Clear
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function DateFieldComponent({ field, value, error, onChange }: {
    field: DateField; value: string; error?: string; onChange: (v: string) => void;
}) {
    const inputType = field.time ? 'datetime-local' : 'date';

    // Build the min/max attributes respecting the input type
    const minAttr = field.minDate
        ? (field.time && !field.minDate.includes('T') ? `${field.minDate}T00:00` : field.minDate)
        : undefined;
    const maxAttr = field.maxDate
        ? (field.time && !field.maxDate.includes('T') ? `${field.maxDate}T23:59` : field.maxDate)
        : undefined;

    // Normalize stored value for datetime-local input (needs 'YYYY-MM-DDTHH:MM')
    const displayValue = (() => {
        if (!value) return '';
        if (field.time && value.includes(' ') && !value.includes('T')) {
            return value.replace(' ', 'T').slice(0, field.seconds ? 19 : 16);
        }
        return value;
    })();

    const inputEl = (
        <input
            type={inputType}
            value={displayValue}
            onChange={e => {
                // Normalize back to storage format (space separator for datetime)
                const v = field.time ? e.target.value.replace('T', ' ') : e.target.value;
                onChange(v);
            }}
            disabled={field.disabled}
            readOnly={field.readOnly}
            min={minAttr}
            max={maxAttr}
            className={inputCls(error, 'read-only:bg-zinc-50 dark:read-only:bg-zinc-900/50 read-only:cursor-default')}
        />
    );

    // Custom JS picker when native === false (date-only, not datetime)
    if (field.native === false && !field.time) {
        return (
            <div>
                <Label text={field.label} required={field.required} />
                <CustomDatePicker
                    value={value}
                    onChange={onChange}
                    minDate={field.minDate ?? undefined}
                    maxDate={field.maxDate ?? undefined}
                    disabled={field.disabled}
                    readOnly={field.readOnly}
                    error={error}
                />
                <FieldMessage error={error} hint={field.hint} />
            </div>
        );
    }

    return (
        <div>
            <Label text={field.label} required={field.required} />
            {hasAffixes(field) ? (
                <AffixedInput field={field}>{inputEl}</AffixedInput>
            ) : inputEl}
            <FieldMessage error={error} hint={field.hint} />
        </div>
    );
}

// ─── Field Renderer ───────────────────────────────────────────────────────────
export function FieldRenderer({ field, value, error, onChange }: {
    field: LarafusionField; value: unknown; error?: string; onChange: (v: unknown) => void;
}) {
    if (field.hidden) return null;
    const p = { error, onChange: onChange as (v: unknown) => void };

    switch (field.type) {
        case 'text':         return <TextFieldComponent         field={field as TextField}         value={value as string}  {...p} />;
        case 'email':        return <EmailFieldComponent        field={field as EmailField}        value={value as string}  {...p} />;
        case 'password':     return <PasswordFieldComponent     field={field as PasswordField}     value={value as string}  {...p} />;
        case 'textarea':     return <TextareaFieldComponent     field={field as TextareaField}     value={value as string}  {...p} />;
        case 'select':       return <SelectFieldComponent field={field as SelectField} value={value as string | string[]} error={error} onChange={onChange as (v: string | string[]) => void} />;
        case 'number':       return <NumberFieldComponent       field={field as NumberField}       value={value as number}  {...p} />;
        case 'checkbox':     return <CheckboxFieldComponent     field={field as CheckboxField}     value={value as boolean} error={error} onChange={onChange as (v: boolean) => void} />;
        case 'toggle':       return <ToggleFieldComponent       field={field as ToggleField}       value={value as boolean} error={error} onChange={onChange as (v: boolean) => void} />;
        case 'date':         return <DateFieldComponent         field={field as DateField}         value={value as string}  {...p} />;
        case 'hidden':       return <HiddenFieldComponent       field={field as HiddenField}       value={value}            onChange={onChange} />;
        case 'radio':        return <RadioFieldComponent        field={field as RadioField}        value={value as string}  {...p} />;
        case 'checkbox_list': return <CheckboxListFieldComponent field={field as CheckboxListField} value={value as string[]} error={error} onChange={onChange as (v: string[]) => void} />;
        case 'slider':         return <SliderFieldComponent         field={field as SliderField}         value={value as number}  {...p} />;
        case 'toggle_buttons': return <ToggleButtonsFieldComponent  field={field as ToggleButtonsField}  value={value as string | string[]} error={error} onChange={onChange as (v: string | string[]) => void} />;
        case 'code_editor':    return <CodeEditorFieldComponent     field={field as CodeEditorField}     value={value as string}  {...p} />;
        case 'rich_text':      return <RichTextFieldComponent       field={field as RichTextField}       value={value as string}  {...p} />;
        case 'markdown':       return <MarkdownFieldComponent       field={field as MarkdownField}       value={value as string}  {...p} />;
        case 'key_value':      return <KeyValueFieldComponent       field={field as KeyValueField}       value={value as Record<string, string>} error={error} onChange={onChange as (v: Record<string, string>) => void} />;
        case 'builder':        return <BuilderFieldComponent        field={field as BuilderField}        value={value as BuilderItem[]}       error={error} onChange={onChange as (v: BuilderItem[]) => void} />;
        case 'morph_to':       return <MorphToFieldComponent        field={field as MorphToField}        value={value as MorphValue | null}   error={error} onChange={onChange as (v: MorphValue | null) => void} />;
        default: {
            // Fall through to the custom field registry
            const CustomComponent = getRegisteredField(field.type);
            if (CustomComponent) return <CustomComponent field={field} value={value} error={error} onChange={onChange} />;
            if (import.meta.env.DEV) {
                console.warn(`[Larafusion] Unknown field type "${field.type}". Register it with registerField('${field.type}', YourComponent).`);
            }
            return null;
        }
    }
}
