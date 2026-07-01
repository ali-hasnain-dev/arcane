// ─── Layout Schema Types ──────────────────────────────────────────────────────

export interface SectionSchemaType {
    type: 'section';
    label: string;
    description?: string | null;
    icon?: string | null;
    columns: number;
    collapsible: boolean;
    collapsed: boolean;
    fields: FormSchemaItem[];
}

export interface TabSchemaType {
    label: string;
    icon?: string | null;
    columns: number;
    fields: FormSchemaItem[];
}

export interface TabsSchemaType {
    type: 'tabs';
    defaultTab: string;
    tabs: TabSchemaType[];
}

export interface GridSchemaType {
    type: 'grid';
    columns: number;
    fields: FormSchemaItem[];
}

export type FormSchemaItem = LarafusionField | SectionSchemaType | TabsSchemaType | GridSchemaType;

// ─── Field Types ──────────────────────────────────────────────────────────────

export type FieldType =
    | 'text' | 'email' | 'password' | 'textarea'
    | 'select' | 'number' | 'toggle' | 'date'
    | 'file' | 'image'
    | 'tags' | 'color' | 'repeater'
    | 'belongs_to' | 'belongs_to_many' | 'has_many'
    | 'hidden' | 'checkbox' | 'radio' | 'checkbox_list' | 'slider'
    | 'toggle_buttons' | 'code_editor'
    | 'rich_text' | 'markdown' | 'key_value' | 'builder' | 'morph_to';

export interface FieldValidation {
    rules:      string[];
    client:     string[];
    server:     string[];
    /** Custom error messages keyed by rule name (e.g. { required: 'Please enter your :attribute.' }) */
    messages?:  Record<string, string>;
    /** Override of the field label used in validation error messages */
    attribute?: string;
}

export interface BaseField {
    type: FieldType;
    name: string;
    label: string;
    required: boolean;
    disabled: boolean;
    hidden: boolean;
    default: unknown;
    placeholder: string | null;
    hint: string | null;
    validation: FieldValidation;
    /** Arbitrary data passed from PHP via ->componentData([]) for custom field types. */
    componentData?: Record<string, unknown>;
}

export interface AffixProps {
    prefixText?:      string | null;
    suffixText?:      string | null;
    prefixIcon?:      string | null;
    suffixIcon?:      string | null;
    prefixIconColor?: string | null;
    suffixIconColor?: string | null;
    /** 'separated' = icon in its own bordered cell (default); 'inline' = icon floats inside input */
    iconLayout?:      'separated' | 'inline';
}

export interface TextField extends BaseField, AffixProps {
    type:         'text';
    inputType:    'text' | 'url' | 'tel';
    minLength:    number | null;
    maxLength:    number | null;
    copyable:     boolean;
    copyMessage?: string | null;
    readOnly:     boolean;
    trim:         boolean;
    mask?:        string | null;
    autocomplete?: string | null;
    datalist?:    string[];
    inputMode?:   string | null;
}

export interface EmailField    extends BaseField, AffixProps { type: 'email'; }
export interface PasswordField extends BaseField, AffixProps { type: 'password'; minLength: number; showToggle: boolean; }
export interface TextareaField   extends BaseField {
    type:       'textarea';
    rows:       number;
    cols?:      number | null;
    maxLength:  number | null;
    minLength?: number | null;
    autosize:   boolean;
    readOnly:   boolean;
    trim:       boolean;
}
export interface SelectField extends BaseField, AffixProps {
    type: 'select';
    /** Options map — values are either labels (flat) or nested label maps (grouped). */
    options: Record<string, string | Record<string, string>>;
    searchable: boolean;
    multiple: boolean;
    /** false → custom JS dropdown with search/chips; true (default) → native <select> */
    native: boolean;
    clearable: boolean;
    isBoolean: boolean;
    disabledOptions?: string[];
    minItems?: number | null;
    maxItems?: number | null;
    noSearchResultsMessage?: string | null;
    loadingMessage?: string | null;
    searchPrompt?: string | null;
    noOptionsMessage?: string | null;
    searchingMessage?: string | null;
    searchDebounce?: number;
    optionsLimit?: number;
    wrapOptionLabels?: boolean;
    selectablePlaceholder?: boolean;
}

