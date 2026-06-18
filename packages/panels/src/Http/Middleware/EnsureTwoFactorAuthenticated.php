<?php

namespace Arcane\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Arcane\ArcaneManager;

class EnsureTwoFactorAuthenticated
{
    public function handle(Request $request, Closure $next): mixed
    {
        $panel = ArcaneManager::getPanel();

        if (!$panel || !$panel->hasTwoFactor()) {
            return $next($request);
        }

        $user = Auth::guard($panel->getAuthGuard())->user();
        if (!$user) {
            return $next($request);
        }

        // If 2FA is enforced and the user hasn't confirmed setup yet
        if ($panel->isTwoFactorEnforced() && empty($user->two_factor_confirmed_at)) {
            $setupRoute = route('arcane.two-factor.setup');
            if (!$request->is($setupRoute) && $request->url() !== $setupRoute) {
                return redirect()->route('arcane.two-factor.setup');
            }
        }

        return $next($request);
    }
}
