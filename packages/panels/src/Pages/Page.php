<?php

namespace Arcane\Pages;

use Inertia\Inertia;
use Inertia\Response;

/**
 * Base class for arbitrary non-CRUD admin pages.
 *
 * Usage:
 *   class ReportsPage extends Page {
 *       protected static string $slug  = 'reports';
 *       protected static string $title = 'Reports';
 *
 *       public static function getView(): string { return 'Arcane/Reports'; }
 *       public static function getViewData(): array { return ['items' => ...]; }
 *   }
 *
 * Then register: ArcaneManager::registerPages([ReportsPage::class])
 * And create your React component at resources/js/Pages/Arcane/Reports.tsx
 */
abstract class Page
{
    protected static string  $slug             = '';
    protected static string  $title            = '';
    protected static string  $navigationLabel  = '';
    protected static string  $navigationIcon   = 'file';
    protected static ?string $navigationGroup  = null;
    protected static int     $navigationSort   = 0;
    protected static bool    $showInNavigation = true;

    // ── Must override ─────────────────────────────────────────────────────────
    abstract public static function getView(): string;

    // ── Optional ─────────────────────────────────────────────────────────────
    public static function getViewData(): array { return []; }

    // ── Getters ───────────────────────────────────────────────────────────────
    public static function getSlug(): string
    {
        if (static::$slug) return static::$slug;
        $parts = explode('\\', static::class);
        return strtolower(str_replace('Page', '', end($parts)));
    }

    public static function getTitle(): string
    {
        if (static::$title) return static::$title;
        $parts = explode('\\', static::class);
        return str_replace('Page', '', end($parts));
    }

    public static function getNavigationLabel(): string
    {
        return static::$navigationLabel ?: static::getTitle();
    }

    public static function getNavigationIcon(): string   { return static::$navigationIcon; }
    public static function getNavigationGroup(): ?string { return static::$navigationGroup; }
    public static function getNavigationSort(): int      { return static::$navigationSort; }
    public static function showInNavigation(): bool      { return static::$showInNavigation; }

    // ── Render ────────────────────────────────────────────────────────────────
    public static function render(): Response
    {
        return Inertia::render(static::getView(), array_merge(
            ['pageTitle' => static::getTitle()],
            static::getViewData()
        ));
    }
}
