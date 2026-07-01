# Splitting Packages Into Standalone Repositories

Larafusion ships as one monorepo (this repo) so all packages can be developed
and tested together. But Composer's `vcs` repository type only ever reads
the `composer.json` sitting at a repo's **root** — it has no concept of
"there's another installable package in a subfolder." That's why
`composer require larafusion/larafusion` (or even `larafusion/panels`)
against this repo's GitHub URL alone won't work: none of
`packages/support`, `packages/forms`, `packages/tables`, etc. are reachable
as independent Composer packages that way.

To let consumers install only what they need — the same way Filament ships
`filament/tables`, `filament/forms`, `filament/panels`, etc. as separate
installable packages — each `packages/*` directory needs to be pushed to its
own repository. `.github/workflows/split-packages.yml` automates that: on
every push to `main` (and every tag), it splits each package directory into
its own repo, preserving history.

This file covers the one-time manual setup the split action needs, plus how
a consumer project points Composer at the split repos.

## 1. Create the target repositories

Create one GitHub repo per package under your account (or org), and give
each one an **initial commit on `main`** — the easiest way is to click
"Add a README file" on GitHub's empty-repo quick-setup page (or create any
file directly on `main` through the web UI).

This matters because of how `danharrin/monorepo-split-github-action` bootstraps
a branch: if the target repo has zero commits at all, `git checkout -b main`
creates a branch name with nothing for it to point to, and the action's own
`git push origin main` right after that fails with `src refspec main does
not match any` — there's genuinely nothing to push yet. Giving the repo one
commit up front (a README is fine) means `git checkout main` succeeds on the
first try, and everything after that is a normal fast-forward commit+push —
not a conflict, since it's added on top of existing history rather than
pushing divergent history.

| `packages/` directory | Target repo (suggested name) | Composer package name |
|---|---|---|
| `support` | `larafusion-support` | `larafusion/support` |
| `actions` | `larafusion-actions` | `larafusion/actions` |
| `forms` | `larafusion-forms` | `larafusion/forms` |
| `tables` | `larafusion-tables` | `larafusion/tables` |
| `schemas` | `larafusion-schemas` | `larafusion/schemas` |
| `infolists` | `larafusion-infolists` | `larafusion/infolists` |
| `widgets` | `larafusion-widgets` | `larafusion/widgets` |
| `panels` | `larafusion-panels` | `larafusion/panels` |

`packages/notifications` is not included — it's a JS-only package (no
`composer.json`), so there's nothing for Composer to split. `infolists`
currently has a `composer.json` but no `src/` yet; its split repo will be
empty of PHP code until that package has real source.

Repo names are just labels — the actual Composer package identity comes
from the `"name"` field in each package's `composer.json`, which is already
set correctly (`larafusion/support`, `larafusion/panels`, etc.). If you
rename the target repos, update `repository_name` in the workflow's matrix
to match.

## 2. Create a personal access token and add it as a secret

The split action needs push access to all eight target repos.

1. GitHub → Settings → Developer settings → Personal access tokens →
   generate a token with `repo` scope (classic) or `Contents: write` on the
   target repos (fine-grained).
2. In **this** repo (`arcane`): Settings → Secrets and variables → Actions →
   New repository secret → name it `SPLIT_TOKEN`, paste the token.

The workflow reads it as `env.GITHUB_TOKEN`, which the split action expects.

## 3. Trigger it

Push to `main`. The action runs once per package in the matrix and pushes
each `packages/<name>` directory's history into its target repo. Tag a
release (e.g. `git tag v0.1.0 && git push --tags`) and the same tag gets
applied across all split repos, so version constraints like `^0.1` work
consistently everywhere.

## 4. Install from a consumer project

Each split repo is now a normal Composer package. A consumer only needs
`repositories` entries for the packages they actually use — Composer
resolves the rest transitively from each package's own `require` block.

### Full admin panel (everything)

The root `composer.json` in this repo (`larafusion/larafusion`) is itself an
umbrella/meta package — the same pattern Filament uses with `filament/filament`.
It requires `support`, `actions`, `forms`, `tables`, `schemas`, `widgets`, and
`panels` together, so a consumer who wants the whole thing only needs one
`require` line instead of naming `panels` and its six dependencies separately.
Composer still needs a `repositories` entry for every package in that require
chain (including this `arcane` repo itself, since that's where
`larafusion/larafusion` lives), but the install command becomes just:

```json
{
    "repositories": [
        { "type": "vcs", "url": "https://github.com/ali-hasnain-dev/arcane.git" },
        { "type": "vcs", "url": "https://github.com/ali-hasnain-dev/larafusion-support.git" },
        { "type": "vcs", "url": "https://github.com/ali-hasnain-dev/larafusion-actions.git" },
        { "type": "vcs", "url": "https://github.com/ali-hasnain-dev/larafusion-forms.git" },
        { "type": "vcs", "url": "https://github.com/ali-hasnain-dev/larafusion-tables.git" },
        { "type": "vcs", "url": "https://github.com/ali-hasnain-dev/larafusion-widgets.git" },
        { "type": "vcs", "url": "https://github.com/ali-hasnain-dev/larafusion-schemas.git" },
        { "type": "vcs", "url": "https://github.com/ali-hasnain-dev/larafusion-panels.git" }
    ],
    "minimum-stability": "dev",
    "prefer-stable": true
}
```

```bash
composer require larafusion/larafusion
php artisan larafusion:install
```

If you'd rather not add the `arcane` repository entry (e.g. you only want to
depend on the split packages, not the monorepo itself), `composer require
larafusion/panels` works exactly the same way — same six sub-package
repository entries, just requiring `panels` directly instead of the
umbrella package, and skip the `arcane.git` entry.

### Tables only (no admin panel)

Someone who just wants the Inertia table package — no panel, no forms —
only needs `tables` and its one dependency, `support`:

```json
{
    "repositories": [
        { "type": "vcs", "url": "https://github.com/ali-hasnain-dev/larafusion-support.git" },
        { "type": "vcs", "url": "https://github.com/ali-hasnain-dev/larafusion-tables.git" }
    ],
    "require": {
        "larafusion/tables": "dev-main"
    },
    "minimum-stability": "dev",
    "prefer-stable": true
}
```

Same pattern for forms-only (`larafusion/support` + `larafusion/forms`),
widgets-only, etc. — check each package's `require` block in
`packages/<name>/composer.json` for its exact dependency list.

`dev-main` is used above because the split repos won't have tagged releases
until you push a tag (step 3). Once you're tagging releases, switch
consumer constraints to normal semver ranges, e.g. `"^0.1"`.

## Notes

- The root `composer.json` (`larafusion/larafusion`) is now a real umbrella
  package — it requires all seven sub-packages so a consumer can install
  the whole thing with one `composer require`. It still keeps its `path`
  repositories for local monorepo development; those are only used when
  Composer runs from inside this repo, not when a consumer installs it via
  VCS. The split workflow doesn't touch this file — it only splits
  `packages/*` subdirectories into their own repos.
- The npm/React side of each package (`@larafusion/support`,
  `@larafusion/tables`, etc.) is a separate concern — this split only
  covers the PHP/Composer packages. React packages currently still need to
  come from published npm packages or a similar split if you want the same
  "install just what you need" story on the JS side.
