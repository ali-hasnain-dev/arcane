<?php

namespace Arcane\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Arcane\ArcaneManager;

/**
 * Arcane Precognition Middleware
 *
 * When a request comes in with the `Precognition: true` header,
 * this middleware runs ONLY the validation (via the resource's rules)
 * and returns the result — without executing the controller action.
 *
 * This powers the hybrid validation in @arcane/form:
 * - Simple rules are validated instantly on the client (no network)
 * - unique/exists rules fire a Precognition request here
 */
class HandlePrecognition
{
    public function handle(Request $request, Closure $next): mixed
    {
        if (!$request->headers->has('Precognition')) {
            return $next($request);
        }

        // Extract the resource slug from route
        $resourceSlug = $request->route('resource');
        if (!$resourceSlug) {
            return $next($request);
        }

        try {
            $resourceClass = ArcaneManager::resolve($resourceSlug);
        } catch (\Throwable) {
            return $next($request);
        }

        // Determine rules (create vs update)
        $id    = $request->route('id');
        $rules = $id
            ? $resourceClass::getUpdateRules($id)
            : $resourceClass::getCreateRules();

        // If validating only a specific field (Precognition-Validate-Only header)
        $validateOnly = $request->header('Precognition-Validate-Only');
        if ($validateOnly && isset($rules[$validateOnly])) {
            $rules = [$validateOnly => $rules[$validateOnly]];
        }

        // Run validation
        $validator = validator($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Valid — return 204 No Content
        return response()->noContent();
    }
}
