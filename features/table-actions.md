# Table Actions

## Overview

Table actions are buttons that appear in each table row (record actions) or in the toolbar above the table (toolbar actions). Larafusion provides two tiers:

1. **Preset actions** — `EditAction`, `DeleteAction`, `ViewAction` — zero-config convenience wrappers with sensible defaults.
2. **Custom `Action`** — `Larafusion\Tables\Actions\Action` — a full-featured action class supporting server callbacks, URL navigation, confirmation dialogs, conditional visibility, tooltips, badges, and notifications.
3. **Bulk action types** — `DeleteBulkAction`, `RestoreBulkAction`, `ForceDeleteBulkAction`, and the `BulkActionGroup` container.

All actions live in the `Table` builder via `->recordActions([...])` and `->toolbarActions([...])`.

---

## Why This Feature Exists

Without a dedicated action system, per-row operations (publish, archive, send invoice, impersonate) require writing custom controller routes, wiring JavaScript, and managing confirmation dialogs manually. The `Action` class encapsulates the full lifecycle: PHP callback, URL resolution, client-side confirmation, toast notification, and conditional visibility — all declared alongside the column definitions.

---

## Core Concepts

### Two Delivery Paths

**Server-callback actions** — declare `->action(fn($record) => ...)`. The React UI sends `POST /admin/{resource}/{id}/action/{key}`. The `ActionController` resolves the action, calls `->execute($record, $data)`, and redirects back with a success flash.

**URL actions** — declare `->url(fn($record) => "/posts/{$record->slug}")`. The React UI renders the action as an `<a>` tag. No server round-trip; navigation happens client-side.

### Visibility Control

`->visible(callable)` accepts a closure that receives the `Model` record and returns a boolean. The controller enforces this via `$action->visibleFor($record)` before executing. React uses the serialised `toArray()` — closures cannot be serialised, so conditional visibility for rendering must be handled on the PHP side (the controller returns a 403 for hidden actions regardless).

### Serialisation

Actions are serialised via `->toArray()`. Closures (from `->action()`, `->url()` with a closure, `->visible()`) are not sent to the frontend — only static string URLs travel in the JSON. Server-side execution always happens via the `ActionController`.

---

## Preset Actions

### EditAction

Routes to the resource's edit page.

```php
use Larafusion\Tables\Actions\EditAction;

EditAction::make()
EditAction::make()->label('Modify')->color('primary')
```

Serialised as `{ type: 'edit', key: 'edit', label: 'Edit', color: 'primary' }`. React routes to `/admin/{resource}/{id}/edit`.

---

### DeleteAction

Sends `DELETE /admin/{resource}/{id}` with an optional confirmation dialog.

```php
use Larafusion\Tables\Actions\DeleteAction;

DeleteAction::make()
DeleteAction::make()
    ->label('Remove')
    ->color('danger')
    ->confirm('Are you sure you want to permanently delete this?')
    ->withoutConfirmation()   // skip the dialog
```

Default confirm message: `"Are you sure you want to delete this record? This action cannot be undone."`

---

### ViewAction

Routes to the resource's show page (read-only view).

```php
use Larafusion\Tables\Actions\ViewAction;

ViewAction::make()
ViewAction::make()->label('View details')
```

---

## Custom Action

`Larafusion\Tables\Actions\Action`

The general-purpose action for anything that does not fit the presets.

### Basic Server Callback

```php
use Larafusion\Tables\Actions\Action;

Action::make('publish')
    ->label('Publish')
    ->icon('send')
    ->color('success')
    ->confirm('Publish this post? It will be visible immediately.')
    ->action(fn($record) => $record->update(['status' => 'published']))
    ->successNotificationTitle('Post published successfully.')
```

### URL Action (External Link)

```php
Action::make('preview')
    ->label('Preview')
    ->icon('eye')
    ->url(fn($record) => "/posts/{$record->slug}")
    ->openUrlInNewTab()
```

### Static URL (serialised to JSON)

```php
Action::make('analytics')
    ->label('Analytics')
    ->url('/admin/analytics')   // static string → included in JSON
```

### Confirmation Dialog Customisation

```php
Action::make('archive')
    ->label('Archive')
    ->icon('archive')
    ->color('warning')
    ->requiresConfirmation()                      // default message
    ->modalHeading('Archive this post?')
    ->modalDescription('Archived posts are hidden from public view.')
    ->modalSubmitActionLabel('Archive')
```

### Conditional Visibility

