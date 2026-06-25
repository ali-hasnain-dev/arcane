# Notifications

## Notifications

### Flash Toasts (automatic)

Every CRUD operation automatically shows a toast. Trigger from any controller:

```php
return redirect()->route('larafusion.resource.index', 'posts')
    ->with('success', 'Post published!');

return redirect()->back()
    ->with('error', 'Something went wrong.');
```

Toasts stack (max 5), auto-dismiss after 4.5 s, and appear in the bottom-right corner.

### From React

```tsx
import { useNotify } from "../components/ui/Notifications";

function MyComponent() {
  const { success, error, warning, info, notify } = useNotify();

  return <button onClick={() => success("Saved!")}>Save</button>;

  // Full control — persistent toast:
  notify({
    type: "warning",
    title: "Heads up",
    message: "This cannot be undone.",
    duration: 0,
  });
}
```

### Topbar Bell Icon

Shown only when you opt in:

```php
->notifications()   // default: hidden
```

---
