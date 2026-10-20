# AGENTS.md

## What this is

Despite the repo name (`triada-web-expo`), this is a **plain React web app** (Vite + TypeScript) in a **pnpm monorepo** — there is no Expo/React Native here. Do not scaffold Expo tooling.

- Node >= 20; pnpm 11 (pinned via `packageManager`). Use pnpm only — the lockfile is `pnpm-lock.yaml`; never run npm/yarn.
- Workspaces: `apps/*` and `packages/*`, defined in `pnpm-workspace.yaml`.

## Commands (all verified)

| Command | Effect |
|---|---|
| `pnpm install` | Install every workspace from the repo root |
| `pnpm dev` | Vite dev server for `@triada/web` → http://localhost:5173 |
| `pnpm build` | `tsc -b && vite build` for `@triada/web` (packages have no build) |
| `pnpm typecheck` | `tsc` in all 3 packages |
| `pnpm lint` | `eslint .` from the root — the only ESLint config is `/eslint.config.js` |

- One package: `pnpm --filter @triada/web typecheck` (also `@triada/shared`, `@triada/ui`).
- Lint a subset: `pnpm exec eslint apps/web/src` (the `lint` script always covers the whole repo).
- Pre-push check: `pnpm lint && pnpm typecheck && pnpm build`.
- No test runner exists (no `test` script). Don't run `pnpm test`; ask before adding a framework.

## Structure

- `apps/web/` → `@triada/web`. Vite + React 19. Entry: `src/main.tsx` → `src/App.tsx`. Its `tsconfig.app.json`/`tsconfig.node.json` do **not** extend `tsconfig.base.json` (only `packages/*` do).
- `packages/shared/` → `@triada/shared`: app-agnostic constants/utils.
- `packages/ui/` → `@triada/ui`: React components; `react` is declared as both peerDependency and devDependency on purpose.
- Internal deps always use `"workspace:*"`.
- Packages export **source, not build output**: `exports` maps `.` to `./src/index.ts`, and `packages/*` deliberately have **no `build` script** — Vite bundles their TS/TSX directly. Don't introduce `dist/` compile pipelines for them.

## Gotchas

- **TypeScript is pinned to `~6.0.3` deliberately.** `typescript-eslint` 8.x only accepts `>=4.8.4 <6.1.0` and hard-crashes on TS 7.0 (typescript-eslint issue #10940). The `create-vite` template ships a broken TS 7 + ts-eslint combo where `pnpm lint` fails out of the box. Don't bump TypeScript to 7.x until ts-eslint supports it (`pnpm peers check` must stay clean).
- **`strict: true` was added manually** to `apps/web/tsconfig.app.json` and `tsconfig.node.json` — the create-vite template omits it. Keep it.
- **Exactly one ESLint config, at the repo root.** The template's `apps/web/eslint.config.js` was deleted and lint deps hoisted to the root `package.json`. `apps/web/README.md` is untouched template boilerplate that still references the deleted config — the root config is the source of truth. Don't add per-package configs.
- Root `eslint.config.js` ignores use `**/dist` (root-relative); a bare `dist` pattern would not match `apps/web/dist`.
