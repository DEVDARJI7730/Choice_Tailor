import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, EmailStr
from bson import ObjectId
from app.database import db
from app.config import settings
from app.routers.auth import get_current_user, UserResponse

router = APIRouter(prefix="/customers", tags=["Customers"])

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None

class CustomerResponse(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: str

@router.post("", response_model=CustomerResponse)
async def create_customer(
    name: str = Form(...),
    phone: str = Form(...),
    email: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    current_user: UserResponse = Depends(get_current_user)
):
    photo_url = None
    if photo:
        file_ext = photo.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_ext}"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        # In a real environment, we would upload to Cloudinary.
        # Locally, we serve via static files endpoint: `/uploads/{filename}`
        photo_url = f"/uploads/{filename}"

    from datetime import datetime
    customer_dict = {
        "name": name,
        "phone": phone,
        "email": email,
        "address": address,
        "photo_url": photo_url,
        "created_at": datetime.utcnow().isoformat()
    }
    
    result = await db["customers"].insert_one(customer_dict)
    customer_dict["_id"] = result.inserted_id
    
    return CustomerResponse(
        id=str(customer_dict["_id"]),
        name=customer_dict["name"],
        phone=customer_dict["phone"],
        email=customer_dict["email"],
        address=customer_dict["address"],
        photo_url=customer_dict["photo_url"],
        created_at=customer_dict["created_at"]
    )

@router.get("", response_model=List[CustomerResponse])
async def list_customers(
    search: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    query = {}
    if search:
        query = {
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"phone": {"$regex": search, "$options": "i"}}
            ]
        }
    
    cursor = db["customers"].find(query)
    customers = []
    # If cursor is the custom SQLite Cursor, it supports to_list. If MongoDB Cursor, it also does.
    # To cover both, let's load documents safely.
    if hasattr(cursor, "to_list"):
        docs = await cursor.to_list(100)
    else:
        docs = []
        async for doc in cursor:
            docs.append(doc)
            
    for doc in docs:
        customers.append(CustomerResponse(
            id=str(doc["_id"]),
            name=doc["name"],
            phone=doc["phone"],
            email=doc.get("email"),
            address=doc.get("address"),
            photo_url=doc.get("photo_url"),
            created_at=doc.get("created_at")
        ))
    return customers

@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    customer = await db["customers"].find_one({"_id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CustomerResponse(
        id=str(customer["_id"]),
        name=customer["name"],
        phone=customer["phone"],
        email=customer.get("email"),
        address=customer.get("address"),
        photo_url=customer.get("photo_url"),
        created_at=customer["created_at"]
    )

@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: str,
    name: str = Form(...),
    phone: str = Form(...),
    email: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    current_user: UserResponse = Depends(get_current_user)
):
    customer = await db["customers"].find_one({"_id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    photo_url = customer.get("photo_url")
    if photo:
        file_ext = photo.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_ext}"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        photo_url = f"/uploads/{filename}"

    update_dict = {
        "name": name,
        "phone": phone,
        "email": email,
        "address": address,
        "photo_url": photo_url
    }
    
    await db["customers"].update_one({"_id": customer_id}, {"$set": update_dict})
    
    return CustomerResponse(
        id=customer_id,
        name=name,
        phone=phone,
        email=email,
        address=address,
        photo_url=photo_url,
        created_at=customer["created_at"]
    )

@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    result = await db["customers"].delete_one({"_id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}
