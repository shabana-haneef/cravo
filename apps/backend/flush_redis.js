import { createClient } from 'redis';

async function main() {
  console.log('Connecting to Redis...');
  const client = createClient({ url: process.env.REDIS_URL });
  
  client.on('error', (err) => console.log('Redis Client Error', err));
  
  await client.connect();
  console.log('Flushing Redis cache...');
  await client.flushAll(); 
  console.log('Cache flushed successfully!');
  await client.disconnect();
}

main().catch(console.error);
