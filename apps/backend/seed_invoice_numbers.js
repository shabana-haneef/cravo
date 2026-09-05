import prisma from './src/lib/prisma.js';

async function main() {
  const orders = await prisma.order.findMany({
    where: { invoiceNumber: null }
  });
  
  console.log(`Found ${orders.length} orders without invoice numbers.`);
  
  for (const order of orders) {
    const invoiceNumber = `INV-${order.orderNumber.substring(4)}`;
    await prisma.order.update({
      where: { id: order.id },
      data: { invoiceNumber }
    });
    console.log(`Updated order ${order.orderNumber} with invoice ${invoiceNumber}`);
  }
  
  console.log('Done!');
}

main().catch(console.error).finally(() => process.exit(0));
