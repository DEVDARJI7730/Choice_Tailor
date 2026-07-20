import os
import shutil
import uuid
import json
import base64
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from datetime import datetime
from app.database import db
from app.config import settings
from app.routers.auth import get_current_user, UserResponse

router = APIRouter(prefix="/measurements", tags=["Measurements"])

class MeasurementResponse(BaseModel):
    id: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    phone: str
    type: str  # shirt, pant, suit, kurta
    values: Dict[str, Any]
    photo_url: Optional[str] = None
    created_at: str

@router.post("", response_model=MeasurementResponse)
async def create_measurement(
    phone: str = Form(...),
    type: str = Form(...),
    values: str = Form(...),  # Expected to be a JSON string representing the dict
    customer_id: Optional[str] = Form(None),
    photo_file: Optional[UploadFile] = File(None),
    photo_base64: Optional[str] = Form(None),
    current_user: UserResponse = Depends(get_current_user)
):
    # Parse values dict
    try:
        parsed_values = json.loads(values)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON format for measurement values.")

    # Try to find customer by phone or customer_id
    customer = None
    if customer_id:
        customer = await db["customers"].find_one({"_id": customer_id})
    if not customer and phone:
        customer = await db["customers"].find_one({"phone": phone})

    final_customer_id = str(customer["_id"]) if customer else customer_id
    customer_name = customer["name"] if customer else "Walk-in Customer"

    photo_url = None

    # Handle image file upload
    if photo_file:
        file_ext = photo_file.filename.split(".")[-1]
        filename = f"meas_{uuid.uuid4()}.{file_ext}"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(photo_file.file, buffer)
        photo_url = f"/uploads/{filename}"

    # Handle base64 camera image upload
    elif photo_base64 and photo_base64.strip():
        try:
            # Expected format: data:image/png;base64,...
            header, encoded = photo_base64.split(",", 1)
            file_ext = "png"
            if "jpeg" in header or "jpg" in header:
                file_ext = "jpg"
            elif "webp" in header:
                file_ext = "webp"
            
            file_data = base64.b64decode(encoded)
            filename = f"webcam_{uuid.uuid4()}.{file_ext}"
            filepath = os.path.join(settings.UPLOAD_DIR, filename)
            
            with open(filepath, "wb") as f:
                f.write(file_data)
            photo_url = f"/uploads/{filename}"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to process webcam image: {str(e)}")

    now = datetime.utcnow().isoformat()
    measurement_dict = {
        "customer_id": final_customer_id,
        "customer_name": customer_name,
        "phone": phone,
        "type": type,
        "values": parsed_values,
        "photo_url": photo_url,
        "created_at": now
    }

    result = await db["measurements"].insert_one(measurement_dict)
    measurement_dict["_id"] = result.inserted_id

    return MeasurementResponse(
        id=str(measurement_dict["_id"]),
        customer_id=measurement_dict.get("customer_id"),
        customer_name=measurement_dict.get("customer_name"),
        phone=measurement_dict["phone"],
        type=measurement_dict["type"],
        values=measurement_dict["values"],
        photo_url=measurement_dict.get("photo_url"),
        created_at=measurement_dict["created_at"]
    )

@router.get("/search", response_model=List[MeasurementResponse])
async def search_measurements(
    phone: str,
    current_user: UserResponse = Depends(get_current_user)
):
    query = {"phone": phone}
    cursor = db["measurements"].find(query)
    measurements = []
    
    if hasattr(cursor, "to_list"):
        docs = await cursor.to_list(100)
    else:
        docs = []
        async for doc in cursor:
            docs.append(doc)
            
    for doc in docs:
        measurements.append(MeasurementResponse(
            id=str(doc["_id"]),
            customer_id=doc.get("customer_id"),
            customer_name=doc.get("customer_name"),
            phone=doc["phone"],
            type=doc["type"],
            values=doc.get("values", {}),
            photo_url=doc.get("photo_url"),
            created_at=doc.get("created_at", datetime.utcnow().isoformat())
        ))
        
    # Sort by creation date descending
    measurements.sort(key=lambda x: x.created_at, reverse=True)
    return measurements

