import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';

const url1 = 'postgresql://neondb_owner:npg_tPITl5puvZ7C@ep-snowy-cloud-b4lvllxf-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';
const url2 = 'postgresql://neondb_owner:npg_tPITl5puvZ7C@ep-snowy-cloud-b4lvllxf.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function testConnections() {
  console.log('Testing connection 1 (pooled without channel_binding)...');
  const pool1 = new Pool({ connectionString: url1, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
  try {
    const c1 = await pool1.connect();
    console.log('✅ Pool 1 connected!');
    const r1 = await c1.query('SELECT current_database(), current_user;');
    console.log('Result 1:', r1.rows[0]);
    c1.release();
    await pool1.end();
    return url1;
  } catch (err: any) {
    console.log('❌ Pool 1 failed:', err.message);
  }

  console.log('Testing connection 2 (direct unpooled)...');
  const pool2 = new Pool({ connectionString: url2, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
  try {
    const c2 = await pool2.connect();
    console.log('✅ Pool 2 connected!');
    const r2 = await c2.query('SELECT current_database(), current_user;');
    console.log('Result 2:', r2.rows[0]);
    c2.release();
    await pool2.end();
    return url2;
  } catch (err: any) {
    console.log('❌ Pool 2 failed:', err.message);
  }
}

testConnections();
