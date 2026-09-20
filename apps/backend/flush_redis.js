import { createClient } from 'redis';

async function main() {
  console.log('Connecting to Redis...');
  const url = process.env.REDIS_URL ? process.env.REDIS_URL.replace('cravo_redis', '127.0.0.1') : 'redis://127.0.0.1:6379';
  const client = createClient({ url });
  
  client.on('error', (err) => console.log('Redis Client Error', err));
  
  await client.connect();
  console.log('Flushing Redis cache...');
  await client.flushAll(); 
  console.log('Cache flushed successfully!');
  await client.disconnect();
}

main().catch(console.error);
