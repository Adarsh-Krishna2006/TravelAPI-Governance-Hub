import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_FILE = path.join(__dirname, 'schema.sql');

export async function runMigration(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    console.log('[Migration] No DATABASE_URL provided. Operating in JSON file storage mode.');
    return { status: 'skipped', reason: 'NO_DATABASE_URL' };
  }

  try {
    const pgModule = await import('pg');
    const { Pool } = pgModule.default || pgModule;
    const pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    console.log('[Migration] Connecting to PostgreSQL database...');
    const client = await pool.connect();
    
    try {
      console.log('[Migration] Executing schema.sql DDL...');
      const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf8');
      await client.query(schemaSql);
      console.log('[Migration] PostgreSQL schema initialized successfully.');
      return { status: 'success', migratedAt: new Date().toISOString() };
    } finally {
      client.release();
      await pool.end();
    }
  } catch (err) {
    console.error('[Migration] Failed to run migration:', err.message);
    throw err;
  }
}

// Allow direct CLI execution: node backend/database/migrate.js
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigration().then(res => {
    console.log('[Migration Result]', res);
    process.exit(0);
  }).catch(err => {
    console.error('[Migration Error]', err);
    process.exit(1);
  });
}
