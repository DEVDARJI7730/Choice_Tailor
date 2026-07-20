import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from app.database import db
from app.routers.auth import get_current_user, UserResponse

router = APIRouter(prefix="/billing", tags=["Billing"])

@router.get("/{order_id}/pdf")
async def generate_invoice_pdf(
    order_id: str,
    gst_percent: float = 0.0,
    current_user: UserResponse = Depends(get_current_user)
):
    order = await db["orders"].find_one({"_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    customer = await db["customers"].find_one({"_id": order["customer_id"]})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Define temporary file path for invoice PDF
    pdf_filename = f"Invoice_{order.get('invoice_id', 'INV')}.pdf"
    pdf_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "uploads"
    )
    os.makedirs(pdf_dir, exist_ok=True)
    pdf_path = os.path.join(pdf_dir, pdf_filename)

    doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    
    # Choice Tailors styling
    primary_color = colors.HexColor("#7A1C1C")  # Crimson Red
    text_color = colors.HexColor("#222222")

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'ChoiceTailorsTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=primary_color,
        leading=28
    )
    subtitle_style = ParagraphStyle(
        'ChoiceTailorsSub',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=10,
        textColor=colors.gray,
        leading=14
    )
    normal_style = ParagraphStyle(
        'InvoiceNormal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=text_color,
        leading=14
    )
    bold_style = ParagraphStyle(
        'InvoiceBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=text_color,
        leading=14
    )

    # Header
    story.append(Paragraph("CHOICE TAILORS", title_style))
    story.append(Paragraph("Real Men Real Choice... | Gents Only", subtitle_style))
    story.append(Paragraph("Nr. Nilkanth Lodge, Gandhi Chok, Kadi", normal_style))
    story.append(Paragraph("Contact: +91 9925256898", normal_style))
    story.append(Paragraph("E-mail: choice.kadi@gmail.com", normal_style))
    story.append(Spacer(1, 20))

    # Invoice Meta Info
    meta_data = [
        [Paragraph("<b>Invoice No:</b>", normal_style), Paragraph(order.get('invoice_id', 'INV'), normal_style),
         Paragraph("<b>Date:</b>", normal_style), Paragraph(order.get('created_at', '')[:10], normal_style)],
        [Paragraph("<b>Customer Name:</b>", normal_style), Paragraph(customer.get('name', 'N/A'), normal_style),
         Paragraph("<b>Phone:</b>", normal_style), Paragraph(customer.get('phone', 'N/A'), normal_style)],
        [Paragraph("<b>Delivery Date:</b>", normal_style), Paragraph(order.get('delivery_date', 'N/A'), normal_style),
         Paragraph("<b>Trial Date:</b>", normal_style), Paragraph(order.get('trial_date', 'N/A') or 'N/A', normal_style)]
    ]
    
    meta_table = Table(meta_data, colWidths=[100, 180, 100, 160])
    meta_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 20))

    # Items Table Header
    items_data = [
        [Paragraph("<b>Item Description</b>", bold_style), Paragraph("<b>Qty</b>", bold_style), Paragraph("<b>Measurements Highlight</b>", bold_style), Paragraph("<b>Price</b>", bold_style)]
    ]

    for item in order.get("items", []):
        m_summary = ", ".join([f"{k.capitalize()}: {v}" for k, v in list(item.get("measurements", {}).items())[:3]])
        items_data.append([
            Paragraph(f"Custom Tailored {item.get('item_type', 'Clothing').capitalize()}", normal_style),
            Paragraph("1", normal_style),
            Paragraph(m_summary, normal_style),
            Paragraph(f"INR {order.get('total_price', 0.0) / len(order.get('items', [1])):.2f}", normal_style)
        ])

    # Totals and Payments
    subtotal = order["total_price"]
    gst_amt = subtotal * (gst_percent / 100.0)
    grand_total = subtotal + gst_amt
    advance = order.get("advance_payment", 0.0)
    due = max(0.0, grand_total - advance)

    items_data.append([Paragraph("", normal_style), Paragraph("", normal_style), Paragraph("<b>Subtotal:</b>", bold_style), Paragraph(f"INR {subtotal:.2f}", normal_style)])
    if gst_percent > 0:
        items_data.append([Paragraph("", normal_style), Paragraph("", normal_style), Paragraph(f"<b>GST ({gst_percent}%):</b>", bold_style), Paragraph(f"INR {gst_amt:.2f}", normal_style)])
    items_data.append([Paragraph("", normal_style), Paragraph("", normal_style), Paragraph("<b>Grand Total:</b>", bold_style), Paragraph(f"INR {grand_total:.2f}", bold_style)])
    items_data.append([Paragraph("", normal_style), Paragraph("", normal_style), Paragraph("<b>Advance Paid:</b>", bold_style), Paragraph(f"INR {advance:.2f}", normal_style)])
    items_data.append([Paragraph("", normal_style), Paragraph("", normal_style), Paragraph("<b>Remaining Amount:</b>", bold_style), Paragraph(f"INR {due:.2f}", bold_style)])

    items_table = Table(items_data, colWidths=[180, 50, 200, 110])
    items_table.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,0), 1.5, primary_color),
        ('LINEBELOW', (0,1), (-1,-6), 0.5, colors.lightgrey),
        ('LINEABOVE', (2,-4), (3,-4), 1, primary_color),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    
    story.append(items_table)
    story.append(Spacer(1, 40))
    story.append(Paragraph("<b>Terms & Conditions:</b>", bold_style))
    story.append(Paragraph("1. Please bring this invoice at the time of trial or delivery.", normal_style))
    story.append(Paragraph("2. All garments are custom stitched, no refunds will be issued.", normal_style))
    story.append(Paragraph("3. Choice Tailors is not responsible for fabric shrinkage/bleeding post stitching.", normal_style))
    story.append(Spacer(1, 20))
    story.append(Paragraph("<font color='#7A1C1C'><b>Thank you for choosing Choice Tailors!</b></font>", bold_style))

    doc.build(story)

    return FileResponse(pdf_path, media_type="application/pdf", filename=pdf_filename)
