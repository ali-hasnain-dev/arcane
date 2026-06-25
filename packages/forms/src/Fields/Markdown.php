<?php

namespace Larafusion\Fields;

class Markdown extends Field
{
    protected bool    $showPreview             = true;
    protected bool    $defaultPreview          = false;
    protected int     $minHeight               = 200;
    protected array   $toolbarButtons          = [];    // empty = use defaults
    protected ?string $fileAttachmentsDisk      = null;
    protected ?string $fileAttachmentsDirectory = null;

    public function getType(): string { return 'markdown'; }

    /** Hide the Preview tab entirely. */
    public function hidePreview(): static            { $this->showPreview    = false; return $this; }

    /** Show the Preview tab (default: true). */
    public function showPreview(bool $v = true): static { $this->showPreview = $v;    return $this; }

    /** Start in Preview mode instead of Write mode. */
    public function startInPreview(): static         { $this->defaultPreview = true;  return $this; }

    public function minHeight(int $px): static       { $this->minHeight = $px;        return $this; }

    /**
     * Restrict the toolbar to a specific set of buttons.
     * Leave empty to use all available shortcuts.
     * Available: bold, italic, strike, h2, h3, ul, ol, blockquote, link, code, image
     */
    public function toolbarButtons(array $buttons): static { $this->toolbarButtons = $buttons; return $this; }

    /** Storage disk for images dragged/pasted into the editor. */
    public function fileAttachmentsDisk(string $disk): static     { $this->fileAttachmentsDisk      = $disk; return $this; }

    /** Directory on the disk where markdown image uploads are stored. */
    public function fileAttachmentsDirectory(string $dir): static { $this->fileAttachmentsDirectory = $dir;  return $this; }

    public function toArray(): array
    {
        $arr = array_merge(parent::toArray(), [
            'showPreview'    => $this->showPreview,
            'defaultPreview' => $this->defaultPreview,
            'minHeight'      => $this->minHeight,
        ]);
        if (!empty($this->toolbarButtons))             $arr['toolbarButtons']          = $this->toolbarButtons;
        if ($this->fileAttachmentsDisk      !== null)  $arr['fileAttachmentsDisk']      = $this->fileAttachmentsDisk;
        if ($this->fileAttachmentsDirectory !== null)  $arr['fileAttachmentsDirectory'] = $this->fileAttachmentsDirectory;
        return $arr;
    }
}
