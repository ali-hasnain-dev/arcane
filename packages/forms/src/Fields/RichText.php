<?php

namespace Arcane\Fields;

class RichText extends Field
{
    protected array   $toolbar                  = ['bold', 'italic', 'underline', 'strike', 'h2', 'h3', 'ul', 'ol', 'blockquote', 'link'];
    protected int     $minHeight                = 200;
    protected ?int    $maxHeight                = null;
    protected ?string $fileAttachmentsDisk      = null;
    protected ?string $fileAttachmentsDirectory = null;

    public function getType(): string { return 'rich_text'; }

    /** Set the full toolbar. Tools: bold, italic, underline, strike, h2, h3, ul, ol, blockquote, link */
    public function toolbar(array $tools): static         { $this->toolbar = $tools; return $this; }

    /** Alias for toolbar() — Filament-style name. */
    public function toolbarButtons(array $tools): static  { return $this->toolbar($tools); }

    /** Remove specific tools from the current toolbar. */
    public function disableToolbarButtons(array $tools): static
    {
        $this->toolbar = array_values(array_diff($this->toolbar, $tools));
        return $this;
    }

    public function minHeight(int $px): static            { $this->minHeight = $px; return $this; }

    /** Maximum editor height in px before it becomes scrollable. */
    public function maxHeight(int $px): static            { $this->maxHeight = $px; return $this; }

    /** Storage disk for images pasted or dropped into the editor. */
    public function fileAttachmentsDisk(string $disk): static     { $this->fileAttachmentsDisk      = $disk; return $this; }

    /** Directory on the disk where editor image uploads are stored. */
    public function fileAttachmentsDirectory(string $dir): static { $this->fileAttachmentsDirectory = $dir;  return $this; }

    /** Convenience: only basic formatting. */
    public function simple(): static { return $this->toolbar(['bold', 'italic', 'ul', 'ol']); }

    public function toArray(): array
    {
        $arr = array_merge(parent::toArray(), [
            'toolbar'   => $this->toolbar,
            'minHeight' => $this->minHeight,
        ]);
        if ($this->maxHeight                !== null) $arr['maxHeight']                = $this->maxHeight;
        if ($this->fileAttachmentsDisk      !== null) $arr['fileAttachmentsDisk']      = $this->fileAttachmentsDisk;
        if ($this->fileAttachmentsDirectory !== null) $arr['fileAttachmentsDirectory'] = $this->fileAttachmentsDirectory;
        return $arr;
    }
}
