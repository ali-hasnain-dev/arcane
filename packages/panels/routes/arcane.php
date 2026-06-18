<?php

use Illuminate\Support\Facades\Route;
use Arcane\Http\Controllers\ResourceController;
use Arcane\Http\Controllers\DashboardController;
use Arcane\Http\Controllers\UploadController;
use Arcane\Http\Controllers\RelationController;
use Arcane\Http\Controllers\ActionController;
use Arcane\Http\Controllers\SearchController;
use Arcane\Http\Controllers\ExportController;
use Arcane\Http\Controllers\ImportController;
use Arcane\Http\Controllers\InlineEditController;
use Arcane\Http\Controllers\MorphController;
use Arcane\Http\Controllers\PageController;
use Arcane\Http\Controllers\AuthController;
use Arcane\Http\Controllers\ProfileController;
use Arcane\Http\Controllers\TwoFactorController;
use Arcane\Http\Middleware\HandlePrecognition;
use Arcane\Http\Middleware\EnsureTwoFactorAuthenticated;

// ── Auth routes — public (no auth middleware) ─────────────────────────────────
Route::prefix(config('arcane.prefix', 'admin'))
    ->middleware(['web'])
    ->name('arcane.')
    ->group(function () {
        Route::get ('/login',  [AuthController::class, 'showLogin'])->name('login');
        Route::post('/login',  [AuthController::class, 'login'])->name('login.store')
            ->middleware('throttle:arcane-login');
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

        // Registration (enabled via ->registration() on the panel)
        Route::get ('/register', [AuthController::class, 'showRegister'])->name('register');
        Route::post('/register', [AuthController::class, 'register'])->name('register.store');

        // Forgot / reset password (enabled via ->forgotPassword() on the panel)
        Route::get ('/forgot-password',        [AuthController::class, 'showForgotPassword'])->name('password.request');
        Route::post('/forgot-password',        [AuthController::class, 'sendResetLink'])->name('password.email');
        Route::get ('/reset-password/{token}', [AuthController::class, 'showResetPassword'])->name('password.reset');
        Route::post('/reset-password',         [AuthController::class, 'resetPassword'])->name('password.update');

        // 2FA challenge (public — user is not yet auth'd, awaiting second factor)
        Route::get ('/two-factor/challenge', [TwoFactorController::class, 'showChallenge'])->name('two-factor.challenge');
        Route::post('/two-factor/challenge', [TwoFactorController::class, 'challenge'])->name('two-factor.challenge.store')
            ->middleware('throttle:arcane-2fa');
    });

// ── Authenticated routes ───────────────────────────────────────────────────────
Route::prefix(config('arcane.prefix', 'admin'))
    ->middleware(array_merge(
        config('arcane.middleware', ['web', 'auth']),
        [EnsureTwoFactorAuthenticated::class]
    ))
    ->name('arcane.')
    ->group(function () {

        // Logout — duplicated here so the explicit route always wins over /{resource} wildcard
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout.post');

        // Dashboard
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

        // Profile (enabled via ->profile() on the panel)
        Route::get   ('/profile',          [ProfileController::class, 'show'])           ->name('profile');
        Route::put   ('/profile',          [ProfileController::class, 'update'])          ->name('profile.update');
        Route::put   ('/profile/password', [ProfileController::class, 'updatePassword']) ->name('profile.password');

        // 2FA management (for authenticated users)
        Route::get   ('/two-factor/setup',            [TwoFactorController::class, 'showSetup'])         ->name('two-factor.setup');
        Route::post  ('/two-factor/setup',            [TwoFactorController::class, 'confirmSetup'])      ->name('two-factor.setup.confirm');
        Route::get   ('/two-factor/manage',           [TwoFactorController::class, 'manage'])            ->name('two-factor.manage');
        Route::delete('/two-factor',                  [TwoFactorController::class, 'disable'])           ->name('two-factor.disable');
        Route::post  ('/two-factor/recovery-codes',   [TwoFactorController::class, 'regenerateCodes'])   ->name('two-factor.recovery-codes');

        // File uploads
        Route::post  ('/upload',       [UploadController::class, 'store'])  ->name('upload');
        Route::delete('/upload',       [UploadController::class, 'destroy'])->name('upload.destroy');
        Route::get   ('/files/{path}', [UploadController::class, 'serve'])  ->name('files.serve')->where('path', '.*');

        // Relation endpoints
        Route::get('/{resource}/relations/{field}/options', [RelationController::class, 'options'])->name('relations.options');
        Route::get('/{resource}/{id}/relations/{field}',    [RelationController::class, 'related'])->name('relations.related');

        // MorphTo async options
        Route::get('/{resource}/morph/{field}/options', [MorphController::class, 'options'])->name('morph.options');

        // Global search
        Route::get('/search', [SearchController::class, 'search'])->name('search');

        // Custom pages (before resource catch-all to avoid slug collision)
        Route::get('/p/{page}', [PageController::class, 'show'])->name('page.show');

        // Export / Import
        Route::get ('/{resource}/export',          [ExportController::class, 'export'])         ->name('resource.export');
        Route::get ('/{resource}/import',          [ImportController::class, 'show'])            ->name('resource.import');
        Route::post('/{resource}/import/preview',  [ImportController::class, 'preview'])         ->name('resource.import.preview');
        Route::post('/{resource}/import/commit',   [ImportController::class, 'commit'])          ->name('resource.import.commit');

        // Soft-delete extras (restore / force-delete)
        Route::post  ('/{resource}/bulk-restore',  [ResourceController::class, 'bulkRestore'])  ->name('resource.bulk-restore');
        Route::post  ('/{resource}/{id}/restore',  [ResourceController::class, 'restore'])      ->name('resource.restore');
        Route::delete('/{resource}/{id}/force',    [ResourceController::class, 'forceDestroy']) ->name('resource.force-destroy');

        // Inline edit
        Route::patch('/{resource}/{id}/inline',    [InlineEditController::class, 'update'])     ->name('resource.inline-edit');

        // Record actions
        Route::post('/{resource}/{id}/action/{action}', [ActionController::class, 'handle'])->name('resource.action');

        // Resource CRUD (must come after named sub-paths above to avoid slug collisions)
        Route::delete('/{resource}/bulk',      [ResourceController::class, 'bulkDestroy'])->name('resource.bulk-destroy');
        Route::get   ('/{resource}',           [ResourceController::class, 'index'])      ->name('resource.index');
        Route::get   ('/{resource}/create',    [ResourceController::class, 'create'])     ->name('resource.create');
        Route::post  ('/{resource}',           [ResourceController::class, 'store'])      ->name('resource.store')->middleware(HandlePrecognition::class);
        Route::get   ('/{resource}/{id}',      [ResourceController::class, 'show'])       ->name('resource.show');
        Route::get   ('/{resource}/{id}/edit', [ResourceController::class, 'edit'])       ->name('resource.edit');
        Route::put   ('/{resource}/{id}',      [ResourceController::class, 'update'])     ->name('resource.update')->middleware(HandlePrecognition::class);
        Route::patch ('/{resource}/{id}',      [ResourceController::class, 'update'])     ->name('resource.update.patch')->middleware(HandlePrecognition::class);
        Route::delete('/{resource}/{id}',      [ResourceController::class, 'destroy'])    ->name('resource.destroy');
    });
