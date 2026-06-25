<?php

namespace Larafusion\Fields;

class ImageUpload extends FileUpload
{
    protected ?int $minWidth    = null;
    protected ?int $minHeight   = null;
    protected ?int $maxWidth    = null;
    protected ?int $maxHeight   = null;
    protected bool $avatar      = false;   // circular preview
    protected bool $optimize    = true;    // auto compress on server

    public function __construct(string $name)
    {
        parent::__construct($name);
        // Default to images only
        $this->acceptedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $this->directory = 'images';
    }

    public function getType(): string { return 'image'; }

    public function minWidth(int $px): static  { $this->minWidth  = $px; return $this; }
    public function minHeight(int $px): static { $this->minHeight = $px; return $this; }
    public function maxWidth(int $px): static  { $this->maxWidth  = $px; return $this; }
    public function maxHeight(int $px): static { $this->maxHeight = $px; return $this; }

    public function avatar(bool $v = true): static
    {
        $this->avatar = $v;
        return $this;
    }

    public function optimize(bool $v = true): static
    {
        $this->optimize = $v;
        return $this;
    }

    public function dimensions(int $width, int $height): static
    {
        $this->minWidth  = $width;
        $this->minHeight = $height;
        $this->maxWidth  = $width;
        $this->maxHeight = $height;
        return $this;
    }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'minWidth'  => $this->minWidth,
            'minHeight' => $this->minHeight,
            'maxWidth'  => $this->maxWidth,
            'maxHeight' => $this->maxHeight,
            'avatar'    => $this->avatar,
            'optimize'  => $this->optimize,
        ]);
    }
}
