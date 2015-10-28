import redis from 'redis';
const { NODE_ENV, REDIS_URL } = process.env;

export let client = redis.createClient(REDIS_URL);

client.on('error', function (err) {
  console.error(`Error ${err}`);
});
