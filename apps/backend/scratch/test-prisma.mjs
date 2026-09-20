import prisma from '../src/lib/prisma.js';

async function main() {
  console.log("Connecting...");
  const ts = Date.now();
  console.log("Creating user...");
  try {
    const user = await prisma.user.create({
      data: {
        email: `test-${ts}@example.com`,
        role: 'CUSTOMER',
        isEmailVerified: true,
        status: 'ACTIVE'
      }
    });
    console.log("User created", user.id);
  } catch (e) {
    console.error("Error creating user:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
