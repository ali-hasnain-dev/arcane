<?php

namespace Arcane\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Arcane\ArcaneManager;

class SettingsController extends Controller
{
    public function index()
    {
        return Inertia::render('Arcane/Settings', [
            'navigation' => ArcaneManager::getNavigation(),
        ]);
    }

    /**
     * Switch theme — stores preference in session.
     * In production you'd persist to user preferences or DB.
     * POST /admin/settings/theme
     */
    public function updateTheme(Request $request)
    {
        $request->validate([
            'theme'     => ['required', 'string', 'in:' . implode(',', ArcaneManager::theme()->available())],
            'dark_mode' => ['sometimes', 'boolean'],
        ]);

        // Store in session (override config for this session)
        session([
            'arcane_theme'     => $request->get('theme'),
            'arcane_dark_mode' => $request->boolean('dark_mode', false),
        ]);

        return back()->with('success', 'Theme updated.');
    }
}
