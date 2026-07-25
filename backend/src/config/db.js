import pg from 'pg';
import { env } from './env.js';
import { APP_TIMEZONE } from '../utils/timezone.js';

const { types } = pg;
// Preserve raw timestamp strings for timestamp without time zone values.
// This avoids the client receiving UTC-normalized values for local business timestamps.
types.setTypeParser(1114, (value) => value);

const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // fail fast instead of hanging forever
});

pool.on('connect', async (client) => {
  try {
    await client.query(`SET timezone = '${APP_TIMEZONE}'`);
  } catch (error) {
    console.error('Failed to initialize database timezone', error);
  }
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error', err);
});

export const query = (text, params) => pool.query(text, params);

export default pool;
