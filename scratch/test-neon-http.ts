import dotenv from 'dotenv';
dotenv.config();
import { neon } from '@neondatabase/serverless';

async function testNeonHttp() {
  console.log('Testing Neon Serverless HTTP driver over HTTPS (Port 443)...');
  const sql = neon(process.env.DATABASE_URL!);

  try {
    const result = await sql`SELECT NOW() as current_time, version() as pg_version;`;
    console.log('✅ Connected successfully to Neon Postgres over HTTP!');
    console.log('Current Time:', result[0].current_time);
    console.log('Postgres Version:', result[0].pg_version);
  } catch (err) {
    console.error('❌ Neon HTTP error:', err);
  }
}

testNeonHttp();
