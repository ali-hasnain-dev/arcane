<?php

namespace Larafusion\Contracts;

use Larafusion\Panel;

/**
 * Implement this interface on your User model to control who can access
 * the Larafusion panel. If the model does NOT implement this interface, all
 * authenticated users are allowed in.
 *
 * Usage:
 *
 *   class User extends Authenticatable implements LarafusionUser
 *   {
 *       public function canAccessPanel(Panel $panel): bool
 *       {
 *           return $this->hasVerifiedEmail() && $this->role === UserRole::Admin;
 *       }
 *   }
 */
interface LarafusionUser
{
    /**
     * Return true to allow this user into the panel.
     * Called immediately after a successful login attempt.
     */
    public function canAccessPanel(Panel $panel): bool;
}
