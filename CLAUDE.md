# CLAUDE.md

This file is the operating contract for Claude Code when working in this repository. Read it before editing code. Larafusion is not a normal Laravel app and not a normal React app: it is a Laravel package monorepo that ships PHP APIs and compiled React/Inertia UI packages.

**Before starting work, also read `MEMORY.md`** in the repo root — it's a running status file of recent session work (distribution/split-repo setup, install-flow bugs already found and fixed, Dashboard/resource-scaffold/table-config changes, and anything still open). It exists so context isn't rebuilt from scratch every session. Keep it updated as you go.

## Claude Role And Quality Bar

Act as a senior Laravel, Filament, React, Inertia, shadcn-style UI, and Figma-fluent product engineer/architect with 15+ years of experience. Treat every change as package-quality work that may become public API for many Laravel applications.

This repository is mainly an admin panel system, so admin UX quality is a first-class engineering requirement, not decoration. Put 101% focus on clear, consistent, accessible, professional admin UI before shipping any feature. The interface should feel like a serious production admin panel: fast to scan, efficient for repeated workflows, visually balanced, responsive, keyboard-friendly, and consistent with Laravel/Filament expectations.

Think like an architect before editing:

- Understand the existing package boundary, public API, serialized schema, and UI pattern first.
- Prefer Laravel-first, Filament-inspired, package-safe design decisions.
- Keep PHP APIs elegant for Laravel developers and keep React implementation generic, typed, and schema-driven.
- Make UI decisions with Figma-level care: spacing, alignment, hierarchy, density, empty states, loading states, error states, focus states, hover states, dark mode, and mobile behavior all matter.
- Choose readable names, small cohesive methods/components, and predictable abstractions over clever code.
- Leave the codebase cleaner, stricter, and easier to extend without changing unrelated behavior.

## Product Context

Larafusion is a Filament-style admin panel package for Laravel 11 and newer. Developers define PHP resources, fields, tables, actions, widgets, panels, and plugins. Larafusion serializes those PHP definitions into Inertia props and renders the admin UI with React 19, Inertia React v3, lucide icons, Tailwind/shadcn-style primitives, and local Larafusion React packages.

The package goal is: keep the consumer API Laravel/PHP-first while keeping the React UI generic, typed, reusable, and driven by serialized schema.

## Hard Rules

- Do not add code that assumes this repository is a standalone Laravel application. Package code belongs under `packages/*`; app-specific examples belong in `stubs/`, `docs/`, or `features/`.
- Do not import random UI libraries, icon libraries, routers, table libraries, form libraries, or state managers. Use the stack already present: Laravel, Inertia, React 19, lucide-react, Tailwind classes, clsx, and local Larafusion packages.
- Do not invent aliases such as `@/components` unless they already exist in that package's `tsconfig` and Vite config. Most source imports here are relative imports or local package exports.
- Do not bypass the PHP schema layer by hardcoding resource-specific fields, columns, routes, or model names in React.
- Do not change package boundaries casually. Shared types, helpers, icons, and base UI belong in `@larafusion/support`; forms belong in `@larafusion/forms`; tables belong in `@larafusion/tables`; admin pages/layout/auth/theme belong in `@larafusion/panels`.
- Do not add runtime dependencies to the root package when they belong to a workspace package. For React packages, put React/Inertia as peer dependencies when the consuming app should provide them.
- Do not break Inertia partial reload behavior. `records` and `record` must remain refreshable regular props; schema/config props use lazy closures or `Inertia::once()` intentionally.
- Do not silently remove existing features, docs, routes, stubs, exports, or public PHP methods. This is package API surface.

## Repository Shape

This is a dual monorepo:

- PHP packages live in `packages/*/src`.
- React/TypeScript packages live in `packages/*/resources/js`.
- Root `package.json` uses npm workspaces.
- Root `composer.json` wires local path repositories.
- Feature specs live in `features/`.
- Public documentation lives in `docs/`.
- Consumer app scaffolding lives in `packages/panels/stubs/`.

Important packages:

- `larafusion/larafusion` and `@larafusion/panels`: main entry point — admin panel, pages, routes, controllers, layout, auth, plugins, themes. Lives in `packages/panels/`.
- `larafusion/forms` and `@larafusion/forms`: PHP fields, layout schema, React fields, hybrid validation, uploads, relation fields.
- `larafusion/tables` and `@larafusion/tables`: PHP columns/filters/actions/table builder, React table UI.
- `larafusion/widgets` and `@larafusion/widgets`: widget PHP APIs and React widget UI.
- `larafusion/support` and `@larafusion/support`: shared PHP support namespace plus shared JS types, utilities, primitives, icons.
- `larafusion/actions`: PHP action builders.
- `larafusion/schemas`: PHP serializer layer.
- `larafusion/infolists`, `@larafusion/infolists`, `@larafusion/notifications`: package modules; keep their dependencies narrow.

