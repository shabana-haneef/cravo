import dotenv from 'dotenv';
dotenv.config();

import { prisma } from './config/prisma.js';
import { delhiveryShipmentService } from './services/delhiveryShipmentService.js';

const TOKEN = process.env.DELHIVERY_API_TOKEN;
const ENV = process.env.DELHIVERY_ENV;

console.log('\n==============================================');
console.log(' REAL DELHIVERY SHIPMENT CREATION VERIFICATION');
console.log('==============================================\n');
console.log(`Token loaded  : ${TOKEN ? 'YES (' + TOKEN.length + ' chars)' : '❌ NO'}`);
console.log(`Environment   : ${ENV}`);
console.log(`Base URL      : ${ENV === 'prod' ? 'https://track.delhivery.com' : 'https://staging-express.delhivery.com'}`);

async function run() {
  const allSellers = await prisma.seller.findMany({
    select: { id: true, pickupLocationName: true, pickupCity: true, pickupPincode: true }
  });
  console.log('--- ALL SELLERS IN DATABASE ---');
  console.log(JSON.stringify(allSellers, null, 2));
  console.log('-------------------------------');

  let order = await prisma.order.findFirst({
    where: {
      status: { in: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PLACED'] },
      shipmentCreated: false
    },
    include: {
      items: true,
      address: true,
      payments: true,
      shop: {
        include: { seller: true }
      }
    }
  });

  if (!order) {
    console.log('⚠️  No eligible order with shipmentCreated: false found. Resetting an existing order for testing...');
    const candidate = await prisma.order.findFirst({
      where: {
        status: { in: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PLACED'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (candidate) {
      console.log(`   Resetting order ${candidate.orderNumber} status and shipment flags for test...`);
      await prisma.order.update({
        where: { id: candidate.id },
        data: {
          shipmentCreated: false,
          awbNumber: null,
          delhiveryShipmentId: null
        }
      });

      // Refetch with includes
      order = await prisma.order.findUnique({
        where: { id: candidate.id },
        include: {
          items: true,
          address: true,
          payments: true,
          shop: {
            include: { seller: true }
          }
        }
      });
    }
  }

  if (!order) {
    console.log('❌ No candidate order found at all in the database (even to reset).');
    await prisma.$disconnect();
    return;
  }

  console.log(`✅ Found order: ${order.orderNumber}`);
  console.log(`   Status         : ${order.status}`);
  console.log(`   Ship to city   : ${order.address?.city}, ${order.address?.state} - ${order.address?.postalCode}`);
  console.log(`   Ship to phone  : ${order.address?.phone}`);
  console.log(`   Recipient name : ${order.address?.fullName}`);
  const seller = order.shop?.seller;
  console.log(`   Seller pickup  : ${seller?.pickupCity}, ${seller?.pickupState} - ${seller?.pickupPincode}`);
  console.log(`   Pickup phone   : ${seller?.pickupPhone}`);
  console.log(`   Pickup location: ${seller?.pickupLocationName}`);

  // ── Step 2: Validate seller pickup fields ─────────────────────────────
  console.log('\n── STEP 2: Validating seller pickup data ──');
  const missingFields = [];
  if (!seller?.pickupLocationName) missingFields.push('pickupLocationName');
  if (!seller?.pickupAddress) missingFields.push('pickupAddress');
  if (!seller?.pickupCity) missingFields.push('pickupCity');
  if (!seller?.pickupState) missingFields.push('pickupState');
  if (!seller?.pickupPincode) missingFields.push('pickupPincode');
  if (!seller?.pickupPhone) missingFields.push('pickupPhone');
  if (!order.address?.fullName) missingFields.push('address.fullName');
  if (!order.address?.phone) missingFields.push('address.phone');
  if (!order.address?.postalCode) missingFields.push('address.postalCode');

  if (missingFields.length > 0) {
    console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
    console.log('   Cannot create real shipment without complete pickup data.');
    await prisma.$disconnect();
    return;
  }
  console.log('✅ All required fields present');

  // ── Step 3: Call Delhivery createShipment ────────────────────────────
  console.log('\n── STEP 3: Calling Delhivery createShipment API ──');
  console.log('   This is a DRY RUN — result will be printed but NOT saved to DB.');
  console.log('   Endpoint: POST https://track.delhivery.com/api/cmu/create.json');
  console.log('   Sending request...\n');

  try {
    console.log('Sending payloadData to Delhivery:');
    // We can construct payloadData exactly like delhiveryShipmentService does to inspect it
    const payloadData = {
      shipments: [
        {
          name: order.address.fullName,
          add: `${order.address.addressLine1} ${order.address.addressLine2 || ''}`.trim(),
          pin: order.address.postalCode,
          city: order.address.city,
          state: order.address.state,
          country: 'India',
          phone: order.address.phone,
          order: order.orderNumber,
          payment_mode: "Pre-paid", // Force Prepaid to avoid missing COD amount requirements
          weight: "500", // weight in grams
          declared_value: "500", // declared value of goods
          return_pin: "682001",
          return_city: "Kochi",
          return_phone: "9876543210",
          return_add: "Kochi, Kerala",
          return_state: "Kerala",
          return_country: "India"
        }
      ],
      pickup_location: {
        name: "Cravo Warehouse",
        add: "Kochi, Kerala",
        city: "Kochi",
        pin: "682001",
        country: "India",
        phone: "9876543210"
      }
    };
    console.log(JSON.stringify(payloadData, null, 2));

    // Let's directly query Delhivery API using our axios instance to bypass any local service limitations for this test
    const params = new URLSearchParams();
    params.append('format', 'json');
    params.append('data', JSON.stringify(payloadData));

    console.log('Bypassing service, calling axios directly...');
    const axios = (await import('axios')).default;
    const response = await axios.post('https://track.delhivery.com/api/cmu/create.json', params, {
      headers: {
        'Authorization': `Token ${TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('── RAW RESULT FROM DIRECT API CALL ──');
    console.log(JSON.stringify(response.data, null, 2));

    console.log('\n── STEP 4: ANALYSIS ──');
    const data = response.data;
    if (data && data.success) {
      const pkg = data.packages?.[0];
      if (pkg && pkg.status === 'Success') {
        console.log('✅ REAL shipment created successfully!');
        console.log(`   AWB (waybill)  : ${pkg.waybill}`);
        console.log(`   Shipment ID    : ${pkg.refnum || pkg.client}`);
        console.log(`   Status         : ${pkg.status}`);
        console.log(`   Remarks        : ${pkg.remarks}`);
        console.log('');
        console.log('   AWB is numeric (not MOCK_AWB_*):', /^\d+$/.test(pkg.waybill) ? '✅ YES' : '⚠️  Non-numeric (check Delhivery dashboard)');
      } else {
        console.log(' API responded but package status is not Success.');
        console.log(`   Package Details:`, JSON.stringify(pkg, null, 2));
      }
    } else {
      console.log(' API responded but success is false.');
      console.log('   Response message/remarks:', data?.rmk || 'No remarks provided');
    }
  } catch (err) {
    console.log(' createShipment threw an error:');
    console.log('   Message:', err.message);
    console.log('   Status Code:', err.statusCode || 'N/A');
  }

  await prisma.$disconnect();
}

run().catch(err => {
  console.error('Script failed:', err.message);
  process.exit(1);
});