export interface NumberField extends BaseField { type: 'number'; min: number | null; max: number | null; step: number; }

export interface CheckboxField extends BaseField { type: 'checkbox'; inline: boolean; }

export interface ToggleField extends BaseField {
    type:      'toggle';
    onLabel:   string;
    offLabel:  string;
    inline:    boolean;
    onIcon?:   string | null;
    offIcon?:  string | null;
    onColor?:  string | null;
    offColor?: string | null;
}

export interface DateField extends BaseField, AffixProps {
    type:                 'date';
    minDate:              string | null;
    maxDate:              string | null;
    format:               string;
    time:                 boolean;
    seconds:              boolean;
    closeOnDateSelection: boolean;
    readOnly:             boolean;
    firstDayOfWeek:       number;
    displayFormat?:       string | null;
    timezone?:            string | null;
    disabledDates?:       string[];
    /** false → custom JS calendar picker; true (default) → native <input type="date"> */
    native?:              boolean;
}

export interface HiddenField extends BaseField { type: 'hidden'; }

export interface RadioField extends BaseField {
    type:             'radio';
    options:          Record<string, string>;
    layout:           'vertical' | 'horizontal' | 'grid';
    descriptions?:    Record<string, string>;
    disabledOptions?: string[];
}

export interface CheckboxListField extends BaseField {
    type:                    'checkbox_list';
    options:                 Record<string, string>;
    columns:                 number | null;
    min:                     number | null;
    max:                     number | null;
    searchable:              boolean;
    bulkToggleable:          boolean;
    descriptions?:           Record<string, string>;
    disabledOptions?:        string[];
    noSearchResultsMessage?: string | null;
    searchPrompt?:           string | null;
}
export interface SliderField extends BaseField {
    type:           'slider';
    min:            number;
    max:            number;
    step:           number;
    showValue:      boolean;
    prefix:         string | null;
    suffix:         string | null;
    range:          boolean;
    decimalPlaces:  number;
    vertical:       boolean;
    fillTrack:      boolean;
    tooltips:       boolean;
    minDifference?: number | null;
    maxDifference?: number | null;
}

export interface ToggleButtonsField extends BaseField {
    type:           'toggle_buttons';
    options:        Record<string, string>;
    multiple:       boolean;
    inline:         boolean;
    grouped:        boolean;
    hiddenLabels:   boolean;
    colors?:        Record<string, string>;
    icons?:         Record<string, string>;
    tooltips?:      Record<string, string>;
    columns?:       number | null;
    disabledOptions?: string[];
}

export interface CodeEditorField extends BaseField {
    type:         'code_editor';
    language:     string;
    wrap:         boolean;
    lineNumbers:  boolean;
    minHeight:    number;
    maxHeight?:   number | null;
    theme?:       string | null;
}
export interface RichTextField extends BaseField {
    type:      'rich_text';
    toolbar:   string[];
    minHeight: number;
    maxHeight?: number | null;
    fileAttachmentsDisk?:      string | null;
    fileAttachmentsDirectory?: string | null;
}

export interface MarkdownField extends BaseField {
    type:           'markdown';
    showPreview:    boolean;
    defaultPreview: boolean;
    minHeight:      number;
    toolbarButtons?: string[];
    fileAttachmentsDisk?:      string | null;
    fileAttachmentsDirectory?: string | null;
}

export interface KeyValueField extends BaseField {
    type:              'key_value';
    keyLabel:          string;
    valueLabel:        string;
    keyPlaceholder:    string | null;
    valuePlaceholder:  string | null;
    reorderable:       boolean;
    addable:           boolean;
    deletable:         boolean;
    editableKeys:      boolean;
    editableValues:    boolean;
    addActionLabel?:   string | null;
}

