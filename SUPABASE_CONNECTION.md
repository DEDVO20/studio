# Conexion con Supabase

Este proyecto ya puede usar Supabase como base principal de Postgres.

## Variables recomendadas

Usa `.env.local` con estas variables:

```env
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
POSTGRES_SSL=true
POSTGRES_POOL_MAX=10
AUTH_SESSION_SECRET=replace-with-a-long-random-secret
```

Notas:

- `SUPABASE_DB_URL` es ahora la variable recomendada.
- `POSTGRES_URL` sigue siendo compatible por retrocompatibilidad.
- `POSTGRES_SSL=true` es lo normal para Supabase.

## Probar la conexion

Con la app levantada, revisa:

- `GET /api/health/db`

Si todo esta bien, debe responder con `ok: true`.

## Cargar el esquema

Abre el SQL Editor de Supabase y ejecuta el contenido de:

- `src/lib/postgres-schema.sql`

## Flujo recomendado

1. Crear el proyecto en Supabase.
2. Copiar la cadena de conexion de Postgres.
3. Pegarla en `.env.local` como `SUPABASE_DB_URL`.
4. Ejecutar `src/lib/postgres-schema.sql`.
5. Levantar la app.
6. Validar `GET /api/health/db`.
7. Crear el administrador inicial desde login.
