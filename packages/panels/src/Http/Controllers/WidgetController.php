<?php

namespace Larafusion\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Larafusion\LarafusionManager;

class WidgetController extends Controller
{
    /**
     * Return the data payload for a single registered widget.
     * Called by the React widget components to load and poll their own data independently.
     *
     * GET /admin/_widgets/data?class=App\Larafusion\Widgets\DashboardStatsWidget
     */
    public function data(Request $request): JsonResponse
    {
        $class = $request->query('class');

        if (!$class) {
            return response()->json(['error' => 'Widget class is required.'], 422);
        }

        // Validate the class is actually a registered widget — never instantiate
        // arbitrary user-supplied class names.
        $registered = LarafusionManager::getWidgets();
        $found = null;

        foreach ($registered as $widget) {
            $widgetClass = is_string($widget) ? $widget : get_class($widget);
            if ($widgetClass === $class) {
                $found = $widget;
                break;
            }
        }

        if ($found === null) {
            return response()->json(['error' => 'Widget not found.'], 404);
        }

        $instance = is_string($found) ? $found::make() : $found;

        return response()->json($instance->getData());
    }
}