export interface BuilderBlockSchema {
    key:    string;
    label:  string;
    icon:   string | null;
    fields: LarafusionField[];
}

export interface BuilderField extends BaseField {
    type:        'builder';
    blocks:      BuilderBlockSchema[];
    maxItems:    number | null;
    minItems?:   number | null;
    addLabel:    string;
    addable:     boolean;
    deletable:   boolean;
    cloneable:   boolean;
    reorderable: boolean;
    collapsible: boolean;
    collapsed:   boolean;
}

export interface MorphToField     extends BaseField { type: 'morph_to';     types: Record<string, string>; labelColumn: string; searchColumn: string; minChars: number; }

export type LarafusionField =
    | TextField | EmailField | PasswordField | TextareaField
    | SelectField | NumberField | CheckboxField | ToggleField | DateField
    | HiddenField | RadioField | CheckboxListField | SliderField
    | ToggleButtonsField | CodeEditorField
    | RichTextField | MarkdownField | KeyValueField | BuilderField | MorphToField
    | BaseField;

// ─── Widget Types ─────────────────────────────────────────────────────────────

export interface StatData {
    label: string;
    value: string | number;
    description: string | null;
    descriptionIcon?: string | null;
    descriptionIconPosition?: 'before' | 'after';
    descriptionColor?: string | null;
    icon: string | null;
    color: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    trend: number | null;
    chart?: number[];
    backgroundColor?: string | null;
}

// ── Widget meta (no DB data — comes from DashboardController immediately) ──────

export interface WidgetMeta {
    widgetClass:     string;
    type:            'stats_overview' | 'chart' | 'table';
    heading:         string | null;
    description:     string | null;
    columnSpan:      number | string;
    sort:            number;
    /** null = polling disabled; e.g. '30s', '5m', '1h' = poll at that interval */
    pollingInterval: string | null;
    isLazy:          boolean;
}

// ── Widget data payloads (returned by GET /_widgets/data) ─────────────────────

export interface StatData {
    label:                   string;
    value:                   string | number;
    description?:            string | null;
    descriptionIcon?:        string | null;
    descriptionIconPosition?: 'before' | 'after';
    descriptionColor?:       string | null;
    icon?:                   string | null;
    color?:                  string;
    trend?:                  number | null;
    chart?:                  number[];
    extraAttributes?:        Record<string, string>;
    backgroundColor?:        string | null;
}

export interface StatsOverviewWidgetData {
    stats: StatData[];
}

export interface ChartDataset {
    label: string;
    data: number[];
    color?: string;
}

export interface ChartWidgetData {
    chartType:          'line' | 'bar' | 'doughnut';
    labels:             string[];
    datasets:           ChartDataset[];
    color?:             string;
    filterOptions?:     Record<string, string>;
    activeFilter?:      string | null;
    hasDeferredFilters?: boolean;
    maxHeight?:         string | null;
    options?:           Record<string, unknown>;
    isCollapsible?:     boolean;
    isCollapsed?:       boolean;
}

export interface TableWidgetData {
    columns: string[];
    rows:    string[][];
}

export type WidgetPayload = StatsOverviewWidgetData | ChartWidgetData | TableWidgetData;

/** Full widget state = meta + loaded data payload */
export type WidgetData = WidgetMeta & Partial<StatsOverviewWidgetData & ChartWidgetData & TableWidgetData>;

// ─── Column Types ─────────────────────────────────────────────────────────────

export interface Column {
    name: string;
    label: string;
    type: string;
    sortable?: boolean;
    filterable?: boolean;
    filterType?: string;
    filterOptions?: { label: string; value: string | number }[];
    visible?: boolean;
    align?: string;
    width?: string;
    toggleable?: boolean;
    toggledHiddenByDefault?: boolean;

