import dotenv from 'dotenv';
dotenv.config();

import { delhiveryService } from '../src/modules/delivery/services/delhiveryService.js';

async function run() {
  console.log('Testing Delhivery Rate Calculator Integration');
  console.log('API Token present:', !!process.env.DELHIVERY_API_TOKEN);

  try {
    // Valid Kerala Pincodes: 682001 (Kochi) -> 695001 (Trivandrum)
    const origin = '682001';
    const dest = '695001';
    const weightGrams = 1000; // 1 KG

    console.log(`\nCalculating charge for ${weightGrams}g from ${origin} to ${dest}...`);
    const charge = await delhiveryService.calculateShippingCharge(origin, dest, weightGrams);
    console.log(`✅ Returned Charge: ₹${charge}`);

    console.log(`\nTesting with invalid pincodes (should fallback)...`);
    const fallbackCharge = await delhiveryService.calculateShippingCharge('000000', '999999', 500, 45);
    console.log(`✅ Returned Charge (Fallback): ₹${fallbackCharge}`);

  } catch (error) {
    console.error('Test Failed:', error.message);
  }
}

run();
