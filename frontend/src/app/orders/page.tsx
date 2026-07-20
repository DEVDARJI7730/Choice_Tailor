"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { ShoppingBag, ArrowRight, MessageSquare, Printer, CheckCircle, Clock, Scissors, X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Orders() {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // WhatsApp Message Generator panel state
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waMessageType, setWaMessageType] = useState<"trial" | "delivery" | "payment">("trial");
  const [waText, setWaText] = useState("");
  const [mounted, setMounted] = useState(false);

  // Customers & Orders Lists
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Create Order Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [orderCustomerId, setOrderCustomerId] = useState("");
  const [orderItemType, setOrderItemType] = useState("shirt");
  const [orderDeliveryDate, setOrderDeliveryDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [orderTrialDate, setOrderTrialDate] = useState(
    new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [orderTotalPrice, setOrderTotalPrice] = useState("1500");
  const [orderAdvancePayment, setOrderAdvancePayment] = useState("500");
  const [orderNotes, setOrderNotes] = useState("");

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem("token");
    
    // Set fallback seed orders for offline mode
    const mockSeedOrders = [
      {
        id: "1",
        invoice_id: "INV-1092F3",
        customer_name: "Mr. Nilesh Shah",
        phone: "9925256898",
        items: "1 Midnight Blue Suit",
        delivery_date: "2026-07-22",
        trial_date: "2026-07-20",
        status: "Stitching",
        total_price: 12500.0,
        advance_payment: 5000.0,
        remaining_payment: 7500.0,
        notes: "Wedding Blazer. Double-breasted."
      },
      {
        id: "2",
        invoice_id: "INV-290A81",
        customer_name: "Mr. Rajesh Patel",
        phone: "9998170809",
        items: "1 White Shirt, 1 Grey Pant",
        delivery_date: "2026-07-24",
        trial_date: "2026-07-21",
        status: "Cutting",
        total_price: 2800.0,
        advance_payment: 1000.0,
        remaining_payment: 1800.0,
        notes: "Office wear. Soft collar."
      },
      {
        id: "3",
        invoice_id: "INV-7801CD",
        customer_name: "Mr. Amit Mehta",
        phone: "9876543210",
        items: "1 Maroon Silk Kurta",
        delivery_date: "2026-07-20",
        trial_date: "2026-07-19",
        status: "Trial",
        total_price: 3500.0,
        advance_payment: 3500.0,
        remaining_payment: 0.0,
        notes: "Festive loose fit."
      }
    ];

    if (!token) {
      setOrders(mockSeedOrders);
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch customers first to map details
      const custRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/customers`, { headers });
      let customersList: any[] = [];
      if (custRes.ok) {
        customersList = await custRes.json();
        setCustomers(customersList);
        if (customersList.length > 0) {
          setOrderCustomerId(customersList[0].id);
        }
      }

      // Fetch orders
      const ordersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/orders`, { headers });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        const transformed = ordersData.map((o: any) => {
          const client = customersList.find((c) => c.id === o.customer_id);
          const itemsStr = o.items.map((i: any) => `1 ${i.item_type.toUpperCase()}`).join(", ");
          return {
            id: o.id,
            invoice_id: o.invoice_id,
            customer_name: o.customer_name,
            phone: client ? client.phone : "N/A",
            items: itemsStr || "Bespoke Stitching",
            delivery_date: o.delivery_date,
            trial_date: o.trial_date,
            status: o.status,
            total_price: o.total_price,
            advance_payment: o.advance_payment,
            remaining_payment: o.remaining_payment,
            notes: o.notes
          };
        });
        setOrders(transformed);
      } else {
        throw new Error("Unauthorized or invalid response");
      }
    } catch (err) {
      console.warn("Backend API not reachable. Using offline fallback orders.");
      setOrders(mockSeedOrders);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    // Optimistic state update
    setOrders(
      orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }

    const token = localStorage.getItem("token");
    if (token) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/orders/${orderId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        });
      } catch (err) {
        console.warn("Could not sync status update with database.");
      }
    }
  };

  // Create order handler
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCustomerId) {
      alert("Please select a customer first.");
      return;
    }

    const token = localStorage.getItem("token");
    const payload = {
      customer_id: orderCustomerId,
      items: [
        {
          item_type: orderItemType,
          measurements: {},
          fabric: null,
          design_images: []
        }
      ],
      delivery_date: orderDeliveryDate,
      trial_date: orderTrialDate || null,
      notes: orderNotes,
      total_price: parseFloat(orderTotalPrice) || 0,
      advance_payment: parseFloat(orderAdvancePayment) || 0
    };

    if (token) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          alert("Order created successfully!");
          setCreateModalOpen(false);
          setOrderNotes("");
          loadData(); // Reload orders and counts
          return;
        } else {
          const errData = await res.json();
          alert(`Failed to create order: ${errData.detail || "Unknown error"}`);
        }
      } catch (err) {
        console.error("Failed to connect to backend:", err);
      }
    }

    // Local Mock Fallback
    const mockOrder = {
      id: `ORDER-${Math.floor(1000 + Math.random() * 9000)}`,
      invoice_id: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      customer_name: customers.find(c => c.id === orderCustomerId)?.name || "Walk-in Customer",
      phone: customers.find(c => c.id === orderCustomerId)?.phone || "N/A",
      items: `1 ${orderItemType.toUpperCase()}`,
      delivery_date: orderDeliveryDate,
      trial_date: orderTrialDate,
      status: "Pending",
      total_price: parseFloat(orderTotalPrice) || 0,
      advance_payment: parseFloat(orderAdvancePayment) || 0,
      remaining_payment: Math.max(0, (parseFloat(orderTotalPrice) || 0) - (parseFloat(orderAdvancePayment) || 0)),
      notes: orderNotes
    };

    setOrders([mockOrder, ...orders]);
    setOrderNotes("");
    setCreateModalOpen(false);
    alert("Saved successfully! (Saved to local memory state)");
  };

  const handleGenerateWa = (order: any, type: "trial" | "delivery" | "payment") => {
    setWaMessageType(type);
    setSelectedOrder(order);
    
    let text = "";
    if (type === "trial") {
      text = `Hello Mr. ${order.customer_name}, your trial for ${order.items} at Choice Tailors is scheduled for ${order.trial_date} at 5:00 PM. Please visit Nr. Nilkanth Lodge, Gandhi Chok, Kadi.`;
    } else if (type === "delivery") {
      text = `Hello Mr. ${order.customer_name}, your order (${order.invoice_id}) is ready for delivery at Choice Tailors! Remaining amount: INR ${order.remaining_payment}. Please visit Gandhi Chok, Kadi.`;
    } else {
      text = `Hello Mr. ${order.customer_name}, reminder from Choice Tailors for pending payment of INR ${order.remaining_payment} on your order (${order.invoice_id}). Thank you!`;
    }
    
    setWaText(text);
    setWaModalOpen(true);
  };

  const handleSendWa = () => {
    if (!selectedOrder) return;
    const cleanPhone = selectedOrder.phone.replace("+", "").replace(" ", "");
    const finalPhone = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone;
    const encoded = encodeURIComponent(waText);
    window.open(`https://wa.me/${finalPhone}?text=${encoded}`, "_blank");
    setWaModalOpen(false);
  };

  const filteredOrders = orders.filter(
    (o) => activeFilter === "All" || o.status === activeFilter
  );

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 font-sans tracking-tight">
              Order Pipeline
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Track fabric cutting, stitching progress and schedules of custom menswear.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn-crimson px-4 py-2.5 flex items-center gap-2 text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Stitch Order</span>
          </button>
        </div>

        {/* Status pipeline filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {["All", "Pending", "Cutting", "Stitching", "Trial", "Completed", "Delivered"].map((status) => (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
                activeFilter === status
                  ? "bg-red-50 text-red-700 border-red-200 shadow-sm"
                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Layout list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Orders List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 p-8 text-center rounded-xl text-slate-500 text-sm shadow-sm">
                No orders matching the active pipeline state.
              </div>
            ) : (
              filteredOrders.map((order) => (
                <motion.div
                  key={order.id}
                  layoutId={`order-${order.id}`}
                  className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-slate-300 transition-all duration-150"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-red-600 font-mono">{order.invoice_id}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      <span className="text-xs text-slate-500 font-semibold">{order.customer_name}</span>
                    </div>

                    <h3 className="text-md font-semibold text-slate-800">{order.items}</h3>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Delivery: {order.delivery_date}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Scissors className="w-3.5 h-3.5 text-slate-400" />
                        <span>Trial: {order.trial_date}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between md:justify-end">
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-slate-400">Remaining Bal.</span>
                      <span className={`text-sm font-semibold ${order.remaining_payment > 0 ? "text-rose-600" : "text-emerald-600"}`}>₹{order.remaining_payment}</span>
                    </div>

                    {/* Actions buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGenerateWa(order, "trial")}
                        title="Send WhatsApp Trial Alert"
                        className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100/70 shadow-sm"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Right panel: Detail / Update Action Panel */}
          <div className="space-y-6">
            {selectedOrder ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-slate-200 p-6 rounded-xl shadow-md"
              >
                <div className="flex justify-between items-start pb-4 border-b border-slate-200 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{selectedOrder.customer_name}</h3>
                    <p className="text-xs text-red-600 font-mono mt-0.5">{selectedOrder.invoice_id}</p>
                  </div>
                  <button 
                    onClick={() => {
                      const token = localStorage.getItem("token");
                      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/billing/${selectedOrder.id}/pdf?token=${token}`;
                      window.open(url, "_blank");
                    }}
                    className="p-2 bg-red-50 border border-red-200 text-red-700 rounded hover:bg-red-100/80 shadow-sm"
                    title="Print Invoice PDF"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Items Summary</span>
                    <p className="text-sm font-semibold text-slate-700">{selectedOrder.items}</p>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Update Stitch Status</span>
                    <div className="grid grid-cols-2 gap-2">
                      {["Cutting", "Stitching", "Trial", "Completed", "Delivered"].map((st) => (
                        <button
                          key={st}
                          onClick={() => updateStatus(selectedOrder.id, st)}
                          className={`py-1.5 rounded text-[10px] font-bold uppercase border transition-all duration-150 ${
                            selectedOrder.status === st
                              ? "bg-red-50 text-red-700 border-red-300"
                              : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs shadow-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Price:</span>
                      <span className="font-semibold text-slate-800">₹{selectedOrder.total_price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Advance Payment:</span>
                      <span className="font-semibold text-emerald-600">₹{selectedOrder.advance_payment}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                      <span className="text-slate-700">Remaining Balance:</span>
                      <span className={selectedOrder.remaining_payment > 0 ? "text-rose-600" : "text-emerald-600"}>₹{selectedOrder.remaining_payment}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={() => handleGenerateWa(selectedOrder, "trial")}
                      className="w-full py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/70 text-emerald-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Trial Reminder</span>
                    </button>
                    <button
                      onClick={() => handleGenerateWa(selectedOrder, "delivery")}
                      className="w-full py-2 bg-red-50 border border-red-200 hover:bg-red-100/80 text-red-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Ready for Pickup</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white border border-slate-200 p-8 text-center rounded-xl opacity-70 shadow-sm">
                <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Select an order from the list to update status, print billing, or draft WhatsApp reminders.</p>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Create Order Modal Dialogue */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white border border-slate-200 p-6 rounded-xl shadow-2xl relative"
            >
              <button 
                onClick={() => setCreateModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all duration-150"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShoppingBag className="w-5 h-5 text-red-600" />
                <span>Create Stitching Order (ऑर्डर दर्ज करें)</span>
              </h3>

              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Select Customer
                  </label>
                  <select
                    value={orderCustomerId}
                    onChange={(e) => setOrderCustomerId(e.target.value)}
                    className="w-full custom-input text-sm text-slate-700"
                    required
                  >
                    <option value="">-- Choose Customer --</option>
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
                      value={orderItemType}
                      onChange={(e) => setOrderItemType(e.target.value)}
                      className="w-full custom-input text-sm text-slate-700"
                    >
                      <option value="shirt">Shirt (शर्ट)</option>
                      <option value="pant">Pant (पैंट)</option>
                      <option value="suit">Suit / Blazer (सूट)</option>
                      <option value="kurta">Kurta (कुर्ता)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Stitching Charge
                    </label>
                    <input
                      type="number"
                      value={orderTotalPrice}
                      onChange={(e) => setOrderTotalPrice(e.target.value)}
                      className="w-full custom-input text-sm font-mono text-slate-850"
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Advance Paid
                    </label>
                    <input
                      type="number"
                      value={orderAdvancePayment}
                      onChange={(e) => setOrderAdvancePayment(e.target.value)}
                      className="w-full custom-input text-sm font-mono text-slate-850"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Trial Date
                    </label>
                    <input
                      type="date"
                      value={orderTrialDate}
                      onChange={(e) => setOrderTrialDate(e.target.value)}
                      className="w-full custom-input text-sm font-mono text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    value={orderDeliveryDate}
                    onChange={(e) => setOrderDeliveryDate(e.target.value)}
                    className="w-full custom-input text-sm font-mono text-slate-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Order Remarks / Design Notes
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Mandarin collar, double cuffs, specific fabric pattern..."
                    className="w-full custom-input text-xs h-20 border-slate-200 text-slate-800 bg-slate-50"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="submit" className="btn-crimson flex-1 py-2.5 text-sm shadow-sm">
                    Save Stitch Order
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 shadow-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp Message Composer Modal */}
      <AnimatePresence>
        {waModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white border border-slate-200 p-6 rounded-xl shadow-2xl relative"
            >
              <button 
                onClick={() => setWaModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all duration-150"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <span>Choice Tailors Message Editor</span>
              </h3>
              
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Message Type</label>
                <div className="flex gap-2">
                  {(["trial", "delivery", "payment"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setWaMessageType(type);
                        let text = "";
                        if (type === "trial") {
                          text = `Hello Mr. ${selectedOrder.customer_name}, your trial for ${selectedOrder.items} at Choice Tailors is scheduled for ${selectedOrder.trial_date} at 5:00 PM. Please visit Nr. Nilkanth Lodge, Gandhi Chok, Kadi.`;
                        } else if (type === "delivery") {
                          text = `Hello Mr. ${selectedOrder.customer_name}, your order (${selectedOrder.invoice_id}) is ready for delivery at Choice Tailors! Remaining amount: INR ${selectedOrder.remaining_payment}. Please visit Gandhi Chok, Kadi.`;
                        } else {
                          text = `Hello Mr. ${selectedOrder.customer_name}, reminder from Choice Tailors for pending payment of INR ${selectedOrder.remaining_payment} on your order (${selectedOrder.invoice_id}). Thank you!`;
                        }
                        setWaText(text);
                      }}
                      className={`flex-1 py-1 px-3 rounded text-[10px] font-bold uppercase border transition-all duration-150 ${
                        waMessageType === type
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-white border-slate-200 text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-500 mb-2">Draft Preview</label>
                <textarea
                  value={waText}
                  onChange={(e) => setWaText(e.target.value)}
                  className="w-full custom-input text-xs h-28 border-slate-200 text-slate-800 bg-slate-50"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={handleSendWa} className="btn-crimson flex-1 py-2 text-sm flex items-center justify-center gap-2 shadow-sm">
                  <span>Send WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setWaModalOpen(false)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm transition-all duration-200 shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