    // TextColumn extras
    limit?: number;
    wrap?: boolean;
    lineClamp?: boolean;
    description?: string;
    copyable?: boolean;
    color?: string;
    weight?: string;
    prefix?: string;
    suffix?: string;
    money?: boolean;
    currency?: string;
    badge?: boolean;

    // BadgeColumn / IconColumn extras
    colors?: Record<string, string>;   // value → color name
    icons?: Record<string, string>;    // value → icon name
    labels?: Record<string, string>;   // value → display label (BadgeColumn enum support)

    // TextColumn enum support
    enumLabels?: Record<string, string>;  // value → display label
    enumColors?: Record<string, string>;  // value → color name

    // BooleanColumn extras
    trueIcon?: string;
    falseIcon?: string;
    trueColor?: string;
    falseColor?: string;
    trueLabel?: string;
    falseLabel?: string;

    // DateColumn extras
    format?: string;
    since?: boolean;
    dateTime?: boolean;
    time?: boolean;

    // ImageColumn extras
    size?: string;
    disk?: string;
    circular?: boolean;
    stacked?: boolean;
    stackedLimit?: number;

    // IconColumn extras
    boolean?: boolean;
}

// ─── Table Config ─────────────────────────────────────────────────────────────

export interface StandaloneFilter {
    name: string;
    label: string;
    type: 'boolean' | 'select' | 'date_range' | 'trashed' | 'ternary';
    // select
    options?: Record<string, string>;
    multiple?: boolean;
    searchable?: boolean;
    // ternary
    trueLabel?: string;
    falseLabel?: string;
    placeholder?: string;
    // shared
    default?: string | string[] | null;
    indicator?: string | null;
}

// Built-in record-level action descriptors (edit / delete / view / custom action)
export interface BuiltinRecordAction {
    type: 'edit' | 'delete' | 'view' | 'action';
    key: string;
    label: string;
    color?: string;
    confirm?: string | null;
    // Extra fields used when type === 'action'
    icon?: string | null;
    display?: 'icon' | 'text' | 'button';
    confirmHeading?: string | null;
    confirmDescription?: string | null;
    confirmSubmitLabel?: string | null;
    tooltip?: string | null;
    badge?: string | null;
    badgeColor?: string | null;
    url?: string | null;
    newTab?: boolean;
    isLink?: boolean;
}

// Built-in toolbar bulk action descriptors
export type BulkActionType = 'delete_bulk' | 'force_delete_bulk' | 'restore_bulk';

export interface BuiltinBulkAction {
    type: BulkActionType;
    key: string;
    label: string;
}

export interface BulkActionGroup {
    type: 'bulk_group';
    key: string;
    label: string;
    actions: BuiltinBulkAction[];
}

export type ToolbarAction = BulkActionGroup;

export type FiltersLayout =
    | 'dropdown'
    | 'drawer' | 'modal'
    | 'above' | 'above_collapsible' | 'below'
    | 'before_content' | 'before_content_collapsible'
    | 'after_content'  | 'after_content_collapsible';

export interface TableConfig {
    striped?: boolean;
    heading?: string;
    description?: string;
    emptyStateHeading?: string;
    emptyStateDescription?: string;
    emptyStateIcon?: string;
    /** Auto-refresh interval, e.g. '30s', '1m'. Reloads just the records prop. */
    polling?: string;
    /** Defers the *initial* records fetch — page shell renders first, records
     *  arrive in a follow-up request. Subsequent reloads work as normal. */
    deferLoading?: boolean;
    reorderable?: string;
    standaloneFilters?: StandaloneFilter[];
    /** When present, ONLY these record-level actions are shown (replaces legacy can.* built-ins). */
    recordActions?: BuiltinRecordAction[];
    /** When present, ONLY these toolbar/bulk actions are shown. */
    toolbarActions?: ToolbarAction[];
    /** Override the initial sort applied by the controller. */
    defaultSort?: { field: string; dir: 'asc' | 'desc' };
    /** Where/how to render the filter panel. Default: 'drawer'. */
    filtersLayout?: FiltersLayout;
    /** Number of grid columns in the filter panel (for above/below layouts). Default: 1. */
    filtersFormColumns?: number;
    /** Max-width CSS value for the filter dropdown/modal panel. */
    filtersFormWidth?: string;
    /** Max-height CSS value for the filter panel before scrolling. */
    filtersFormMaxHeight?: string;
    /** When true, the active-filter indicator chips row is hidden. */
    hideFilterIndicators?: boolean;
    /** When set to 'full', removes the default max-w-7xl constraint on the index page. */
    contentWidth?: 'full';
    /**
     * Pagination mode: 'full' (numbered pages) | 'simple' (Prev/Next only) | false (disabled).
     * Only present when ->pagination(...) was explicitly called on the Table builder —
     * absent means "use the panel-level default".
     */
    pagination?: 'full' | 'simple' | false;
}

