# CLI Commands

## CLI Commands

| Command                                 | Description                                                       |
| --------------------------------------- | ----------------------------------------------------------------- |
| `php artisan arcane:install`            | Full setup: template, vite, bootstrap, env, npm, example resource |
| `php artisan arcane:resource ModelName` | Scaffold Filament-style resource folder (6 files)                 |
| `php artisan arcane:panel {name?}`      | Create a new panel provider in `app/Providers/Arcane/`            |
| `php artisan arcane:plugin PluginName`  | Generate a plugin stub in `app/Arcane/Plugins/`                   |

### `arcane:resource`

Generates a complete Filament-style folder structure:

```bash
php artisan arcane:resource Post
```

Creates:

```
app/Arcane/Resources/Posts/
├── PostResource.php         ← model, navigation, wires form + table
├── Schemas/PostForm.php     ← form field definitions
├── Tables/PostsTable.php    ← column + action definitions
├── Pages/ListPosts.php      ← list page hook (extends ListPage)
├── Pages/CreatePost.php     ← create page hook (extends CreatePage)
└── Pages/EditPost.php       ← edit page hook (extends EditPage)
```

Resources are **auto-discovered** immediately — no registration step required.

### `arcane:panel`

```bash
php artisan arcane:panel admin    # → app/Providers/Arcane/AdminPanelProvider.php
php artisan arcane:panel          # prompts: "Panel name?"
```

---
