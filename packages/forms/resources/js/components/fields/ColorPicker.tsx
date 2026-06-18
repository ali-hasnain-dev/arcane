import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ColorField, ValidationStatus } from '../../types';
import FieldWrapper from './FieldWrapper';
import { cn } from '../../lib/utils';

// ─── Color math ───────────────────────────────────────────────────────────────

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    const hi = Math.floor(h / 60) % 6;
    const f  = h / 60 - Math.floor(h / 60);
    const p  = v * (1 - s);
    const q  = v * (1 - f * s);
    const t  = v * (1 - (1 - f) * s);
    const m  = [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][hi];
    return [Math.round(m[0]*255), Math.round(m[1]*255), Math.round(m[2]*255)];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    if (d !== 0) {
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6;               break;
            case b: h = ((r - g) / d + 4) / 6;               break;
        }
    }
    return [h * 360, s, v];
}

function hexToRgb(hex: string): [number, number, number] | null {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b]
        .map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0'))
        .join('');
}

// ─── Format conversion helpers ────────────────────────────────────────────────

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, Math.round(l * 100)];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6;               break;
        case b: h = ((r - g) / d + 4) / 6;               break;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function parseAnyColor(val: string): [number, number, number] | null {
    // hex
    const hex = hexToRgb(val);
    if (hex) return hex;
    // rgb(r, g, b) or rgba(r, g, b, a)
    const rgb = val.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (rgb) return [+rgb[1], +rgb[2], +rgb[3]];
    // hsl(h, s%, l%)
    const hsl = val.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i);
    if (hsl) {
        const [h, s, l] = [+hsl[1], +hsl[2] / 100, +hsl[3] / 100];
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        const hk = h / 360;
        const toRgb = (t: number) => {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        return [Math.round(toRgb(hk + 1/3) * 255), Math.round(toRgb(hk) * 255), Math.round(toRgb(hk - 1/3) * 255)];
    }
    return null;
}

function formatColor(r: number, g: number, b: number, format: string, alpha = 1): string {
    switch (format) {
        case 'rgb':  return `rgb(${r}, ${g}, ${b})`;
        case 'rgba': return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        case 'hsl': { const [h, s, l] = rgbToHsl(r, g, b); return `hsl(${h}, ${s}%, ${l}%)`; }
        default:    return rgbToHex(r, g, b);
    }
}

const DEFAULT_PRESETS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
    '#6b7280', '#1f2937', '#ffffff', '#000000',
];

// ─── Saturation / Value canvas ────────────────────────────────────────────────