```php
// Show "Publish" only for draft posts
Action::make('publish')
    ->visible(fn($record) => $record->status === 'draft')
    ->action(fn($record) => $record->update(['status' => 'published'])),

// Show "Unpublish" only for live posts
Action::make('unpublish')
    ->visible(fn($record) => $record->status === 'published')
    ->action(fn($record) => $record->update(['status' => 'draft'])),
```

### Display Modes

```php
Action::make('edit')
    ->iconOnly()     // icon only, no text (default for row actions)
    ->textOnly()     // text only, no icon
    ->button()       // full button with icon + text
    ->display('icon') // same as iconOnly()
```

### Badge on an Action

```php
Action::make('notifications')
    ->badge('5', 'danger')   // badge text, badge color
```

### Tooltip

```php
Action::make('delete')
    ->icon('trash')
    ->tooltip('Permanently delete this record')
```

### Full API Reference

| Method | Description |
|---|---|
| `make(string $key)` | Factory; key is also the route segment |
| `label(string)` | Display label |
| `icon(string)` | Lucide icon name |
| `color(string)` | `default` \| `primary` \| `success` \| `warning` \| `danger` |
| `primary() / success() / warning() / danger()` | Color shortcuts |
| `display(string)` | `'icon'` \| `'text'` \| `'button'` |
| `iconOnly()` | Shortcut for `display('icon')` |
| `textOnly()` | Shortcut for `display('text')` |
| `button()` | Shortcut for `display('button')` |
| `tooltip(string)` | Tooltip on hover |
| `badge(string, string)` | Badge text and color on the button |
| `confirm(?string)` | Enable confirmation dialog with message |
| `requiresConfirmation()` | Same as `->confirm()` with default message |
| `modalHeading(string)` | Dialog title |
| `modalDescription(string)` | Dialog body text |
| `modalSubmitActionLabel(string)` | Dialog submit button label |
| `action(callable)` | Server-side callback `($record, $data) => mixed` |
| `url(string\|callable)` | Static URL or closure returning URL |
| `openUrlInNewTab()` | Open URL in a new browser tab |
| `visible(callable)` | Closure `($record): bool` for conditional display |
| `hidden(bool)` | Always hide |
| `successNotificationTitle(string)` | Flash message on success |
| `failureNotificationTitle(string)` | Flash message on failure |

---

## Bulk Actions

Bulk actions apply to a set of selected rows. The built-in `BasicTable` renders checkboxes and a "Bulk actions" menu when toolbar actions include a `BulkActionGroup`.

### BulkActionGroup

Container that groups bulk actions into a dropdown menu.

```php
use Larafusion\Tables\Actions\BulkActionGroup;
use Larafusion\Tables\Actions\DeleteBulkAction;
use Larafusion\Tables\Actions\RestoreBulkAction;
use Larafusion\Tables\Actions\ForceDeleteBulkAction;

Table::make()
    ->toolbarActions([
        BulkActionGroup::make([
            DeleteBulkAction::make(),
        ])->label('Bulk Actions'),
    ]);
```

For a resource with soft deletes:

```php
BulkActionGroup::make([
    DeleteBulkAction::make(),
    RestoreBulkAction::make(),
    ForceDeleteBulkAction::make(),
])
```

### DeleteBulkAction

Sends `DELETE /admin/{resource}/bulk` with `{ ids: [...] }`. Authorised by `canDelete()`.

### RestoreBulkAction

Sends `POST /admin/{resource}/bulk-restore` with `{ ids: [...] }`. Requires `softDeletes()`.

### ForceDeleteBulkAction

Sends `POST /admin/{resource}/bulk-force-delete` with `{ ids: [...] }`. Requires `softDeletes()` and `canDelete()`.

---

## Architecture

### ActionController

```php
// POST /admin/{resource}/{id}/action/{action}
ActionController::handle(Request $request, string $resource, int|string $id, string $action)
```

1. Resolve the resource class via `LarafusionManager::resolve($resource)`.
2. Find the record via `findOrFail($id)`.
3. Search `$resourceClass::actions()` (legacy API) first, then `table()->getRecordActions()` for a matching key.
4. Abort 404 if not found; abort 403 if `visibleFor($record)` returns false.
5. Call `$action->execute($record, $request->all())`.
6. Return `$result` if it is a `RedirectResponse` or JSON-serialisable, otherwise redirect to the index with a success flash.

### Redirect Behaviour

An action callback can return:
- `null` → redirect to index with success flash
- `RedirectResponse` → use that redirect
- Any array/object → return as JSON (`response()->json($result)`)

