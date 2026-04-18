const express = require("express");
const { Kafka } = require("kafkajs");
const redis = require("redis");
const amqp = require("amqplib");

const app = express();
app.use(express.json());

const kafka = new Kafka({
  clientId: "flashsale",
  brokers: ["kafka:9092"]
});

const producer = kafka.producer();

const redisClient = redis.createClient({
  url: "redis://redis:6379"
});

let channel;

async function connectRabbitMQ() {

  while (true) {
    try {

      const conn = await amqp.connect("amqp://rabbitmq");

      channel = await conn.createChannel();

      await channel.assertQueue("orders");

      console.log("RabbitMQ connected");

      break;

    } catch (err) {

      console.log("RabbitMQ not ready, retrying in 5 seconds...");
      await new Promise(res => setTimeout(res, 5000));

    }
  }
}

async function init() {

  await producer.connect();

  await redisClient.connect();

  await connectRabbitMQ();

}

init();

app.post("/order", async (req, res) => {

  const { userId, productId } = req.body;

  const order = {
    userId,
    productId,
    timestamp: Date.now()
    
  };

  await producer.send({
    topic: "orders",
    messages: [{ value: JSON.stringify(order) }]
  });

  await channel.sendToQueue(
    "orders",
    Buffer.from(JSON.stringify(order))
  );

  res.send({ status: "processing" });

console.log(
  `User ${userId} ordering ${productId} at ${new Date().toISOString()}`
);

});

app.listen(3000, () =>
  console.log("Node API running")
);