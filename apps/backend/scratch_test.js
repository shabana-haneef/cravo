import prisma from './src/lib/prisma.js';
import { generateAccessToken, generateRefreshToken } from './src/shared/utils/jwt.js';
import crypto from 'crypto';
import { authService } from './src/modules/auth/services/auth.service.js';
import { env } from './src/config/env.js';
import { userRepository } from './src/modules/users/repositories/user.repository.js';
import { refreshTokenRepository } from './src/modules/auth/repositories/refreshToken.repository.js';

const hashRefreshToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

async function runTest() {
  console.log("== Starting Rotation & Concurrency Test Suite ==\n");

  let user = await prisma.user.findFirst({ where: { email: 'test_refresh_concurrency@example.com' }});
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'test_refresh_concurrency@example.com',
        passwordHash: 'dummy',
        role: 'SELLER',
        status: 'ACTIVE',
        isEmailVerified: true
      }
    });
  }

  const payload = { id: user.id, role: user.role };

  const generateAndStoreToken = async () => {
    const rawToken = generateRefreshToken(payload);
    const hash = hashRefreshToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({ data: { userId: user.id, tokenHash: hash, expiresAt }});
    return rawToken;
  };

  // Test 1: Normal Rotation
  console.log("--- Test 1: Normal Rotation ---");
  await prisma.refreshToken.deleteMany({ where: { userId: user.id }});
  let token1 = await generateAndStoreToken();
  try {
    let result = await authService.refreshToken(token1);
    console.log("SUCCESS: Token rotated properly");
  } catch(e) { console.error("FAIL:", e.message); }

  // Test 2: Concurrent Race Condition
  console.log("\n--- Test 2: Concurrent Race Condition (Simultaneous Tabs) ---");
  await prisma.refreshToken.deleteMany({ where: { userId: user.id }});
  let token2 = await generateAndStoreToken();
  const results = await Promise.allSettled([
    authService.refreshToken(token2),
    authService.refreshToken(token2)
  ]);
  results.forEach((r, i) => console.log(`Tab ${i+1}: ${r.status === 'fulfilled' ? 'SUCCESS' : r.reason.message}`));
  const tokens2 = await prisma.refreshToken.findMany({ where: { userId: user.id }});
  console.log(`Active tokens in DB: ${tokens2.length} (Expected: 2 - one revoked, one active)`);

  // Test 3: Malicious Replay (Outside Grace Period)
  console.log("\n--- Test 3: Malicious Replay Attack (Outside Grace Period) ---");
  await prisma.refreshToken.deleteMany({ where: { userId: user.id }});
  let token3 = await generateAndStoreToken();
  
  // Rotate it normally first
  await authService.refreshToken(token3);
  
  // Tamper with the revokedAt time to simulate expiration of grace period (31 seconds ago)
  const hash3 = hashRefreshToken(token3);
  const pastDate = new Date(Date.now() - 31000);
  await prisma.refreshToken.update({ where: { tokenHash: hash3 }, data: { revokedAt: pastDate }});

  try {
    // Attempt to use the old token again
    await authService.refreshToken(token3);
    console.log("FAIL: Expected session revocation but succeeded");
  } catch (e) {
    console.log(`EXPECTED REJECTION: ${e.message}`);
  }
  
  const tokens3 = await prisma.refreshToken.findMany({ where: { userId: user.id }});
  console.log(`Active tokens in DB: ${tokens3.length} (Expected: 0 - entire family revoked)`);

  // Test 4: Missing Token Replay
  console.log("\n--- Test 4: Missing Token Replay (Already deleted) ---");
  let fakeToken = generateRefreshToken(payload); // Never stored
  try {
    await authService.refreshToken(fakeToken);
    console.log("FAIL: Expected rejection");
  } catch(e) {
    console.log(`EXPECTED REJECTION: ${e.message}`);
  }

  await prisma.$disconnect();
}

runTest();
