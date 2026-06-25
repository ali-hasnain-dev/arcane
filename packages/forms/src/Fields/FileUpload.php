<?php

namespace Larafusion\Fields;

class FileUpload extends Field
{
    protected string  $disk              = 'public';
    protected string  $directory         = 'uploads';
    protected string  $visibility        = 'public';
    protected bool    $multiple          = false;
    protected ?int    $maxSize           = null;   // KB
    protected ?int    $minSize           = null;   // KB
    protected array   $acceptedMimeTypes = [];
    protected bool    $preserveFilenames = false;
    protected ?int    $maxFiles          = null;
    protected ?int    $minFiles          = null;
    protected bool    $deletable         = true;
    protected bool    $downloadable      = true;
    protected bool    $openable          = false;
    protected bool    $reorderable       = false;

    public function getType(): string { return 'file'; }

    public function disk(string $disk): static                { $this->disk = $disk; return $this; }
    public function directory(string $directory): static      { $this->directory = $directory; return $this; }

    /** File visibility on the storage disk ('public' or 'private'). */
    public function visibility(string $v): static             { $this->visibility = $v; return $this; }

    public function multiple(bool $v = true): static          { $this->multiple = $v; return $this; }
    public function maxFiles(int $n): static                  { $this->maxFiles = $n; return $this; }
    public function minFiles(int $n): static                  { $this->minFiles = $n; return $this; }

    public function maxSize(int $kb): static
    {
        $this->maxSize = $kb;
        $this->addRule("max:{$kb}", 'client');
        return $this;
    }

    public function minSize(int $kb): static
    {
        $this->minSize = $kb;
        $this->addRule("min:{$kb}", 'client');
        return $this;
    }

    public function acceptedFileTypes(array $mimes): static
    {
        $this->acceptedMimeTypes = $mimes;
        $this->addRule('mimes:' . implode(',', array_map(
            fn($m) => ltrim(str_replace('application/', '', str_replace('image/', '', $m)), '/'),
            $mimes
        )), 'client');
        return $this;
    }

    public function preserveFilenames(bool $v = true): static
    {
        $this->preserveFilenames = $v;
        return $this;
    }

    public function deletable(bool $v = true): static    { $this->deletable    = $v; return $this; }
    public function downloadable(bool $v = true): static { $this->downloadable = $v; return $this; }

    /** Add an "open in new tab" button for each uploaded file. */
    public function openable(bool $v = true): static     { $this->openable     = $v; return $this; }

    /** Allow users to reorder uploaded files (multiple mode). */
    public function reorderable(bool $v = true): static  { $this->reorderable  = $v; return $this; }

    // ── Helper presets ────────────────────────────────────────────────────────
    public function image(): static
    {
        return $this->acceptedFileTypes(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
    }

    public function pdf(): static
    {
        return $this->acceptedFileTypes(['application/pdf']);
    }

    public function documents(): static
    {
        return $this->acceptedFileTypes([
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function getDisk(): string      { return $this->disk; }
    public function getDirectory(): string { return $this->directory; }
    public function isMultiple(): bool     { return $this->multiple; }
    public function preservesFilenames(): bool { return $this->preserveFilenames; }

    public function toArray(): array
    {
        $arr = array_merge(parent::toArray(), [
            'disk'              => $this->disk,
            'directory'         => $this->directory,
            'visibility'        => $this->visibility,
            'multiple'          => $this->multiple,
            'maxSize'           => $this->maxSize,
            'acceptedMimeTypes' => $this->acceptedMimeTypes,
            'deletable'         => $this->deletable,
            'downloadable'      => $this->downloadable,
            'openable'          => $this->openable,
            'reorderable'       => $this->reorderable,
        ]);
        if ($this->minSize  !== null) $arr['minSize']  = $this->minSize;
        if ($this->maxFiles !== null) $arr['maxFiles'] = $this->maxFiles;
        if ($this->minFiles !== null) $arr['minFiles'] = $this->minFiles;
        return $arr;
    }
}
