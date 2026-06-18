# Polla Mundialista 2026

Aplicación full-stack para un grupo privado que pronostica partidos del Mundial 2026.

## Estructura

- `frontend/`: Vite + React 18 + Tailwind + React Query.
- `supabase/`: migraciones SQL y Edge Functions.
- `scripts/create-users.js`: seed de usuarios iniciales.

## Frontend

1. Copia `frontend/.env.example` a `frontend/.env`.
2. Define `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Instala dependencias y levanta Vite:

```bash
cd frontend
npm install
npm run dev
```

## Supabase

1. Crea el proyecto.
2. Ejecuta `supabase/migrations/001_initial_schema.sql`.
3. Registra secrets:

```bash
API_FOOTBALL_KEY=...
API_FOOTBALL_WORLD_CUP_LEAGUE_ID=...
API_FOOTBALL_WORLD_CUP_SEASON=2026
```

4. Despliega funciones:

```bash
supabase functions deploy sync-matches
supabase functions deploy calculate-scores
```

## Pendiente manual

- Confirmar el `league_id` real del Mundial 2026 en API-Football.
- Configurar el cron de Supabase con `pg_cron`.
- Completar la lista final de participantes en `scripts/create-users.js`.