## Commands

Run from repo root unless noted:

```bash
npm run build
npm run typecheck
npm run build:support
npm run build:forms
npm run build:tables
npm run build:widgets
npm run build:notifications
npm run build:panels
npm run lint --workspace=packages/panels
```

Build order matters when checking individual packages: `support` first, then consumers (`forms`, `tables`, `widgets`, `notifications`), then `panels`.

PHP artisan commands are designed for the consuming Laravel app, not this repo:

```bash
php artisan larafusion:install
php artisan larafusion:resource Post
php artisan larafusion:widget Stats
php artisan larafusion:plugin Analytics
php artisan larafusion:panel Admin
```

## PHP Package Practices

Use Laravel 11+ and PHP 8.2+ conventions.

- Use typed properties, return types, fluent `static` returns for builder APIs, and clear method names.
- Follow Laravel naming conventions carefully: action methods should be verbs, booleans should read like predicates (`isSearchable`, `hasFilters`, `canCreate`), collection variables should be plural, DTO/schema arrays should use stable descriptive keys, and resource/table/form methods should match Laravel/Filament mental models.
- Keep function and variable names explicit enough that a Laravel developer understands intent without opening three other files.
- Keep public APIs chainable where the surrounding code is chainable, for example `Text::make('name')->required()->max(255)`.
- Preserve the package namespace strategy. Many packages intentionally autoload to `Larafusion\\` so users can write APIs such as `Larafusion\Fields\Text`, `Larafusion\Columns\TextColumn`, `Larafusion\Tables\Table`, and `Larafusion\Widgets\Widget`. `actions`, `support`, and `infolists` have more specific namespaces in composer; check each package before adding classes.
- Do not use app-only helpers or assumptions in package code, such as hardcoded `App\Models\User` except in stubs/examples.
- Prefer Laravel contracts/services/facades already used by the package. Do not introduce service container complexity unless the feature needs it.
- Controllers must authorize with the resource permission methods before reading or mutating records.
- Keep route order safe: specific routes such as export/import/bulk/action routes must be registered before catch-all `/{resource}` routes.
- For package configuration, use `packages/panels/config/larafusion.php` and service provider publishing/merging patterns.
- Public package behavior needs docs or feature notes when changed.

## Resource, Schema, And Serialization Rules

The PHP schema is the source of truth.

- Resource classes extend `Larafusion\Resource`.
- `form()` returns field/layout objects.
- `table(Table $table): Table` is the preferred table API. `columns()` remains legacy and must stay compatible.
- `actions()` returns resource action objects.
- `widgets()` returns widget objects.
- `Serializer::fields()`, `Serializer::columns()`, and `Serializer::flattenFields()` are the bridge to React.
- When adding a new field/column/filter/action, update both the PHP object and the TypeScript type/renderer/schema support.
- Do not send closures, Eloquent models, queries, enums, or unserializable objects directly to React. Convert to plain arrays/scalars.
- Preserve validation split: client-safe rules go to React; server-only rules stay server-side. `unique`, `exists`, conditional required/prohibited rules, and other DB/context-dependent rules must not be trusted to client validation alone.
- `Resource::getCreateRules()` and `getUpdateRules()` extract rules from the field schema. Keep validation colocated with field definitions.

## ResourceController/Inertia Rules

Current prop strategy is intentional:

- Index page: use lazy closures for `resource`, `schema`, `columns`, `tableConfig`, and `actions`. This keeps same-component navigation between resources correct while allowing `only: ['records']` reloads to skip schema/config.
- Create/edit/show pages: use `Inertia::once()` for schema/resource/action metadata that does not change during that visit.
- `records` and `record` are regular props so reloads can refresh them.
- Widgets/stats can use `Inertia::defer()` only when non-empty. Return `[]` immediately when empty to avoid unnecessary second requests.
- `Inertia::share()` is for global Larafusion data such as navigation, theme, plugin registry, panel config, and authenticated user.

The store/update pipeline must remain ordered:

1. Validate request.
2. Fire `record.creating` or `record.updating` plugin hook.
3. Separate relation payloads.
4. Persist temporary uploads.
5. Encode JSON-like fields.
6. Convert morph fields.
7. Hash password fields.
8. Create/update model.
9. Sync relations.
10. Fire created/updated hooks and broadcast if enabled.

## Inertia React v3 Practices

