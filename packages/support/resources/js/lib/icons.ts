/**
 * Centralized Lucide icon registry for all Larafusion packages.
 *
 * Keys are kebab-case names (matching what PHP passes as strings).
 * Add entries here to make new icons available everywhere: navigation,
 * form affixes, badge icons, and table actions.
 */
import React from 'react';
import {
    // ── Layout / navigation ─────────────────────────────────────────────────
    LayoutDashboard, Home, Settings, Menu,
    ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ChevronsUpDown,
    ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
    GripVertical, MoveHorizontal,

    // ── Users ────────────────────────────────────────────────────────────────
    Users, User, UserPlus, UserMinus, UserCheck, UserX,

    // ── Files / documents ────────────────────────────────────────────────────
    File, FileText, FilePlus, FileEdit, FileCheck, FileX,
    FileJson, FileCode, FileImage,
    Folder, FolderOpen, FolderPlus,

    // ── Commerce ─────────────────────────────────────────────────────────────
    ShoppingCart, ShoppingBag, Package, PackageOpen,
    CreditCard, Banknote, DollarSign, Percent, Receipt, Wallet,
    Store, Truck, Boxes,

    // ── Communication ────────────────────────────────────────────────────────
    Mail, MailOpen,
    Phone, PhoneCall, PhoneOff,
    MessageCircle, MessageSquare, Send,
    Bell, BellOff, BellRing,
    AtSign, Hash, Tag, Tags, Ticket,
    Link, Link2, ExternalLink, Globe, Rss, Wifi,

    // ── Status / alert ───────────────────────────────────────────────────────
    CheckCircle, XCircle, AlertCircle, AlertTriangle, Info, HelpCircle,
    CircleSlash,
    Shield, ShieldCheck, ShieldX, ShieldOff, ShieldAlert,
    Lock, Unlock, Key,

    // ── Time ─────────────────────────────────────────────────────────────────
    Clock, Timer, Hourglass,
    Calendar, CalendarDays, CalendarCheck, CalendarX,

    // ── Loading ──────────────────────────────────────────────────────────────
    Loader2, RefreshCw, RotateCcw, RotateCw,

    // ── Shapes / generic ─────────────────────────────────────────────────────
    Circle, Square, Triangle, Diamond, Hexagon, Octagon,
    Dot, Minus, Plus, X, Check,

    // ── Actions ──────────────────────────────────────────────────────────────
    Pencil, PencilLine,
    Trash2,
    Eye, EyeOff,
    Copy, Clipboard, ClipboardCheck, ClipboardList,
    Scissors, Download, Upload, CloudDownload, CloudUpload,
    Save,
    Search, ZoomIn, ZoomOut,
    Filter, SortAsc, SortDesc,
    Play, Pause, StopCircle,

    // ── Data / analytics ──────────────────────────────────────────────────────
    BarChart2, BarChart3, PieChart, LineChart, AreaChart,
    TrendingUp, TrendingDown, Activity,
    Database, Server, HardDrive, Cpu,
    Table, Grid2X2, Grid3X3, LayoutGrid,
    List, ListOrdered, ListChecks,
    Layers, Layers2,

    // ── Infrastructure ────────────────────────────────────────────────────────
    Cloud, CloudOff,
    Terminal, Code, Code2,
    Plug2, Puzzle,
    Zap, ZapOff,

    // ── Media / design ────────────────────────────────────────────────────────
    Image, Images, Camera, Video, Film,
    Music2, Headphones, Volume2, VolumeX,
    Star, Heart, Flame, Sparkles,
    Sun, Moon, Monitor, Laptop, Smartphone,
    Palette, Paintbrush2, Brush, Eraser,

    // ── Maps / location ───────────────────────────────────────────────────────
    Map, MapPin, Navigation, Compass,

    // ── Miscellaneous ────────────────────────────────────────────────────────
    Archive,
    Inbox,
    Bookmark, BookmarkPlus,
    Award, Trophy, Crown,
    Gift, Box,
    Bug, Wrench, Hammer,
    Rocket, Lightbulb,
    Maximize2, Minimize2, Expand,
    MoreHorizontal, MoreVertical,
    Power,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Bold, Italic, Underline,
    TextCursor, Type,
} from 'lucide-react';

type IconComponent = React.ComponentType<{ className?: string }>;

