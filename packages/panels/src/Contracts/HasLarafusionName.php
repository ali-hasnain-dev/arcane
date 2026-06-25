<?php

namespace Larafusion\Contracts;

/**
 * Implement this interface on your User model to customise how the user's
 * name is displayed throughout the panel (user menu, greeting, etc.).
 *
 * Usage:
 *
 *   class User extends Authenticatable implements HasLarafusionName
 *   {
 *       public function getLarafusionName(): string
 *       {
 *           return $this->display_name ?? $this->name;
 *       }
 *   }
 */
interface HasLarafusionName
{
    /**
     * Return the display name for this user.
     */
    public function getLarafusionName(): string;
}
