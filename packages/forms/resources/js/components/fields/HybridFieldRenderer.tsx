import React from 'react';
import { FieldRenderer } from '.';        // same directory: fields/index.tsx
import { LarafusionField } from '@larafusion/core'; // support types via vite alias
import {
    ExtendedField, RepeaterField, TagsField, ColorField,
    FileField, ImageField,
    BelongsToField, BelongsToManyField, HasManyField,
    RepeaterRow, ValidationStatus,
} from '../../types';
import Repeater            from './Repeater';
import TagsInput           from './TagsInput';
import ColorPicker         from './ColorPicker';
import FileUploadField     from './upload/FileUploadField';
import ImageUploadField    from './upload/ImageUploadField';
import BelongsToSelect     from './relations/BelongsToSelect';
import BelongsToManySelect from './relations/BelongsToManySelect';
import HasManyTable        from './relations/HasManyTable';

interface HybridFieldRendererProps {
    field: ExtendedField;
    value: unknown;
    error?: string;
    status?: ValidationStatus;
    onChange: (val: unknown) => void;
    onBlur?: () => void;
    // needed for relation fields to build API URLs
    resourceSlug?: string;
    // needed for HasMany — the current record's id
    recordId?: string | number | null;
}

export default function HybridFieldRenderer({
    field, value, error, status, onChange, onBlur,
    resourceSlug = '', recordId = null,
}: HybridFieldRendererProps) {
    if (field.hidden) return null;

    switch (field.type) {
        case 'repeater':
            return <Repeater field={field as RepeaterField} value={value as RepeaterRow[]} error={error} status={status} onChange={onChange as (v: RepeaterRow[]) => void} />;

        case 'tags':
            return <TagsInput field={field as TagsField} value={value as string[]} error={error} status={status} onChange={onChange as (v: string[]) => void} onBlur={onBlur} />;

        case 'color':
            return <ColorPicker field={field as ColorField} value={value as string} error={error} status={status} onChange={onChange as (v: string) => void} onBlur={onBlur} />;

        case 'file':
            return <FileUploadField field={field as FileField} value={value as string | string[] | null} error={error} status={status} onChange={onChange as (v: string | string[] | null) => void} />;

        case 'image':
            return <ImageUploadField field={field as ImageField} value={value as string | string[] | null} error={error} status={status} onChange={onChange as (v: string | string[] | null) => void} />;

        // ── Phase 6: Relation fields ──────────────────────────────────────────
        case 'belongs_to':
            return (
                <BelongsToSelect
                    field={field as BelongsToField}
                    resourceSlug={resourceSlug}
                    value={value as string | number | null}
                    error={error}
                    status={status}
                    onChange={onChange as (v: string | number | null) => void}
                    onBlur={onBlur}
                />
            );

        case 'belongs_to_many':
            return (
                <BelongsToManySelect
                    field={field as BelongsToManyField}
                    resourceSlug={resourceSlug}
                    value={value as (string | number)[]}
                    error={error}
                    status={status}
                    onChange={onChange as (v: (string | number)[]) => void}
                    onBlur={onBlur}
                />
            );

        case 'has_many':
            // HasMany is read-only in forms — shows related records inline
            return (
                <HasManyTable
                    field={field as HasManyField}
                    resourceSlug={resourceSlug}
                    recordId={recordId}
                    error={error}
                    status={status}
                />
            );

        default:
            // Wrap in a div that fires onBlur when focus truly leaves the component
            // (not just moves between sub-elements), enabling per-field blur validation.
            return (
                <div onBlur={onBlur ? (e: React.FocusEvent<HTMLDivElement>) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) onBlur();
                } : undefined}>
                    <FieldRenderer field={field as LarafusionField} value={value} error={error} onChange={onChange} />
                </div>
            );
    }
}