---

## Real World Examples

### Content Publishing Workflow

```php
->recordActions([
    ViewAction::make(),
    EditAction::make(),
    Action::make('publish')
        ->icon('send')
        ->color('success')
        ->visible(fn($r) => $r->status === 'draft')
        ->confirm('Publish this post?')
        ->action(function ($record) {
            $record->update([
                'status'       => 'published',
                'published_at' => now(),
            ]);
        })
        ->successNotificationTitle('Post published.'),
    Action::make('unpublish')
        ->icon('eye-off')
        ->color('warning')
        ->visible(fn($r) => $r->status === 'published')
        ->action(fn($r) => $r->update(['status' => 'draft'])),
    Action::make('archive')
        ->icon('archive')
        ->color('gray')
        ->visible(fn($r) => in_array($r->status, ['draft', 'published']))
        ->confirm('Archive this post?')
        ->action(fn($r) => $r->update(['status' => 'archived'])),
    DeleteAction::make(),
])
```

### Impersonate User Action

```php
Action::make('impersonate')
    ->icon('user-check')
    ->color('warning')
    ->tooltip('Log in as this user')
    ->visible(fn($r) => $r->id !== auth()->id())
    ->confirm('Log in as ' . '?')
    ->action(function ($record) {
        auth()->loginUsingId($record->id);
        return redirect('/dashboard');
    })
```

### Send Welcome Email

```php
Action::make('welcome_email')
    ->label('Send Welcome')
    ->icon('mail')
    ->visible(fn($r) => !$r->welcome_sent_at)
    ->action(function ($record) {
        $record->notify(new WelcomeNotification());
        $record->update(['welcome_sent_at' => now()]);
    })
    ->successNotificationTitle('Welcome email sent.')
```

### External URL Action (no server callback)

```php
Action::make('stripe')
    ->label('View in Stripe')
    ->icon('credit-card')
    ->url(fn($r) => "https://dashboard.stripe.com/customers/{$r->stripe_id}")
    ->openUrlInNewTab()
```

---

## Advanced Usage

### Action with Form Data

The `ActionController` passes `$request->all()` as `$data` to `execute()`. This allows actions to receive extra parameters from a modal form (if wired on the React side via a custom plugin slot):

```php
Action::make('reject')
    ->action(function ($record, $data) {
        $record->update([
            'status' => 'rejected',
            'reason' => $data['reason'] ?? null,
        ]);
    })
```

### Returning a Download Response

```php
Action::make('invoice')
    ->action(function ($record) {
        $pdf = PDF::loadView('invoices.pdf', ['order' => $record]);
        return $pdf->download("invoice-{$record->number}.pdf");
    })
```

The `ActionController` handles `RedirectResponse` but not `StreamedResponse`. For file downloads, return a `Response` and handle on the React side.

---

## Best Practices

- **Use preset actions (`EditAction`, `DeleteAction`)** for standard operations. They have stable behaviour and require no extra configuration.
- **Keep action callbacks focused.** Do one thing per action. Dispatch a job for anything slow.
- **Always provide `->successNotificationTitle()`** for custom server-callback actions so the user gets feedback beyond the generic flash message.
- **Use `->visible(fn($r) => ...)` generously.** Showing only relevant actions per row reduces cognitive load.
- **Use `->tooltip()` on icon-only actions** so the user knows what the icon does without clicking it.

---

## Common Mistakes

**Using `->url(fn($record) => ...)` and expecting a server-side callback.** Closure URLs are resolved server-side and the result URL is returned in the JSON. If the closure contains heavy logic, it runs on every schema serialisation. Use `->action()` for server logic and `->url()` for navigation only.

**Forgetting that `->visible()` closures do not run during schema serialisation for the index page.** The index page sends `actions` as a closure prop (lazy), and `getActionsSchema($record = null)` is called with `$record = null`. The `visibleFor(null)` check would fail for closures that call methods on the record. This is why preset actions and closures that check a record attribute should guard against null: `fn($r) => $r && $r->status === 'draft'`.

**Naming two actions with the same key.** The controller resolves by key; the first match wins. Use unique keys.

---

## Related Features

- [Tables](tables.md) — `Table::recordActions()`, `Table::toolbarActions()`
- [Actions (legacy)](actions.md) — the older `ButtonAction` / `LinkAction` API
- [Soft Deletes](soft-deletes.md) — `RestoreBulkAction`, `ForceDeleteBulkAction`
- [Plugins](plugins.md) — lifecycle hooks fired around action execution
