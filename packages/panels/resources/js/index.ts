// ─── Layout ───────────────────────────────────────────────────────────────────
export { default as AdminLayout  } from './components/layout/AdminLayout';
export type { LarafusionLayoutProps  } from './components/layout/AdminLayout';
export { default as AuthLayout   } from './components/auth/AuthLayout';

// ─── Theme (Phase 7) ──────────────────────────────────────────────────────────
export { default as ThemeProvider, useTheme } from './components/theme/ThemeProvider';
export { default as ThemeSwitcher            } from './components/theme/ThemeSwitcher';
export { PluginProvider, PluginSlot, usePlugins,
         registerComponent, resolveComponent } from './components/theme/PluginRegistry';

// ─── UI ───────────────────────────────────────────────────────────────────────
export { Card, CardHeader, CardBody } from './components/ui/Card';
export { default as Breadcrumb      } from './components/ui/Breadcrumb';

// ─── Fields ───────────────────────────────────────────────────────────────────
export { FieldRenderer } from './components/fields';

// ─── Form ─────────────────────────────────────────────────────────────────────
export { default as DynamicForm } from './components/form/DynamicForm';

// ─── Pages ────────────────────────────────────────────────────────────────────
export { default as Dashboard } from './pages/Larafusion/Dashboard';
export { default as Index     } from './pages/Larafusion/Index';
export { default as Create    } from './pages/Larafusion/Create';
export { default as Edit      } from './pages/Larafusion/Edit';
export { default as Show      } from './pages/Larafusion/Show';
export { default as Settings  } from './pages/Larafusion/Settings';
export { default as Login     } from './pages/Larafusion/Auth/Login';

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
    LarafusionField, LarafusionPageProps, IndexPageProps,
    LarafusionSharedProps, FormValues, FormErrors,
    NavigationItem, ResourceMeta, Column,
    FieldType, FieldValidation, BaseField,
    ThemeConfig, PluginInfo,
} from './types';

// ─── Utils ────────────────────────────────────────────────────────────────────
export { cn } from './lib/utils';
