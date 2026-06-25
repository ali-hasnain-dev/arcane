<?php

namespace Larafusion\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    /**
     * Temp upload — stores file to temp location, returns a signed key.
     * The actual save to permanent location happens on form submit.
     *
     * POST /larafusion/upload
     * Body: multipart/form-data { file, disk, directory }
     */
    public function store(Request $request)
    {
        $request->validate([
            'file'      => ['required', 'file', 'max:51200'], // 50MB max
            'disk'      => ['nullable', 'string', 'in:public,local,s3'],
            'directory' => ['nullable', 'string', 'max:255'],
        ]);

        $file      = $request->file('file');
        $disk      = $request->get('disk', 'public');
        $directory = $request->get('directory', 'temp');

        // Store to temp path
        $tempPath = $file->store(
            "larafusion-temp/{$directory}",
            $disk
        );

        // Generate a signed temp key (expires in 1 hour)
        $key = encrypt([
            'path'       => $tempPath,
            'disk'       => $disk,
            'name'       => $file->getClientOriginalName(),
            'mime'       => $file->getMimeType(),
            'size'       => $file->getSize(),
            'expires_at' => now()->addHour()->timestamp,
        ]);

        return response()->json([
            'key'      => $key,
            'name'     => $file->getClientOriginalName(),
            'size'     => $file->getSize(),
            'mime'     => $file->getMimeType(),
            'preview'  => in_array($file->getMimeType(), ['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
                ? Storage::disk($disk)->url($tempPath)
                : null,
        ]);
    }

    /**
     * Serve a private file securely.
     * GET /larafusion/files/{path}
     */
    public function serve(Request $request, string $path)
    {
        $disk = $request->get('disk', 'local');

        if (!Storage::disk($disk)->exists($path)) {
            abort(404);
        }

        return Storage::disk($disk)->response($path);
    }

    /**
     * Delete a temp file.
     * DELETE /larafusion/upload
     */
    public function destroy(Request $request)
    {
        $key = $request->get('key');
        if (!$key) return response()->json(['deleted' => false]);

        try {
            $data = decrypt($key);

            // Only allow deleting temp files
            if (!str_starts_with($data['path'], 'larafusion-temp/')) {
                return response()->json(['deleted' => false], 403);
            }

            Storage::disk($data['disk'])->delete($data['path']);

            return response()->json(['deleted' => true]);
        } catch (\Throwable) {
            return response()->json(['deleted' => false]);
        }
    }

    /**
     * Move temp file to permanent location — called internally by ResourceController.
     * Returns the final stored path.
     */
    public static function persist(string $encryptedKey, string $finalDirectory, string $disk = 'public'): ?string
    {
        try {
            $data = decrypt($encryptedKey);

            if (now()->timestamp > $data['expires_at']) {
                return null; // expired
            }

            $ext      = pathinfo($data['name'], PATHINFO_EXTENSION);
            $filename = Str::uuid() . '.' . $ext;
            $destPath = "{$finalDirectory}/{$filename}";

            Storage::disk($disk)->move($data['path'], $destPath);

            return $destPath;
        } catch (\Throwable) {
            return null;
        }
    }
}
