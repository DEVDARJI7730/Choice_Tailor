import os
import tempfile
from typing import Optional
import pandas as pd
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from app.database import db
from app.routers.auth import get_current_user, UserResponse

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/sales/excel")
async def export_sales_excel(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    query = {}
    if start_date or end_date:
        query["created_at"] = {}
        if start_date:
            query["created_at"]["$gte"] = start_date
        if end_date:
            query["created_at"]["$lte"] = end_date

    cursor = db["orders"].find(query)
    
    if hasattr(cursor, "to_list"):
        docs = await cursor.to_list(1000)
    else:
        docs = []
        async for doc in cursor:
            docs.append(doc)

    if not docs:
        raise HTTPException(status_code=404, detail="No orders found for the report period")

    data = []
    for doc in docs:
        data.append({
            "Invoice ID": doc.get("invoice_id", ""),
            "Customer Name": doc.get("customer_name", ""),
            "Total Price (INR)": doc.get("total_price", 0.0),
            "Advance Paid (INR)": doc.get("advance_payment", 0.0),
            "Remaining Amount (INR)": doc.get("remaining_payment", 0.0),
            "Delivery Date": doc.get("delivery_date", ""),
            "Status": doc.get("status", ""),
            "Date Ordered": doc.get("created_at", "")[:10]
        })

    df = pd.DataFrame(data)
    
    # Save to a temporary file
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, f"Sales_Report_{datetime.utcnow().strftime('%Y%m%d')}.xlsx")
    
    # Use pandas to write excel
    with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Sales", index=False)

    return FileResponse(
        file_path, 
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
        filename=os.path.basename(file_path)
    )

@router.get("/summary")
async def get_dashboard_summary(
    current_user: UserResponse = Depends(get_current_user)
):
    # Total customers
    customers_count = await db["customers"].count_documents({})
    
    # Active orders
    active_count = await db["orders"].count_documents({"status": {"$in": ["Pending", "Cutting", "Stitching", "Trial"]}})
    
    # Completed orders
    completed_count = await db["orders"].count_documents({"status": "Completed"})
    
    # Today's deliveries count
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    todays_deliveries = await db["orders"].count_documents({"delivery_date": today_str})
    
    # Total Revenue Calculation
    cursor = db["orders"].find({})
    total_revenue = 0.0
    pending_collection = 0.0
    if hasattr(cursor, "to_list"):
        docs = await cursor.to_list(1000)
    else:
        docs = []
        async for doc in cursor:
            docs.append(doc)
            
    for doc in docs:
        total_revenue += doc.get("total_price", 0.0)
        pending_collection += doc.get("remaining_payment", 0.0)

    # Let's mock a monthly revenue graph
    monthly_sales = [
        {"month": "Jan", "revenue": total_revenue * 0.1},
        {"month": "Feb", "revenue": total_revenue * 0.12},
        {"month": "Mar", "revenue": total_revenue * 0.15},
        {"month": "Apr", "revenue": total_revenue * 0.08},
        {"month": "May", "revenue": total_revenue * 0.14},
        {"month": "Jun", "revenue": total_revenue * 0.21},
        {"month": "Jul", "revenue": total_revenue * 0.20}
    ]

    return {
        "customers_count": customers_count,
        "active_orders_count": active_count,
        "completed_orders_count": completed_count,
        "todays_deliveries": todays_deliveries,
        "total_revenue": total_revenue,
        "pending_collection": pending_collection,
        "monthly_sales": monthly_sales
    }

