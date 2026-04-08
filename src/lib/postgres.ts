import 'server-only';

import { Pool, type PoolClient, type QueryResultRow } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __postgresPool: Pool | undefined;
}

function getConnectionString() {
  const connectionString =
    process.env.SUPABASE_DB_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.POSTGRES_URL;

  if (!connectionString) {
    throw new Error(
      'Database connection string is not configured. Use SUPABASE_DB_URL or POSTGRES_URL.'
    );
  }

  return connectionString;
}

function getPoolSize() {
  const rawValue = process.env.POSTGRES_POOL_MAX ?? process.env.SUPABASE_POOL_MAX;

  if (!rawValue) {
    return 1;
  }

  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

export function getPostgresPool() {
  if (!global.__postgresPool) {
    const ssl =
      process.env.POSTGRES_SSL === 'false'
        ? false
        : {
            rejectUnauthorized: false,
          };

    global.__postgresPool = new Pool({
      connectionString: getConnectionString(),
      max: getPoolSize(),
      idleTimeoutMillis: 500, // Close idle connections quickly for serverless
      connectionTimeoutMillis: 5000,
      allowExitOnIdle: true,
      ssl,
    });
  }

  return global.__postgresPool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  values: unknown[] = []
) {
  return getPostgresPool().query<T>(text, values);
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
) {
  const client = await getPostgresPool().connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function checkDatabaseConnection() {
  const result = await query<{ now: Date | string; version: string }>(
    'SELECT NOW() AS now, version() AS version'
  );

  return {
    now: result.rows[0]?.now,
    version: result.rows[0]?.version ?? '',
  };
}
