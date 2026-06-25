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

            'widgets' => Inertia::defer(function () {
                return array_map(fn($w) => $w->toArray(), LarafusionManager::getWidgets());
            }),
        ]);
    }
}