@router.get("/invoice/{invoice_id}/pdf")
async def generate_invoice_pdf(
    invoice_id: str,
    customer: str,
    phone: str,
    item: str,
    subtotal: float,
    gst_rate: float,
    gst_amount: float,
    grand_total: float,
    advance: float,
    remaining: float,
    date: str,
    token: Optional[str] = None
):
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    import io
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1e293b')
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748b')
    )
    
    bold_style = ParagraphStyle(
        'BoldText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1e293b')
    )
    
    normal_style = ParagraphStyle(
        'NormalText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155')
    )
    
    # Header Section
    story.append(Paragraph("<b>CHOICE TAILORS</b>", title_style))
    story.append(Paragraph("REAL MEN REAL CHOICE...", subtitle_style))
    story.append(Paragraph("Gandhi Chok, Kadi | Nr. Nilkanth Lodge<br/>M: 9925256898", normal_style))
    story.append(Spacer(1, 15))
    
    # Invoice Metadata Grid (Date, ID, Billed To)
    meta_data = [
        [Paragraph(f"<b>Invoice ID:</b> {invoice_id}", bold_style), Paragraph(f"<b>Date:</b> {date}", bold_style)],
        [Paragraph(f"<b>Billed To:</b> {customer}", normal_style), Paragraph(f"<b>Phone:</b> {phone}", normal_style)]
    ]
    t_meta = Table(meta_data, colWidths=[270, 270])
    t_meta.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 20))
    
    # Line Items Header & Row
    table_data = [
        [Paragraph("<b>Description</b>", bold_style), Paragraph("<b>Rate</b>", bold_style), Paragraph("<b>Total</b>", bold_style)],
        [Paragraph(item, normal_style), Paragraph(f"INR {subtotal:.2f}", normal_style), Paragraph(f"INR {subtotal:.2f}", normal_style)]
    ]
    t_items = Table(table_data, colWidths=[360, 90, 90])
    t_items.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('TOPPADDING', (0,0), (-1,0), 8),
        ('BOTTOMPADDING', (0,1), (-1,-1), 12),
        ('TOPPADDING', (0,1), (-1,-1), 12),
        ('LINEBELOW', (0,0), (-1,0), 1.5, colors.HexColor('#cbd5e1')),
        ('LINEBELOW', (0,1), (-1,-1), 1, colors.HexColor('#e2e8f0')),
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
    ]))
    story.append(t_items)
    story.append(Spacer(1, 20))
    
    # Summary Totals Table
    sum_data = [
        [Paragraph("Subtotal:", normal_style), Paragraph(f"INR {subtotal:.2f}", normal_style)],
    ]
    if gst_rate > 0:
        sum_data.append([Paragraph(f"GST ({gst_rate}%):", normal_style), Paragraph(f"INR {gst_amount:.2f}", normal_style)])
        
    sum_data.append([Paragraph("<b>Grand Total:</b>", bold_style), Paragraph(f"<b>INR {grand_total:.2f}</b>", bold_style)])
    sum_data.append([Paragraph("Advance Paid:", normal_style), Paragraph(f"INR {advance:.2f}", normal_style)])
    sum_data.append([Paragraph("<font color='#e11d48'><b>Outstanding Due:</b></font>", bold_style), Paragraph(f"<font color='#e11d48'><b>INR {remaining:.2f}</b></font>", bold_style)])
    
    t_sum = Table(sum_data, colWidths=[150, 90])
    t_sum.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LINEABOVE', (0,2), (1,2), 1, colors.HexColor('#cbd5e1')),
    ]))
    
    # Layout summary on right side
    t_layout = Table([[Spacer(1,1), t_sum]], colWidths=[300, 240])
    t_layout.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    story.append(t_layout)
    story.append(Spacer(1, 30))
    
    # Footer Notice
    notice_style = ParagraphStyle(
        'FooterNotice',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#64748b'),
        alignment=1 # Center
    )
    story.append(Paragraph("Thank you for choosing Choice Tailors. Stitching your perfect outfit is our privilege!", notice_style))
    
    doc.build(story)
    buffer.seek(0)
    
    # Save to a temporary file
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, f"{invoice_id}.pdf")
    with open(file_path, "wb") as f:
        f.write(buffer.read())
        
    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=f"{invoice_id}.pdf"
    )