function SVCanvas({ hue, s, v, onChange }: {
    hue: number; s: number; v: number;
    onChange: (s: number, v: number) => void;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dragging  = useRef(false);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width, H = canvas.height;
        const [hr, hg, hb] = hsvToRgb(hue, 1, 1);

        const gH = ctx.createLinearGradient(0, 0, W, 0);
        gH.addColorStop(0, 'rgba(255,255,255,1)');
        gH.addColorStop(1, `rgb(${hr},${hg},${hb})`);
        ctx.fillStyle = gH;
        ctx.fillRect(0, 0, W, H);

        const gV = ctx.createLinearGradient(0, 0, 0, H);
        gV.addColorStop(0, 'rgba(0,0,0,0)');
        gV.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = gV;
        ctx.fillRect(0, 0, W, H);
    }, [hue]);

    useEffect(() => { draw(); }, [draw]);

    const pick = useCallback((e: MouseEvent | React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const nx = Math.max(0, Math.min(1, (e.clientX - rect.left)  / rect.width));
        const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        onChange(nx, 1 - ny);
    }, [onChange]);

    useEffect(() => {
        const onMove = (e: MouseEvent) => { if (dragging.current) pick(e); };
        const onUp   = () => { dragging.current = false; };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onUp);
        return () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup',   onUp);
        };
    }, [pick]);

    return (
        <div className="relative w-full h-36 rounded-lg overflow-hidden cursor-crosshair select-none">
            <canvas
                ref={canvasRef}
                width={256} height={144}
                className="w-full h-full"
                onMouseDown={e => { dragging.current = true; pick(e); }}
            />
            {/* Picker dot */}
            <div
                className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow pointer-events-none"
                style={{
                    left: `${s * 100}%`,
                    top:  `${(1 - v) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                }}
            />
        </div>
    );
}

// ─── Hue slider ───────────────────────────────────────────────────────────────

function HueSlider({ hue, onChange }: { hue: number; onChange: (h: number) => void }) {
    const ref      = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);

    const pick = useCallback((e: MouseEvent | React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        onChange(nx * 360);
    }, [onChange]);

    useEffect(() => {
        const onMove = (e: MouseEvent) => { if (dragging.current) pick(e); };
        const onUp   = () => { dragging.current = false; };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onUp);
        return () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup',   onUp);
        };
    }, [pick]);

    return (
        <div
            ref={ref}
            className="relative h-3 rounded-full cursor-pointer select-none"
            style={{ background: 'linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' }}
            onMouseDown={e => { dragging.current = true; pick(e); }}
        >
            <div
                className="absolute w-4 h-4 rounded-full border-2 border-white shadow pointer-events-none"
                style={{
                    left: `${(hue / 360) * 100}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: `hsl(${hue},100%,50%)`,
                }}
            />
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ColorPickerProps {
    field: ColorField;
    value: string;
    error?: string;
    status?: ValidationStatus;
    onChange: (val: string) => void;
    onBlur?: () => void;
}

export default function ColorPicker({ field, value = '#3b82f6', error, status = 'idle', onChange, onBlur }: ColorPickerProps) {
    const [open, setOpen]   = useState(false);
    const [openUp, setOpenUp] = useState(false);
    const [alpha, setAlpha] = useState(1);
    const ref               = useRef<HTMLDivElement>(null);
    const fmt               = field.format ?? 'hex';
    const presets           = field.presets ?? DEFAULT_PRESETS;

    // Parse any stored format back to RGB for the picker
    const rgb = parseAnyColor(value) ?? [59, 130, 246];
    const [hue, sat, val] = rgbToHsv(rgb[0], rgb[1], rgb[2]);

    // The hex display in the text input always shows hex for editing
    const [hexInput, setHexInput] = useState(rgbToHex(rgb[0], rgb[1], rgb[2]));
    useEffect(() => {
        const parsed = parseAnyColor(value);
        if (parsed) setHexInput(rgbToHex(parsed[0], parsed[1], parsed[2]));
    }, [value]);

    // Emit value in the configured format
    const emit = (r: number, g: number, b: number, a = alpha) => {
        onChange(formatColor(r, g, b, fmt, a));
    };

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                onBlur?.();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onBlur]);

    const handleOpen = () => {
        if (field.disabled) return;
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setOpenUp(window.innerHeight - rect.bottom < 400 && rect.top > window.innerHeight - rect.bottom);
        }
        setOpen(o => !o);
    };

    const handleSV = (s: number, v: number) => {
        const [r, g, b] = hsvToRgb(hue, s, v);
        setHexInput(rgbToHex(r, g, b));
        emit(r, g, b);
    };

    const handleHue = (h: number) => {
        const [r, g, b] = hsvToRgb(h, sat, val);
        setHexInput(rgbToHex(r, g, b));
        emit(r, g, b);
    };

    const handleHexInput = (v: string) => {
        setHexInput(v);
        if (/^#[0-9a-fA-F]{6}$/.test(v)) {
            const parsed = hexToRgb(v);
            if (parsed) emit(parsed[0], parsed[1], parsed[2]);
        }
    };

    const handleRgb = (channel: 0 | 1 | 2, raw: string) => {
        const n = Math.max(0, Math.min(255, parseInt(raw) || 0));
        const next: [number, number, number] = [rgb[0], rgb[1], rgb[2]];
        next[channel] = n;
        setHexInput(rgbToHex(next[0], next[1], next[2]));
        emit(next[0], next[1], next[2]);
    };

    const handleAlpha = (a: number) => {
        setAlpha(a);
        emit(rgb[0], rgb[1], rgb[2], a);
    };

    return (
        <FieldWrapper label={field.label} required={field.required} hint={field.hint} error={error} status={status}>
            <div className="relative" ref={ref}>
                {/* ── Trigger ────────────────────────────────────────────── */}
                <button
                    type="button"
                    onClick={handleOpen}
                    disabled={field.disabled}
                    className={cn(
                        'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg border text-sm transition-colors bg-white dark:bg-zinc-800',
                        open
                            ? 'border-[var(--arcane-primary,#18181b)] ring-2 ring-[var(--arcane-primary,#18181b)]/20'
                            : error
                            ? 'border-red-400'
                            : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                >
                    <span
                        className="w-5 h-5 rounded-md border border-black/10 dark:border-white/10 shrink-0"
                        style={{ backgroundColor: value }}
                    />
                    <span className="text-zinc-700 dark:text-zinc-300 font-mono text-xs">{value}</span>
                </button>

                {/* ── Picker panel ───────────────────────────────────────── */}
                {open && (
                    <div className={cn(
                        'absolute left-0 z-30 w-64 p-3 rounded-xl border shadow-xl',
                        'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700',
                        'animate-in fade-in-0 zoom-in-95',
                        openUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
                    )}>
                        {/* Preview + hex input */}
                        <div className="flex items-center gap-2 mb-3">
                            <span
                                className="w-10 h-10 rounded-lg border border-black/10 dark:border-white/10 shrink-0"
                                style={{ backgroundColor: value }}
                            />
                            <input
                                type="text"
                                value={hexInput}
                                onChange={e => handleHexInput(e.target.value)}
                                placeholder="#000000"
                                maxLength={7}
                                className="flex-1 px-2 py-1.5 text-xs font-mono rounded-lg border outline-none transition-colors bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-[var(--arcane-primary,#18181b)]/20 focus:border-[var(--arcane-primary,#18181b)]"
                            />
                        </div>

                        {/* SV canvas */}
                        <div className="mb-3">
                            <SVCanvas hue={hue} s={sat} v={val} onChange={handleSV} />
                        </div>

                        {/* Hue slider */}
                        <div className="mb-3 px-1">
                            <HueSlider hue={hue} onChange={handleHue} />
                        </div>

                        {/* RGB inputs */}
                        <div className="flex gap-1.5 mb-3">
                            {(['R', 'G', 'B'] as const).map((ch, i) => (
                                <div key={ch} className="flex-1 text-center">
                                    <input
                                        type="number"
                                        min={0} max={255}
                                        value={rgb[i]}
                                        onChange={e => handleRgb(i as 0|1|2, e.target.value)}
                                        className="w-full px-1 py-1 text-xs text-center rounded-md border outline-none transition-colors bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-[var(--arcane-primary,#18181b)]/20 focus:border-[var(--arcane-primary,#18181b)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 block">{ch}</span>
                                </div>
                            ))}
                        </div>

                        {/* Alpha slider — only for rgba format */}
                        {fmt === 'rgba' && (
                            <div className="mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide w-5 shrink-0">A</span>
                                    <div className="flex-1 relative h-3 rounded-full cursor-pointer"
                                        style={{ background: `linear-gradient(to right, transparent, rgb(${rgb[0]},${rgb[1]},${rgb[2]}))`, backgroundSize: '100%' }}>
                                        <input type="range" min={0} max={1} step={0.01}
                                            value={alpha}
                                            onChange={e => handleAlpha(+e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <div className="absolute w-4 h-4 rounded-full border-2 border-white shadow pointer-events-none"
                                            style={{ left: `${alpha * 100}%`, top: '50%', transform: 'translate(-50%,-50%)', backgroundColor: `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})` }} />
                                    </div>
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 w-8 text-right">{Math.round(alpha * 100)}%</span>
                                </div>
                            </div>
                        )}

                        {/* Format badge */}
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Presets</p>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase">{fmt}</span>
                        </div>

                        {/* Preset swatches */}
                        <div className="grid grid-cols-6 gap-1.5">
                            {presets.map(preset => {
                                const presetHex = parseAnyColor(preset) ? rgbToHex(...(parseAnyColor(preset)!)) : preset;
                                return (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => {
                                            const parsed = parseAnyColor(preset);
                                            if (parsed) { emit(parsed[0], parsed[1], parsed[2]); setHexInput(rgbToHex(parsed[0], parsed[1], parsed[2])); }
                                        }}
                                        title={preset}
                                        className={cn(
                                            'w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110',
                                            hexInput === presetHex
                                                ? 'border-[var(--arcane-primary,#18181b)] scale-110'
                                                : preset === '#ffffff'
                                                ? 'border-zinc-300 dark:border-zinc-600'
                                                : preset === '#000000'
                                                ? 'border-zinc-400 dark:border-zinc-500'
                                                : 'border-transparent',
                                        )}
                                        style={{ backgroundColor: preset }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </FieldWrapper>
    );
}
