import React from 'react';

// ── Dashboard widget DATA animations ──────────────────────────────────────────
// Opt-in, configured on the panel via ->widgetAnimations(). These animate the
// *data inside* a widget as it first loads — not the card itself. Each chart
// type gets the reveal that suits its shape:
//   • stat overview  — numbers count up; sparklines draw in
//   • line / area    — the series wipes in left→right; points pop in after
//   • bar            — bars grow up from the baseline, staggered
//   • pie / doughnut — slices sweep around like a clock; centre total counts up
//   • radar / polar  — the plot grows out from the centre
//   • scatter/bubble — points pop in with a short stagger
// Everything runs once on first reveal and never on polling refreshes, and is
// fully suppressed under prefers-reduced-motion.

/** Keyframes used by the CSS-driven SVG animations + a reduced-motion guard. */
const WIDGET_ANIMATION_CSS = `
@keyframes lf-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes lf-fade-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes lf-grow-up { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes lf-wipe { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes lf-pop { from { opacity: 0; transform: scale(.6) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) {
  [data-lf-anim] { animation: none !important; stroke-dashoffset: 0 !important; transform: none !important; opacity: 1 !important }
}
`;

/** One-time <style> block carrying the keyframes; render once near the widget grid. */
export function WidgetAnimationStyles(): React.ReactElement {
    return React.createElement('style', null, WIDGET_ANIMATION_CSS);
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

/** True when the user has asked the OS to minimise motion. */
function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Drive a 0→1 reveal progress over `durationMs` when `enabled`, easing out.
 * Used by charts whose geometry has to be interpolated frame-by-frame (pie
 * sweep, radar/polar grow) rather than expressed as a CSS keyframe. Runs once;
 * returns 1 immediately when disabled so polling refreshes render the final
 * shape with no motion.
 */
export function useReveal(enabled: boolean, durationMs = 850): number {
    const active = enabled && !prefersReducedMotion();
    const [progress, setProgress] = React.useState<number>(active ? 0 : 1);
    const started = React.useRef(false);

    React.useEffect(() => {
        if (!active) { setProgress(1); return; }
        if (started.current) { setProgress(1); return; }
        started.current = true;

        let raf = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const t = Math.min((now - start) / durationMs, 1);
            setProgress(easeOutCubic(t));
            if (t < 1) raf = requestAnimationFrame(tick);
            else setProgress(1);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [active, durationMs]);

    return progress;
}

/**
 * Animate a number from 0 up to `target` when `enabled`, easing out over
 * `durationMs`. Runs once; when disabled it returns the target immediately so
 * polling refreshes render the final value with no motion.
 */
export function useCountUp(target: number, enabled: boolean, durationMs = 900): number {
    const active = enabled && !prefersReducedMotion();
    const [value, setValue] = React.useState<number>(active ? 0 : target);
    const started = React.useRef(false);

    React.useEffect(() => {
        if (!active) { setValue(target); return; }
        if (started.current) { setValue(target); return; }
        started.current = true;

        let raf = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const t = Math.min((now - start) / durationMs, 1);
            setValue(target * easeOutCubic(t));
            if (t < 1) raf = requestAnimationFrame(tick);
            else setValue(target);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [active, target, durationMs]);

    return value;
}
