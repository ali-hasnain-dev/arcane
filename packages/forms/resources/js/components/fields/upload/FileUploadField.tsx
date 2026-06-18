import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle, Loader2, Download } from 'lucide-react';
import { useFileUpload, UploadedFile } from '../../../hooks/useFileUpload';
import FieldWrapper from '../FieldWrapper';
import { ValidationStatus } from '../../../types';
import { cn } from '../../../lib/utils';

// ─── File field schema props (passed from PHP serialized field) ───────────────
interface FileFieldSchema {
    name: string;
    label: string;
    required?: boolean;
    hint?: string | null;
    multiple?: boolean;
    maxSize?: number;
    maxFiles?: number;
    acceptedMimeTypes?: string[];
    disk?: string;
    directory?: string;
    deletable?: boolean;
    downloadable?: boolean;
}

interface FileUploadProps {
    field: FileFieldSchema;
    value: string | string[] | null;
    error?: string;
    status?: ValidationStatus;
    onChange: (val: string | string[] | null) => void;
}

// ─── Single file row ──────────────────────────────────────────────────────────
function FileRow({ file, deletable, downloadable, onRemove }: {
    file: UploadedFile;
    deletable?: boolean;
    downloadable?: boolean;
    onRemove: (key: string) => void;
}) {
    const sizeLabel = file.size > 1024 * 1024
        ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
        : file.size > 1024
        ? `${(file.size / 1024).toFixed(0)} KB`
        : `${file.size} B`;

    return (
        <div className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm',
            file.status === 'error'     ? 'border-red-200 bg-red-50'    :
            file.status === 'uploading' ? 'border-zinc-200 bg-zinc-50'  :
                                          'border-zinc-200 bg-white'
        )}>
            {/* Icon / preview */}
            {file.preview ? (
                <img src={file.preview} alt={file.name} className="w-8 h-8 rounded object-cover shrink-0" />
            ) : (
                <FileText className="w-5 h-5 text-zinc-400 shrink-0" />
            )}

            {/* Name + progress */}
            <div className="flex-1 min-w-0">
                <p className="text-zinc-700 font-medium truncate">{file.name}</p>
                {file.status === 'uploading' ? (
                    <div className="mt-1">
                        <div className="h-1 rounded-full bg-zinc-200 overflow-hidden">
                            <div
                                className="h-full bg-[var(--arcane-primary,#18181b)] rounded-full transition-all duration-200"
                                style={{ width: `${file.progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">{file.progress}%</p>
                    </div>
                ) : file.status === 'error' ? (
                    <p className="text-xs text-red-600 mt-0.5">{file.error}</p>
                ) : (
                    <p className="text-xs text-zinc-400">{sizeLabel}</p>
                )}
            </div>

            {/* Status icon */}
            <div className="shrink-0">
                {file.status === 'uploading' && <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />}
                {file.status === 'done'      && <CheckCircle className="w-4 h-4 text-green-500" />}
                {file.status === 'error'     && <AlertCircle className="w-4 h-4 text-red-500" />}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
                {downloadable && file.status === 'done' && file.preview && (
                    <a
                        href={file.preview}
                        download={file.name}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                        title="Download"
                    >
                        <Download className="w-3.5 h-3.5" />
                    </a>
                )}
                {deletable !== false && (
                    <button
                        type="button"
                        onClick={() => onRemove(file.key)}
                        className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── FileUpload component ─────────────────────────────────────────────────────
export default function FileUploadField({ field, value, error, status = 'idle', onChange }: FileUploadProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const { files, addFiles, removeFile, setExisting, keys } = useFileUpload({
        disk:              field.disk,
        directory:         field.directory,
        multiple:          field.multiple,
        maxFiles:          field.maxFiles,
        maxSize:           field.maxSize,
        acceptedMimeTypes: field.acceptedMimeTypes,
        onUploadComplete: () => {
            // Notify form of new keys
            const updated = files.filter(f => f.status === 'done').map(f => f.key);
            onChange(field.multiple ? updated : (updated[0] ?? null));
        },
    });

    // Sync existing value on mount
    React.useEffect(() => { setExisting(value); }, []);

    // Propagate key changes up
    React.useEffect(() => {
        const doneKeys = files.filter(f => f.status === 'done').map(f => f.key);
        onChange(field.multiple ? doneKeys : (doneKeys[0] ?? null));
    }, [files]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const dropped = Array.from(e.dataTransfer.files);
        if (dropped.length > 0) addFiles(dropped);
    }, [addFiles]);

    const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? []);
        if (selected.length > 0) addFiles(selected);
        e.target.value = ''; // reset so same file can be re-selected
    };

    const canAddMore = field.multiple
        ? !field.maxFiles || files.length < field.maxFiles
        : files.length === 0;

    const acceptAttr = field.acceptedMimeTypes?.join(',');
    const maxSizeLabel = field.maxSize
        ? field.maxSize > 1024 ? `${(field.maxSize / 1024).toFixed(0)} MB` : `${field.maxSize} KB`
        : null;

    return (
        <FieldWrapper label={field.label} required={field.required} hint={field.hint} error={error} status={status}>
            {/* Drop zone */}
            {canAddMore && (
                <div
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={cn(
                        'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
                        isDragOver
                            ? 'border-[var(--arcane-primary,#18181b)] bg-zinc-100'
                            : 'border-zinc-300 hover:border-[var(--arcane-primary,#18181b)] hover:bg-zinc-50',
                    )}
                >
                    <Upload className={cn('w-8 h-8 mx-auto mb-2 transition-colors', isDragOver ? 'text-[var(--arcane-primary,#18181b)]' : 'text-zinc-400')} />
                    <p className="text-sm font-medium text-zinc-600">
                        {isDragOver ? 'Drop to upload' : 'Drag & drop or click to browse'}
                    </p>
                    {(field.acceptedMimeTypes?.length || maxSizeLabel) && (
                        <p className="text-xs text-zinc-400 mt-1">
                            {field.acceptedMimeTypes?.length
                                ? field.acceptedMimeTypes.map(m => m.split('/')[1].toUpperCase()).join(', ')
                                : 'Any file'}
                            {maxSizeLabel && ` · Max ${maxSizeLabel}`}
                            {field.maxFiles && ` · Max ${field.maxFiles} file${field.maxFiles !== 1 ? 's' : ''}`}
                        </p>
                    )}

                    <input
                        ref={inputRef}
                        type="file"
                        multiple={field.multiple}
                        accept={acceptAttr}
                        onChange={handleSelect}
                        className="hidden"
                    />
                </div>
            )}

            {/* File list */}
            {files.length > 0 && (
                <div className="space-y-2 mt-2">
                    {files.map(f => (
                        <FileRow
                            key={f.key}
                            file={f}
                            deletable={field.deletable}
                            downloadable={field.downloadable}
                            onRemove={removeFile}
                        />
                    ))}
                </div>
            )}
        </FieldWrapper>
    );
}
