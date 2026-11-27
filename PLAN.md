# Plan: Paisaje de Marte cinematográfico con Three.js

## Contexto
La carpeta está vacía. Quieres una escena 3D de Marte "de película" (dunas, rocas, cielo caramelo con polvo, sol de tarde cálido, sombras suaves, Fobos y Deimos), visible en vivo en el navegador de VS Code lo antes posible (<20 min), y un `npm run check` que la revise con Playwright usando tu Chrome instalado, en modo invisible (headless), guardando captura y listando errores de consola.

Interpreto: "lib3.js" = **Three.js**, "mi cron" = **Google Chrome**, "play write" = **Playwright**.

## Archivos
- `package.json` — scripts `start` y `check`; única dependencia de desarrollo: `playwright-core` (no descarga navegadores).
- `server.js` — servidor estático mínimo con `http` de Node (sin dependencias), puerto **5173**.
- `perseverance.html` — la escena (archivo único, como pide CLAUDE.md; `/` redirige a él). Three.js **0.160.0** por CDN con import map (versión fija).
- `check.mjs` — lanza Chrome con `chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] })` para que WebGL funcione sin GPU, abre `http://localhost:5173`, espera ~3 s, guarda `captura.png`, imprime errores de consola / `pageerror` / requests fallidos, y termina con código 1 si hay errores.

## Orden de trabajo
0. **Guardar este plan como `PLAN.md`** en la carpeta del proyecto (primer paso tras aprobar).
1. **Primero (≈5 min):** `package.json`, `server.js`, escena mínima (cielo, terreno, luz) → arrancar servidor en segundo plano (`npm start`) y darte la URL `http://localhost:5173` para abrirla en el navegador de VS Code.
2. **Escena completa:**
   - Terreno grande con dunas (ondas senoidales + ruido) y sombras `PCFSoftShadowMap`.
   - Cielo: shader de degradado caramelo/butterscotch, más claro hacia el sol; niebla exponencial color polvo.
   - Sol bajo de tarde: `DirectionalLight` cálido con sombras suaves + `HemisphereLight` rojiza; disco solar con halo.
   - ~150 rocas (`DodecahedronGeometry` deformadas) con sombras.
   - Partículas de polvo flotando con el viento.
   - Fobos (más grande, irregular) y Deimos (pequeña) en el cielo.
   - ACES tone mapping, cámara cinematográfica que orbita lentamente (OrbitControls para mirar).
3. `npm install` (playwright-core) y crear `check.mjs`.
4. **Bucle de revisión (máx. 3 rondas):** `npm run check` → leer `captura.png` + errores → corregir. Listo cuando 0 errores y la captura muestre dunas, rocas, cielo caramelo, sol, sombras y las dos lunas.

## Verificación
- `npm start` → abrir `http://localhost:5173` en VS Code.
- `npm run check` → `captura.png` y "0 errores de consola".