- Use `@inertiajs/react` APIs already used here: `Link`, `router`, `useForm`, `usePage`, `Deferred`, and `setLayoutProps` where appropriate.
- Use Inertia navigation for internal app routes instead of raw anchors.
- Use partial reloads for table interactions: filters, search, sort, pagination, inline actions, and refreshes should request only the props they need.
- Preserve scroll/state intentionally. Use `preserveScroll`, `preserveState`, and `replace` where UX requires it.
- Hooks cannot be called inside `Deferred` render callbacks. Use a child component, as in `DeferredWidgets`.
- Do not create a separate client router or React Router layer.
- Do not fetch resource schema independently from React when the controller already provides it through Inertia props.

## React 19 And TypeScript Practices

- Use React 19 with the automatic JSX runtime. Do not add `ReactDOM.render`; use modern React patterns.
- Prefer function components, typed props, discriminated unions, and small hooks.
- Keep `strict` TypeScript clean. Avoid `any`; if current code uses `any`, narrow it when touching that area.
- Use `unknown` for dynamic record values and narrow before rendering or mutating.
- Keep components schema-driven and generic. A component should work for any Larafusion resource unless it is explicitly an auth/settings/layout component.
- Keep hooks at the top level. Do not call hooks conditionally, inside callbacks, or inside loops.
- Use `useMemo` and `useCallback` only when they remove real repeated work or stabilize props for child behavior. Do not sprinkle them everywhere.
- Avoid derived state when it can be computed from props.
- Treat `usePage<T>().props` as typed shared state; update shared types when new shared props are added.
- For dynamic imports, only use them for real optional package boundaries or code splitting.

## Frontend UI Practices

Larafusion UI is a working admin tool, not a marketing page.

- Follow the existing Tailwind/shadcn-style primitives and class patterns.
- Treat admin-panel UX as the highest priority for frontend work. Every screen should be practical, polished, accessible, responsive, and easy to scan under real data volume.
- Design like a Figma expert before coding: establish visual hierarchy, rhythm, whitespace, alignment, density, contrast, responsive behavior, and component states before adding new markup.
- Use Filament-quality admin patterns: strong table ergonomics, predictable action placement, clear filters/search/sort/pagination, good form grouping, useful validation feedback, and calm empty/loading/error states.
- Use `lucide-react` icons for buttons, empty states, nav, actions, and status indicators.
- Use local `cn()` helpers from the current package's `lib/utils`.
- Use existing primitives such as `Card`, `Breadcrumb`, `Notifications`, `AdminLayout`, field wrappers, modal patterns, table controls, and theme provider before creating new primitives.
- Keep controls dense, predictable, accessible, and suitable for repeated admin work.
- Keep spacing and sizing intentional. Align labels, fields, icons, controls, table cells, and action groups precisely. Avoid visual noise, random colors, inconsistent radii, and uneven padding.
- Prefer familiar admin controls: icon buttons with accessible labels for repeated actions, segmented/toggle controls for modes, menus for secondary actions, clear destructive states, and consistent confirmation flows.
- Always account for long labels, long values, missing data, validation messages, many rows, narrow screens, and dark mode.
- Add `type="button"` to non-submit buttons inside forms.
- Preserve dark mode classes where nearby UI supports dark mode.
- Use CSS variables for theme-sensitive colors where existing code uses Larafusion theme tokens, for example `var(--larafusion-primary, #7c3aed)`.
- Do not hardcode a one-off color system when the theme manager should control it.
- Do not add explanatory UI text about how features work unless the existing UX pattern calls for helper copy.

## Import And Dependency Discipline

Use only dependencies present in the relevant package manifest.

- `lucide-react` is the icon source.
- `clsx` is available; `tailwind-merge` and `class-variance-authority` are not currently part of the stack.
- `@inertiajs/react` is for React/Inertia packages that declare it.
- `@larafusion/support` is the shared package for public support exports.
- Internal package code usually imports relatively from `../types`, `../lib/utils`, or nearby components.
- `@larafusion/core` appears as a consumer-app Vite alias in stubs and some existing form code. Do not expand its use without checking the resolver and build impact.
- Do not import from another package's private `resources/js` path unless this is already the local pattern for shared re-exports and the build supports it.
- If a new dependency is truly needed, add it to the smallest package that needs it, document why, and keep React/Inertia as peer dependencies when appropriate.

## Code Style

PHP:

- Follow Laravel Pint/PSR-12 style and the surrounding package style.
- Keep one class per file.
- Use explicit visibility.
- Use strict, readable PHP with typed parameters, typed returns, nullable types where needed, and narrow PHPDoc only when it adds information static analysis cannot infer.
- Prefer Laravel collections, value objects, enums, contracts, request validation, policies/authorization, resources, and service classes when they fit the existing package pattern.
- Keep methods small and intention-revealing. Extract private helpers when a method mixes authorization, transformation, persistence, and response-building.
- Avoid vague names like `$data`, `$item`, `$value`, `$result`, or `$config` when a domain-specific name is available.
- Avoid magic strings and duplicated schema keys. Reuse constants or existing helper methods where the codebase already does so.
- Prefer early authorization/abort checks.
- Keep chainable builder methods short and predictable.
- Comments should explain non-obvious package behavior, serialization choices, or Inertia strategy.

