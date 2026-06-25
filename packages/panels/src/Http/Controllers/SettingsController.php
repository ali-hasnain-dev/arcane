<?php

namespace Larafusion\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Larafusion\LarafusionManager;

class SettingsController extends Controller
{
    public function index()
    {
        return Inertia::render('Larafusion/Settings', [
            'navigation' => LarafusionManager::getNavigation(),
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
            'theme'     => ['required', 'string', 'in:' . implode(',', LarafusionManager::theme()->available())],
            'dark_mode' => ['sometimes', 'boolean'],
        ]);

        // Store in session (override config for this session)
        session([
            'larafusion_theme'     => $request->get('theme'),
            'larafusion_dark_mode' => $request->boolean('dark_mode', false),
        ]);

        return back()->with('success', 'Theme updated.');
    }
}
