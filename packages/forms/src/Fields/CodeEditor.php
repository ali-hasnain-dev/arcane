<?php

namespace Arcane\Fields;

class CodeEditor extends Field
{
    // Available language values (sent to frontend for syntax hint display)
    const LANG_PHP        = 'php';
    const LANG_JS         = 'javascript';
    const LANG_TYPESCRIPT = 'typescript';
    const LANG_HTML       = 'html';
    const LANG_CSS        = 'css';
    const LANG_JSON       = 'json';
    const LANG_SQL        = 'sql';
    const LANG_PYTHON     = 'python';
    const LANG_GO         = 'go';
    const LANG_YAML       = 'yaml';
    const LANG_XML        = 'xml';
    const LANG_MARKDOWN   = 'markdown';
    const LANG_BASH       = 'bash';
    const LANG_PLAINTEXT  = 'plaintext';

    protected string  $language  = 'plaintext';
    protected bool    $wrap      = false;
    protected int     $minHeight = 200;
    protected ?int    $maxHeight = null;
    protected bool    $lineNumbers = true;
    protected ?string $theme     = null; // 'dark' | 'light' | null (inherit)

    public function getType(): string { return 'code_editor'; }

    /**
     * Set the syntax-highlighted language.
     * Use the class constants: CodeEditor::LANG_PHP, CodeEditor::LANG_JS, etc.
     * Or pass a plain string: 'php', 'javascript', 'json', etc.
     */
    public function language(string $lang): static
    {
        $this->language = strtolower($lang);
        return $this;
    }

    /** Enable line wrapping instead of horizontal scrolling. */
    public function wrap(bool $v = true): static      { $this->wrap       = $v;  return $this; }

    /** Show line numbers in the gutter (default: true). */
    public function lineNumbers(bool $v = true): static { $this->lineNumbers = $v; return $this; }

    public function minHeight(int $px): static        { $this->minHeight  = $px; return $this; }

    /** Maximum editor height in pixels before the area becomes scrollable. */
    public function maxHeight(int $px): static        { $this->maxHeight  = $px; return $this; }

    /** Force a colour theme: 'dark', 'light', or null to inherit from the panel. */
    public function theme(string $theme): static      { $this->theme      = $theme; return $this; }

    public function toArray(): array
    {
        $arr = array_merge(parent::toArray(), [
            'language'    => $this->language,
            'wrap'        => $this->wrap,
            'lineNumbers' => $this->lineNumbers,
            'minHeight'   => $this->minHeight,
        ]);
        if ($this->maxHeight !== null) $arr['maxHeight'] = $this->maxHeight;
        if ($this->theme     !== null) $arr['theme']     = $this->theme;
        return $arr;
    }
}