@router.get("/customer/{customer_id}", response_model=List[MeasurementResponse])
async def list_measurements_by_customer(
    customer_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    query = {"customer_id": customer_id}
    cursor = db["measurements"].find(query)
    measurements = []
    
    if hasattr(cursor, "to_list"):
        docs = await cursor.to_list(100)
    else:
        docs = []
        async for doc in cursor:
            docs.append(doc)
            
    for doc in docs:
        measurements.append(MeasurementResponse(
            id=str(doc["_id"]),
            customer_id=doc.get("customer_id"),
            customer_name=doc.get("customer_name"),
            phone=doc["phone"],
            type=doc["type"],
            values=doc.get("values", {}),
            photo_url=doc.get("photo_url"),
            created_at=doc.get("created_at", datetime.utcnow().isoformat())
        ))
        
    measurements.sort(key=lambda x: x.created_at, reverse=True)
    return measurements

@router.delete("/{measurement_id}")
async def delete_measurement(
    measurement_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    result = await db["measurements"].delete_one({"_id": measurement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Measurement not found")
    return {"message": "Measurement deleted successfully"}

@router.post("/scan-bill")
async def scan_gujarati_bill(
    photo_file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user)
):
    import base64
    import json
    import requests
    import google.generativeai as genai
    
    gemini_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    openai_key = settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY")
    
    if not gemini_key and not openai_key:
        raise HTTPException(
            status_code=400, 
            detail="No API Key configured. Please add GEMINI_API_KEY or OPENAI_API_KEY in your backend/.env file."
        )

    # Read image file bytes
    try:
        image_data = await photo_file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image file: {str(e)}")

    prompt = """
    You are an expert OCR AI assistant for a gents-only tailoring shop in Gujarat, India named "Choice Tailors".
    Analyze this handwritten Gujarati tailoring measurement slip.
    Extract the customer's name, phone number, and the specific tailoring measurements.

    Handwritten Gujarati tailoring receipts have standard structures:
    - "નામ:" means Name.
    - "નંબર:" means Serial Number / Name / ID. (Note: in this specific slip, "દેવ" is written next to "નંબર", which represents the customer's name "Dev").
    - "આપ્યા તારીખ:" means Order Date.
    - "ટ્રાયલ તારીખ:" means Trial Date.
    - "ડીલીવરી:" means Delivery Date.
    - The numbers in the grid represent garments sizes in inches.
      - If you see terms like "પેન્ટ" (pant) or "શર્ટ" (shirt), use it to determine garment type. In this slip, "પેન્ટ" (written as "પેન્ટ" or "સ્ટોન પેન્ટ" or "પાયજામો") refers to "pant".
      - For Pants (પેન્ટ): Numbers represent Waist (કંમર), Hip/Seat (સીટ), Thigh (જંઘ), Knee (ઘૂંટણ), Bottom (મોરી), Length (લંબાઈ).
      - For Shirts (શર્ટ): Numbers represent Length (લંબાઈ), Chest (છાતી), Waist (કંમર), Shoulder (શોલ્ડર), Sleeve (બાંય), Neck (કોલર).

    Output the results as a structured JSON object. Map the sizes to standard field keys:
    - For pant: waist, hip, thigh, knee, bottom, length.
    - For shirt: neck, chest, waist, shoulder, sleeve, length, cuff.
    Use float values as strings (e.g., "32.0", "43.0", "20.0").

    Return ONLY a clean JSON object with this exact structure (no markdown formatting, no code blocks):
    {
      "customer_name": "Dev",
      "garment_type": "pant",
      "values": {
        "waist": "32.0",
        "hip": "43.0",
        "thigh": "20.0",
        "knee": "25.0",
        "bottom": "12.5",
        "length": "37.0"
      }
    }
    """

    # Try Gemini models in sequence (multi-model fallback to maximize free quota)
    parsed_data = None
    if gemini_key:
        genai.configure(api_key=gemini_key)
        models_to_try = [
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-2.5-flash-lite",
            "gemini-flash-latest"
        ]
        
        image_part = {
            "mime_type": photo_file.content_type or "image/jpeg",
            "data": image_data
        }
        
        last_err = None
        for model_name in models_to_try:
            for attempt in range(3):
                try:
                    print(f"Trying Gemini model: {model_name} (Attempt {attempt+1}/3)...")
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content([image_part, prompt])
                    text_resp = response.text.strip()
                    
                    # Clean JSON markdown blocks if returned
                    if text_resp.startswith("```"):
                        lines = text_resp.splitlines()
                        if lines[0].startswith("```"):
                            lines = lines[1:]
                        if lines[-1].startswith("```"):
                            lines = lines[:-1]
                        text_resp = "\n".join(lines).strip()
                        
                    parsed_data = json.loads(text_resp)
                    print(f"Gemini model {model_name} successfully scanned the bill!")
                    return parsed_data
                except Exception as e:
                    last_err = e
                    err_msg = str(e)
                    print(f"Gemini model {model_name} attempt {attempt+1} failed: {err_msg}")
                    # If it's a rate limit or quota block, sleep and try again
                    if "429" in err_msg or "ResourceExhausted" in err_msg or "quota" in err_msg.lower() or "limit" in err_msg.lower():
                        if attempt < 2:
                            import asyncio
                            print("Rate limit hit. Waiting 5 seconds before retrying...")
                            await asyncio.sleep(5)
                            continue
                    # If it's a different fatal error or we ran out of attempts, break to try next model
                    break
                
        # If we exhausted Gemini models and still failed
        if not parsed_data:
            if openai_key:
                print("All Gemini models exhausted. Falling back to OpenAI API...")
            else:
                import traceback
                traceback.print_exc()
                err_msg = str(last_err)
                raise HTTPException(
                    status_code=429,
                    detail=f"Gemini free limits exhausted on all available models. Please wait 15 seconds or configure an active OPENAI_API_KEY for backup."
                )

    # Fallback to OpenAI GPT-4o-mini
    if openai_key:
        try:
            base64_image = base64.b64encode(image_data).decode("utf-8")
            mime = photo_file.content_type or "image/jpeg"
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {openai_key}"
            }
            
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime};base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                "response_format": {"type": "json_object"},
                "max_tokens": 1000
            }
            
            resp = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            if resp.status_code == 200:
                result = resp.json()
                content = result["choices"][0]["message"]["content"].strip()
                parsed_data = json.loads(content)
                return parsed_data
            else:
                resp_json = {}
                try:
                    resp_json = resp.json()
                except Exception:
                    pass
                
                err_desc = resp_json.get("error", {}).get("message", "")
                err_code = resp_json.get("error", {}).get("code", "")
                
                if "insufficient_quota" in err_code or "quota" in err_desc.lower():
                    raise Exception("Your OpenAI API Key has expired free credits or insufficient balance. Please check your OpenAI billing platform.")
                
                raise Exception(f"OpenAI API returned status code {resp.status_code}: {err_desc or resp.text}")
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=500, 
                detail=f"OCR Scan failed. Gemini free limits exhausted and OpenAI backup failed: {str(e)}"
            )
