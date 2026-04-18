use rdkafka::consumer::{Consumer, StreamConsumer};
use rdkafka::config::ClientConfig;
use rdkafka::Message;

use redis::AsyncCommands;

use serde_json::Value;

#[tokio::main]
async fn main() {

    println!("Inventory engine started");

    let consumer: StreamConsumer =
        ClientConfig::new()
        .set("group.id", "inventory")
        .set("bootstrap.servers", "kafka:9092")
        .create()
        .expect("Consumer creation failed");

    consumer.subscribe(&["orders"])
        .expect("Subscription failed");

    let redis_client =
        redis::Client::open("redis://redis:6379")
        .unwrap();

    let mut conn =
        redis_client
        .get_async_connection()
        .await
        .unwrap();

    loop {

        let msg = match consumer.recv().await {
            Ok(m) => m,
            Err(e) => {
                println!("Kafka error: {:?}", e);
                continue;
            }
        };

        let payload = msg.payload().unwrap();

        let order: Value =
            serde_json::from_slice(payload).unwrap();

        let product_id =
            order["productId"].as_str().unwrap();

        let key =
            format!("inventory:{}", product_id);

       let script = r#"
local stock = redis.call('GET', KEYS[1])
if (not stock) then
    return -1
end

stock = tonumber(stock)

if stock <= 0 then
    return -1
end

redis.call('DECR', KEYS[1])
return stock - 1
"#;

let result: i32 = redis::Script::new(script)
    .key(&key)
    .invoke_async(&mut conn)
    .await
    .unwrap();

if result >= 0 {
    println!("Product {} remaining {}", product_id, result);
} else {
    println!("Product {} SOLD OUT", product_id);
}
    }
}