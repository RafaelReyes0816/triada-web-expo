# AGENTS.md

## What this is

Despite the repo name (`triada-web-expo`), this is a **plain React web app** (Vite + TypeScript) in a **pnpm monorepo** — there is no Expo/React Native here. Do not scaffold Expo tooling.

- Node >= 20; pnpm 11 (pinned via `packageManager`). Use pnpm only — lockfile `pnpm-lock.yaml`; never npm/yarn.
- Workspaces: `apps/*` and `packages/*` (`pnpm-workspace.yaml`).

## Commands (verified)

| Command | Effect |
|---|---|
| `pnpm install` | Install all workspaces from repo root |
| `pnpm dev` | Vite dev for `@triada/web` → http://localhost:5173 |
| `pnpm build` | `pnpm -r build` → `@triada/web` runs `tsc -b && vite build`; `packages/*` have no `build` script (no-op) |
| `pnpm typecheck` | `pnpm -r typecheck` → `@triada/web` uses `tsc -b`, `@triada/shared`/`@triada/ui` use `tsc --noEmit` |
| `pnpm lint` | `eslint .` from root — only config is `eslint.config.js` |
| `pnpm preview` | Preview `@triada/web` build |

- Single package: `pnpm --filter @triada/web <cmd>` (also `@triada/shared`, `@triada/ui`).
- Lint subset: `pnpm exec eslint apps/web/src` (root `lint` still covers whole repo).
- Pre-push: `pnpm lint && pnpm typecheck && pnpm build`.
- No test runner/script. Don't run `pnpm test`; ask before adding one.

## Structure

- `apps/web/` → `@triada/web` (Vite + React 19). Entry: `src/main.tsx` → `src/App.tsx`. `tsconfig.app.json`/`tsconfig.node.json` do **not** extend `tsconfig.base.json` (only `packages/*` do). Uses `allowImportingTsExtensions` + `noEmit`.
- `packages/shared/` → `@triada/shared` (app-agnostic). Extends `tsconfig.base.json`.
- `packages/ui/` → `@triada/ui` (React components). Extends `tsconfig.base.json`. `react` is both peerDependency and devDependency by design.
- Internal deps use `"workspace:*"`.
- Packages export **source, not build output**: `exports` map `.` to `./src/index.ts`. No `dist/` compile pipeline for `packages/*` — Vite bundles TS/TSX directly. Don't add build/dist for them.

## Gotchas

- **TypeScript pinned to `~6.0.3` deliberately.** `typescript-eslint` 8.x accepts `>=4.8.4 <6.1.0` and hard-crashes on TS 7.0 (#10940). Don't bump to TS 7.x until ts-eslint supports it (`pnpm peers check` must stay clean).
- **`strict: true` added manually** to `apps/web/tsconfig.app.json` and `tsconfig.node.json` (template omits it). Keep it.
- **Single ESLint config at root.** Template `apps/web/eslint.config.js` deleted; deps hoisted to root. `apps/web/README.md` is stale boilerplate referencing the deleted config — root `eslint.config.js` is source of truth. Don't add per-package configs. Root ignores use `**/dist` (root-relative); bare `dist` won't match `apps/web/dist`.
- **Build uses `tsc -b` for web.** `tsconfig.app.json` writes tsbuildinfo to `./node_modules/.tmp/...`; don't delete that cache unless necessary.
