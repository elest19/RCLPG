import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

try {
  await client.connect();
  await client.query(
    "ALTER TABLE public.sales_records ADD COLUMN IF NOT EXISTS is_purchased_tank BOOLEAN NOT NULL DEFAULT FALSE;",
  );

  const result = await client.query(
    "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sales_records' AND column_name = 'is_purchased_tank'",
  );

  console.log(JSON.stringify(result.rows, null, 2));
} finally {
  await client.end();
}
