import React, { useState, useRef, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { TagsField } from '../../types';
import { ValidationStatus } from '../../types';
import FieldWrapper, { inputClasses } from './FieldWrapper';
import { cn } from '../../lib/utils';

interface TagsInputProps {
    field: TagsField;
    value: string[];
    error?: string;
    status?: ValidationStatus;
    onChange: (val: string[]) => void;
    onBlur?: () => void;
}

// Map semantic color name to Tailwind classes for tag chips
function tagColorCls(color?: string | null): string {
    switch (color) {
        case 'success': return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
        case 'warning': return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
        case 'danger':  return 'bg-red-100   dark:bg-red-900/40   text-red-700   dark:text-red-300   border-red-200   dark:border-red-800';
        case 'info':    return 'bg-blue-100  dark:bg-blue-900/40  text-blue-700  dark:text-blue-300  border-blue-200  dark:border-blue-800';
        case 'gray':    return 'bg-zinc-100  dark:bg-zinc-800     text-zinc-600  dark:text-zinc-300  border-zinc-200  dark:border-zinc-700';
        default:        return 'bg-[var(--arcane-primary,#18181b)]/10 text-[var(--arcane-primary,#18181b)] border-[var(--arcane-primary,#18181b)]/20 dark:text-white';
    }
}

export default function TagsInput({ field, value = [], error, status = 'idle', onChange, onBlur }: TagsInputProps) {
    const [input, setInput]   = useState('');
    const [focused, setFocused] = useState(false);
    const inputRef            = useRef<HTMLInputElement>(null);

    const tags      = Array.isArray(value) ? value : [];
    const separator = field.separator ?? ',';
    const splitKeys = field.splitKeys ?? ['Enter', ','];
    const doTrim    = field.trim !== false;

    const filteredSuggestions = (field.suggestions ?? []).filter(
        s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
    );

    const normalizeTag = (raw: string): string => doTrim ? raw.trim() : raw;

    const addTag = (raw: string) => {
        // Support separator-split paste
        const parts = raw.split(separator).map(normalizeTag).filter(Boolean);
        const newTags = parts.filter(t => t && !tags.includes(t));
        if (newTags.length === 0) return;
        const limited = field.maxTags
            ? newTags.slice(0, field.maxTags - tags.length)
            : newTags;
        if (limited.length === 0) return;
        onChange([...tags, ...limited]);
        setInput('');
    };

    const removeTag = (tag: string) => {
        onChange(tags.filter(t => t !== tag));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        const key = e.key;
        if (splitKeys.includes(key)) {
            e.preventDefault();
            if (input) addTag(input);
        } else if (key === 'Backspace' && !input && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    };

    const chipCls = cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border',
        tagColorCls(field.color),
    );

    const formatTag = (tag: string) =>
        `${field.tagPrefix ?? ''}${tag}${field.tagSuffix ?? ''}`;

    return (
        <FieldWrapper label={field.label} required={field.required} hint={field.hint} error={error} status={status}>
            {/* Tag container */}
            <div
                onClick={() => inputRef.current?.focus()}
                className={cn(
                    'min-h-[42px] flex flex-wrap gap-1.5 px-3 py-2 rounded-lg border cursor-text transition-colors',
                    focused
                        ? status === 'invalid'
                            ? 'border-red-400 ring-2 ring-red-200 dark:ring-red-900'
                            : 'border-[var(--arcane-primary,#18181b)] ring-2 ring-[var(--arcane-primary,#18181b)]/20 bg-white dark:bg-zinc-800'
                        : status === 'invalid'
                        ? 'border-red-400 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
                        : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800',
                )}
            >
                {/* Existing tags */}
                {tags.map(tag => (
                    <span key={tag} className={chipCls}>
                        {formatTag(tag)}
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); removeTag(tag); }}
                            disabled={field.disabled}
                            className="hover:opacity-70 transition-opacity disabled:opacity-40"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}

                {/* Input */}
                {(!field.maxTags || tags.length < field.maxTags) && (
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setFocused(true)}
                        onBlur={() => { setFocused(false); onBlur?.(); }}
                        placeholder={tags.length === 0 ? (field.placeholder ?? 'Add tags…') : ''}
                        className="flex-1 min-w-[100px] text-sm outline-none bg-transparent text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                        disabled={field.disabled}
                    />
                )}
            </div>

            {/* Suggestions dropdown */}
            {focused && input && filteredSuggestions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 max-h-40 overflow-y-auto">
                    {filteredSuggestions.map(s => (
                        <button
                            key={s}
                            type="button"
                            onMouseDown={e => { e.preventDefault(); addTag(s); }}
                            className="w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-[var(--arcane-primary,#18181b)]/5 hover:text-[var(--arcane-primary,#18181b)] transition-colors"
                        >
                            {formatTag(s)}
                        </button>
                    ))}
                </div>
            )}

            {/* Counter */}
            {field.maxTags && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {tags.length}/{field.maxTags} tags
                    {splitKeys.length > 0 && ` · Press ${splitKeys.filter(k => k !== ',').join(' or ')} to add`}
                </p>
            )}
        </FieldWrapper>
    );
}
