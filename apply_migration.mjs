import { Client } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read DATABASE_URL from .env
import { config } from 'dotenv';
config({ path: join(__dirname, '../apps/backend/.env') });

const sql = readFileSync(join(__dirname, '../apps/backend/prisma/migrations/20260920140000_add_delivery_event_fingerprint/migration.sql'), 'utf8');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function apply() {
  await client.connect();
  
  // Split statements and run each one separately
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const stmt of statements) {
    console.log('Running:', stmt.substring(0, 80).replace(/\n/g, ' '));
    try {
      await client.query(stmt);
      console.log('  OK');
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('does not exist')) {
        console.log('  SKIPPED (already applied):', err.message);
      } else {
        console.error('  ERROR:', err.message);
        throw err;
      }
    }
  }
  
  await client.end();
  console.log('\nAll statements processed successfully.');
}

apply().catch(err => {
  console.error(err);
  process.exit(1);
});
