import React, { useRef, useState, useCallback } from 'react';
import { ImageIcon, X, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { useFileUpload } from '../../../hooks/useFileUpload';
import FieldWrapper from '../FieldWrapper';
import { ValidationStatus } from '../../../types';
import { cn } from '../../../lib/utils';

interface ImageFieldSchema {
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
    avatar?: boolean;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
}

interface ImageUploadProps {
    field: ImageFieldSchema;
    value: string | string[] | null;
    error?: string;
    status?: ValidationStatus;
    onChange: (val: string | string[] | null) => void;
}

// ─── Validate image dimensions client-side ────────────────────────────────────
function validateImageDimensions(
    file: File,
    minW?: number, minH?: number,
    maxW?: number, maxH?: number
): Promise<string | null> {
    return new Promise(resolve => {
        if (!file.type.startsWith('image/')) { resolve(null); return; }
        const img = new Image();
        img.onload = () => {
            if (minW && img.width < minW)  { resolve(`Image must be at least ${minW}px wide.`); return; }
            if (minH && img.height < minH) { resolve(`Image must be at least ${minH}px tall.`); return; }
            if (maxW && img.width > maxW)  { resolve(`Image must be at most ${maxW}px wide.`); return; }
            if (maxH && img.height > maxH) { resolve(`Image must be at most ${maxH}px tall.`); return; }
            resolve(null);
        };
        img.onerror = () => resolve(null);
        img.src = URL.createObjectURL(file);
    });
}

export default function ImageUploadField({ field, value, error, status = 'idle', onChange }: ImageUploadProps) {
    const [isDragOver, setIsDragOver]   = useState(false);
    const [dimError, setDimError]       = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { files, addFiles, removeFile, setExisting } = useFileUpload({
        disk:              field.disk ?? 'public',
        directory:         field.directory ?? 'images',
        multiple:          field.multiple,
        maxFiles:          field.maxFiles,
        maxSize:           field.maxSize,
        acceptedMimeTypes: field.acceptedMimeTypes ?? ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        onUploadComplete: () => {
            const doneKeys = files.filter(f => f.status === 'done').map(f => f.key);
            onChange(field.multiple ? doneKeys : (doneKeys[0] ?? null));
        },
    });

    React.useEffect(() => { setExisting(value); }, []);
    React.useEffect(() => {
        const doneKeys = files.filter(f => f.status === 'done').map(f => f.key);
        onChange(field.multiple ? doneKeys : (doneKeys[0] ?? null));
    }, [files]);

    const handleFiles = useCallback(async (incoming: File[]) => {
        setDimError(null);
        for (const file of incoming) {
            const dimErr = await validateImageDimensions(
                file, field.minWidth, field.minHeight, field.maxWidth, field.maxHeight
            );
            if (dimErr) { setDimError(dimErr); return; }
        }
        addFiles(incoming);
    }, [addFiles, field.minWidth, field.minHeight, field.maxWidth, field.maxHeight]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(Array.from(e.dataTransfer.files));
    };

    const combinedError = error ?? dimError ?? undefined;

    // ── Avatar mode (single image, circular) ──────────────────────────────────
    if (field.avatar) {
        const single = files[0];
        return (
            <FieldWrapper label={field.label} required={field.required} hint={field.hint} error={combinedError} status={status}>
                <div className="flex items-center gap-4">
                    {/* Circle preview */}
                    <div className="relative shrink-0">
                        <div className={cn(
                            'w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors',
                            isDragOver ? 'border-[var(--larafusion-primary,#18181b)] bg-zinc-100' : 'border-zinc-300 bg-zinc-50',
                        )}>
                            {single?.preview ? (
                                <img src={single.preview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="w-7 h-7 text-zinc-300" />
                            )}
                            {single?.status === 'uploading' && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                                </div>
                            )}
                        </div>
                        {single && (
                            <button
                                type="button"
                                onClick={() => removeFile(single.key)}
                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    <div>
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="text-sm font-medium text-[var(--larafusion-primary,#18181b)] hover:opacity-80 hover:underline"
                        >
                            {single ? 'Change photo' : 'Upload photo'}
                        </button>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            JPG, PNG or WebP
                            {field.maxSize && ` · Max ${field.maxSize > 1024 ? `${(field.maxSize / 1024).toFixed(0)} MB` : `${field.maxSize} KB`}`}
                        </p>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            onChange={e => handleFiles(Array.from(e.target.files ?? []))}
                            className="hidden"
                        />
                    </div>
                </div>
            </FieldWrapper>
        );
    }

    // ── Grid mode (single or multiple images) ─────────────────────────────────
    const canAddMore = field.multiple
        ? !field.maxFiles || files.length < field.maxFiles
        : files.length === 0;

    return (
        <FieldWrapper label={field.label} required={field.required} hint={field.hint} error={combinedError} status={status}>
            <div className={cn('grid gap-3', field.multiple ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-1 max-w-xs')}>
                {/* Existing image thumbnails */}
                {files.map(f => (
                    <div key={f.key} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 group">
                        {f.preview ? (
                            <img src={f.preview} alt={f.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-zinc-300" />
                            </div>
                        )}

                        {/* Upload progress overlay */}
                        {f.status === 'uploading' && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                                <Loader2 className="w-5 h-5 text-white animate-spin mb-1" />
                                <span className="text-white text-xs font-medium">{f.progress}%</span>
                            </div>
                        )}

                        {/* Error overlay */}
                        {f.status === 'error' && (
                            <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                        )}

                        {/* Remove button */}
                        {f.status !== 'uploading' && (
                            <button
                                type="button"
                                onClick={() => removeFile(f.key)}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                ))}

                {/* Add more drop zone */}
                {canAddMore && (
                    <div
                        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                        className={cn(
                            'aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors',
                            isDragOver
                                ? 'border-[var(--larafusion-primary,#18181b)] bg-zinc-100'
                                : 'border-zinc-300 hover:border-[var(--larafusion-primary,#18181b)] hover:bg-zinc-50',
                        )}
                    >
                        <Upload className={cn('w-6 h-6 mb-1 transition-colors', isDragOver ? 'text-[var(--larafusion-primary,#18181b)]' : 'text-zinc-400')} />
                        <span className="text-xs text-zinc-500 font-medium">
                            {field.multiple ? 'Add images' : 'Upload'}
                        </span>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            multiple={field.multiple}
                            onChange={e => handleFiles(Array.from(e.target.files ?? []))}
                            className="hidden"
                        />
                    </div>
                )}
            </div>

            {/* Dimension hint */}
            {(field.minWidth || field.minHeight || field.maxWidth || field.maxHeight) && (
                <p className="text-xs text-zinc-400 mt-1.5">
                    {[
                        field.minWidth && field.minHeight && `Min ${field.minWidth}×${field.minHeight}px`,
                        field.maxWidth && field.maxHeight && `Max ${field.maxWidth}×${field.maxHeight}px`,
                    ].filter(Boolean).join(' · ')}
                </p>
            )}
        </FieldWrapper>
    );
}
