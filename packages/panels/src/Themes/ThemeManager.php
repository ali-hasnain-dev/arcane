<?php

namespace Larafusion\Themes;

class ThemeManager
{
    protected array $config = [];

    protected const THEMES = [
        // ── Neutral (default) — pure zinc, matches Laravel React Starter Kit ─
        'neutral' => ['primary'=>'#18181b','primary-hover'=>'#27272a','primary-light'=>'#f4f4f5','primary-ring'=>'#a1a1aa','sidebar-bg'=>'#18181b','sidebar-bg-light'=>'#fafafa','sidebar-text'=>'#a1a1aa','sidebar-active'=>'#18181b'],
        // ── Neutral / Shadcn ──────────────────────────────────────────────────
        'shadcn'  => ['primary'=>'#18181b','primary-hover'=>'#27272a','primary-light'=>'#f4f4f5','primary-ring'=>'#71717a','sidebar-bg'=>'#09090b','sidebar-text'=>'#a1a1aa','sidebar-active'=>'#18181b'],
        // ── Stone — warm dark neutral, Tailwind Stone-800 ────────────────────
        'stone'   => ['primary'=>'#292524','primary-hover'=>'#1c1917','primary-light'=>'#f5f5f4','primary-ring'=>'#a8a29e','sidebar-bg'=>'#1c1917','sidebar-text'=>'#a8a29e','sidebar-active'=>'#292524'],
        // ── Colour themes ─────────────────────────────────────────────────────
        'violet'  => ['primary'=>'#7c3aed','primary-hover'=>'#6d28d9','primary-light'=>'#ede9fe','primary-ring'=>'#c4b5fd','sidebar-bg'=>'#18181b','sidebar-text'=>'#a1a1aa','sidebar-active'=>'#7c3aed'],
        'slate'   => ['primary'=>'#475569','primary-hover'=>'#334155','primary-light'=>'#f1f5f9','primary-ring'=>'#94a3b8','sidebar-bg'=>'#0f172a','sidebar-text'=>'#94a3b8','sidebar-active'=>'#475569'],
        'rose'    => ['primary'=>'#e11d48','primary-hover'=>'#be123c','primary-light'=>'#fff1f2','primary-ring'=>'#fda4af','sidebar-bg'=>'#1c0a0e','sidebar-text'=>'#fb7185','sidebar-active'=>'#e11d48'],
        'emerald' => ['primary'=>'#059669','primary-hover'=>'#047857','primary-light'=>'#ecfdf5','primary-ring'=>'#6ee7b7','sidebar-bg'=>'#022c22','sidebar-text'=>'#6ee7b7','sidebar-active'=>'#059669'],
        'amber'   => ['primary'=>'#d97706','primary-hover'=>'#b45309','primary-light'=>'#fffbeb','primary-ring'=>'#fcd34d','sidebar-bg'=>'#1c1400','sidebar-text'=>'#fcd34d','sidebar-active'=>'#d97706'],
        'sky'     => ['primary'=>'#0284c7','primary-hover'=>'#0369a1','primary-light'=>'#e0f2fe','primary-ring'=>'#7dd3fc','sidebar-bg'=>'#082f49','sidebar-text'=>'#7dd3fc','sidebar-active'=>'#0284c7'],
    ];

    public function __construct()
    {
        $this->config = \config('larafusion.theme', []);

        // Session overrides (set by SettingsController)
        if (\session()->has('larafusion_theme')) {
            $this->config['name'] = \session('larafusion_theme');
        }
        if (\session()->has('larafusion_dark_mode')) {
            $this->config['dark_mode'] = \session('larafusion_dark_mode');
        }
    }

    public function name(): string     { return $this->config['name'] ?? 'neutral'; }
    public function available(): array { return array_keys(self::THEMES); }

    public function cssVars(): array
    {
        $base   = self::THEMES[$this->name()] ?? self::THEMES['stone'];
        $custom = $this->config['colors'] ?? [];

        // If primary is a hex colour, auto-derive all companion variables so
        // ->colors(['primary' => '#292524']) works without manually specifying
        // primary-hover, primary-light, primary-ring, sidebar-* etc.
        $derived = isset($custom['primary']) && str_starts_with($custom['primary'], '#')
            ? static::deriveFromHex($custom['primary'])
            : [];

        // Priority (highest wins): explicit custom > auto-derived > named-theme base
        $colors = array_merge($base, $derived, $custom);

        $vars = [];
        foreach ($colors as $key => $value) {
            $vars["--larafusion-{$key}"] = $value;
        }
        $vars['--larafusion-font']      = $this->config['font']      ?? '"Instrument Sans", system-ui, sans-serif';
        $vars['--larafusion-font-mono'] = $this->config['font_mono'] ?? '"JetBrains Mono", monospace';
        $vars['--larafusion-radius']    = $this->config['radius']    ?? '0.625rem';
        return $vars;
    }

