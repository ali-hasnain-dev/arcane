<?php

namespace Larafusion\Tables\Enums;

/**
 * Where/how the table filter panel is rendered.
 *
 * Passed to Table::filters([...], layout: FiltersLayout::Modal) or
 * Table::filtersLayout(FiltersLayout::Dropdown). Plain strings with the
 * same backing values remain accepted for backwards compatibility.
 */
enum FiltersLayout: string
{
    /** Filament-style popover below the funnel icon button (default). */
    case Dropdown = 'dropdown';

    /** Slide-in panel from the right. */
    case Drawer = 'drawer';

    /** Centred modal dialog. */
    case Modal = 'modal';

    /** Inline panel above the table rows. */
    case Above = 'above';

    /** Inline panel above the table rows, with a collapse/expand toggle. */
    case AboveCollapsible = 'above_collapsible';

    /** Inline panel below the table rows. */
    case Below = 'below';

    /** Fixed sidebar to the left of the table content. */
    case BeforeContent = 'before_content';

    /** Left sidebar with a collapse/expand toggle. */
    case BeforeContentCollapsible = 'before_content_collapsible';

    /** Fixed sidebar to the right of the table content. */
    case AfterContent = 'after_content';

    /** Right sidebar with a collapse/expand toggle. */
    case AfterContentCollapsible = 'after_content_collapsible';

    /**
     * Side layouts render the filter form in a narrow sidebar, so the
     * filters form is always constrained to a single column.
     */
    public function isSideLayout(): bool
    {
        return in_array($this, [
            self::BeforeContent,
            self::BeforeContentCollapsible,
            self::AfterContent,
            self::AfterContentCollapsible,
        ], true);
    }
}
