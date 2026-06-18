<?php

namespace Arcane\Contracts;

use Arcane\Panel;

/**
 * Implement this interface on your User model to control who can access
 * the Arcane panel. If the model does NOT implement this interface, all
 * authenticated users are allowed in.
 *
 * Usage:
 *
 *   class User extends Authenticatable implements ArcaneUser
 *   {
 *       public function canAccessPanel(Panel $panel): bool
 *       {
 *           return $this->hasVerifiedEmail() && $this->role === UserRole::Admin;
 *       }
 *   }
 */
interface ArcaneUser
{
    /**
     * Return true to allow this user into the panel.
     * Called immediately after a successful login attempt.
     */
    public function canAccessPanel(Panel $panel): bool;
}
