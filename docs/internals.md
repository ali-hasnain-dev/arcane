# HTTP Endpoints & Inertia Data Flow

## HTTP Endpoints

All routes are prefixed with `/admin` (configurable via `->path()`).

| Method    | Path                                    | Description                |
| --------- | --------------------------------------- | -------------------------- |
| GET       | `/`                                     | Dashboard                  |
| GET       | `/search?q=`                            | Global search (JSON)       |
| POST      | `/upload`                               | Upload temp file           |
| DELETE    | `/upload`                               | Delete temp file           |
| GET       | `/files/{path}`                         | Serve uploaded file        |
| GET       | `/p/{page}`                             | Custom page                |
| GET       | `/settings`                             | Settings page              |
| POST      | `/settings/theme`                       | Update theme preference    |
| GET       | `/{resource}`                           | Index table                |
| GET       | `/{resource}/create`                    | Create form                |
| POST      | `/{resource}`                           | Store record               |
| GET       | `/{resource}/{id}`                      | Show record                |
| GET       | `/{resource}/{id}/edit`                 | Edit form                  |
| PUT/PATCH | `/{resource}/{id}`                      | Update record              |
| DELETE    | `/{resource}/{id}`                      | Delete (soft or hard)      |
| DELETE    | `/{resource}/bulk`                      | Bulk delete                     |
| POST      | `/{resource}/bulk-delete`               | Bulk delete (POST variant)      |
| POST      | `/{resource}/bulk-force-delete`         | Bulk force-delete (soft-delete) |
| POST      | `/{resource}/{id}/restore`              | Restore soft-deleted            |
| DELETE    | `/{resource}/{id}/force`                | Permanently delete              |
| POST      | `/{resource}/bulk-restore`              | Bulk restore                    |
| PATCH     | `/{resource}/{id}/inline`               | Inline cell edit           |
| POST      | `/{resource}/{id}/action/{key}`         | Run record action          |
| GET       | `/{resource}/export`                    | Download CSV               |
| GET       | `/{resource}/import`                    | Import wizard page         |
| POST      | `/{resource}/import/preview`            | Preview CSV rows           |
| POST      | `/{resource}/import/commit`             | Commit import              |
| GET       | `/{resource}/relations/{field}/options` | Async relation options     |
| GET       | `/{resource}/{id}/relations/{field}`    | Fetch related records      |
| GET       | `/{resource}/morph/{field}/options`     | Async morph options        |

---

## Inertia v3 Data Flow

Larafusion uses all Inertia v3 features to minimise round-trips and payload size.

### Prop strategies

| Strategy                | Used for                                                            | Re-sent on partial reload?             |
| ----------------------- | ------------------------------------------------------------------- | -------------------------------------- |
| `Inertia::once($value)` | `schema`, `columns`, `tableConfig`, `resource`, `actions`, `page`   | **No** — sent once on initial visit    |
| `Inertia::defer(fn)`    | `widgets`, `stats`                                                  | Only when explicitly requested         |
| Regular prop            | `records`, `record`                                                 | Yes — refreshed via `only:['records']` |
| `Inertia::share()`      | `larafusion.navigation`, `larafusion.flash`, `larafusion.theme`, `larafusion.panel` | Every response                         |

### Index table data flow

```
Initial visit → full response (once + deferred records/widgets)
Sort / filter → only:['records'] — schema/columns never re-serialised
Pagination    → only:['records'] — same
Per-page      → only:['records'] — same
Trash tab     → only:['records'] — same
```

### Optimistic delete

```tsx
router
  .optimistic<{ records: typeof records }>((p) => ({
    records: {
      ...p.records,
      data: p.records.data.filter((r) => r.id !== id),
      total: p.records.total - 1,
    },
  }))
  .delete(`/admin/${resource.slug}/${id}`, { preserveScroll: true });
```

The row vanishes instantly before the server responds.

### Link prefetching

When `->prefetch()` is enabled in the panel provider, Larafusion spreads the configured `prefetch` and `cacheFor` props onto all internal `<Link>` components (nav, row actions, Create/Edit buttons). The exact strategy and cache duration are controlled entirely via the provider — no React changes required.

---
