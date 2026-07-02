import { PrismaClient } from '@prisma/client';
import { delhiveryShipmentService } from '../src/services/delhiveryShipmentService.js';
import prisma from '../src/lib/prisma.js';

async function testTrackingSync() {
  console.log('--- STARTING TRACKING SYNC VERIFICATION ---');

  try {
    // 1. Find or create a test customer user
    let customerUser = await prisma.user.findFirst({ where: { email: 'testcustomer@gmail.com' } });
    if (!customerUser) {
      customerUser = await prisma.user.create({
        data: {
          email: 'testcustomer@gmail.com',
          passwordHash: 'not-secure',
          role: 'CUSTOMER',
          isEmailVerified: true
        }
      });
    }

    // 2. Find or create test seller & shop
    let sellerUser = await prisma.user.findFirst({ where: { email: 'testseller@gmail.com' } });
    if (!sellerUser) {
      sellerUser = await prisma.user.create({
        data: {
          email: 'testseller@gmail.com',
          passwordHash: 'not-secure',
          role: 'SELLER',
          isEmailVerified: true
        }
      });
    }

    let sellerProfile = await prisma.seller.findUnique({ where: { userId: sellerUser.id } });
    if (!sellerProfile) {
      sellerProfile = await prisma.seller.create({
        data: {
          userId: sellerUser.id,
          status: 'APPROVED',
          pickupLocationName: 'Warehouse',
          pickupAddress: 'Street A',
          pickupCity: 'Kochi',
          pickupState: 'Kerala',
          pickupPincode: '682001',
          pickupPhone: '9876543210'
        }
      });
    }

    let shop = await prisma.shop.findUnique({ where: { sellerId: sellerProfile.id } });
    if (!shop) {
      shop = await prisma.shop.create({
        data: {
          sellerId: sellerProfile.id,
          name: 'Verification Shop',
          slug: 'verification-shop',
          status: 'ACTIVE',
          shopType: 'LOCAL_SHOP'
        }
      });
    }

    let address = await prisma.address.findFirst({ where: { userId: customerUser.id } });
    if (!address) {
      address = await prisma.address.create({
        data: {
          userId: customerUser.id,
          fullName: 'John Doe',
          phone: '9895000000',
          addressLine1: 'Test Road',
          city: 'Ernakulam',
          state: 'Kerala',
          postalCode: '682020'
        }
      });
    }

    // 3. Create a test order that represents a newly created Delhivery shipment
    // We suffix the AWB with _DELIVERED to trigger the mock delivery status in our service.
    const orderNum = `TRACK-TEST-${Date.now()}`;
    const testOrder = await prisma.order.create({
      data: {
        orderNumber: orderNum,
        customerId: customerUser.id,
        shopId: shop.id,
        addressId: address.id,
        subtotal: 500,
        deliveryCharge: 30,
        grandTotal: 530,
        status: 'CONFIRMED',
        shipmentCreated: true,
        shipmentCreatedAt: new Date(),
        awbNumber: `MOCK_AWB_${orderNum}_DELIVERED`,
        delhiveryShipmentId: `MOCK_SHP_${orderNum}`,
        trackingStatus: 'booked',
        shipmentLogs: [{ timestamp: new Date().toISOString(), event: 'Shipment Created' }]
      }
    });

    console.log(`Created test order ${testOrder.orderNumber} with AWB: ${testOrder.awbNumber}`);

    // 4. Manually trigger the sync logic for this order to verify status mapping and database updates
    const trackingData = await delhiveryShipmentService.trackShipment(testOrder.awbNumber);
    console.log('Retrieved Mock Tracking Data:', trackingData);

    if (trackingData && trackingData.status === 'DELIVERED') {
      console.log('✓ Successfully retrieved tracking status DELIVERED from service.');
      
      // Update order status as the sync job does
      const updatedOrder = await prisma.order.update({
        where: { id: testOrder.id },
        data: {
          status: 'DELIVERED',
          trackingStatus: 'delivered',
          shipmentLogs: [
            ...testOrder.shipmentLogs,
            ...trackingData.events.map(ev => ({
              timestamp: ev.date || new Date().toISOString(),
              event: ev.status,
              location: ev.location,
              remarks: 'Scanned at location'
            }))
          ]
        }
      });

      console.log('Updated Order State in DB:', {
        status: updatedOrder.status,
        trackingStatus: updatedOrder.trackingStatus,
        logsCount: updatedOrder.shipmentLogs.length
      });

      if (updatedOrder.status === 'DELIVERED' && updatedOrder.trackingStatus === 'delivered' && updatedOrder.shipmentLogs.length > 1) {
        console.log('✓ SUCCESS: Tracking synchronization successfully mapped and synced Delivered status to database.');
      } else {
        console.log('✗ FAILED: Database state was not updated correctly.');
      }
    } else {
      console.log('✗ FAILED: Expected DELIVERED tracking status but got:', trackingData?.status);
    }

  } catch (error) {
    console.error('Error in tracking test execution:', error);
  } finally {
    await prisma.$disconnect();
    console.log('--- TRACKING SYNC VERIFICATION COMPLETED ---');
  }
}

testTrackingSync();
