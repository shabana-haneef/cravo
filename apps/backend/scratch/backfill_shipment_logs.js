import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillShipmentLogs() {
  console.log('Starting Backfill: Migrating JSON shipmentLogs to OrderShipmentLog table...');
  let skip = 0;
  const limit = 500;
  let totalProcessed = 0;
  let totalMigrated = 0;

  while (true) {
    const orders = await prisma.order.findMany({
      where: {
        NOT: {
          shipmentLogs: {
            equals: "[]"
          }
        }
      },
      skip,
      take: limit,
      select: {
        id: true,
        shipmentLogs: true
      }
    });

    if (orders.length === 0) break;

    for (const order of orders) {
      if (Array.isArray(order.shipmentLogs) && order.shipmentLogs.length > 0) {
        for (const log of order.shipmentLogs) {
          // Idempotency Check: Don't insert if exact log already exists for this order
          const existing = await prisma.orderShipmentLog.findFirst({
            where: {
              orderId: order.id,
              event: log.event,
              timestamp: new Date(log.timestamp || new Date()),
            }
          });

          if (!existing) {
            await prisma.orderShipmentLog.create({
              data: {
                orderId: order.id,
                event: log.event,
                timestamp: new Date(log.timestamp || new Date()),
                awbNumber: log.awbNumber || null,
                shipmentId: log.shipmentId || null,
                remarks: log.remarks || null,
                error: log.error || null,
              }
            });
            totalMigrated++;
          }
        }
      }
      totalProcessed++;
    }

    console.log(`Processed ${totalProcessed} orders...`);
    skip += limit;
  }

  console.log(`Backfill Complete. Total Orders Processed: ${totalProcessed}. Total Logs Migrated: ${totalMigrated}.`);
  await prisma.$disconnect();
}

backfillShipmentLogs().catch((e) => {
  console.error(e);
  process.exit(1);
});
