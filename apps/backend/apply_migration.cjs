const { Client } = require('pg');
require('dotenv').config();

const statements = [
  'ALTER TABLE "public"."Delivery" ADD COLUMN "ewaybillNumber" TEXT',
  'ALTER TABLE "public"."DeliveryTrackingEvent" ADD COLUMN "fingerprint" TEXT',
  'CREATE UNIQUE INDEX "DeliveryTrackingEvent_deliveryId_fingerprint_key" ON "public"."DeliveryTrackingEvent"("deliveryId", "fingerprint")'
];

const client = new Client({ connectionString: process.env.DATABASE_URL });

client.connect().then(async () => {
  for (const stmt of statements) {
    console.log('Running:', stmt.substring(0, 100));
    try {
      await client.query(stmt);
      console.log('  OK');
    } catch (e) {
      if (/already exists|does not exist/.test(e.message)) {
        console.log('  SKIPPED (idempotent):', e.message);
      } else {
        console.error('  ERROR:', e.message);
        await client.end();
        process.exit(1);
      }
    }
  }
  await client.end();
  console.log('\nAll done.');
}).catch(err => {
  console.error('Connection error:', err.message);
  process.exit(1);
});
