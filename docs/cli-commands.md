# CLI Commands

## CLI Commands

| Command                                 | Description                                                       |
| --------------------------------------- | ----------------------------------------------------------------- |
| `php artisan larafusion:install`            | Full setup: template, vite, bootstrap, env, npm, example resource |
| `php artisan larafusion:resource ModelName` | Scaffold Filament-style resource folder (6 files)                 |
| `php artisan larafusion:panel {name?}`      | Create a new panel provider in `app/Providers/Larafusion/`            |
| `php artisan larafusion:plugin PluginName`  | Generate a plugin stub in `app/Larafusion/Plugins/`                   |

### `larafusion:resource`

Generates a complete Filament-style folder structure:

```bash
php artisan larafusion:resource Post
```

Creates:

```
app/Larafusion/Resources/Posts/
├── PostResource.php         ← model, navigation, wires form + table
├── Schemas/PostForm.php     ← form field definitions
├── Tables/PostsTable.php    ← column + action definitions
├── Pages/ListPosts.php      ← list page hook (extends ListPage)
├── Pages/CreatePost.php     ← create page hook (extends CreatePage)
└── Pages/EditPost.php       ← edit page hook (extends EditPage)
```

Resources are **auto-discovered** immediately — no registration step required.

### `larafusion:panel`

```bash
php artisan larafusion:panel admin    # → app/Providers/Larafusion/AdminPanelProvider.php
php artisan larafusion:panel          # prompts: "Panel name?"
```

---
