import asyncio
import os
import sys
from datetime import datetime, timedelta

# Adjust path to import app modules correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import db
from app.routers.auth import get_password_hash

async def seed_data():
    print("Starting database seeding...")
    
    # 1. Seed Admin User
    admin_email = "choice.kadi@gmail.com"
    existing_admin = await db["users"].find_one({"email": admin_email})
    
    if not existing_admin:
        hashed_password = get_password_hash("Choice@123")
        admin_user = {
            "name": "Choice Tailors Admin",
            "email": admin_email,
            "password": hashed_password,
            "role": "admin",
            "created_at": datetime.utcnow().isoformat()
        }
        await db["users"].insert_one(admin_user)
        print(f"Created admin account: {admin_email} / Choice@123")
    else:
        print("Admin account already exists.")

    # 2. Seed Customers
    customers_data = [
        {
            "name": "Mr. Nilesh Shah",
            "phone": "9925256898",
            "email": "nilesh@gmail.com",
            "address": "Gandhi Chok, Kadi",
            "photo_url": None,
            "created_at": (datetime.utcnow() - timedelta(days=30)).isoformat()
        },
        {
            "name": "Mr. Rajesh Patel",
            "phone": "9998170809",
            "email": "rajesh@gmail.com",
            "address": "Station Road, Kadi",
            "photo_url": None,
            "created_at": (datetime.utcnow() - timedelta(days=20)).isoformat()
        },
        {
            "name": "Mr. Amit Mehta",
            "phone": "9876543210",
            "email": "amit.mehta@yahoo.com",
            "address": "Nilkanth Lodge, Kadi",
            "photo_url": None,
            "created_at": (datetime.utcnow() - timedelta(days=10)).isoformat()
        },
        {
            "name": "Mr. Dinesh Kumar",
            "phone": "9898989898",
            "email": "dinesh@gmail.com",
            "address": "Gandhi Chok, Kadi",
            "photo_url": None,
            "created_at": datetime.utcnow().isoformat()
        }
    ]

    customer_ids = []
    for cust in customers_data:
        existing = await db["customers"].find_one({"phone": cust["phone"]})
        if not existing:
            res = await db["customers"].insert_one(cust)
            cust_id = str(res.inserted_id)
            customer_ids.append(cust_id)
            print(f"Seeded Customer: {cust['name']}")
        else:
            cust_id = str(existing["_id"])
            customer_ids.append(cust_id)

    # 3. Seed Orders
    if customer_ids:
        orders_data = [
            {
                "customer_id": customer_ids[0],
                "customer_name": "Mr. Nilesh Shah",
                "items": [
                    {
                        "item_type": "suit",
                        "measurements": {
                            "chest": 40.5,
                            "waist": 36.0,
                            "shoulder": 18.0,
                            "sleeve": 25.0,
                            "jacket_length": 29.5,
                            "lapel_style": "Peak Lapel",
                            "coat_size": 40
                        },
                        "fabric": {
                            "fabric_type": "Premium Woolen",
                            "color": "Midnight Blue",
                            "quantity": 3.2,
                            "provided_by_customer": False
                        },
                        "design_images": []
                    }
                ],
                "delivery_date": (datetime.utcnow() + timedelta(days=3)).strftime("%Y-%m-%d"),
                "trial_date": (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d"),
                "status": "Stitching",
                "notes": "Wedding Suit. Needs extra padding in shoulders.",
                "total_price": 12500.0,
                "advance_payment": 5000.0,
                "remaining_payment": 7500.0,
                "invoice_id": "INV-1092F3",
                "created_at": (datetime.utcnow() - timedelta(days=4)).isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            },
            {
                "customer_id": customer_ids[1],
                "customer_name": "Mr. Rajesh Patel",
                "items": [
                    {
                        "item_type": "shirt",
                        "measurements": {
                            "neck": 15.5,
                            "chest": 38.0,
                            "waist": 34.0,
                            "shoulder": 17.5,
                            "sleeve_length": 24.5,
                            "shirt_length": 28.5,
                            "cuff": 2.5,
                            "collar_type": "Cutaway Collar",
                            "pocket_style": "Classic Square"
                        },
                        "fabric": {
                            "fabric_type": "Giza Cotton",
                            "color": "White",
                            "quantity": 1.6,
                            "provided_by_customer": True
                        },
                        "design_images": []
                    },
                    {
                        "item_type": "pant",
                        "measurements": {
                            "waist": 34.0,
                            "hip": 40.0,
                            "thigh": 24.0,
                            "knee": 18.0,
                            "bottom": 15.0,
                            "length": 40.0,
                            "inseam": 30.0,
                            "belt_loop": True,
                            "pocket_type": "Cross Pocket"
                        },
                        "fabric": {
                            "fabric_type": "Cotton Trousering",
                            "color": "Charcoal Grey",
                            "quantity": 1.2,
                            "provided_by_customer": True
                        },
                        "design_images": []
                    }
                ],
                "delivery_date": (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%d"),
                "trial_date": (datetime.utcnow() + timedelta(days=2)).strftime("%Y-%m-%d"),
                "status": "Cutting",
                "notes": "Office formal wear.",
                "total_price": 2800.0,
                "advance_payment": 1000.0,
                "remaining_payment": 1800.0,
                "invoice_id": "INV-290A81",
                "created_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            },
            {
                "customer_id": customer_ids[2],
                "customer_name": "Mr. Amit Mehta",
                "items": [
                    {
                        "item_type": "kurta",
                        "measurements": {
                            "chest": 39.0,
                            "waist": 35.0,
                            "sleeve": 24.0,
                            "length": 42.0,
                            "collar": 15.0
                        },
                        "fabric": {
                            "fabric_type": "Linen Silk",
                            "color": "Maroon",
                            "quantity": 2.5,
                            "provided_by_customer": False
                        },
                        "design_images": []
                    }
                ],
                "delivery_date": (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d"),
                "trial_date": datetime.utcnow().strftime("%Y-%m-%d"),
                "status": "Trial",
                "notes": "Festive wear. Fit should be loose/comfortable.",
                "total_price": 3500.0,
                "advance_payment": 3500.0,
                "remaining_payment": 0.0,
                "invoice_id": "INV-7801CD",
                "created_at": (datetime.utcnow() - timedelta(days=6)).isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
        ]

        for order in orders_data:
            existing = await db["orders"].find_one({"invoice_id": order["invoice_id"]})
            if not existing:
                await db["orders"].insert_one(order)
                print(f"Seeded Order: {order['invoice_id']} for {order['customer_name']}")

        # 4. Seed Payments
        nilesh_order = await db["orders"].find_one({"invoice_id": "INV-1092F3"})
        if nilesh_order:
            existing_pay = await db["payments"].find_one({"order_id": str(nilesh_order["_id"])})
            if not existing_pay:
                await db["payments"].insert_one({
                    "_id": "PAY-NIL001",
                    "customer_id": nilesh_order["customer_id"],
                    "order_id": str(nilesh_order["_id"]),
                    "amount": 5000.0,
                    "payment_mode": "UPI",
                    "notes": "Advance payment for Midnight Blue Suit",
                    "payment_date": nilesh_order["created_at"],
                    "created_at": nilesh_order["created_at"]
                })
                print("Seeded Payment: INR 5000 UPI for Mr. Nilesh Shah")

        rajesh_order = await db["orders"].find_one({"invoice_id": "INV-290A81"})
        if rajesh_order:
            existing_pay = await db["payments"].find_one({"order_id": str(rajesh_order["_id"])})
            if not existing_pay:
                await db["payments"].insert_one({
                    "_id": "PAY-RAJ001",
                    "customer_id": rajesh_order["customer_id"],
                    "order_id": str(rajesh_order["_id"]),
                    "amount": 1000.0,
                    "payment_mode": "Cash",
                    "notes": "Cash Advance for shirts & pants stitching",
                    "payment_date": rajesh_order["created_at"],
                    "created_at": rajesh_order["created_at"]
                })
                print("Seeded Payment: INR 1000 Cash for Mr. Rajesh Patel")

        amit_order = await db["orders"].find_one({"invoice_id": "INV-7801CD"})
        if amit_order:
            existing_pay = await db["payments"].find_one({"order_id": str(amit_order["_id"])})
            if not existing_pay:
                await db["payments"].insert_one({
                    "_id": "PAY-AMI001",
                    "customer_id": amit_order["customer_id"],
                    "order_id": str(amit_order["_id"]),
                    "amount": 2000.0,
                    "payment_mode": "UPI",
                    "notes": "Advance for Maroon Kurta sangeet wear",
                    "payment_date": amit_order["created_at"],
                    "created_at": amit_order["created_at"]
                })
                pay2_date = amit_order.get("trial_date") + "T17:00:00"
                await db["payments"].insert_one({
                    "_id": "PAY-AMI002",
                    "customer_id": amit_order["customer_id"],
                    "order_id": str(amit_order["_id"]),
                    "amount": 1500.0,
                    "payment_mode": "Cash",
                    "notes": "Final settlement at trial fitting",
                    "payment_date": pay2_date,
                    "created_at": pay2_date
                })
                print("Seeded Payments: INR 2000 UPI & INR 1500 Cash for Mr. Amit Mehta")

    print("Database seeding completed successfully.")

if __name__ == "__main__":
    asyncio.run(seed_data())
