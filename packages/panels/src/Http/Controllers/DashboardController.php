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

            'stats' => Inertia::defer(function () {
                $resources = LarafusionManager::all();
                $counts    = [];

                foreach ($resources as $slug => $class) {
                    try {
                        $counts[$slug] = $class::getModelInstance()->count();
                    } catch (\Throwable) {
                        $counts[$slug] = 0;
                    }
                }

                return [
                    'total'  => array_sum($counts),
                    'counts' => $counts,
                ];
            }),

            // Widget metadata only (no DB queries) — each widget fetches its own
            // data independently via GET /_widgets/data?class=... and polls at its own interval.
            'widgetsMeta' => array_map(
                fn($w) => (is_string($w) ? $w::make() : $w)->toMeta(),
                LarafusionManager::getWidgets()
            ),
        ]);
    }
}
