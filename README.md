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
WORLDCUP26_BASE_URL=https://worldcup26.ir
WORLDCUP26_TOKEN=...
```

4. Despliega funciones:

```bash
supabase functions deploy sync-matches
supabase functions deploy calculate-scores
```

5. Aplica migraciones, incluido el cron:

```bash
supabase db push
```

Esto deja programados dos jobs con `pg_cron`:

- `worldcup-sync-matches-every-minute`: ejecuta `sync-matches` cada minuto.
- `worldcup-recalculate-scores-every-2-minutes`: ejecuta `calculate-scores` cada 2 minutos como respaldo.

## Pendiente manual

- Confirmar si `WORLDCUP26_TOKEN` es obligatorio en el entorno objetivo.
- Completar la lista final de participantes en `scripts/create-users.js`.
