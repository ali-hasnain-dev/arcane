import React, { useState } from 'react';
import { router, setLayoutProps, usePage } from '@inertiajs/react';
import AdminLayout from '../../components/layout/AdminLayout';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { ArcaneSharedProps, ThemeConfig, PluginInfo } from '../../types';
import { Check, Puzzle, Palette, Type, Sliders } from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── Theme preview swatch colours ─────────────────────────────────────────────
const SWATCHES: Record<string, { primary: string; sidebar: string }> = {
    violet:  { primary: '#18181b', sidebar: '#18181b' },
    slate:   { primary: '#475569', sidebar: '#0f172a' },
    rose:    { primary: '#e11d48', sidebar: '#1c0a0e' },
    emerald: { primary: '#059669', sidebar: '#022c22' },
    amber:   { primary: '#d97706', sidebar: '#1c1400' },
    sky:     { primary: '#0284c7', sidebar: '#082f49' },
};

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                <Icon className="w-4 h-4" />
                {title}
            </div>
            {children}
        </div>
    );
}

export default function Settings() {
    setLayoutProps({ pageTitle: 'Settings', fullBleed: false });

    const { arcane } = usePage<ArcaneSharedProps>().props;
    const theme   = arcane?.theme   as ThemeConfig;
    const plugins = arcane?.plugins as PluginInfo[] ?? [];

    const [saving, setSaving] = useState(false);

    const switchTheme = (name: string) => {
        setSaving(true);
        router.post('/admin/settings/theme', { theme: name }, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    };

    const toggleDarkMode = () => {
        router.post('/admin/settings/theme', {
            theme: theme.name,
            dark_mode: !theme.darkMode,
        }, { preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Breadcrumb crumbs={[
                { label: 'Dashboard', href: '/admin' },
                { label: 'Settings' },
            ]} />

            <div className="max-w-2xl space-y-8">

                {/* ── Appearance ────────────────────────────────────────── */}
                <Card>
                    <CardHeader title="Appearance" description="Customize the look and feel of your admin panel." />
                    <CardBody className="space-y-8">

                        <Section title="Theme" icon={Palette}>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                {theme.available.map(name => {
                                    const swatch  = SWATCHES[name] ?? SWATCHES.violet;
                                    const isActive = name === theme.name;
                                    return (
                                        <button
                                            key={name}
                                            onClick={() => switchTheme(name)}
                                            disabled={saving}
                                            className={cn(
                                                'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                                                isActive ? 'border-[var(--arcane-primary,#18181b)] shadow-md' : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600',
                                            )}
                                        >
                                            {/* Mini preview */}
                                            <div className="w-full h-12 rounded-lg overflow-hidden flex">
                                                <div className="w-1/3 h-full" style={{ backgroundColor: swatch.sidebar }} />
                                                <div className="flex-1 h-full bg-zinc-50 flex flex-col justify-end p-1 gap-0.5">
                                                    <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: swatch.primary }} />
                                                    <div className="h-1 rounded-full w-2/3 bg-zinc-200" />
                                                </div>
                                            </div>
                                            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 capitalize">{name}</span>
                                            {isActive && (
                                                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[var(--arcane-primary,#18181b)] flex items-center justify-center">
                                                    <Check className="w-2.5 h-2.5 text-white" />
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </Section>

                        <Section title="Mode" icon={Sliders}>
                            <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                <div>
                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Dark Mode</p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Use a dark sidebar and background</p>
                                </div>
                                <button
                                    role="switch"
                                    aria-checked={theme.darkMode}
                                    onClick={toggleDarkMode}
                                    className={cn(
                                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                                        theme.darkMode ? 'bg-[var(--arcane-primary,#18181b)]' : 'bg-zinc-300 dark:bg-zinc-600',
                                    )}
                                >
                                    <span className={cn(
                                        'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                                        theme.darkMode ? 'translate-x-6' : 'translate-x-1',
                                    )} />
                                </button>
                            </div>
                        </Section>

                    </CardBody>
                </Card>

                {/* ── Plugins ───────────────────────────────────────────── */}
                <Card>
                    <CardHeader
                        title="Installed Plugins"
                        description={`${plugins.length} plugin${plugins.length !== 1 ? 's' : ''} installed.`}
                    />
                    <CardBody>
                        {plugins.length === 0 ? (
                            <div className="text-center py-8 text-zinc-400 dark:text-zinc-500">
                                <Puzzle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm font-medium">No plugins installed</p>
                                <p className="text-xs mt-1">Add plugins to <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-xs">config/arcane.php</code></p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {plugins.map(plugin => (
                                    <div key={plugin.id} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                        <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-700/50 flex items-center justify-center shrink-0">
                                            <Puzzle className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{plugin.name}</p>
                                                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">v{plugin.version}</span>
                                            </div>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{plugin.description || plugin.id}</p>
                                        </div>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 shrink-0">
                                            <Check className="w-3 h-3" /> Active
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>

            </div>
        </AdminLayout>
    );
}
