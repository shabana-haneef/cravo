import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all tables in public schema...');
  
  // Get all table names in the public schema
  const tablenames = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;
  
  console.log(`Found ${tablenames.length} tables. Starting truncation...`);
  
  // Truncate all tables CASCADE, excluding prisma migrations
  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
        console.log(`Successfully truncated table: ${tablename}`);
      } catch (error) {
        console.error(`Failed to truncate ${tablename}:`, error);
      }
    }
  }
  
  console.log('Database clean-up finished successfully.');
}

main()
  .catch((e) => {
    console.error('Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
