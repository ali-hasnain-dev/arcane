// ─── Main form component ──────────────────────────────────────────────────────
export { default as HybridForm           } from './components/form/HybridForm';

// ─── Field components ─────────────────────────────────────────────────────────
export { default as HybridFieldRenderer  } from './components/fields/HybridFieldRenderer';
export { default as Repeater             } from './components/fields/Repeater';
export { default as TagsInput            } from './components/fields/TagsInput';
export { default as ColorPicker          } from './components/fields/ColorPicker';
export { default as CodeEditorComponent  } from './components/fields/CodeEditor';
export { ToggleButtonsFieldComponent     } from './components/fields/extended';
export { default as FileUploadField      } from './components/fields/upload/FileUploadField';
export { default as ImageUploadField     } from './components/fields/upload/ImageUploadField';

// ─── Phase 6: Relation components ────────────────────────────────────────────
export { default as BelongsToSelect      } from './components/fields/relations/BelongsToSelect';
export { default as BelongsToManySelect  } from './components/fields/relations/BelongsToManySelect';
export { default as HasManyTable         } from './components/fields/relations/HasManyTable';

// ─── Hooks ────────────────────────────────────────────────────────────────────
export { useHybridForm  } from './hooks/useHybridForm';
export { useFileUpload  } from './hooks/useFileUpload';

// ─── Custom field registry ────────────────────────────────────────────────────
export { registerField, getRegisteredField, FieldRenderer } from './components/fields/index';

// ─── Validation engine ────────────────────────────────────────────────────────
export { classifyRules, runClientValidation } from './engine/validator';

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
    HybridFormHandle, HybridFormState,
    FormValidationState, FieldValidationState, ValidationStatus,
    RepeaterField, RepeaterRow,
    TagsField, ColorField,
    ToggleButtonsField, CodeEditorField,
    FileField, ImageField,
    BelongsToField, BelongsToManyField, HasManyField,
    RelationOption, ExtendedField,
} from './types';

export type { UploadedFile, UploadStatus } from './hooks/useFileUpload';
