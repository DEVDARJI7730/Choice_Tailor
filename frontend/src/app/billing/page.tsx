"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { CreditCard, IndianRupee, Printer, Percent, Sparkles, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Billing() {
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [itemType, setItemType] = useState("suit");
  const [totalPrice, setTotalPrice] = useState("12500");
  const [advancePayment, setAdvancePayment] = useState("5000");
  const [gstRate, setGstRate] = useState("0");
  const [invoiceReady, setInvoiceReady] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchCustomers = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/customers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCustomers(data);
          if (data.length > 0) {
            setCustomerId(data[0].id);
          }
        } else {
          throw new Error("Unauthorized or invalid response");
        }
      } catch (err) {
        console.warn("Backend API not reachable. Using fallback customer list.");
        const fallback = [
          { id: "1", name: "Mr. Nilesh Shah", phone: "9925256898" },
          { id: "2", name: "Mr. Rajesh Patel", phone: "9998170809" },
          { id: "3", name: "Mr. Amit Mehta", phone: "9876543210" }
        ];
        setCustomers(fallback);
        setCustomerId(fallback[0].id);
      }
    };
    fetchCustomers();
  }, []);

  const sendWhatsAppInvoice = (invoice: any) => {
    if (!invoice || !invoice.phone || invoice.phone === "N/A") return;
    
    let formattedPhone = invoice.phone.replace(/\D/g, "");
    if (formattedPhone.length === 10) {
      formattedPhone = "91" + formattedPhone;
    }

    const pdfUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/reports/invoice/${invoice.invoice_id}/pdf?customer=${encodeURIComponent(invoice.customer)}&phone=${encodeURIComponent(invoice.phone)}&item=${encodeURIComponent(invoice.item)}&subtotal=${invoice.subtotal}&gst_rate=${invoice.gst_rate}&gst_amount=${invoice.gst_amount}&grand_total=${invoice.grand_total}&advance=${invoice.advance}&remaining=${invoice.remaining}&date=${invoice.date}`;
    
    // Open WhatsApp Web to send invoice text (clean single-gesture redirect)
    const message = `Hello ${invoice.customer}! 🧵\n\nYour invoice *${invoice.invoice_id}* has been generated at *Choice Tailors*.\n\n*Details:*\n🔹 Item: ${invoice.item}\n🔹 Date: ${invoice.date}\n🔹 Grand Total: ₹${invoice.grand_total}\n🔹 Advance Paid: ₹${invoice.advance}\n🔸 *Outstanding Due: ₹${invoice.remaining}*\n\n📥 *Download Link (Backup):*\n${pdfUrl}\n\nThank you for choosing us!\n\n_Choice Tailors, Gandhi Chok, Kadi_\n_Helpline: 9925256898_`;
    
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const downloadInvoicePdf = (invoice: any) => {
    if (!invoice) return;
    const pdfUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/reports/invoice/${invoice.invoice_id}/pdf?customer=${encodeURIComponent(invoice.customer)}&phone=${encodeURIComponent(invoice.phone)}&item=${encodeURIComponent(invoice.item)}&subtotal=${invoice.subtotal}&gst_rate=${invoice.gst_rate}&gst_amount=${invoice.gst_amount}&grand_total=${invoice.grand_total}&advance=${invoice.advance}&remaining=${invoice.remaining}&date=${invoice.date}`;
    
    const downloadLink = document.createElement("a");
    downloadLink.href = pdfUrl;
    downloadLink.setAttribute("download", `${invoice.invoice_id}.pdf`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const calculateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const priceVal = parseFloat(totalPrice) || 0;
    const advVal = parseFloat(advancePayment) || 0;
    const gstPct = parseFloat(gstRate) || 0;

    const gstAmt = priceVal * (gstPct / 100);
    const grandTotal = priceVal + gstAmt;
    const remaining = Math.max(0, grandTotal - advVal);

    const selectedCust = customers.find((c) => c.id === customerId) || { name: "Guest", phone: "N/A" };

    const newInvoice = {
      invoice_id: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      customer: selectedCust.name,
      phone: selectedCust.phone,
      item: itemType.toUpperCase() + " Bespoke Stitching",
      subtotal: priceVal,
      gst_rate: gstPct,
      gst_amount: gstAmt,
      grand_total: grandTotal,
      advance: advVal,
      remaining: remaining,
      date: new Date().toISOString().slice(0, 10),
    };

    setGeneratedInvoice(newInvoice);
    setInvoiceReady(true);
    sendWhatsAppInvoice(newInvoice);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto print:bg-white print:p-0">
        
        <div className="flex justify-between items-center mb-8 print:hidden">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 font-sans tracking-tight">
              Bespoke Billing
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Generate custom invoices, calculate GST rate brackets, and log cash advances.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Billing Form */}
          <div className="lg:col-span-6 bg-white border border-slate-200 p-6 rounded-xl shadow-sm print:hidden">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-5 h-5 text-red-600" />
              <span>Invoice Calculator</span>
            </h3>

            <form onSubmit={calculateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Select Customer
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full custom-input text-sm text-slate-700"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Garment Type
                  </label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                    className="w-full custom-input text-sm text-slate-700"
                  >
                    <option value="shirt">Bespoke Shirt</option>
                    <option value="pant">Bespoke Pant</option>
                    <option value="suit">Bespoke Suit / Blazer</option>
                    <option value="kurta">Bespoke Kurta</option>
                    <option value="sherwani">Designer Sherwani</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    GST Category
                  </label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                    className="w-full custom-input text-sm text-slate-700"
                  >
                    <option value="0">0% Excluded</option>
                    <option value="5">5% SGST + CGST</option>
                    <option value="12">12% Luxury Apparel</option>
                    <option value="18">18% standard service tax</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Stitching Price (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold font-mono">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={totalPrice}
                      onChange={(e) => setTotalPrice(e.target.value)}
                      className="w-full custom-input pl-8 text-sm font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Advance Payment (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold font-mono">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={advancePayment}
                      onChange={(e) => setAdvancePayment(e.target.value)}
                      className="w-full custom-input pl-8 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full btn-crimson py-3 text-sm font-bold mt-4 shadow-sm">
                Compile Invoice
              </button>
            </form>
          </div>

          {/* Invoice Output Panel */}
          <div className="lg:col-span-6">
            {invoiceReady && generatedInvoice ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-md relative print:border-none print:shadow-none print:p-0 print:text-black"
              >
                {/* Invoice Branded Header */}
                <div className="border-b border-slate-200 pb-5 mb-5 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 print:text-black tracking-wide font-sans">
                      CHOICE TAILORS
                    </h2>
                    <span className="text-[9px] uppercase tracking-widest text-slate-500 block mt-0.5">
                      Real Men Real Choice...
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">
                      Gandhi Chok, Kadi | Nr. Nilkanth Lodge<br />
                      M: 9925256898
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-red-600 font-mono block">
                      {generatedInvoice.invoice_id}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Date: {generatedInvoice.date}
                    </span>
                  </div>
                </div>

                {/* Customer meta */}
                <div className="grid grid-cols-2 gap-4 text-xs mb-6 text-slate-600 print:text-black">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Billed To:</span>
                    <p className="font-semibold text-slate-800 mt-1">{generatedInvoice.customer}</p>
                    <p className="mt-0.5">{generatedInvoice.phone}</p>
                  </div>
                </div>

                {/* Line Item Table */}
                <table className="w-full text-xs text-left mb-6 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 print:border-black text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-2">Description</th>
                      <th className="py-2 text-right">Rate</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 text-slate-600 print:text-black">
                      <td className="py-3 font-semibold">{generatedInvoice.item}</td>
                      <td className="py-3 text-right font-mono">₹{generatedInvoice.subtotal}</td>
                      <td className="py-3 text-right font-mono">₹{generatedInvoice.subtotal}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Totals Summary */}
                <div className="w-64 ml-auto space-y-2.5 text-xs text-slate-600 print:text-black pb-4 border-b border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal:</span>
                    <span className="font-mono">₹{generatedInvoice.subtotal}</span>
                  </div>
                  {generatedInvoice.gst_rate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">GST ({generatedInvoice.gst_rate}%):</span>
                      <span className="font-mono">₹{generatedInvoice.gst_amount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-800 print:text-black border-t border-slate-100 pt-2 text-sm">
                    <span>Grand Total:</span>
                    <span className="font-mono text-red-600 print:text-black">₹{generatedInvoice.grand_total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Advance Paid:</span>
                    <span className="font-mono text-emerald-600 print:text-emerald-700">₹{generatedInvoice.advance}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-rose-600">
                    <span>Outstanding Due:</span>
                    <span className="font-mono">₹{generatedInvoice.remaining}</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3 print:hidden">
                  <button
                    onClick={handlePrint}
                    className="bg-slate-800 hover:bg-slate-900 text-white flex-1 py-2.5 text-sm flex items-center justify-center gap-2 rounded-lg font-semibold shadow-sm transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print</span>
                  </button>
                  
                  <button
                    onClick={() => downloadInvoicePdf(generatedInvoice)}
                    className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex-1 py-2.5 text-sm flex items-center justify-center gap-2 rounded-lg font-semibold shadow-sm transition-all"
                  >
                    <svg className="w-4.5 h-4.5 text-slate-500 fill-none stroke-current stroke-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={() => sendWhatsAppInvoice(generatedInvoice)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 py-2.5 text-sm flex items-center justify-center gap-2 rounded-lg font-semibold shadow-sm transition-all"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.75-3.345c1.614.957 3.328 1.463 5.234 1.463 5.485 0 9.948-4.469 9.951-9.953.001-2.657-1.026-5.155-2.894-7.026-1.868-1.868-4.357-2.896-7.027-2.896-5.492 0-9.956 4.469-9.959 9.954-.001 1.996.52 3.946 1.512 5.666l-.991 3.618 3.705-.972zm12.39-4.88c-.33-.165-1.951-.963-2.251-1.072-.3-.11-.52-.165-.74.165-.22.33-.85 1.072-1.04 1.293-.19.22-.38.248-.71.083-.33-.165-1.396-.514-2.66-1.642-.983-.878-1.647-1.962-1.84-2.29-.19-.33-.02-.508.145-.671.15-.147.33-.385.495-.578.165-.192.22-.33.33-.55.11-.22.055-.413-.028-.578-.083-.165-.74-1.788-1.013-2.45-.267-.64-.563-.55-.74-.56l-.63-.01c-.22 0-.577.083-.88.413-.303.33-1.155 1.128-1.155 2.75 0 1.622 1.182 3.19 1.346 3.41 1.65 2.215 3.74 3.3 5.9 3.3 1.14 0 2.18-.03 2.99-.21.57-.13 1.73-.7 1.97-1.38.24-.68.24-1.26.17-1.38-.07-.11-.29-.22-.62-.385z"/>
                    </svg>
                    <span>Send WhatsApp</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white border border-slate-200 p-8 text-center rounded-xl opacity-70 shadow-sm">
                <CreditCard className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">
                  Fill in the invoice parameters on the left and click Compile to compute billing.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
