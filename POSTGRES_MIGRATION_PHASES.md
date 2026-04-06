# Migracion a Postgres / Supabase

Este archivo deja documentado el estado actual de la migracion y las fases siguientes para terminar de sacar Firestore del sistema.

## Variables de entorno

El proyecto ya usa `.env.local` para la conexion local con Supabase.

```env
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
POSTGRES_SSL=true
POSTGRES_POOL_MAX=10
AUTH_SESSION_SECRET=replace-with-a-long-random-secret
```

## Estado actual

Ya esta migrado a Postgres:

- Autenticacion base por sesion.
- Usuarios iniciales en Postgres.
- Productos.
- Clientes.
- POS.
- Facturas.
- Pagos de facturas.
- Inventario.
- Gastos.
- Dashboard.
- Settings del negocio.
- Metodos de pago.
- Cambio de contrasena del usuario autenticado.
- Gestion de usuarios.
- Activacion y desactivacion de usuarios.
- Roles base del sistema.

Todavia siguen dependiendo de Firebase o quedan mezclados:

- Limpieza final de providers y librerias Firebase.
- Reglas y archivos residuales de Firestore.

## Fase 1: Conexion real con Supabase

Objetivo:
Dejar la app corriendo contra una base real de Supabase.

Tareas:

1. Reemplazar los placeholders de `.env.local` por los datos reales de Supabase.
2. Ejecutar `src/lib/postgres-schema.sql` en la base.
3. Validar `GET /api/health/db`.
4. Probar login, dashboard, productos, clientes, POS, inventario, gastos y facturas.
5. Crear un usuario administrador inicial.

Criterio de salida:
La app levanta y los modulos ya migrados funcionan usando Supabase.

## Fase 2: Settings del negocio

Estado:
Completada.

Objetivo:
Mover configuraciones que aun dependan de almacenamiento local o Firebase.

Tareas:

1. Identificar settings aun guardados en `localStorage` o Firestore.
2. Crear endpoints Postgres para leer y guardar configuracion.
3. Migrar la UI de configuracion para usar la nueva API.
4. Unificar prefijos, datos de empresa y metodos de pago en la base.

Criterio de salida:
La configuracion del negocio queda centralizada y compartida entre equipos.

## Fase 3: Reportes

Estado:
Completada.

Objetivo:
Migrar reportes y metricas a consultas SQL.

Tareas:

1. Revisar todas las pantallas de reportes actuales.
2. Crear consultas Postgres para ventas, utilidad, gastos, cartera e inventario.
3. Reemplazar lecturas desde Firestore por endpoints Postgres.
4. Ajustar exportaciones PDF o Excel si dependen de datos viejos.

Criterio de salida:
Los reportes principales salen desde Supabase y ya no consumen Firestore.

## Fase 4: Usuarios y roles

Estado:
Completada en su base operativa.

Objetivo:
Completar la administracion de acceso desde Postgres.

Tareas:

1. Crear CRUD de usuarios.
2. Definir roles y permisos de negocio.
3. Aplicar validaciones de acceso en API y UI.
4. Eliminar dependencias restantes de autenticacion Firebase.

Criterio de salida:
El acceso al sistema se administra completamente desde Postgres.

## Fase 5: Limpieza de Firebase

Objetivo:
Retirar el codigo legacy y dejar una sola arquitectura.

Tareas:

1. Eliminar imports de Firebase que ya no se usen.
2. Desmontar providers, hooks y servicios obsoletos.
3. Eliminar `firestore.rules` y configuraciones relacionadas cuando ya no haya uso real.
4. Limpiar rutas legacy que hoy solo reexportan componentes Postgres.
5. Actualizar la documentacion del proyecto.

Criterio de salida:
El proyecto ya no depende de Firestore ni de Firebase para operar.

## Fase 6: Endurecimiento y despliegue

Objetivo:
Dejar el sistema estable para produccion.

Tareas:

1. Agregar indices SQL segun consultas reales.
2. Revisar errores de `typecheck` preexistentes.
3. Crear pruebas minimas para ventas, pagos, stock y clientes.
4. Definir backups, monitoreo y variables de entorno del despliegue.
5. Validar manejo de SSL, pool de conexiones y tiempos de respuesta.

Criterio de salida:
La app queda lista para operar de forma estable en Supabase.

## Siguiente paso recomendado

El siguiente bloque con mas valor es:

1. Configurar Supabase real.
2. Ejecutar el esquema SQL.
3. Retirar imports y helpers Firebase que ya no participan en runtime.
4. Retirar reglas y archivos residuales de Firestore.

## Avance reciente de limpieza

- `FirebaseClientProvider` ya no envuelve el layout principal.
- El barrel `@/firebase` ya no exporta `client-provider`.
- Las rutas legacy principales ya quedaron neutralizadas como wrappers comentados con reexport a Postgres.

## Notas

- `.env.local` no debe subirse al repositorio.
- `.env.example` si debe mantenerse actualizado.
- Mientras existan rutas legacy, hay que evitar borrar Firebase de golpe.
