import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { env, isProduction } from './env';


export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: env.DB_POOL_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: env.DB_POOL_CONNECT_TIMEOUT_MS,
  ssl: isProduction
    ? { rejectUnauthorized: true }
    : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected pg pool error:', err);
});

export async function query<T extends QueryResultRow = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(sql, params);
}


export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

export async function checkDatabaseConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('Database connection OK');
  } finally {
    client.release();
  }
}
