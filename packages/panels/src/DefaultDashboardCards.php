<?php

namespace Larafusion;

/**
 * Placeholder entry for Panel::widgets(). Its presence in the array — not
 * any data on the class itself — controls whether the dashboard shows its
 * default greeting + "Built with Larafusion" GitHub cards.
 *
 * ->widgets([DefaultDashboardCards::class])   // cards show
 * ->widgets([MyRealWidget::class])            // cards hidden, your widget shows
 * ->widgets([])                               // cards hidden, no widgets
 *
 * It is filtered out before the real widgets array reaches WidgetGrid, so it
 * never gets treated as an actual widget (no ::make()/toMeta() call happens
 * on it).
 */
final class DefaultDashboardCards
{
    //
}
