<?php

namespace Larafusion\Contracts;

/**
 * Implement this interface on your User model to display a custom avatar
 * in the user menu instead of the default initials badge.
 *
 * Usage:
 *
 *   class User extends Authenticatable implements HasLarafusionAvatar
 *   {
 *       public function getLarafusionAvatarUrl(): ?string
 *       {
 *           return $this->avatar_url
 *               ?? 'https://ui-avatars.com/api/?name=' . urlencode($this->name);
 *       }
 *   }
 */
interface HasLarafusionAvatar
{
    /**
     * Return a fully-qualified URL for the user's avatar image,
     * or null to fall back to the initials badge.
     */
    public function getLarafusionAvatarUrl(): ?string;
}
