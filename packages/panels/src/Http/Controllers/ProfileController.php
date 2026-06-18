<?php

namespace Arcane\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class ProfileController extends Controller
{
    protected function panel(): \Arcane\Panel
    {
        return app('arcane')->getPanel();
    }

    protected function guard(): \Illuminate\Contracts\Auth\Guard
    {
        return Auth::guard($this->panel()->getAuthGuard());
    }

    public function show()
    {
        $panel = $this->panel();
        abort_unless($panel->hasProfile(), 404);

        return Inertia::render('Arcane/Profile', [
            'revealablePasswords' => $panel->hasRevealablePasswords(),
        ]);
    }

    public function update(Request $request)
    {
        $panel = $this->panel();
        abort_unless($panel->hasProfile(), 404);

        /** @var \Illuminate\Foundation\Auth\User $user */
        $user = $this->guard()->user();

        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $user->getKey()],
        ]);

        $user->forceFill([
            'name'  => $validated['name'],
            'email' => $validated['email'],
        ])->save();

        return back()->with('status', 'Profile updated.');
    }

    public function updatePassword(Request $request)
    {
        $panel = $this->panel();
        abort_unless($panel->hasProfile(), 404);

        /** @var \Illuminate\Foundation\Auth\User $user */
        $user = $this->guard()->user();

        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password'         => ['required', 'confirmed', Password::min(8)],
        ]);

        $user->forceFill([
            'password' => bcrypt($request->password),
        ])->save();

        return back()->with('password_status', 'Password updated.');
    }
}
