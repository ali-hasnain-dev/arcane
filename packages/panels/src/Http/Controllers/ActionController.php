<?php

namespace Larafusion\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Larafusion\LarafusionManager;
use Larafusion\Actions\ButtonAction;
use Larafusion\Actions\LinkAction;
use Larafusion\Tables\Table;
use Larafusion\Tables\Actions\Action as TableAction;

class ActionController extends Controller
{
    public function handle(Request $request, string $resource, int|string $id, string $action)
    {
        $resourceClass = LarafusionManager::resolve($resource);
        $record        = $resourceClass::getModelInstance()->findOrFail($id);

        $actionInstance = null;

        // Search legacy actions() first
        foreach ($resourceClass::actions() as $a) {
            if ($a->getKey() === $action) {
                $actionInstance = $a;
                break;
            }
        }

        // Also search custom Action instances inside recordActions()
        if ($actionInstance === null) {
            foreach ($resourceClass::table(Table::make())->getRecordActions() as $a) {
                if ($a instanceof TableAction && $a->getKey() === $action) {
                    $actionInstance = $a;
                    break;
                }
            }
        }

        abort_if($actionInstance === null, 404, "Action [{$action}] not found.");
        abort_unless($actionInstance->visibleFor($record), 403);

        // Link actions are client-side only — no server execution
        if ($actionInstance instanceof LinkAction) {
            return response()->json(['url' => $actionInstance->resolveUrl($record)]);
        }

        /** @var ButtonAction $actionInstance */
        $result = $actionInstance->execute($record, $request->all());

        if ($result instanceof \Illuminate\Http\RedirectResponse) {
            return $result;
        }

        if ($result !== null) {
            return response()->json($result);
        }

        $message = $actionInstance->getSuccessMessage()
            ?? ucwords(str_replace(['_', '-'], ' ', $action)) . ' completed successfully.';

        $redirectTo = $actionInstance->getRedirectTo()
            ?? route('larafusion.resource.index', $resource);

        return redirect($redirectTo)->with('success', $message);
    }
}
