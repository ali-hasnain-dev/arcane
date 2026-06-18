export type * from '@arcane/core';
import type { BaseField, ArcaneField, FormValues, FormErrors } from '@arcane/core';

export type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

export interface FieldValidationState {
    status: ValidationStatus;
    error: string | undefined;
    touched: boolean;
}

export type FormValidationState = Record<string, FieldValidationState>;

export interface HybridFormState {
    data: FormValues;
    errors: FormErrors;
    validation: FormValidationState;
    isDirty: boolean;
    isSubmitting: boolean;
    hasErrors: boolean;
}

// ─── Repeater ─────────────────────────────────────────────────────────────────
export interface RepeaterRow { _key: string; [field: string]: unknown; }
export interface RepeaterField extends BaseField {
    type:         'repeater';
    subFields:    ArcaneField[];
    minRows?:     number | null;
    maxRows?:     number | null;
    addLabel?:    string;
    defaultItems: number;
    columns?:     number | null;
    addable:      boolean;
    deletable:    boolean;
    cloneable:    boolean;
    reorderable:  boolean;
    collapsible:  boolean;
    collapsed:    boolean;
}

// ─── Tags ─────────────────────────────────────────────────────────────────────
export interface TagsField extends BaseField {
    type:         'tags';
    suggestions?: string[];
    maxTags?:     number | null;
    separator:    string;
    splitKeys:    string[];
    trim:         boolean;
    reorderable:  boolean;
    tagPrefix?:   string | null;
    tagSuffix?:   string | null;
    color?:       string | null;
}

// ─── Color ────────────────────────────────────────────────────────────────────
export interface ColorField extends BaseField {
    type:     'color';
    presets?: string[];
    format:   'hex' | 'rgb' | 'rgba' | 'hsl';
}

// ─── File uploads ─────────────────────────────────────────────────────────────
export interface FileField extends BaseField {
    type:              'file';
    disk?:             string;
    directory?:        string;
    visibility?:       string;
    multiple?:         boolean;
    maxSize?:          number;
    minSize?:          number;
    maxFiles?:         number;
    minFiles?:         number;
    acceptedMimeTypes?: string[];
    deletable?:        boolean;
    downloadable?:     boolean;
    openable:          boolean;
    reorderable:       boolean;
}

export interface ImageField extends BaseField {
    type:              'image';
    disk?:             string;
    directory?:        string;
    visibility?:       string;
    multiple?:         boolean;
    maxSize?:          number;
    minSize?:          number;
    maxFiles?:         number;
    minFiles?:         number;
    acceptedMimeTypes?: string[];
    avatar?:           boolean;
    minWidth?:         number;
    minHeight?:        number;
    maxWidth?:         number;
    maxHeight?:        number;
    optimize?:         boolean;
    openable?:         boolean;
    reorderable?:      boolean;
}

// ─── Relations (Phase 6) ──────────────────────────────────────────────────────
export interface RelationOption {
    value: string | number;
    label: string;
}

export interface BelongsToField extends BaseField {
    type: 'belongs_to';
    relatedModel: string;
    foreignKey: string;
    labelColumn: string;
    valueColumn: string;
    searchable?: boolean;
    preload?: boolean;
    preloadedOptions?: RelationOption[];
    optionsUrl: string;
}

export interface BelongsToManyField extends BaseField {
    type: 'belongs_to_many';
    relatedModel: string;
    foreignKey: string;
    labelColumn: string;
    valueColumn: string;
    searchable?: boolean;
    preload?: boolean;
    preloadedOptions?: RelationOption[];
    optionsUrl: string;
    pivotTable?: string;
    pivotFk?: string;
    pivotRelated?: string;
    pivotColumns?: string[];
}

export interface HasManyField extends BaseField {
    type: 'has_many';
    relatedModel: string;
    foreignKey: string;
    displayColumns: string[];
    limit: number;
    relatedResource?: string;
}

// ─── Extended union ───────────────────────────────────────────────────────────
export type ExtendedField =
    | ArcaneField
    | RepeaterField
    | TagsField
    | ColorField
    | FileField
    | ImageField
    | BelongsToField
    | BelongsToManyField
    | HasManyField;

// ─── useHybridForm handle ─────────────────────────────────────────────────────
export interface HybridFormHandle {
    data: FormValues;
    errors: FormErrors;
    validation: FormValidationState;
    isDirty: boolean;
    isSubmitting: boolean;
    hasErrors: boolean;
    setField: (name: string, value: unknown) => void;
    validateField: (name: string) => Promise<void>;
    validateAll: () => Promise<boolean>;
    submit: (url: string, method: 'post' | 'put' | 'patch') => void;
    reset: () => void;
    clearErrors: () => void;
}
