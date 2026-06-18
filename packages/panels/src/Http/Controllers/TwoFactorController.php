<?php

namespace Arcane\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Arcane\ArcaneManager;
use Arcane\TwoFactor\TwoFactorManager;

class TwoFactorController extends Controller
{
    public function __construct(protected TwoFactorManager $totp) {}

    protected function panel(): \Arcane\Panel
    {
        return app('arcane')->getPanel();
    }

    protected function guard(): \Illuminate\Contracts\Auth\Guard
    {
        return Auth::guard($this->panel()->getAuthGuard());
    }

    // ── Challenge (login flow) ────────────────────────────────────────────────

    public function showChallenge(Request $request)
    {
        abort_unless($this->panel()->hasTwoFactor(), 404);

        // Must have a pending user in session
        if (!$request->session()->has('arcane.2fa.user')) {
            return redirect()->route('arcane.login');
        }

        return Inertia::render('Arcane/Auth/TwoFactorChallenge', [
            'loginSlug' => $this->panel()->getLoginSlug(),
        ]);
    }

    public function challenge(Request $request)
    {
        abort_unless($this->panel()->hasTwoFactor(), 404);

        $userId = $request->session()->get('arcane.2fa.user');
        if (!$userId) {
            return redirect()->route('arcane.login');
        }

        $request->validate(['code' => ['required', 'string']]);

        $panel     = $this->panel();
        $userModel = config('auth.providers.users.model', \App\Models\User::class);
        $user      = $userModel::find($userId);

        if (!$user) {
            $request->session()->forget('arcane.2fa.user');
            return redirect()->route('arcane.login');
        }

        $code = str_replace('-', '', trim($request->input('code')));

        $valid = $this->totp->verifyCode($user->two_factor_secret, $code);

        // Try recovery code if TOTP fails
        if (!$valid && !empty($user->two_factor_recovery_codes)) {
            $remaining = $this->totp->verifyRecoveryCode(
                json_decode($user->two_factor_recovery_codes, true) ?? [],
                $code
            );
            if ($remaining !== null) {
                $user->forceFill(['two_factor_recovery_codes' => json_encode($remaining)])->save();
                $valid = true;
            }
        }

        if (!$valid) {
            return back()->withErrors(['code' => 'The provided two-factor code is invalid.']);
        }

        $request->session()->forget('arcane.2fa.user');
        $this->guard()->login($user);
        $request->session()->regenerate();

        return redirect()->intended('/' . $panel->getPath());
    }

    // ── Setup (authenticated users) ───────────────────────────────────────────

    public function showSetup(Request $request)
    {
        abort_unless($this->panel()->hasTwoFactor(), 404);
        $user = $this->guard()->user();

        if (!empty($user->two_factor_confirmed_at)) {
            return redirect()->route('arcane.two-factor.manage');
        }

        // Generate a new secret if not set
        if (empty($user->two_factor_secret)) {
            $secret = $this->totp->generateSecret();
            $user->forceFill(['two_factor_secret' => $secret])->save();
        }

        $issuer = config('app.name', 'Arcane');
        $uri    = $this->totp->getProvisioningUri($user->two_factor_secret, $user->email, $issuer);

        return Inertia::render('Arcane/Auth/TwoFactorSetup', [
            'qrUri'        => $uri,
            'secret'       => $user->two_factor_secret,
            'manageRoute'  => route('arcane.two-factor.manage'),
        ]);
    }

    public function confirmSetup(Request $request)
    {
        abort_unless($this->panel()->hasTwoFactor(), 404);
        $request->validate(['code' => ['required', 'string', 'size:6']]);

        $user = $this->guard()->user();
        if (!$this->totp->verifyCode($user->two_factor_secret, $request->input('code'))) {
            return back()->withErrors(['code' => 'The provided code is invalid.']);
        }

        $codes = $this->totp->generateRecoveryCodes();
        $user->forceFill([
            'two_factor_confirmed_at'   => now(),
            'two_factor_recovery_codes' => json_encode($codes),
        ])->save();

        return Inertia::render('Arcane/Auth/TwoFactorRecoveryCodes', [
            'codes' => $codes,
        ]);
    }

    // ── Manage (view/disable) ─────────────────────────────────────────────────

    public function manage(Request $request)
    {
        abort_unless($this->panel()->hasTwoFactor(), 404);
        $user = $this->guard()->user();

        return Inertia::render('Arcane/Auth/TwoFactorManage', [
            'enabled'  => !empty($user->two_factor_confirmed_at),
            'setupUrl' => route('arcane.two-factor.setup'),
        ]);
    }

    public function disable(Request $request)
    {
        abort_unless($this->panel()->hasTwoFactor(), 404);
        $request->validate(['password' => ['required', 'current_password']]);

        $user = $this->guard()->user();
        $user->forceFill([
            'two_factor_secret'         => null,
            'two_factor_confirmed_at'   => null,
            'two_factor_recovery_codes' => null,
        ])->save();

        Inertia::flash('success', 'Two-factor authentication disabled.');
        return back();
    }

    public function regenerateCodes(Request $request)
    {
        abort_unless($this->panel()->hasTwoFactor(), 404);
        $request->validate(['password' => ['required', 'current_password']]);

        $user  = $this->guard()->user();
        $codes = $this->totp->generateRecoveryCodes();
        $user->forceFill(['two_factor_recovery_codes' => json_encode($codes)])->save();

        return Inertia::render('Arcane/Auth/TwoFactorRecoveryCodes', [
            'codes' => $codes,
        ]);
    }
}
