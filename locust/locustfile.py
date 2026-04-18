from locust import HttpUser, task, between
import random

PRODUCTS = [
    "product1",
    "product2",
    "product3",
    "product4",
    "product5"
]

class FlashSaleUser(HttpUser):

    wait_time = between(0.1, 1)

    @task
    def place_order(self):

        product = random.choice(PRODUCTS)

        payload = {
            "userId": random.randint(1, 1000000),
            "productId": product
        }

        self.client.post("/order", json=payload)

    @task(2)
    def spam_orders(self):

        payload = {
            "userId": random.randint(1, 10),  # same user
            "productId": "product1"
        }

        self.client.post("/order", json=payload)