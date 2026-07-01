<?php

namespace Larafusion\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Larafusion\LarafusionManager;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Larafusion/Dashboard', [
            'navigation' => LarafusionManager::getNavigation(),

            // Widget metadata only (no DB queries) — each widget fetches its own
            // data independently via GET /_widgets/data?class=... and polls at its own interval.
            'widgetsMeta' => array_map(
                fn($w) => (is_string($w) ? $w::make() : $w)->toMeta(),
                LarafusionManager::getWidgets()
            ),
        ]);
    }
}
