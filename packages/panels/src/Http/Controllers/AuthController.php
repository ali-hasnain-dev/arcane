<?php

namespace Larafusion\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Larafusion\Contracts\LarafusionUser;

class AuthController extends Controller
{
    // ── Helpers ───────────────────────────────────────────────────────────────

    protected function panel(): \Larafusion\Panel
    {
        return app('larafusion')->getPanel();
    }

    protected function guard(): \Illuminate\Contracts\Auth\Guard
    {
        return Auth::guard($this->panel()->getAuthGuard());
    }

    protected function broker(): \Illuminate\Auth\Passwords\PasswordBroker
    {
        return Password::broker($this->panel()->getAuthPasswordBroker());
    }

    // ── Rate Limiting ─────────────────────────────────────────────────────────

    protected function throttleKey(Request $request): string
    {
        return Str::transliterate(Str::lower($request->input('email')) . '|' . $request->ip());
    }

    protected function ensureIsNotRateLimited(Request $request): void
    {
        $panel = $this->panel();
        if (!$panel->hasLoginRateLimiting()) return;

        $key = $this->throttleKey($request);
        if (!RateLimiter::tooManyAttempts($key, $panel->getLoginMaxAttempts())) return;

        $seconds = RateLimiter::availableIn($key);

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    public function showLogin(Request $request)
    {
        $panel = $this->panel();
        if ($this->guard()->check()) {
            return redirect('/' . $panel->getPath());
        }

        return Inertia::render('Larafusion/Auth/Login', [
            'hasRegistration'      => $panel->hasRegistration(),
            'hasForgotPassword'    => $panel->hasForgotPassword(),
            'revealablePasswords'  => $panel->hasRevealablePasswords(),
            'loginSlug'            => $panel->getLoginSlug(),
            'registrationSlug'     => $panel->getRegistrationSlug(),
            'forgotPasswordSlug'   => $panel->getForgotPasswordSlug(),
        ]);
    }

    public function login(Request $request)
    {
        $panel = $this->panel();

        $this->ensureIsNotRateLimited($request);

        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (!$this->guard()->attempt($credentials, $request->boolean('remember'))) {
            if ($panel->hasLoginRateLimiting()) {
                RateLimiter::hit(
                    $this->throttleKey($request),
                    $panel->getLoginDecayMinutes() * 60
                );
            }

            return back()->withErrors([
                'email' => 'These credentials do not match our records.',
            ])->onlyInput('email');
        }

        $user = $this->guard()->user();

        // Check canAccessPanel() if the model implements LarafusionUser
        if ($user instanceof LarafusionUser && !$user->canAccessPanel($panel)) {
            $this->guard()->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return back()->withErrors([
                'email' => 'You are not authorized to access this panel.',
            ])->onlyInput('email');
        }

        if ($panel->hasLoginRateLimiting()) {
            RateLimiter::clear($this->throttleKey($request));
        }

        $request->session()->regenerate();

        // ── Two-Factor Auth gate ──────────────────────────────────────────────
        if ($panel->hasTwoFactor() && $this->userHasTwoFactor($user)) {
            // Park the user in session but require 2FA confirmation
            $request->session()->put('larafusion.2fa.user', $user->getKey());
            $this->guard()->logout();

            return redirect()->route('larafusion.two-factor.challenge');
        }

        return redirect()->intended('/' . $panel->getPath());
    }

    protected function userHasTwoFactor($user): bool
    {
        return !empty($user->two_factor_secret) && !empty($user->two_factor_confirmed_at);
    }

    public function logout(Request $request)
    {
        $this->guard()->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/' . $this->panel()->getPath() . '/' . $this->panel()->getLoginSlug());
    }

    // ── Registration ──────────────────────────────────────────────────────────

    public function showRegister()
    {
        $panel = $this->panel();
        abort_unless($panel->hasRegistration(), 404);
        if ($this->guard()->check()) return redirect('/' . $panel->getPath());

        return Inertia::render('Larafusion/Auth/Register', [
            'revealablePasswords' => $panel->hasRevealablePasswords(),
            'loginSlug'           => $panel->getLoginSlug(),
        ]);
    }

    public function register(Request $request)
    {
        $panel = $this->panel();
        abort_unless($panel->hasRegistration(), 404);

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = \App\Models\User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => bcrypt($validated['password']),
        ]);

        $this->guard()->login($user);
        $request->session()->regenerate();

        return redirect()->intended('/' . $panel->getPath());
    }

    // ── Forgot / Reset Password ───────────────────────────────────────────────

    public function showForgotPassword()
    {
        $panel = $this->panel();
        abort_unless($panel->hasForgotPassword(), 404);
        if ($this->guard()->check()) return redirect('/' . $panel->getPath());

        return Inertia::render('Larafusion/Auth/ForgotPassword', [
            'status'              => session('status'),
            'revealablePasswords' => $panel->hasRevealablePasswords(),
            'loginSlug'           => $panel->getLoginSlug(),
            'forgotPasswordSlug'  => $panel->getForgotPasswordSlug(),
        ]);
    }

    public function sendResetLink(Request $request)
    {
        abort_unless($this->panel()->hasForgotPassword(), 404);
        $request->validate(['email' => ['required', 'email']]);

        $status = $this->broker()->sendResetLink($request->only('email'));

        return $status === Password::RESET_LINK_SENT
            ? back()->with('status', __($status))
            : back()->withErrors(['email' => __($status)]);
    }

    public function showResetPassword(Request $request, string $token)
    {
        abort_unless($this->panel()->hasForgotPassword(), 404);

        return Inertia::render('Larafusion/Auth/ResetPassword', [
            'token'               => $token,
            'email'               => $request->query('email', ''),
            'revealablePasswords' => $this->panel()->hasRevealablePasswords(),
            'loginSlug'           => $this->panel()->getLoginSlug(),
            'resetPasswordSlug'   => $this->panel()->getResetPasswordSlug(),
        ]);
    }

    public function resetPassword(Request $request)
    {
        $panel = $this->panel();
        abort_unless($panel->hasForgotPassword(), 404);

        $request->validate([
            'token'    => ['required'],
            'email'    => ['required', 'email'],
            'password' => ['required', 'min:8', 'confirmed'],
        ]);

        $status = $this->broker()->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (\App\Models\User $user, string $password) {
                $user->forceFill(['password' => bcrypt($password)])->save();
            }
        );

        return $status === Password::PASSWORD_RESET
            ? redirect('/' . $panel->getPath() . '/' . $panel->getLoginSlug())->with('status', __($status))
            : back()->withErrors(['email' => [__($status)]]);
    }
}
