import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from app.database import db
from app.routers.auth import get_current_user, UserResponse

router = APIRouter(prefix="/orders", tags=["Orders"])

class FabricSchema(BaseModel):
    fabric_type: str
    color: str
    quantity: float
    provided_by_customer: bool = True

class ClothesItemSchema(BaseModel):
    item_type: str  # shirt, pant, suit, kurta, sherwani, custom
    measurements: Dict[str, Any]
    fabric: Optional[FabricSchema] = None
    design_images: List[str] = []

class OrderCreate(BaseModel):
    customer_id: str
    items: List[ClothesItemSchema]
    delivery_date: str
    trial_date: Optional[str] = None
    notes: Optional[str] = None
    total_price: float
    advance_payment: float = 0.0

class OrderUpdate(BaseModel):
    status: Optional[str] = None  # Pending, Cutting, Stitching, Trial, Completed, Delivered
    delivery_date: Optional[str] = None
    trial_date: Optional[str] = None
    notes: Optional[str] = None
    total_price: Optional[float] = None
    advance_payment: Optional[float] = None
    items: Optional[List[ClothesItemSchema]] = None

class OrderResponse(BaseModel):
    id: str
    customer_id: str
    customer_name: str
    items: List[ClothesItemSchema]
    delivery_date: str
    trial_date: Optional[str] = None
    status: str
    notes: Optional[str] = None
    total_price: float
    advance_payment: float
    remaining_payment: float
    invoice_id: Optional[str] = None
    created_at: str
    updated_at: str

@router.post("", response_model=OrderResponse)
async def create_order(
    order_data: OrderCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    customer = await db["customers"].find_one({"_id": order_data.customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    invoice_id = f"INV-{uuid.uuid4().hex[:6].upper()}"
    remaining_payment = max(0.0, order_data.total_price - order_data.advance_payment)
    now = datetime.utcnow().isoformat()

    order_dict = {
        "customer_id": order_data.customer_id,
        "customer_name": customer["name"],
        "items": [item.dict() for item in order_data.items],
        "delivery_date": order_data.delivery_date,
        "trial_date": order_data.trial_date,
        "status": "Pending",
        "notes": order_data.notes,
        "total_price": order_data.total_price,
        "advance_payment": order_data.advance_payment,
        "remaining_payment": remaining_payment,
        "invoice_id": invoice_id,
        "created_at": now,
        "updated_at": now
    }

    result = await db["orders"].insert_one(order_dict)
    order_dict["_id"] = result.inserted_id

    # Emit notification via websocket (would be done in WebSocket manager)
    # For now, print status
    print(f"Created new order for {customer['name']}")

    return OrderResponse(
        id=str(order_dict["_id"]),
        customer_id=order_dict["customer_id"],
        customer_name=order_dict["customer_name"],
        items=order_data.items,
        delivery_date=order_dict["delivery_date"],
        trial_date=order_dict["trial_date"],
        status=order_dict["status"],
        notes=order_dict["notes"],
        total_price=order_dict["total_price"],
        advance_payment=order_dict["advance_payment"],
        remaining_payment=order_dict["remaining_payment"],
        invoice_id=order_dict.get("invoice_id"),
        created_at=order_dict["created_at"],
        updated_at=order_dict["updated_at"]
    )

@router.get("", response_model=List[OrderResponse])
async def list_orders(
    status_filter: Optional[str] = None,
    customer_id: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    query = {}
    if status_filter:
        query["status"] = status_filter
    if customer_id:
        query["customer_id"] = customer_id

    cursor = db["orders"].find(query)
    orders = []
    if hasattr(cursor, "to_list"):
        docs = await cursor.to_list(100)
    else:
        docs = []
        async for doc in cursor:
            docs.append(doc)

    for doc in docs:
        orders.append(OrderResponse(
            id=str(doc["_id"]),
            customer_id=doc["customer_id"],
            customer_name=doc.get("customer_name", "Unknown"),
            items=[ClothesItemSchema(**item) for item in doc.get("items", [])],
            delivery_date=doc["delivery_date"],
            trial_date=doc.get("trial_date"),
            status=doc["status"],
            notes=doc.get("notes"),
            total_price=doc["total_price"],
            advance_payment=doc.get("advance_payment", 0.0),
            remaining_payment=doc.get("remaining_payment", doc["total_price"]),
            invoice_id=doc.get("invoice_id"),
            created_at=doc["created_at"],
            updated_at=doc.get("updated_at", doc["created_at"])
        ))
    return orders

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    order = await db["orders"].find_one({"_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponse(
        id=str(order["_id"]),
        customer_id=order["customer_id"],
        customer_name=order.get("customer_name", "Unknown"),
        items=[ClothesItemSchema(**item) for item in order.get("items", [])],
        delivery_date=order["delivery_date"],
        trial_date=order.get("trial_date"),
        status=order["status"],
        notes=order.get("notes"),
        total_price=order["total_price"],
        advance_payment=order.get("advance_payment", 0.0),
        remaining_payment=order.get("remaining_payment", order["total_price"]),
        invoice_id=order.get("invoice_id"),
        created_at=order["created_at"],
        updated_at=order.get("updated_at", order["created_at"])
    )

@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: str,
    order_data: OrderUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    order = await db["orders"].find_one({"_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    update_dict = {}
    if order_data.status is not None:
        update_dict["status"] = order_data.status
    if order_data.delivery_date is not None:
        update_dict["delivery_date"] = order_data.delivery_date
    if order_data.trial_date is not None:
        update_dict["trial_date"] = order_data.trial_date
    if order_data.notes is not None:
        update_dict["notes"] = order_data.notes
    if order_data.items is not None:
        update_dict["items"] = [item.dict() for item in order_data.items]

    total_price = order_data.total_price if order_data.total_price is not None else order["total_price"]
    advance_payment = order_data.advance_payment if order_data.advance_payment is not None else order.get("advance_payment", 0.0)
    
    update_dict["total_price"] = total_price
    update_dict["advance_payment"] = advance_payment
    update_dict["remaining_payment"] = max(0.0, total_price - advance_payment)
    update_dict["updated_at"] = datetime.utcnow().isoformat()

    await db["orders"].update_one({"_id": order_id}, {"$set": update_dict})
    
    updated_order = await db["orders"].find_one({"_id": order_id})
    return OrderResponse(
        id=str(updated_order["_id"]),
        customer_id=updated_order["customer_id"],
        customer_name=updated_order.get("customer_name", "Unknown"),
        items=[ClothesItemSchema(**item) for item in updated_order.get("items", [])],
        delivery_date=updated_order["delivery_date"],
        trial_date=updated_order.get("trial_date"),
        status=updated_order["status"],
        notes=updated_order.get("notes"),
        total_price=updated_order["total_price"],
        advance_payment=updated_order.get("advance_payment", 0.0),
        remaining_payment=updated_order.get("remaining_payment", updated_order["total_price"]),
        invoice_id=updated_order.get("invoice_id"),
        created_at=updated_order["created_at"],
        updated_at=updated_order["updated_at"]
    )
