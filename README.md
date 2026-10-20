# triada-web-expo

Monorepo PNPM + React (Vite + TypeScript).

## Estructura

```
apps/web/          App React (Vite, ESLint vive en la raíz)
packages/shared/   Lógica y tipos compartidos (@triada/shared)
packages/ui/       Componentes React compartidos (@triada/ui)
```

## Comandos

```bash
pnpm install      # instalar todo el workspace
pnpm dev          # servidor de desarrollo (apps/web)
pnpm build        # build de producción (todos los paquetes)
pnpm typecheck    # tsc en todos los paquetes
pnpm lint         # ESLint sobre todo el repo (config en la raíz)
```

Para ver comandos y convenciones detalladas para agentes, ver [AGENTS.md](./AGENTS.md).
