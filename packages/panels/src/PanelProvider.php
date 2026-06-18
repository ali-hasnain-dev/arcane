<?php

namespace Arcane;

use Illuminate\Support\ServiceProvider;

abstract class PanelProvider extends ServiceProvider
{
    /**
     * Configure and return the Arcane panel.
     * Override this method in your application's provider.
     */
    abstract public function panel(Panel $panel): Panel;

    public function register(): void
    {
        $panel = $this->panel(Panel::make());

        ArcaneManager::registerPanel($panel);

        config([
            // Core routing
            'arcane.prefix'      => $panel->getPath(),
            'arcane.middleware'  => $panel->getMiddleware(),
            'arcane.auth_middleware' => $panel->getAuthMiddleware(),
            'arcane.domain'      => $panel->getDomain(),
            'arcane.pagination'  => $panel->getPagination(),

            // Branding
            'arcane.brand.name'             => $panel->getBrandName() ?: config('arcane.brand.name', config('app.name')),
            'arcane.brand.logo'             => $panel->getBrandLogo(),
            'arcane.brand.dark_logo'        => $panel->getDarkModeBrandLogo(),
            'arcane.brand.logo_height'      => $panel->getBrandLogoHeight(),
            'arcane.brand.favicon'          => $panel->getFavicon(),

            // Font
            'arcane.font.family' => $panel->getFont(),
            'arcane.font.weight' => $panel->getFontWeight(),

            // Theme
            'arcane.theme.name'             => $panel->getTheme(),
            'arcane.theme.dark_mode'        => $panel->getDarkMode(),
            'arcane.theme.default_mode'     => $panel->getDefaultThemeMode(),
            'arcane.theme.colors'           => $panel->getColors(),

            // Layout
            'arcane.layout.top_navigation'              => $panel->isTopNavigation(),
            'arcane.layout.sidebar_collapsible'         => $panel->isSidebarCollapsibleOnDesktop(),
            'arcane.layout.sidebar_width'               => $panel->getSidebarWidth(),
            'arcane.layout.collapsed_sidebar_width'     => $panel->getCollapsedSidebarWidth(),
            'arcane.layout.max_content_width'           => $panel->getMaxContentWidth(),
            'arcane.layout.breadcrumbs'                 => $panel->hasBreadcrumbs(),
            'arcane.layout.topbar'                      => $panel->hasTopbar(),
            'arcane.layout.sub_navigation_position'     => $panel->getSubNavigationPosition(),

            // Behaviour
            'arcane.unsaved_changes_alerts' => $panel->hasUnsavedChangesAlerts(),
            'arcane.database_transactions'  => $panel->hasDatabaseTransactions(),
            'arcane.strict_authorization'   => $panel->hasStrictAuthorization(),
        ]);
    }

    public function boot(): void
    {
        $panel = ArcaneManager::getPanel();

        if ($panel && $boot = $panel->getBootUsing()) {
            $boot($panel);
        }
    }
}