export const ICON_MAP: Record<string, IconComponent> = {
    // ── Layout ────────────────────────────────────────────────────────────────
    'layout-dashboard': LayoutDashboard, dashboard: LayoutDashboard,
    home: Home,
    settings: Settings, gear: Settings,
    menu: Menu,
    'chevron-left': ChevronLeft, 'chevron-right': ChevronRight,
    'chevron-down': ChevronDown, 'chevron-up': ChevronUp,
    'chevrons-up-down': ChevronsUpDown,
    'arrow-left': ArrowLeft, 'arrow-right': ArrowRight,
    'arrow-up': ArrowUp, 'arrow-down': ArrowDown,
    'grip-vertical': GripVertical, 'move-horizontal': MoveHorizontal,

    // ── Users ─────────────────────────────────────────────────────────────────
    users: Users, user: User,
    'user-plus': UserPlus, 'user-minus': UserMinus,
    'user-check': UserCheck, 'user-x': UserX,
    admin: User, profile: User, contact: User,

    // ── Files ─────────────────────────────────────────────────────────────────
    file: File, 'file-text': FileText, posts: FileText, article: FileText,
    'file-plus': FilePlus, 'file-edit': FileEdit,
    'file-check': FileCheck, 'file-x': FileX,
    'file-json': FileJson, 'file-code': FileCode, 'file-image': FileImage,
    folder: Folder, 'folder-open': FolderOpen, 'folder-plus': FolderPlus,

    // ── Commerce ──────────────────────────────────────────────────────────────
    'shopping-cart': ShoppingCart, cart: ShoppingCart, orders: ShoppingCart,
    'shopping-bag': ShoppingBag,
    package: Package, 'package-open': PackageOpen,
    'credit-card': CreditCard, payments: CreditCard,
    banknote: Banknote, 'dollar-sign': DollarSign, dollar: DollarSign,
    percent: Percent, receipt: Receipt, wallet: Wallet,
    store: Store, truck: Truck, boxes: Boxes,

    // ── Communication ─────────────────────────────────────────────────────────
    mail: Mail, email: Mail, newsletter: MailOpen, 'mail-open': MailOpen,
    phone: Phone, 'phone-call': PhoneCall, 'phone-off': PhoneOff,
    'message-circle': MessageCircle, chat: MessageCircle,
    'message-square': MessageSquare,
    send: Send,
    bell: Bell, 'bell-off': BellOff, 'bell-ring': BellRing, notifications: Bell,
    'at-sign': AtSign, at: AtSign,
    hash: Hash, tag: Tag, tags: Tags, ticket: Ticket,
    link: Link, link2: Link2, 'external-link': ExternalLink, open: ExternalLink,
    globe: Globe, website: Globe, rss: Rss, wifi: Wifi,

    // ── Status / alert ────────────────────────────────────────────────────────
    'check-circle': CheckCircle, published: CheckCircle,
    active: CheckCircle, completed: CheckCircle,
    'x-circle': XCircle, cancelled: XCircle, rejected: XCircle,
    'alert-circle': AlertCircle, error: AlertCircle,
    'alert-triangle': AlertTriangle, warning: AlertTriangle,
    info: Info, 'help-circle': HelpCircle, help: HelpCircle,
    'circle-slash': CircleSlash, disabled: CircleSlash,
    shield: Shield, security: Shield,
    'shield-check': ShieldCheck, verified: ShieldCheck,
    'shield-x': ShieldX, 'shield-off': ShieldOff, spam: ShieldX,
    'shield-alert': ShieldAlert,
    lock: Lock, unlock: Unlock, key: Key,

    // ── Time ──────────────────────────────────────────────────────────────────
    clock: Clock, time: Clock, pending: Clock,
    timer: Timer, hourglass: Hourglass, processing: Hourglass,
    calendar: Calendar, 'calendar-days': CalendarDays,
    'calendar-check': CalendarCheck, 'calendar-x': CalendarX,

    // ── Loading ───────────────────────────────────────────────────────────────
    loader: Loader2, loader2: Loader2, loading: Loader2, spinner: Loader2,
    refresh: RefreshCw, 'refresh-cw': RefreshCw,
    'rotate-ccw': RotateCcw, restore: RotateCcw,
    'rotate-cw': RotateCw,

    // ── Shapes / generic ──────────────────────────────────────────────────────
    circle: Circle, dot: Dot, square: Square, triangle: Triangle,
    diamond: Diamond, hexagon: Hexagon, octagon: Octagon,

    // ── Actions ───────────────────────────────────────────────────────────────
    edit: Pencil, pencil: Pencil, 'pencil-line': PencilLine,
    trash: Trash2, trash2: Trash2, delete: Trash2, destroy: Trash2,
    eye: Eye, view: Eye, 'eye-off': EyeOff,
    copy: Copy, duplicate: Copy, clone: Copy,
    clipboard: Clipboard, 'clipboard-check': ClipboardCheck,
    scissors: Scissors,
    download: Download, export: Download,
    upload: Upload, import: Upload,
    'cloud-download': CloudDownload, 'cloud-upload': CloudUpload,
    save: Save,
    search: Search, 'zoom-in': ZoomIn, 'zoom-out': ZoomOut,
    filter: Filter, 'sort-asc': SortAsc, 'sort-desc': SortDesc,
    plus: Plus, add: Plus,
    minus: Minus, remove: Minus,
    x: X, close: X, reject: X,
    check: Check, approve: Check,
    play: Play, pause: Pause, stop: StopCircle,

    // ── Data / analytics ──────────────────────────────────────────────────────
    'bar-chart': BarChart2, 'bar-chart-2': BarChart2, 'bar-chart-3': BarChart3,
    analytics: BarChart2, stats: BarChart2,
    'pie-chart': PieChart, 'line-chart': LineChart, 'area-chart': AreaChart,
    'trending-up': TrendingUp, 'trending-down': TrendingDown,
    activity: Activity,
    database: Database, db: Database,
    server: Server, 'hard-drive': HardDrive, cpu: Cpu,
    table: Table, 'grid-2': Grid2X2, 'grid-3': Grid3X3,
    'layout-grid': LayoutGrid, grid: Grid2X2,
    list: List, 'list-ordered': ListOrdered, 'list-checks': ListChecks,
    layers: Layers, layers2: Layers2,

    // ── Infrastructure ────────────────────────────────────────────────────────
    cloud: Cloud, 'cloud-off': CloudOff,
    terminal: Terminal, code: Code, code2: Code2,
    plug: Plug2, plugin: Puzzle, puzzle: Puzzle,
    zap: Zap, 'zap-off': ZapOff, action: Zap, run: Zap,

    // ── Media / design ────────────────────────────────────────────────────────
    image: Image, images: Images, photo: Image,
    camera: Camera, video: Video, film: Film,
    music: Music2, headphones: Headphones, volume: Volume2, mute: VolumeX,
    star: Star, favourite: Star, favorite: Star,
    heart: Heart, like: Heart,
    flame: Flame, hot: Flame,
    sparkles: Sparkles, magic: Sparkles,
    sun: Sun, moon: Moon, monitor: Monitor, laptop: Laptop, smartphone: Smartphone,
    palette: Palette, paintbrush: Paintbrush2, brush: Brush, eraser: Eraser,

    // ── Maps / location ───────────────────────────────────────────────────────
    map: Map, 'map-pin': MapPin, pin: MapPin, location: MapPin,
    navigation: Navigation, compass: Compass,

    // ── Misc ──────────────────────────────────────────────────────────────────
    archive: Archive,
    inbox: Inbox,
    bookmark: Bookmark, 'bookmark-plus': BookmarkPlus,
    award: Award, trophy: Trophy, crown: Crown,
    gift: Gift, box: Box,
    bug: Bug, wrench: Wrench, tool: Wrench, hammer: Hammer,
    rocket: Rocket, lightbulb: Lightbulb,
    maximize: Maximize2, minimize: Minimize2, expand: Expand,
    'more-horizontal': MoreHorizontal, 'more-vertical': MoreVertical,
    ellipsis: MoreHorizontal,
    power: Power,
    'align-left': AlignLeft, 'align-center': AlignCenter,
    'align-right': AlignRight, 'align-justify': AlignJustify,
    bold: Bold, italic: Italic, underline: Underline,
    'text-cursor': TextCursor, type: Type,
};

/**
 * Resolve an icon component by name, with optional fallback.
 * Falls back to `Circle` when the name is unknown.
 */
export function resolveIcon(
    name: string | null | undefined,
    fallback: IconComponent = Circle,
): IconComponent {
    if (!name) return fallback;
    return ICON_MAP[name.toLowerCase().replace(/[\s_]/g, '-')] ?? fallback;
}