// ─── Record Actions ───────────────────────────────────────────────────────────

export interface RecordAction {
    key: string;
    label: string;
    icon: string | null;
    color: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    display: 'icon' | 'text' | 'button';
    confirm: string | null;
    type: 'button' | 'link';
    newTab?: boolean;
    url?: string;
}

// ─── Resource ─────────────────────────────────────────────────────────────────

export interface ResourcePermissions {
    viewAny: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    view: boolean;
}

export interface ResourceMeta {
    slug: string;
    label: string;
    navigationLabel: string;
    searchable: string[];
    sortable: string[];
    // No longer sent by the server (authorization is moving to its own package) —
    // consumers must fall back to permissive defaults when this is absent, as
    // BasicTable and Show.tsx already do.
    can?: ResourcePermissions;
    useModalForms?: boolean;
    // hideCreateButton intentionally not serialized — its effect already happens
    // server-side (omitted from headerActions), nothing on the frontend reads it.
}

export interface NavigationItem {
    type: 'item';
    label: string;
    icon: string;
    slug: string;
    url: string;
    plugin: string | null;
    badge: string | number | null;
    group: string | null;
    sort: number;
}

export interface NavigationGroupNode {
    type: 'group';
    label: string;
    icon: string | null;
    collapsible: boolean;
    collapsed: boolean;
    sort: number;
    items: NavigationItem[];
}

export type NavigationNode = NavigationItem | NavigationGroupNode;

// ─── Theme (Phase 7) ──────────────────────────────────────────────────────────

export interface ThemeConfig {
    name: string;
    cssVars: Record<string, string>;
    available: string[];
    brand: {
        name: string;
        logo: string | null;
        darkLogo: string | null;
        logoHeight: string;
        favicon: string | null;
    };
    font: string | null;
    fontWeight: string;
    darkMode: boolean;
    defaultThemeMode: 'light' | 'dark' | 'system';
}

// ─── Prefetch Config ──────────────────────────────────────────────────────────

export type PrefetchStrategy = 'hover' | 'click' | 'mount';

export interface PrefetchConfig {
    enabled: boolean;
    /** Single strategy or array for combined strategies e.g. ['mount', 'hover'] */
    strategy: PrefetchStrategy | PrefetchStrategy[];
    /**
     * Cache freshness duration.
     * string: '30s', '1m', '5m'
     * number: milliseconds
     * [fresh, stale]: stale-while-revalidate tuple e.g. ['30s', '1m']
     */
    cacheFor: string | number | [string | number, string | number];
    /** Flush entire prefetch cache on every Inertia navigation. */
    flushOnNavigate: boolean;
}

// ─── User Menu ────────────────────────────────────────────────────────────────

export interface UserMenuItemConfig {
    name: string;
    label: string;
    url: string | null;
    icon: string | null;
    method: 'get' | 'post';
    newTab: boolean;
}

export interface UserMenuConfig {
    enabled: boolean;
    position: 'topbar' | 'sidebar';
    /** null = use default profile link */
    profile: UserMenuItemConfig | null;
    /** null = use default logout link */
    logout: UserMenuItemConfig | null;
    /** Custom items inserted between profile and logout */
    items: UserMenuItemConfig[];
}

