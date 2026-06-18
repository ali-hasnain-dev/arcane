import { useState, useCallback } from 'react';

export type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

export interface UploadedFile {
    key: string;          // encrypted temp key from server
    name: string;
    size: number;
    mime: string;
    preview: string | null;  // URL if image, null otherwise
    status: UploadStatus;
    progress: number;     // 0–100
    error?: string;
}

interface UseFileUploadOptions {
    disk?: string;
    directory?: string;
    multiple?: boolean;
    maxFiles?: number;
    maxSize?: number;          // KB
    acceptedMimeTypes?: string[];
    onUploadComplete?: (files: UploadedFile[]) => void;
}

export function useFileUpload({
    disk = 'public',
    directory = 'uploads',
    multiple = false,
    maxFiles,
    maxSize,
    acceptedMimeTypes = [],
    onUploadComplete,
}: UseFileUploadOptions) {
    const [files, setFiles] = useState<UploadedFile[]>([]);

    // ── Client-side validation before upload ──────────────────────────────────
    const validateFile = (file: File): string | null => {
        if (maxSize && file.size > maxSize * 1024) {
            return `File exceeds maximum size of ${maxSize > 1024 ? `${(maxSize / 1024).toFixed(1)} MB` : `${maxSize} KB`}.`;
        }
        if (acceptedMimeTypes.length > 0 && !acceptedMimeTypes.includes(file.type)) {
            const readable = acceptedMimeTypes
                .map(m => m.split('/')[1].toUpperCase())
                .join(', ');
            return `Only ${readable} files are allowed.`;
        }
        return null;
    };

    // ── Upload a single file with XHR for progress tracking ──────────────────
    const uploadFile = useCallback((file: File): Promise<UploadedFile> => {
        return new Promise((resolve, reject) => {
            const tempId = Math.random().toString(36).slice(2);

            const pending: UploadedFile = {
                key: tempId, name: file.name, size: file.size,
                mime: file.type, preview: null,
                status: 'uploading', progress: 0,
            };

            // Optimistic preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = e => {
                    setFiles(f => f.map(u => u.key === tempId
                        ? { ...u, preview: e.target?.result as string }
                        : u
                    ));
                };
                reader.readAsDataURL(file);
            }

            setFiles(prev => multiple ? [...prev, pending] : [pending]);

            const form = new FormData();
            form.append('file', file);
            form.append('disk', disk);
            form.append('directory', directory);

            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', e => {
                if (!e.lengthComputable) return;
                const pct = Math.round((e.loaded / e.total) * 100);
                setFiles(f => f.map(u => u.key === tempId ? { ...u, progress: pct } : u));
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    const res = JSON.parse(xhr.responseText);
                    const done: UploadedFile = {
                        key: res.key, name: res.name, size: res.size,
                        mime: res.mime, preview: res.preview,
                        status: 'done', progress: 100,
                    };
                    setFiles(f => f.map(u => u.key === tempId ? done : u));
                    resolve(done);
                } else {
                    const err = 'Upload failed. Please try again.';
                    setFiles(f => f.map(u => u.key === tempId ? { ...u, status: 'error', error: err } : u));
                    reject(new Error(err));
                }
            });

            xhr.addEventListener('error', () => {
                const err = 'Network error during upload.';
                setFiles(f => f.map(u => u.key === tempId ? { ...u, status: 'error', error: err } : u));
                reject(new Error(err));
            });

            xhr.open('POST', '/admin/upload');
            // CSRF token from cookie
            const token = document.cookie.split('; ')
                .find(r => r.startsWith('XSRF-TOKEN='))
                ?.split('=')[1] ?? '';
            xhr.setRequestHeader('X-XSRF-TOKEN', decodeURIComponent(token));
            xhr.send(form);
        });
    }, [disk, directory, multiple]);

    // ── Handle file selection (from input or drop) ────────────────────────────
    const addFiles = useCallback(async (incoming: File[]) => {
        const toUpload = multiple
            ? (maxFiles ? incoming.slice(0, maxFiles - files.length) : incoming)
            : [incoming[0]];

        const uploaded: UploadedFile[] = [];

        for (const file of toUpload) {
            const err = validateFile(file);
            if (err) {
                const errFile: UploadedFile = {
                    key: Math.random().toString(36).slice(2),
                    name: file.name, size: file.size, mime: file.type,
                    preview: null, status: 'error', progress: 0, error: err,
                };
                setFiles(prev => multiple ? [...prev, errFile] : [errFile]);
                continue;
            }
            try {
                const done = await uploadFile(file);
                uploaded.push(done);
            } catch {}
        }

        if (uploaded.length > 0) onUploadComplete?.(uploaded);
    }, [files, multiple, maxFiles, uploadFile, onUploadComplete, validateFile]);

    // ── Remove a file ─────────────────────────────────────────────────────────
    const removeFile = useCallback(async (key: string) => {
        const file = files.find(f => f.key === key);
        if (!file) return;

        setFiles(f => f.filter(u => u.key !== key));

        // Delete temp file from server
        if (file.status === 'done') {
            const token = document.cookie.split('; ')
                .find(r => r.startsWith('XSRF-TOKEN='))?.split('=')[1] ?? '';
            fetch('/admin/upload', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(token),
                },
                body: JSON.stringify({ key }),
            }).catch(() => {});
        }
    }, [files]);

    // ── Initialise with existing values (for edit forms) ──────────────────────
    const setExisting = useCallback((paths: string | string[] | null) => {
        if (!paths) { setFiles([]); return; }
        const arr = Array.isArray(paths) ? paths : [paths];
        setFiles(arr.map(p => ({
            key: p, name: p.split('/').pop() ?? p,
            size: 0, mime: '', preview: isImagePath(p) ? `/storage/${p}` : null,
            status: 'done' as UploadStatus, progress: 100,
        })));
    }, []);

    // Keys to submit with form
    const keys = files.filter(f => f.status === 'done').map(f => f.key);

    return { files, addFiles, removeFile, setExisting, keys };
}

function isImagePath(path: string) {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(path);
}
