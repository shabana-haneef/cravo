import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('Starting Regression Tests...');
  
  // 1. Create a test user
  const email = 'test_regression@example.com';
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
     user = await prisma.user.create({
       data: {
         email,
         passwordHash: '$2b$10$wT.M4Pz.aZ1Xp/i6H/KkOO3L6gO7W2Y5YtT.wP9jOq5.nS5u5y9rC', // mock
         role: 'SELLER',
         isEmailVerified: true
       }
     });
  }

  // 2. Login to get refreshToken
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123!' })
  });

  const cookies = loginRes.headers.get('set-cookie');
  if (!cookies) throw new Error('No refresh token cookie received');
  
  const refreshTokenCookie = cookies.split(';')[0];
  console.log('Login successful. Refresh token obtained.');

  // Test 4 & 9 (Backend Concurrency Race)
  console.log('Testing concurrent refresh (simulating multi-tab)...');
  try {
    const p1 = fetch(`${BASE_URL}/auth/refresh-token`, { method: 'POST', headers: { Cookie: refreshTokenCookie } });
    const p2 = fetch(`${BASE_URL}/auth/refresh-token`, { method: 'POST', headers: { Cookie: refreshTokenCookie } });
    const p3 = fetch(`${BASE_URL}/auth/refresh-token`, { method: 'POST', headers: { Cookie: refreshTokenCookie } });

    const results = await Promise.all([p1, p2, p3]);
    
    let successCount = 0;
    let concurrentErrorCount = 0;

    for (let i = 0; i < results.length; i++) {
       const res = results[i];
       const data = await res.json();
       if (res.ok) {
          successCount++;
          console.log(`Request ${i+1}: SUCCESS`);
       } else {
          if (data.message === 'Concurrent refresh detected') {
             concurrentErrorCount++;
             console.log(`Request ${i+1}: Gracefully handled as concurrent race`);
          } else {
             console.log(`Request ${i+1}: FAILED with ${data.message}`);
          }
       }
    }

    if (successCount === 1 && concurrentErrorCount === 2) {
       console.log('✅ TEST PASSED: Exactly one refresh succeeded, others hit the grace period.');
    } else {
       console.log('❌ TEST FAILED: Race condition handling incorrect.', { successCount, concurrentErrorCount });
    }
  } catch (err) {
    console.log('Unexpected error in concurrency test', err.message);
  }

  // Test 6 (Invalid Token)
  console.log('Testing invalid token rejection...');
  try {
     const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { Cookie: 'refreshToken=invalid_garbage_token' }
     });
     if (res.status === 401) {
        console.log('✅ TEST PASSED: Invalid token correctly rejected.');
     } else {
        console.log('❌ TEST FAILED: Wrong status code for invalid token:', res.status);
     }
  } catch (err) {
     console.log('Unexpected error', err);
  }

  // Test 8 (Cookie verification)
  console.log('Verifying cookie flags...');
  const isHttpOnly = cookies.includes('HttpOnly');
  const path = cookies.includes('Path=/');
  if (isHttpOnly && path) {
     console.log('✅ TEST PASSED: Cookie has HttpOnly and correct Path.');
  } else {
     console.log('❌ TEST FAILED: Cookie flags incorrect.', cookies);
  }

  process.exit(0);
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
