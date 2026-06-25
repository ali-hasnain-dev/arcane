<?php

namespace Larafusion;

use Illuminate\Support\ServiceProvider;

abstract class PanelProvider extends ServiceProvider
{
    /**
     * Configure and return the Larafusion panel.
     * Override this method in your application's provider.
     */
    abstract public function panel(Panel $panel): Panel;

    public function register(): void
    {
        $panel = $this->panel(Panel::make());

        LarafusionManager::registerPanel($panel);

        config([
            // Core routing
            'larafusion.prefix'      => $panel->getPath(),
            'larafusion.middleware'  => $panel->getMiddleware(),
            'larafusion.auth_middleware' => $panel->getAuthMiddleware(),
            'larafusion.domain'      => $panel->getDomain(),
            'larafusion.pagination'  => $panel->getPagination(),

            // Branding
            'larafusion.brand.name'             => $panel->getBrandName() ?: config('larafusion.brand.name', config('app.name')),
            'larafusion.brand.logo'             => $panel->getBrandLogo(),
            'larafusion.brand.dark_logo'        => $panel->getDarkModeBrandLogo(),
            'larafusion.brand.logo_height'      => $panel->getBrandLogoHeight(),
            'larafusion.brand.favicon'          => $panel->getFavicon(),

            // Font
            'larafusion.font.family' => $panel->getFont(),
            'larafusion.font.weight' => $panel->getFontWeight(),

            // Theme
            'larafusion.theme.name'             => $panel->getTheme(),
            'larafusion.theme.dark_mode'        => $panel->getDarkMode(),
            'larafusion.theme.default_mode'     => $panel->getDefaultThemeMode(),
            'larafusion.theme.colors'           => $panel->getColors(),

            // Layout
            'larafusion.layout.top_navigation'              => $panel->isTopNavigation(),
            'larafusion.layout.sidebar_collapsible'         => $panel->isSidebarCollapsibleOnDesktop(),
            'larafusion.layout.sidebar_width'               => $panel->getSidebarWidth(),
            'larafusion.layout.collapsed_sidebar_width'     => $panel->getCollapsedSidebarWidth(),
            'larafusion.layout.max_content_width'           => $panel->getMaxContentWidth(),
            'larafusion.layout.breadcrumbs'                 => $panel->hasBreadcrumbs(),
            'larafusion.layout.topbar'                      => $panel->hasTopbar(),
            'larafusion.layout.sub_navigation_position'     => $panel->getSubNavigationPosition(),

            // Behaviour
            'larafusion.unsaved_changes_alerts' => $panel->hasUnsavedChangesAlerts(),
            'larafusion.database_transactions'  => $panel->hasDatabaseTransactions(),
            'larafusion.strict_authorization'   => $panel->hasStrictAuthorization(),
        ]);
    }

    public function boot(): void
    {
        $panel = LarafusionManager::getPanel();

        if ($panel && $boot = $panel->getBootUsing()) {
            $boot($panel);
        }
    }
}
