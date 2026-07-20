import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from app.database import db
from app.routers.auth import get_current_user, UserResponse

router = APIRouter(prefix="/payments", tags=["Payments"])

class PaymentCreate(BaseModel):
    customer_id: str
    amount: float
    payment_mode: str  # Cash, UPI, Card, etc.
    order_id: Optional[str] = None
    notes: Optional[str] = None
    payment_date: Optional[str] = None

class PaymentResponse(BaseModel):
    id: str
    customer_id: str
    amount: float
    payment_mode: str
    order_id: Optional[str]
    notes: Optional[str]
    payment_date: str
    created_at: str

@router.post("", response_model=PaymentResponse)
async def create_payment(
    payment_data: PaymentCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    # Verify customer exists
    customer = await db["customers"].find_one({"_id": payment_data.customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Verify order exists if order_id is provided
    order = None
    if payment_data.order_id:
        order = await db["orders"].find_one({"_id": payment_data.order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

    payment_id = f"PAY-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.utcnow().isoformat()
    pay_date = payment_data.payment_date or now

    payment_dict = {
        "customer_id": payment_data.customer_id,
        "amount": payment_data.amount,
        "payment_mode": payment_data.payment_mode,
        "order_id": payment_data.order_id,
        "notes": payment_data.notes,
        "payment_date": pay_date,
        "created_at": now
    }

    # Store in payments collection
    payment_dict["_id"] = payment_id
    await db["payments"].insert_one(payment_dict)

    # Update the order's remaining and advance payment if order_id is provided
    if order:
        new_advance = order.get("advance_payment", 0.0) + payment_data.amount
        total_price = order["total_price"]
        new_remaining = max(0.0, total_price - new_advance)

        update_dict = {
            "advance_payment": new_advance,
            "remaining_payment": new_remaining,
            "updated_at": now
        }
        await db["orders"].update_one({"_id": payment_data.order_id}, {"$set": update_dict})

    return PaymentResponse(
        id=payment_id,
        customer_id=payment_dict["customer_id"],
        amount=payment_dict["amount"],
        payment_mode=payment_dict["payment_mode"],
        order_id=payment_dict["order_id"],
        notes=payment_dict["notes"],
        payment_date=payment_dict["payment_date"],
        created_at=payment_dict["created_at"]
    )

@router.get("/customer/{customer_id}", response_model=List[PaymentResponse])
async def list_payments_by_customer(
    customer_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    # Verify customer exists
    customer = await db["customers"].find_one({"_id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    cursor = db["payments"].find({"customer_id": customer_id})
    payments = []
    if hasattr(cursor, "to_list"):
        docs = await cursor.to_list(100)
    else:
        docs = []
        async for doc in cursor:
            docs.append(doc)

    for doc in docs:
        payments.append(PaymentResponse(
            id=str(doc["_id"]),
            customer_id=doc["customer_id"],
            amount=doc["amount"],
            payment_mode=doc["payment_mode"],
            order_id=doc.get("order_id"),
            notes=doc.get("notes"),
            payment_date=doc.get("payment_date", doc["created_at"]),
            created_at=doc["created_at"]
        ))
    
    # Sort payments by date descending
    payments.sort(key=lambda x: x.payment_date, reverse=True)
    return payments

@router.delete("/{payment_id}")
async def delete_payment(
    payment_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    payment = await db["payments"].find_one({"_id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # If linked to an order, reverse the order balances
    if payment.get("order_id"):
        order = await db["orders"].find_one({"_id": payment["order_id"]})
        if order:
            new_advance = max(0.0, order.get("advance_payment", 0.0) - payment["amount"])
            total_price = order["total_price"]
            new_remaining = max(0.0, total_price - new_advance)

            update_dict = {
                "advance_payment": new_advance,
                "remaining_payment": new_remaining,
                "updated_at": datetime.utcnow().isoformat()
            }
            await db["orders"].update_one({"_id": payment["order_id"]}, {"$set": update_dict})

    await db["payments"].delete_one({"_id": payment_id})
    return {"message": "Payment voided and deleted successfully"}
