/**
 * Database Initialization Script for PickleballHQ
 *
 * This script pushes the Prisma schema to the database and
 * optionally seeds it with initial data.
 *
 * Usage:
 *   npx tsx scripts/db-init.ts
 *
 * Prerequisites:
 *   - DATABASE_URL environment variable set
 *   - PostgreSQL database accessible
 */

import { execSync } from 'child_process';
import * as path from 'path';

const SERVER_DIR = path.join(__dirname, '..', 'server');

function run(command: string, cwd: string) {
  console.log(`\n▶ ${command}`);
  execSync(command, { cwd, stdio: 'inherit' });
}

async function main() {
  console.log('🗄️  PickleballHQ Database Initialization');
  console.log('========================================\n');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.error('   Example: postgresql://user:pass@host:5432/pickleballhq');
    process.exit(1);
  }

  console.log(`📡 Database: ${dbUrl.replace(/:[^:@]+@/, ':***@')}`);

  // Step 1: Generate Prisma client
  console.log('\n📦 Step 1: Generating Prisma client...');
  run('npx prisma generate', SERVER_DIR);

  // Step 2: Push schema to database (creates tables)
  console.log('\n📊 Step 2: Pushing schema to database...');
  run('npx prisma db push', SERVER_DIR);

  // Step 3: Seed data (if seed script exists)
  console.log('\n🌱 Step 3: Seeding data...');
  try {
    const importScript = path.join(SERVER_DIR, 'scripts', 'import-data.ts');
    console.log(`   Using import script: ${importScript}`);
    console.log('   Note: Data is loaded from JSON files in src/data/');
    console.log('   The server reads data directly from these JSON files.');
  } catch (err) {
    console.log('   ⚠️ No seed script found, skipping data import');
  }

  console.log('\n✅ Database initialization complete!');
  console.log('   You can now start the server with: npm start');
}

main().catch((err) => {
  console.error('\n❌ Initialization failed:', err);
  process.exit(1);
});
