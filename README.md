# BodegaStore

## Supabase

El archivo `.env.local` no aparece en el repo porque `.gitignore` excluye `.env*`. Eso es intencional para no subir credenciales.

Toma como base `.env.example` y configura estas variables para Supabase:

```env
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
POSTGRES_SSL=true
POSTGRES_POOL_MAX=10
AUTH_SESSION_SECRET=replace-with-a-long-random-secret
```

Pasos rapidos:

1. Copia `.env.example` a `.env.local`.
2. Reemplaza `SUPABASE_DB_URL` con la cadena de conexion de Supabase.
3. Define un `AUTH_SESSION_SECRET` largo y aleatorio.
4. Ejecuta `src/lib/postgres-schema.sql` en la base.
5. Valida la conexion con `GET /api/health/db`.

Aplicación Next.js para POS, inventario, clientes, facturas y reportes.

## Postgres

La migración desde Firestore a Postgres comenzó en este repo. La primera integración lista es el detalle de facturas y el registro de pagos.

### Variables de entorno

Configura estas variables antes de usar la nueva capa:

```env
POSTGRES_URL=postgres://USER:PASSWORD@HOST:5432/DATABASE
POSTGRES_SSL=true
```

### Esquema base

El archivo `src/lib/postgres-schema.sql` contiene el esquema inicial para usuarios, productos, clientes, facturas, pagos, movimientos de inventario, gastos y settings.
