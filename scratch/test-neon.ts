import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

async function testNeon() {
  console.log('Testing Neon DB connection...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected successfully to Neon Postgres!');
    const res = await client.query('SELECT NOW() as current_time, version() as pg_version;');
    console.log('Current Time:', res.rows[0].current_time);
    console.log('Postgres Version:', res.rows[0].pg_version);
    client.release();
    await pool.end();
  } catch (err) {
    console.error('❌ Connection error:', err);
  }
}

testNeon();
