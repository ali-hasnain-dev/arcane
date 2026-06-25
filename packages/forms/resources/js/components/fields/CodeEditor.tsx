import React, { useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '../../lib/utils';
import FieldWrapper from './FieldWrapper';
import type { CodeEditorField, ValidationStatus } from '../../types';

// ─── Language colours / labels ────────────────────────────────────────────────

const LANG_META: Record<string, { label: string; cls: string }> = {
    php:        { label: 'PHP',        cls: 'text-indigo-500  bg-indigo-50  dark:bg-indigo-950/40' },
    javascript: { label: 'JS',         cls: 'text-yellow-600  bg-yellow-50  dark:bg-yellow-950/40' },
    typescript: { label: 'TS',         cls: 'text-blue-600    bg-blue-50    dark:bg-blue-950/40' },
    html:       { label: 'HTML',       cls: 'text-orange-600  bg-orange-50  dark:bg-orange-950/40' },
    css:        { label: 'CSS',        cls: 'text-sky-600     bg-sky-50     dark:bg-sky-950/40' },
    json:       { label: 'JSON',       cls: 'text-green-600   bg-green-50   dark:bg-green-950/40' },
    sql:        { label: 'SQL',        cls: 'text-zinc-700    bg-zinc-100   dark:bg-zinc-800' },
    python:     { label: 'Python',     cls: 'text-blue-500    bg-blue-50    dark:bg-blue-950/40' },
    go:         { label: 'Go',         cls: 'text-cyan-600    bg-cyan-50    dark:bg-cyan-950/40' },
    yaml:       { label: 'YAML',       cls: 'text-amber-600   bg-amber-50   dark:bg-amber-950/40' },
    xml:        { label: 'XML',        cls: 'text-teal-600    bg-teal-50    dark:bg-teal-950/40' },
    markdown:   { label: 'Markdown',   cls: 'text-zinc-600    bg-zinc-100   dark:bg-zinc-800' },
    bash:       { label: 'Bash',       cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
    plaintext:  { label: 'Text',       cls: 'text-zinc-500    bg-zinc-100   dark:bg-zinc-800' },
};

function getLangMeta(lang: string): { label: string; cls: string } {
    return LANG_META[lang?.toLowerCase()] ?? { label: lang?.toUpperCase() ?? 'TEXT', cls: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800' };
}

// ─── Line Numbers ─────────────────────────────────────────────────────────────

function LineNumbers({ count, height }: { count: number; height: number }) {
    return (
        <div className="select-none text-right pr-3 pt-3 text-xs font-mono text-zinc-400 dark:text-zinc-600 leading-6 min-w-[2.5rem] border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 shrink-0 overflow-hidden"
            style={{ minHeight: height }}>
            {Array.from({ length: count }, (_, i) => (
                <div key={i}>{i + 1}</div>
            ))}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CodeEditorProps {
    field: CodeEditorField;
    value: string;
    error?: string;
    status?: ValidationStatus;
    onChange: (val: string) => void;
    onBlur?: () => void;
}

export default function CodeEditorField({ field, value = '', error, status = 'idle', onChange, onBlur }: CodeEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const minH        = field.minHeight ?? 200;
    const maxH        = field.maxHeight;
    const showLines   = field.lineNumbers !== false;
    const doWrap      = field.wrap === true;
    const lang        = (field.language ?? 'plaintext').toLowerCase();
    const langMeta    = getLangMeta(lang);
    const lineCount   = (value ?? '').split('\n').length;

    // Tab key inserts 2 spaces instead of moving focus
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== 'Tab') return;
        e.preventDefault();
        const el    = e.currentTarget;
        const start = el.selectionStart;
        const end   = el.selectionEnd;
        const spaces = '  ';
        const next  = value.slice(0, start) + spaces + value.slice(end);
        onChange(next);
        requestAnimationFrame(() => {
            el.selectionStart = el.selectionEnd = start + spaces.length;
        });
    };

    return (
        <FieldWrapper label={field.label} required={field.required} hint={field.hint} error={error} status={status}>
            <div className={cn(
                'rounded-lg border overflow-hidden font-mono text-sm',
                error
                    ? 'border-red-400'
                    : 'border-zinc-300 dark:border-zinc-700 focus-within:border-[var(--larafusion-primary,#18181b)] focus-within:ring-2 focus-within:ring-[var(--larafusion-primary,#18181b)]/20',
            )}>
                {/* ── Toolbar ──────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
                    <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded', langMeta.cls)}>
                        {langMeta.label}
                    </span>
                    <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400 opacity-60" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-60" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-400 opacity-60" />
                    </div>
                </div>

                {/* ── Editor body ───────────────────────────────────────── */}
                <div className="flex overflow-auto bg-white dark:bg-zinc-950"
                    style={{ minHeight: minH, maxHeight: maxH ?? undefined }}>
                    {showLines && <LineNumbers count={lineCount} height={minH} />}
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={onBlur}
                        disabled={field.disabled}
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        placeholder={field.placeholder ?? `// ${lang} code here…`}
                        style={{ minHeight: minH, maxHeight: maxH ?? undefined, resize: 'none' }}
                        className={cn(
                            'flex-1 p-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 outline-none resize-none bg-transparent',
                            'placeholder:text-zinc-400 dark:placeholder:text-zinc-600',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            doWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto',
                            'leading-6',
                        )}
                    />
                </div>
            </div>
        </FieldWrapper>
    );
}