TypeScript/React:

- Use `.tsx` for components and `.ts` for types/hooks/utilities without JSX.
- Use interfaces/types near the component unless they are shared across packages.
- Keep TypeScript strict and expressive. Prefer discriminated unions, generics, `unknown` plus narrowing, and typed event handlers over `any`.
- Name components, hooks, props, handlers, and variables clearly: `ResourceTable`, `useBulkActions`, `selectedRecordIds`, `handleFilterChange`, `isSubmitting`, `canDelete`.
- Keep React components focused. Extract subcomponents when JSX becomes hard to scan or when admin UI states need clear separation.
- Avoid stale state and unnecessary effects. Derive values from props where possible, and use effects only for synchronization with external systems.
- Keep exports aligned with each package's `resources/js/index.ts` and `package.json` `exports`.
- Use single quotes, semicolons, and the indentation style used in the edited file.
- Keep Tailwind class strings readable; use `cn()` when classes are conditional.
- No large unrelated refactors during feature work.

Quality tools and standards:

- Prefer Laravel's first-party/recommended quality tools and common ecosystem standards: Laravel Pint for formatting, Larastan/PHPStan for static analysis, Pest/PHPUnit for tests, and Rector only when an intentional modernization task calls for it.
- For JavaScript/TypeScript, keep code compatible with the package's existing TypeScript, ESLint/build tooling, and workspace scripts. Do not introduce a new formatter or linter unless the repository adopts it deliberately.
- Code should pass the narrowest relevant checks before finishing. If checks are unavailable, explain exactly what was inspected manually.

Docs:

- Update `docs/` for user-facing behavior.
- Update `features/` for feature planning/status details.
- Update stubs when the generated consumer app code changes.

## Testing And Verification

Before finishing a change, run the narrowest useful checks:

- Type-only frontend change: `npm run typecheck --workspace=<package>` or root `npm run typecheck` if shared.
- Package frontend build change: `npm run build --workspace=<package>`.
- Shared support change: build/typecheck support first, then affected consumers.
- Panels UI or page changes: `npm run typecheck --workspace=packages/panels` and preferably `npm run build:panels`.
- PHP API/controller changes: run available package tests if present; otherwise run focused static inspection and explain what could not be executed.
- Docs-only change: no build required unless examples were changed in a way that should compile.

If a command cannot run because dependencies, a consuming test app, or network access is unavailable, say exactly that in the final answer.

## Implementation Checklist For Claude

When asked to implement something:

1. Inspect the relevant package manifests, types, PHP classes, React components, docs, and stubs before editing.
2. Identify the package boundary: panels, forms, tables, widgets, support, actions, schemas, notifications, or infolists.
3. Keep the PHP API and serialized schema in sync with the React types and renderers.
4. Keep Inertia props and partial reload behavior intact.
5. Use existing local components, icons, helpers, and patterns.
6. Update exports and docs when adding public APIs.
7. Run targeted verification.
8. Summarize changed files, behavior, and checks.

## Current Architecture Notes

`LarafusionServiceProvider` registers package routes, shares Inertia props, and registers CLI commands.

`LarafusionManager` is the central runtime registry for resources, pages, widgets, navigation, plugins, themes, and panels.

`Panel` and `PanelProvider` define fluent panel configuration. `PanelProvider::register()` registers panels with `LarafusionManager`.

`Resource` is the base class for model resources. It provides the form/table/action/widget API, authorization hooks, validation extraction, page props, search/sort config, import/export flags, inline editing flags, and tenant scoping hook.

`packages/panels/routes/larafusion.php` defines admin routes under the panel path, defaulting to `/admin`.

React pages live in `packages/panels/resources/js/pages/Larafusion` and match Inertia component names such as `Larafusion/Index`, `Larafusion/Create`, `Larafusion/Edit`, `Larafusion/Show`, `Larafusion/Dashboard`, and `Larafusion/Auth/Login`.

`AdminLayout` wraps authenticated pages. `ThemeProvider` and `PluginRegistry` handle theme variables and plugin slots.

The dependency graph is:

```text
@larafusion/support
    -> @larafusion/forms
    -> @larafusion/tables
    -> @larafusion/widgets
    -> @larafusion/notifications
    -> @larafusion/panels
```

Build support before dependent packages.

## Consumer App Notes

The `tsconfig.base.json` includes a `typeRoots` entry for a sibling integration app at `../../../../arcane-test-v2/node_modules/@types`. Do not remove it unless the integration setup changes.

The `larafusion:install` stub config wires the consuming Laravel app to resolve Larafusion pages from the installed package. Keep stubs aligned with package exports and page paths.
