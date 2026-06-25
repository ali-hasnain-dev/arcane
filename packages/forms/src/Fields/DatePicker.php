<?php

namespace Larafusion\Fields;

use Larafusion\Concerns\HasAffixes;

class DatePicker extends Field
{
    use HasAffixes;

    // ── Core ──────────────────────────────────────────────────────────────────
    protected ?string $minDate = null;
    protected ?string $maxDate = null;
    protected string  $format  = 'Y-m-d';

    // ── Time picker ───────────────────────────────────────────────────────────
    protected bool $time    = false;
    protected bool $seconds = false;

    // ── Display ───────────────────────────────────────────────────────────────
    protected ?string $displayFormat         = null;
    protected ?string $timezone              = null;
    protected bool    $closeOnDateSelection  = true;
    protected bool    $readOnly              = false;
    protected int     $firstDayOfWeek        = 0;  // 0 = Sunday, 1 = Monday

    // ── Disabled dates ────────────────────────────────────────────────────────
    protected array $disabledDates = [];

    // ── Picker mode ───────────────────────────────────────────────────────────
    protected bool $native = true;

    public function getType(): string { return 'date'; }

    // ── Core ──────────────────────────────────────────────────────────────────

    public function minDate(string $d): static  { $this->minDate = $d; $this->addRule("after_or_equal:{$d}");  return $this; }
    public function maxDate(string $d): static  { $this->maxDate = $d; $this->addRule("before_or_equal:{$d}"); return $this; }
    public function format(string $f): static   { $this->format  = $f; return $this; }

    // ── Time picker ───────────────────────────────────────────────────────────

    /** Include a time input alongside the date. Sets storage format to 'Y-m-d H:i'. */
    public function time(bool $v = true): static
    {
        $this->time   = $v;
        if ($v && $this->format === 'Y-m-d') {
            $this->format = 'Y-m-d H:i';
        }
        return $this;
    }

    /** Include seconds in the time picker (implies time: true). */
    public function seconds(bool $v = true): static
    {
        if ($v) {
            $this->time    = true;
            $this->seconds = true;
            if ($this->format === 'Y-m-d' || $this->format === 'Y-m-d H:i') {
                $this->format = 'Y-m-d H:i:s';
            }
        } else {
            $this->seconds = false;
        }
        return $this;
    }

    // ── Display ───────────────────────────────────────────────────────────────

    /**
     * Set a separate human-readable display format (e.g. 'M d, Y').
     * The storage format is controlled by ->format().
     */
    public function displayFormat(string $f): static     { $this->displayFormat = $f; return $this; }

    /** Timezone for displaying and storing the date/time (e.g. 'America/New_York'). */
    public function timezone(string $tz): static         { $this->timezone = $tz; return $this; }

    /** Close the picker immediately after the user picks a date (default: true). */
    public function closeOnDateSelection(bool $v = true): static { $this->closeOnDateSelection = $v; return $this; }

    /** Make the input read-only — user cannot type, but can still use the picker. */
    public function readOnly(bool $v = true): static     { $this->readOnly = $v; return $this; }

    /** Start the calendar week on Monday (ISO 8601). */
    public function weekStartsOnMonday(): static         { $this->firstDayOfWeek = 1; return $this; }

    /** Start the calendar week on Sunday (default). */
    public function weekStartsOnSunday(): static         { $this->firstDayOfWeek = 0; return $this; }

    // ── Disabled dates ────────────────────────────────────────────────────────

    /**
     * Prevent specific dates from being selected.
     * Pass ISO date strings: ['2025-12-25', '2025-12-31']
     */
    public function disabledDates(array $dates): static  { $this->disabledDates = $dates; return $this; }

    // ── Picker mode ───────────────────────────────────────────────────────────

    /**
     * Use the browser-native date input (default: true).
     * Pass false to render a custom JavaScript calendar picker instead.
     *
     * Example: DatePicker::make('launch_date')->native(false)
     */
    public function native(bool $v = true): static       { $this->native = $v; return $this; }

    // ── Serialization ─────────────────────────────────────────────────────────

    public function toArray(): array
    {
        $arr = array_merge(parent::toArray(), [
            'minDate'             => $this->minDate,
            'maxDate'             => $this->maxDate,
            'format'              => $this->format,
            'time'                => $this->time,
            'seconds'             => $this->seconds,
            'closeOnDateSelection' => $this->closeOnDateSelection,
            'readOnly'            => $this->readOnly,
            'firstDayOfWeek'      => $this->firstDayOfWeek,
        ], $this->affixesToArray());

        if ($this->displayFormat !== null) $arr['displayFormat'] = $this->displayFormat;
        if ($this->timezone !== null)      $arr['timezone']      = $this->timezone;
        if (!empty($this->disabledDates))  $arr['disabledDates'] = $this->disabledDates;
        if (!$this->native)                $arr['native']        = false;

        return $arr;
    }
}
