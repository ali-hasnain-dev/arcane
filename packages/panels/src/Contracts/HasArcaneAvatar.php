<?php

namespace Arcane\Contracts;

/**
 * Implement this interface on your User model to display a custom avatar
 * in the user menu instead of the default initials badge.
 *
 * Usage:
 *
 *   class User extends Authenticatable implements HasArcaneAvatar
 *   {
 *       public function getArcaneAvatarUrl(): ?string
 *       {
 *           return $this->avatar_url
 *               ?? 'https://ui-avatars.com/api/?name=' . urlencode($this->name);
 *       }
 *   }
 */
interface HasArcaneAvatar
{
    /**
     * Return a fully-qualified URL for the user's avatar image,
     * or null to fall back to the initials badge.
     */
    public function getArcaneAvatarUrl(): ?string;
}
