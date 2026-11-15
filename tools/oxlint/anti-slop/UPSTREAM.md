# Upstream

- Source: https://github.com/dmmulroy/anti-slop
- Commit: `d2a9aea3b896ffcb291a85f2c1301aa2543ad8c8`
- Source path: `skills/install-anti-slop/assets/anti-slop/` (tree `97962dc9fad565ca7695bf57805d9d0138ce1def` for `skills/install-anti-slop/`)
- Installed: 2026-11-15, via the `install-anti-slop` skill. All 38 files were byte-identical to the commit before the deviation below.

## Installed plugins

- `tools/oxlint/anti-slop/index.ts` (`anti-slop`)
- `tools/oxlint/anti-slop/effect/index.ts` (`anti-slop-effect`, enabled because `effect` is a direct dependency)

Both are registered in `.oxlintrc.json` with every rule at `"error"`, alongside `oxc/no-accumulating-spread`.

## Local deviations

- `shared/dictionary-types.ts`: `unsafeMembers[0]` became `(unsafeMembers[0] ?? null)`. This repo's `tsconfig.json` enables `noUncheckedIndexedAccess`, which types the index as possibly `undefined`. The branch already checks `length > 0`, so behavior is unchanged.

`vendor/eslint-stylistic/UPSTREAM.md` records the provenance of the vendored Stylistic code.