// ─── Panel Config ─────────────────────────────────────────────────────────────

export interface PanelConfig {
    id: string;
    path: string;
    topNavigation: boolean;
    sidebarCollapsibleOnDesktop: boolean;
    sidebarWidth: string;
    collapsedSidebarWidth: string;
    maxContentWidth: string | null;
    breadcrumbs: boolean;
    breadcrumbsPosition?: 'page' | 'header';
    topbar: boolean;
    subNavigationPosition: 'start' | 'end' | 'top' | 'bottom';
    globalSearch: boolean;
    globalSearchMode?: 'dropdown' | 'modal';
    globalSearchAlignment?: 'left' | 'center' | 'right';
    globalSearchSize?: 'default' | 'wide';
    notifications: boolean;
    unsavedChangesAlerts: boolean;
    font: string | null;
    fontWeight: string;
    favicon: string | null;
    brandLogoHeight: string;
    darkModeBrandLogo: string | null;
    defaultThemeMode: 'light' | 'dark' | 'system';
    prefetch: PrefetchConfig;
    userMenu: UserMenuConfig;
    revealablePasswords: boolean;
    hasProfile: boolean;
    profileSlug: string;
    loginSlug: string;
    registrationSlug: string;
    forgotPasswordSlug: string;
    /** Global simple pagination setting; individual table setting takes precedence. */
    simplePagination?: boolean;
}

// ─── Plugin (Phase 7) ─────────────────────────────────────────────────────────

export interface PluginInfo {
    id: string;
    name: string;
    version: string;
    description: string;
    components: Record<string, string>;
}

// ─── Shared Inertia Props ─────────────────────────────────────────────────────

export interface LarafusionSharedProps {
    [key: string]: unknown;
    larafusion: {
        navigation: NavigationNode[];
        theme: ThemeConfig;
        plugins: PluginInfo[];
        assets: string[];
        panel: PanelConfig;
    };
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            /** Populated when the User model implements HasLarafusionAvatar */
            avatar: string | null;
        } | null;
    };
}

// ─── Page Header Actions (Filament v5 style) ─────────────────────────────────
// Rendered as buttons in the breadcrumb/header area of resource pages.

export interface PageHeaderAction {
    type:     'create' | 'delete' | 'force_delete' | 'restore';
    label:    string;
    color:    'primary' | 'danger' | 'warning' | 'success' | 'gray';
    icon?:    string | null;
    /** For link-based actions (create) */
    href?:    string | null;
    /** For method-based actions (delete, restore, force_delete) */
    url?:     string | null;
    method?:  'delete' | 'post' | 'put' | 'patch' | null;
    /** Confirmation dialog message. Present = show confirm before acting. */
    confirm?: string | null;
}

// ─── Page Props ───────────────────────────────────────────────────────────────

export interface LarafusionPageProps {
    [key: string]: unknown;
    resource: ResourceMeta;
    // Omitted entirely by the server on the index page for resources with no
    // inline-editable columns (see ResourceController::index()) — always present
    // on create/edit/show pages, where a real form is rendered.
    schema?: FormSchemaItem[];
    columns: Column[];
    actions: RecordAction[];
    headerActions?: PageHeaderAction[];
    page: 'index' | 'create' | 'edit' | 'show';
    record: Record<string, unknown> | null;
}

export interface IndexPageProps extends LarafusionPageProps {
    page: 'index';
    tableConfig?: TableConfig;
    widgetsMeta: WidgetMeta[];
    headerActions: PageHeaderAction[];
    // Optional only while tableConfig.deferLoading is on and the initial deferred
    // fetch hasn't landed yet — see ResourceController::index(). Otherwise always
    // present as a regular, partial-reloadable prop.
    records?: {
        data: Record<string, unknown>[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export type FormValues = Record<string, unknown>;
export type FormErrors = Record<string, string>;
