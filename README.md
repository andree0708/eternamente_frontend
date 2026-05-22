# EternaMente — Frontend

Aplicación web de evaluación cognitiva (Astro + React).

## Patrones de software utilizados

| Patrón | Dónde | Para qué |
|--------|-------|----------|
| **Component-Based Architecture** | `src/components/` | UI modular: juegos, auth, historial |
| **Container / Presentational** | `GamePage.tsx` + juegos hijos | `GamePage` orquesta; juegos solo lógica de partida |
| **Custom Hooks** | `src/hooks/useGameSession.ts` | Reutilizar guardado de partida y estado de sesión |
| **Strategy** | `game.astro` / `GamePage` switch por `gameType` | Cada juego es una estrategia intercambiable |
| **Facade** | `src/lib/api.ts` | Interfaz única al backend (URLs, token, envelope) |
| **Module / Barrel** | `src/lib/gameConfig.ts`, `games.ts` | Configuración centralizada por tipo de juego |
| **Observer (React state)** | Componentes con `useState` / `useEffect` | UI reactiva a métricas y fin de partida |
| **Singleton (implícito)** | `localStorage` token vía `getAuthToken()` | Sesión del usuario en el cliente |
| **Proxy (infra)** | `vercel.json` rewrites | Evitar CORS en producción |

## Estructura

```
src/
├── components/
│   ├── auth/AuthPage.tsx      # Login/registro con botón bloqueado
│   ├── games/                 # Juegos React + panel resultados
│   └── history/HistoryPage.tsx
├── hooks/useGameSession.ts
├── lib/api.ts                 # Cliente API
├── lib/gameConfig.ts
├── pages/                     # Rutas Astro
└── styles/
```

## Variables de entorno

```env
# Local
PUBLIC_API_URL=http://localhost:8080

# Vercel: dejar vacío para usar proxy /api → Render
```

## Scripts

```bash
npm run dev
npm run build
```
