import urllib.parse
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.database import db
from app.config import settings
from app.routers.auth import get_current_user, UserResponse

router = APIRouter(prefix="/ai", tags=["AI Features"])

class MeasurementCheckRequest(BaseModel):
    customer_id: str
    item_type: str
    measurements: Dict[str, float]

class MessageGenerateRequest(BaseModel):
    order_id: str
    message_type: str  # trial, delivery, payment

# AI Measurement Assistant: Compare with last orders to find anomalies
@router.post("/check-measurements")
async def check_measurements(
    payload: MeasurementCheckRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    # Find customer's previous orders
    cursor = db["orders"].find({"customer_id": payload.customer_id})
    orders = []
    if hasattr(cursor, "to_list"):
        docs = await cursor.to_list(50)
    else:
        docs = []
        async for doc in cursor:
            docs.append(doc)

    previous_measurements = None
    # Look for most recent item of same type
    for doc in sorted(docs, key=lambda x: x.get("created_at", ""), reverse=True):
        for item in doc.get("items", []):
            if item.get("item_type") == payload.item_type:
                previous_measurements = item.get("measurements", {})
                break
        if previous_measurements:
            break

    warnings = []
    if previous_measurements:
        tolerances = {
            "neck": 1.0,
            "chest": 2.0,
            "waist": 2.0,
            "shoulder": 1.0,
            "sleeve": 1.5,
            "length": 2.0,
            "hip": 2.0,
            "thigh": 1.5,
            "knee": 1.0,
            "bottom": 1.0
        }

        for key, value in payload.measurements.items():
            # Clean key names to match tolerances
            clean_key = key.lower()
            prev_value = previous_measurements.get(key)
            if prev_value is not None:
                try:
                    diff = abs(float(value) - float(prev_value))
                    tol = tolerances.get(clean_key, 2.0)
                    if diff > tol:
                        warnings.append(
                            f"Significant change in {key.capitalize()}: from {prev_value} to {value} (Difference of {diff})"
                        )
                except ValueError:
                    pass

    return {
        "status": "warning" if warnings else "ok",
        "has_previous": previous_measurements is not None,
        "warnings": warnings
    }

# AI Delivery Prediction: Workload-based completion probability
@router.get("/predict-delivery")
async def predict_delivery(
    current_user: UserResponse = Depends(get_current_user)
):
    # Retrieve all active stitching/cutting orders
    active_statuses = ["Pending", "Cutting", "Stitching", "Trial"]
    active_count = await db["orders"].count_documents({"status": {"$in": active_statuses}})

    # Calculate workload index
    if active_count > 30:
        workload = "Critical"
        delay_days = 5
        message = "Stitching queue is heavily overloaded. Standard orders might face delays of 4-5 days."
    elif active_count > 15:
        workload = "High"
        delay_days = 2
        message = "High workload. Recommended to schedule delivery dates +2 days later."
    else:
        workload = "Normal"
        delay_days = 0
        message = "Workload is nominal. Orders are on schedule."

    return {
        "active_orders_count": active_count,
        "workload_status": workload,
        "recommended_buffer_days": delay_days,
        "prediction_insights": message
    }

# AI WhatsApp Message Generator
@router.post("/whatsapp-message")
async def generate_whatsapp_message(
    payload: MessageGenerateRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    order = await db["orders"].find_one({"_id": payload.order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    customer = await db["customers"].find_one({"_id": order["customer_id"]})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    cust_name = customer.get("name", "Customer")
    phone = customer.get("phone", "")
    # Ensure phone number formatting is simple
    clean_phone = phone.replace("+", "").replace(" ", "")
    if len(clean_phone) == 10:
        clean_phone = "91" + clean_phone  # Default to India country code for Choice Tailors

    items_list = ", ".join([item.get("item_type", "garment").capitalize() for item in order.get("items", [])])
    trial_date = order.get("trial_date", "tomorrow")
    delivery_date = order.get("delivery_date", "")
    invoice = order.get("invoice_id", "INV")
    remaining = f"INR {order.get('remaining_payment', 0.0):.2f}"

    msg = ""
    if payload.message_type == "trial":
        msg = (
            f"Hello Mr. {cust_name}, your trial for {items_list} at Choice Tailors is scheduled for {trial_date}. "
            f"Please visit Gandhi Chok, Kadi. Thank you!"
        )
    elif payload.message_type == "delivery":
        msg = (
            f"Hello Mr. {cust_name}, your order ({invoice}) is ready for delivery at Choice Tailors! "
            f"Remaining balance is {remaining}. Please visit Nr. Nilkanth Lodge, Gandhi Chok, Kadi."
        )
    elif payload.message_type == "payment":
        msg = (
            f"Hello Mr. {cust_name}, this is a reminder from Choice Tailors regarding the remaining balance of "
            f"{remaining} on your order ({invoice}). Please pay online or in the shop."
        )
    else:
        msg = f"Hello Mr. {cust_name}, updates regarding your order at Choice Tailors."

    encoded_msg = urllib.parse.quote(msg)
    wa_url = f"https://wa.me/{clean_phone}?text={encoded_msg}"

    return {
        "message_text": msg,
        "whatsapp_url": wa_url
    }

# AI Design Suggestion / Custom recommendations based on style
@router.get("/recommendations")
async def get_style_recommendations(
    item_type: str,
    current_user: UserResponse = Depends(get_current_user)
):
    # If Gemini API Key is available, use it to suggest styling trends. Otherwise, use custom local trends database.
    suggestions = []
    
    if settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"Suggest 3 popular modern styling, collar types, pocket designs or lapel designs for Gents {item_type} suits/clothing in India. Keep descriptions short."
            response = model.generate_content(prompt)
            suggestions.append(response.text)
        except Exception:
            pass

    # Provide high-quality local fallback suggestions if AI is offline or key missing
    if not suggestions:
        if item_type == "shirt":
            suggestions = [
                "Mandarin Collar (Chinese collar): Best for casual and wedding-guest shirts. Pairs well under bandhgala jackets.",
                "Cutaway Collar: A wide collar spread that accommodates larger tie knots and provides a very clean, bold look.",
                "Hidden Button-Down: Buttons hidden underneath the collar flaps, maintaining structural shape without visible buttons."
            ]
        elif item_type == "suit":
            suggestions = [
                "Peak Lapel: Extremely popular for weddings and premium blazers. Accentuates shoulder width.",
                "Double-Breasted (6-on-2 button structure): Elegant, traditional, and sits high in modern slim-fit cuts.",
                "Velvet Trim Lapel: Ideal for groom's wear or tuxedos at wedding receptions."
            ]
        elif item_type == "kurta":
            suggestions = [
                "High Band Collar with Asymmetric Buttons: Very trendy for festive wear.",
                "Side Open Kurta: Modern look featuring side-button slits rather than central placket.",
                "Cowl-Drape Hemline Kurta: Best suited for sangeet ceremonies when paired with a churidar."
            ]
        else:
            suggestions = [
                "Classic Gents tailoring style with custom fitting and choice premium fabric.",
                "Contrast lining inside cuffs and collar band for subtle personalization."
            ]

    return {
        "item_type": item_type,
        "recommendations": suggestions
    }
