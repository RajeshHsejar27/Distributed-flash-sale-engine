const amqp = require("amqplib");

async function start() {

  const conn =
    await amqp.connect("amqp://rabbitmq");

  const channel =
    await conn.createChannel();

  await channel.assertQueue("orders");

  channel.consume("orders", msg => {

    const order =
      JSON.parse(msg.content.toString());

   console.log(
  `Processing payment for user ${order.userId} product ${order.productId}`
);

    channel.ack(msg);

  });

}

start();