    public function toArray(): array
    {
        return [
            'name'             => $this->name(),
            'cssVars'          => $this->cssVars(),
            'available'        => $this->available(),
            'brand'            => [
                'name'        => \config('larafusion.brand.name', \config('app.name')),
                'logo'        => \config('larafusion.brand.logo'),
                'darkLogo'    => \config('larafusion.brand.dark_logo'),
                'logoHeight'  => \config('larafusion.brand.logo_height', '2rem'),
                'favicon'     => \config('larafusion.brand.favicon'),
            ],
            'font'             => \config('larafusion.font.family'),
            'fontWeight'       => \config('larafusion.font.weight', '300..900'),
            'darkMode'         => (bool) ($this->config['dark_mode'] ?? false),
            'defaultThemeMode' => \config('larafusion.theme.default_mode', 'light'),
        ];
    }

    // ── Color derivation ──────────────────────────────────────────────────────

    /**
     * Derive the full set of CSS companion variables from a single hex colour.
     *
     * Used when ->colors(['primary' => '#hex']) is called with only a primary
     * override — auto-generates primary-hover, primary-light, primary-ring,
     * sidebar-bg, sidebar-text, and sidebar-active so callers don't have to
     * specify every variable manually.
     */
    public static function deriveFromHex(string $hex): array
    {
        [$h, $s, $l] = static::hexToHsl($hex);
        $isDark = $l < 40;

        if ($isDark) {
            // Dark primaries (e.g. #292524, stone-800): lighter companions
            return [
                'primary'        => $hex,
                'primary-hover'  => static::hslToHex($h, $s, max(0,  $l - 5)),
                'primary-light'  => static::hslToHex($h, min($s, 8), 97),
                'primary-ring'   => static::hslToHex($h, (int) round($s * 0.6), 60),
                'sidebar-bg'     => static::hslToHex($h, $s, max(0,  $l - 5)),
                'sidebar-text'   => static::hslToHex($h, (int) round($s * 0.5), 65),
                'sidebar-active' => $hex,
            ];
        }

        // Saturated primaries (e.g. #7c3aed violet, #059669 emerald): dark sidebar
        return [
            'primary'        => $hex,
            'primary-hover'  => static::hslToHex($h, $s, max(0,  $l - 8)),
            'primary-light'  => static::hslToHex($h, min($s, 20), 95),
            'primary-ring'   => static::hslToHex($h, (int) round($s * 0.6), min(95, $l + 20)),
            'sidebar-bg'     => static::hslToHex($h, min($s, 15), 12),
            'sidebar-text'   => static::hslToHex($h, (int) round($s * 0.3), 65),
            'sidebar-active' => $hex,
        ];
    }

    /**
     * Convert a hex colour to [hue (0–360), saturation (0–100), lightness (0–100)].
     */
    private static function hexToHsl(string $hex): array
    {
        $hex = ltrim($hex, '#');
        if (strlen($hex) === 3) {
            $hex = $hex[0].$hex[0].$hex[1].$hex[1].$hex[2].$hex[2];
        }

        [$r, $g, $b] = array_map(fn ($c) => hexdec($c) / 255, str_split($hex, 2));

        $max = max($r, $g, $b);
        $min = min($r, $g, $b);
        $l   = ($max + $min) / 2;

        if (abs($max - $min) < 0.0001) {
            return [0, 0, (int) round($l * 100)];
        }

        $d = $max - $min;
        $s = $l > 0.5 ? $d / (2 - $max - $min) : $d / ($max + $min);

        $h = match (true) {
            abs($max - $r) < 0.0001 => (($g - $b) / $d + ($g < $b ? 6 : 0)) / 6,
            abs($max - $g) < 0.0001 => (($b - $r) / $d + 2) / 6,
            default                 => (($r - $g) / $d + 4) / 6,
        };

        return [(int) round($h * 360), (int) round($s * 100), (int) round($l * 100)];
    }

    /**
     * Convert HSL values to a lowercase 6-digit hex string.
     */
    private static function hslToHex(int $h, float $s, float $l): string
    {
        $s /= 100;
        $l /= 100;
        $h  = (($h % 360) + 360) % 360; // normalise to 0–359

        $c = (1 - abs(2 * $l - 1)) * $s;
        $x = $c * (1 - abs(fmod($h / 60.0, 2) - 1));
        $m = $l - $c / 2;

        [$r, $g, $b] = match (true) {
            $h < 60  => [$c, $x, 0.0],
            $h < 120 => [$x, $c, 0.0],
            $h < 180 => [0.0, $c, $x],
            $h < 240 => [0.0, $x, $c],
            $h < 300 => [$x, 0.0, $c],
            default  => [$c, 0.0, $x],
        };

        return sprintf('#%02x%02x%02x',
            (int) round(($r + $m) * 255),
            (int) round(($g + $m) * 255),
            (int) round(($b + $m) * 255),
        );
    }
}
