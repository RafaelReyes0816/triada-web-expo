# CYBER INVADERS v0.5 — INFINITE PULSE 🐧🎵

Videojuego didáctico basado en la tríada CIA, creado con React + TypeScript y Canvas. Cuenta con una API Express **opcional**, sin base de datos. No afecta archivos, procesos ni servicios del sistema operativo: los fallos y el Kernel Panic son simulados.

## Cómo arrancarlo en VS Code (Windows)

1. **Extrae todo** `Cyber-Invaders-v0.5-INFINITE-PULSE.zip`.
2. Abre en VS Code la carpeta `Cyber-Invaders-v0.5` que contiene `package.json`, `apps/` y `pnpm-workspace.yaml`. ¡No ejecutes los comandos desde la carpeta exterior que solo contiene el ZIP!
3. Detén servidores Vite anteriores con `Ctrl+C` para evitar conflictos de puerto.
4. Ejecuta en PowerShell:

```powershell
npx --yes pnpm@11.1.3 install
npx --yes pnpm@11.1.3 dev
```

Abre `http://localhost:5173/` (Node.js 20+).

La API **no hace falta** para jugar. Si deseas conectarla, abre una segunda terminal en la raíz y ejecuta:

```powershell
npx --yes pnpm@11.1.3 api:dev
```

Luego pulsa **MODO LOCAL · CONECTAR API** en la parte superior del videojuego. Ya no se consulta automáticamente `/api/health`, evitando los avisos de ECONNREFUSED si dejas la API apagada.

## Música: solo tres pistas propuestas

| Escena | Pista que puedes importar desde tu disco |
| --- | --- |
| **Menú** | **Natural — Imagine Dragons** |
| **Oleadas 1 y 2 + oleadas de Infinito** | **Hero — Skillet** |
| **Tux y todas sus transformaciones** | **Animal I Have Become — Three Days Grace** |

Los MP3 **no se incluyen** en el repositorio. Cada jugador carga sus propios archivos desde `DJ CYBER / CHROMA BEAT` y el navegador intenta guardarlos en IndexedDB. La música cambia de fase con **fundido cruzado ~1,8 segundos** (el volumen de la anterior baja mientras entra la nueva), y cada canción se reproduce en bucle mientras esté activa. Las dos primeras oleadas comparten *Hero*, que **no se reinicia** cuando comienza la segunda.

Los navegadores pueden bloquear el audio hasta una interacción; pulsa PLAY o comienza la partida. Ajusta sensibilidad en el panel para detectar golpes y usa **Reducir destellos** si prefieres menos cambios luminosos. El analizador local lee el nivel de las frecuencias graves y cambia de verdad el color del **fondo Canvas, la cuadrícula, las líneas y el resplandor alrededor del juego**: azul noche, violeta, magenta, ámbar. Algunos golpes del jefe Infinito activan una ofensiva extra limitada por enfriamiento (3,3 s). La sincronización es aproximada, no un mapa musical perfecto.

> Para no enviar canciones a GitHub, el `.gitignore` excluye archivos MP3/WAV/OGG/etc. Usa únicamente pistas que tengas derecho a utilizar. Si luego publicas el juego, los jugadores cargarán su propia música.

## Modos

- **Historia**: oleada 1 → oleada 2 → batalla contra Tux (2 fases) → victoria con Kernel Panic simulado.
- **Infinito**: sobrevives a oleadas crecientes; **cada 20 enemigos destruidos** aumenta el nivel de amenaza, la cadencia/velocidad de enemigos y proyectiles, y la frecuencia de meteoros. Las siguientes oleadas agregan filas, columnas y enemigos con armadura. Desde los hitos superiores aparecen minas móviles y disparos múltiples. En cada **cuarta oleada**, vuelve Tux con más vida y patrones más exigentes. Nunca hay pantalla de victoria: la partida acaba cuando pierdes las vidas o los invasores atraviesan tu defensa.
- Los **potenciadores aleatorios** incluyen triple disparo, turbo, escudo, vida y EMP. En Infinito también aparecen **cañón de plasma (daño doble)** y **ráfaga x5**.
- Los muros se destruyen bloque a bloque con disparos de ambos bandos y meteoros.
- **Demo: Jefe Final** inicia directamente la pelea contra Tux en Historia, para comprobarlo o mostrarlo en una exposición.

## Controles

| Acción | Tecla |
| --- | --- |
| Moverse | A / D o ← / → |
| Disparar | Espacio o ↑ |
| Pulso EMP | E (100 % de carga) |
| Dash | Shift + dirección |
| Pausar / continuar | P o Escape |
| Empezar | Enter o botones |

## Ubicación del código

- `apps/web/src/App.tsx`: mecánicas del juego y render Canvas.
- `apps/web/src/App.css`: paleta visual reactiva al audio.
- `apps/web/src/music/engine.ts`: doble canal Web Audio, fundidos y detector rítmico.
- `apps/web/src/music/storage.ts`: archivos locales en IndexedDB.
- `apps/api/server.js`: API educativa opcional que guarda estado solo en memoria.

Para GitHub, sube el contenido del proyecto **sin** `node_modules/`, `.env`, archivos MP3 ni otros medios comerciales.
