import { createClient } from 'redis';

const client = createClient({ url: 'redis://localhost:6379' });

async function main() {
  await client.connect();
  await client.flushAll();
  console.log('Redis cache successfully cleared!');
  await client.quit();
}

main().catch(console.error);
