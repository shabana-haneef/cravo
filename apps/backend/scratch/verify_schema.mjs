import prisma from '../src/lib/prisma.js';

try {
  const columns = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'DeliveryTrackingEvent'
    ORDER BY ordinal_position
  `;
  console.log('COLUMNS:');
  for (const col of columns) {
    console.log(`  ${col.column_name} (${col.data_type}) nullable=${col.is_nullable}`);
  }

  const indexes = await prisma.$queryRaw`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'DeliveryTrackingEvent'
      AND schemaname = 'public'
  `;
  console.log('INDEXES:');
  for (const idx of indexes) {
    console.log(`  ${idx.indexname}: ${idx.indexdef}`);
  }

  // Verify migration table has our migration recorded
  const migrations = await prisma.$queryRaw`
    SELECT migration_name, finished_at, applied_steps_count
    FROM _prisma_migrations
    WHERE migration_name LIKE '%fingerprint%' OR migration_name LIKE '%ewaybill%'
    ORDER BY started_at
  `;
  console.log('RELEVANT MIGRATIONS IN DB:');
  for (const m of migrations) {
    console.log(`  ${m.migration_name} — applied_steps=${m.applied_steps_count} finished=${m.finished_at}`);
  }
} finally {
  await prisma.$disconnect();
}
