const redis = require("redis");

const client = redis.createClient();

async function seed() {

  await client.connect();

  await client.set("inventory:product1", 10000);

  console.log("Seeded inventory");

}

seed();


// docker exec -it flashsale-engine-redis-1 redis-cli
// SET inventory:product1 10000
// SET inventory:product2 50000
// SET inventory:product3 20000
// SET inventory:product4 15000
// SET inventory:product5 75000