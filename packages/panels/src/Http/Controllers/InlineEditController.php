<?php

namespace Arcane\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Arcane\ArcaneManager;

class InlineEditController extends Controller
{
    public function update(Request $request, string $resource, int|string $id)
    {
        $resourceClass = ArcaneManager::resolve($resource);
        abort_unless($resourceClass::canEdit(), 403);

        $field = $request->input('field');
        $value = $request->input('value');

        abort_if($field === null, 422, 'field is required.');
        abort_unless(in_array($field, $resourceClass::getInlineEditable()), 403, "Field [{$field}] is not inline-editable.");

        $record = $resourceClass::getModelInstance()->findOrFail($id);

        // Hash passwords inline too
        if (str_contains(strtolower($field), 'password') && $value) {
            $value = bcrypt($value);
        }

        $record->update([$field => $value]);

        return response()->json([
            'success' => true,
            'value'   => $record->fresh()->{$field},
        ]);
    }
}
