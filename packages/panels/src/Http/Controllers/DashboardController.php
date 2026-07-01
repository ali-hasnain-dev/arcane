<?php

namespace Larafusion\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Larafusion\LarafusionManager;

class DashboardController extends Controller
{
    public function index()
    {
        $panel = LarafusionManager::getPanel();

        return Inertia::render('Larafusion/Dashboard', [
            'navigation' => LarafusionManager::getNavigation(),

            // Widget metadata only (no DB queries) — each widget fetches its own
            // data independently via GET /_widgets/data?class=... and polls at its own interval.
            'widgetsMeta' => array_map(
                fn($w) => (is_string($w) ? $w::make() : $w)->toMeta(),
                LarafusionManager::getWidgets()
            ),

            // Default greeting/GitHub placeholder cards — shown only while ->widgets([])
            // is present but empty. Remove that call, or add real widgets, to turn them off.
            'showDefaultCards' => $panel?->showsDefaultDashboardCards() ?? false,
        ]);
    }
}
