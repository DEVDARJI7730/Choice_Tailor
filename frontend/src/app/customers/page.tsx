"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { 
  Search, 
  UserPlus, 
  Phone, 
  MapPin, 
  Mail, 
  Scissors, 
  Calendar, 
  ShieldAlert, 
  IndianRupee, 
  Plus, 
  Trash2, 
  MessageSquare,
  X,
  CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  // Payments Ledger and active customer detail state
  const [selectedCustomerPayments, setSelectedCustomerPayments] = useState<any[]>([]);
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"stitching" | "ledger">("stitching");
  const [allOrders, setAllOrders] = useState<any[]>([]);
  
  // Payment Modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("UPI");
  const [payOrderId, setPayOrderId] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [customers, setCustomers] = useState<any[]>([
    {
      id: "1",
      name: "Mr. Nilesh Shah",
      phone: "9925256898",
      email: "nilesh@gmail.com",
      address: "Gandhi Chok, Kadi",
      created_at: "2026-06-19",
      history: [
        { date: "2026-06-19", item: "3pcs Wedding Suit", status: "Delivered" },
        { date: "2026-07-15", item: "2 Shirts", status: "Stitching" }
      ]
    },
    {
      id: "2",
      name: "Mr. Rajesh Patel",
      phone: "9998170809",
      email: "rajesh@gmail.com",
      address: "Station Road, Kadi",
      created_at: "2026-06-29",
      history: [
        { date: "2026-06-29", item: "1 Kurta & Pajama", status: "Delivered" }
      ]
    },
    {
      id: "3",
      name: "Mr. Amit Mehta",
      phone: "9876543210",
      email: "amit.mehta@yahoo.com",
      address: "Nilkanth Lodge, Kadi",
      created_at: "2026-07-09",
      history: [
        { date: "2026-07-09", item: "1 Designer Sherwani", status: "Trial Scheduled" }
      ]
    },
    {
      id: "4",
      name: "Mr. Dinesh Kumar",
      phone: "9898989898",
      email: "dinesh@gmail.com",
      address: "Gandhi Chok, Kadi",
      created_at: "2026-07-19",
      history: []
    }
  ]);

  // Load customers from backend on mount
  useEffect(() => {
    setMounted(true);
    fetchCustomers();
    fetchAllOrders();
  }, []);

  const fetchCustomers = async () => {
    const localToken = localStorage.getItem("token");
    if (!localToken) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/customers`, {
        headers: { Authorization: `Bearer ${localToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.warn("Backend API not reachable. Using mock customer list.");
    }
  };

  const fetchAllOrders = async () => {
    const localToken = localStorage.getItem("token");
    if (!localToken) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/orders`, {
        headers: { Authorization: `Bearer ${localToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllOrders(data);
      }
    } catch (err) {
      console.warn("Backend API not reachable. Using fallback order counts.");
    }
  };

  // Fetch payments and orders whenever selected customer changes
  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerFinanceData(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  const fetchCustomerFinanceData = async (custId: string) => {
    const localToken = localStorage.getItem("token");
    if (!localToken) {
      // Fallback mock calculations if backend is not running
      const mockOrders = selectedCustomer.id === "1" ? [
        { id: "o1", invoice_id: "INV-1092F3", items: [{ item_type: "suit" }], total_price: 12500, advance_payment: 5000, remaining_payment: 7500, created_at: "2026-07-15T10:00:00" },
        { id: "o2", invoice_id: "INV-99999", items: [{ item_type: "shirt" }], total_price: 1500, advance_payment: 1500, remaining_payment: 0, created_at: "2026-06-19T11:00:00" }
      ] : selectedCustomer.id === "2" ? [
        { id: "o3", invoice_id: "INV-290A81", items: [{ item_type: "shirt" }, { item_type: "pant" }], total_price: 2800, advance_payment: 1000, remaining_payment: 1800, created_at: "2026-06-29T12:00:00" }
      ] : selectedCustomer.id === "3" ? [
        { id: "o4", invoice_id: "INV-7801CD", items: [{ item_type: "kurta" }], total_price: 3500, advance_payment: 3500, remaining_payment: 0, created_at: "2026-07-09T09:00:00" }
      ] : [];

      const mockPayments = selectedCustomer.id === "1" ? [
        { id: "p1", customer_id: custId, amount: 5000, payment_mode: "UPI", order_id: "o1", notes: "Advance payment", payment_date: "2026-07-15T10:10:00", created_at: "2026-07-15T10:10:00" },
        { id: "p2", customer_id: custId, amount: 1500, payment_mode: "Cash", order_id: "o2", notes: "Full payment", payment_date: "2026-06-19T11:15:00", created_at: "2026-06-19T11:15:00" }
      ] : selectedCustomer.id === "2" ? [
        { id: "p3", customer_id: custId, amount: 1000, payment_mode: "Cash", order_id: "o3", notes: "Advance payment", payment_date: "2026-06-29T12:15:00", created_at: "2026-06-29T12:15:00" }
      ] : selectedCustomer.id === "3" ? [
        { id: "p4", customer_id: custId, amount: 2000, payment_mode: "UPI", order_id: "o4", notes: "Advance payment", payment_date: "2026-07-09T09:10:00", created_at: "2026-07-09T09:10:00" },
        { id: "p5", customer_id: custId, amount: 1500, payment_mode: "Cash", order_id: "o4", notes: "Balance cleared at trial", payment_date: "2026-07-19T17:00:00", created_at: "2026-07-19T17:00:00" }
      ] : [];

      setSelectedCustomerOrders(mockOrders);
      setSelectedCustomerPayments(mockPayments);
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${localToken}` };
      
      // Fetch orders
      const ordersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/orders?customer_id=${custId}`, { headers });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setSelectedCustomerOrders(ordersData);
      }

      // Fetch payments
      const paymentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/payments/customer/${custId}`, { headers });
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setSelectedCustomerPayments(paymentsData);
      }
    } catch (err) {
      console.warn("Failed to retrieve financial ledger from API. Using local fallback.");
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const localToken = localStorage.getItem("token");
    if (localToken) {
      try {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("phone", phone);
        if (email) formData.append("email", email);
        if (address) formData.append("address", address);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/customers`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localToken}`
          },
          body: formData
        });

        if (res.ok) {
          const newCust = await res.json();
          setCustomers([newCust, ...customers]);
          setName("");
          setPhone("");
          setEmail("");
          setAddress("");
          setShowAddForm(false);
          fetchAllOrders();
          return;
        }
      } catch (err) {
        console.warn("Failed to save to backend. Falling back to memory state.");
      }
    }

    const newCustomer = {
      id: (customers.length + 1).toString(),
      name,
      phone,
      email: email || "N/A",
      address: address || "Kadi",
      created_at: new Date().toISOString().slice(0, 10),
      history: []
    };

    setCustomers([newCustomer, ...customers]);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setShowAddForm(false);
  };

  const handleDeleteCustomer = async (custId: string) => {
    if (!confirm("Are you sure you want to delete this customer profile? This will permanentely remove their account and billing history.")) return;
    
    const localToken = localStorage.getItem("token");
    if (localToken && !custId.startsWith("mock-") && custId.length > 2) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/customers/${custId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localToken}` }
        });
        if (res.ok) {
          alert("Customer deleted successfully!");
          setSelectedCustomer(null);
          fetchCustomers();
          fetchAllOrders();
          return;
        }
      } catch (err) {
        console.error("Failed to delete customer from backend:", err);
      }
    }
    
    // Fallback/Local delete
    setCustomers(customers.filter(c => c.id !== custId));
    setSelectedCustomer(null);
    alert("Removed customer profile from local memory.");
  };

  const handleReceivePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || !selectedCustomer) return;

    const localToken = localStorage.getItem("token");
    const amountVal = parseFloat(payAmount);

    if (localToken) {
      try {
        const payload = {
          customer_id: selectedCustomer.id,
          amount: amountVal,
          payment_mode: payMode,
          order_id: payOrderId || null,
          notes: payNotes || null,
          payment_date: payDate ? `${payDate}T${new Date().toISOString().slice(11, 19)}` : null
        };

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/payments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localToken}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          // Reset states and re-fetch financial data
          setPayAmount("");
          setPayNotes("");
          setPayOrderId("");
          setPaymentModalOpen(false);
          fetchCustomerFinanceData(selectedCustomer.id);
          return;
        }
      } catch (err) {
        console.error("Error receiving payment:", err);
      }
    }

    // Offline manual fallback logic
    const mockPayId = `PAY-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPayment = {
      id: mockPayId,
      customer_id: selectedCustomer.id,
      amount: amountVal,
      payment_mode: payMode,
      order_id: payOrderId || null,
      notes: payNotes || "Received Payment",
      payment_date: payDate + "T12:00:00",
      created_at: new Date().toISOString()
    };

    setSelectedCustomerPayments([newPayment, ...selectedCustomerPayments]);

    // Update the corresponding order balance in memory
    if (payOrderId) {
      setSelectedCustomerOrders(
        selectedCustomerOrders.map((o) => {
          if (o.id === payOrderId) {
            const newAdvance = o.advance_payment + amountVal;
            return {
              ...o,
              advance_payment: newAdvance,
              remaining_payment: Math.max(0, o.total_price - newAdvance)
            };
          }
          return o;
        })
      );
    }

    setPayAmount("");
    setPayNotes("");
    setPayOrderId("");
    setPaymentModalOpen(false);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Are you sure you want to void this payment? This will restore the dues on the linked order.")) return;

    const localToken = localStorage.getItem("token");
    if (localToken) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/payments/${paymentId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localToken}` }
        });
        if (res.ok) {
          fetchCustomerFinanceData(selectedCustomer.id);
          return;
        }
      } catch (err) {
        console.error("Error voiding payment:", err);
      }
    }

    // Offline voiding logic
    const payToDelete = selectedCustomerPayments.find(p => p.id === paymentId);
    if (payToDelete) {
      setSelectedCustomerPayments(selectedCustomerPayments.filter(p => p.id !== paymentId));
      if (payToDelete.order_id) {
        setSelectedCustomerOrders(
          selectedCustomerOrders.map((o) => {
            if (o.id === payToDelete.order_id) {
              const newAdvance = Math.max(0, o.advance_payment - payToDelete.amount);
              return {
                ...o,
                advance_payment: newAdvance,
                remaining_payment: o.total_price - newAdvance
              };
            }
            return o;
          })
        );
      }
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  // Compute financial totals for selected customer
  const totalBilled = selectedCustomerOrders.reduce((sum, o) => sum + o.total_price, 0);
  const totalPaid = selectedCustomerOrders.reduce((sum, o) => sum + o.advance_payment, 0);
  const outstandingBalance = selectedCustomerOrders.reduce((sum, o) => sum + o.remaining_payment, 0);

  // Build combined chronological ledger
  const ledgerEntries: any[] = [];
  selectedCustomerOrders.forEach((o) => {
    ledgerEntries.push({
      date: o.created_at ? o.created_at.slice(0, 10) : "",
      rawDate: o.created_at || "",
      type: "charge",
      description: `Order Stitching Bill (${o.invoice_id})`,
      amount: o.total_price,
      badge: o.status,
      badgeColor: o.status === "Delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
    });
  });

  selectedCustomerPayments.forEach((p) => {
    ledgerEntries.push({
      id: p.id,
      date: p.payment_date ? p.payment_date.slice(0, 10) : "",
      rawDate: p.payment_date || "",
      type: "payment",
      description: `Payment Received (${p.payment_mode}) ${p.notes ? `- ${p.notes}` : ''}`,
      amount: p.amount,
      badge: "Paid",
      badgeColor: "bg-emerald-50 text-emerald-700 border border-emerald-200"
    });
  });

  // Sort chronological ledger by date descending
  ledgerEntries.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  // Generate WhatsApp Dues Reminder Link
  const handleSendReminder = () => {
    if (!selectedCustomer || outstandingBalance <= 0) return;
    const cleanPhone = selectedCustomer.phone.replace("+", "").replace(" ", "");
    const finalPhone = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone;
    
    const text = `नमस्ते Mr. ${selectedCustomer.name}, चॉइस टेलर्स (Choice Tailors, Kadi) से आपका कुल बकाया (Outstanding Balance) ₹${outstandingBalance} है। कृपया जल्द से जल्द UPI (GPay/PhonePe) या नकद (Cash) द्वारा भुगतान करें। धन्यवाद!`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${finalPhone}?text=${encoded}`, "_blank");
  };

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
              Customer & Khata Registry
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Search clients, track custom tailoring measurements, and manage payment ledgers (खाता बही).
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="btn-crimson px-4 py-2.5 flex items-center gap-2 text-sm shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Search by customer name or mobile phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full custom-input pl-10 py-3 text-sm shadow-sm"
          />
        </div>

        {/* Dashboard split content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left panel: Customers List */}
          <div className="lg:col-span-5 space-y-4">
            {filteredCustomers.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 p-8 text-center rounded-xl">
                <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="text-slate-500 text-sm">No customers matching search criteria.</p>
              </div>
            ) : (
              filteredCustomers.map((cust) => (
                <motion.div
                  key={cust.id}
                  layoutId={`cust-card-${cust.id}`}
                  onClick={() => setSelectedCustomer(cust)}
                  className={`bg-white p-5 rounded-xl border transition-all duration-200 cursor-pointer flex justify-between items-center shadow-sm ${
                    selectedCustomer?.id === cust.id
                      ? "border-red-600 bg-red-50/50 shadow-md"
                      : "border-slate-200 hover:border-red-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-lg">
                      {cust.name[0] || 'C'}
                    </div>
                    <div>
                      <h3 className="text-md font-semibold text-slate-800">{cust.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cust.phone}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cust.address || "Kadi"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {(() => {
                      let count = allOrders.filter(o => o.customer_id === cust.id).length;
                      if (allOrders.length === 0) {
                        // Fallback to offline mock counts
                        count = cust.phone === "9925256898" ? 2 : cust.phone === "9998170809" ? 1 : 0;
                      }
                      return `${count} ${count === 1 ? "Order" : "Orders"}`;
                    })()}
                  </span>
                </motion.div>
              ))
            )}
          </div>

          {/* Right panel: Details View / Add Form */}
          <div className="lg:col-span-7 space-y-6">
            <AnimatePresence mode="wait">
              {showAddForm ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="bg-white border border-slate-200 p-6 rounded-xl shadow-md relative"
                >
                  <h3 className="text-lg font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3">New Customer Profile</h3>
                  <form onSubmit={handleAddCustomer} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mr. Nilesh Shah"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full custom-input text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9925256898"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full custom-input text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. nilesh@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full custom-input text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                        Shop / Home Address
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Gandhi Chok, Kadi"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full custom-input text-sm"
                      />
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-slate-100">
                      <button type="submit" className="btn-crimson flex-1 py-2.5 text-sm shadow-sm">
                        Save Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm transition-all duration-200 shadow-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : selectedCustomer ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border border-slate-200 p-6 rounded-xl shadow-md"
                >
                  {/* Top Header Card */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-5 border-b border-slate-200 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center font-bold text-white text-2xl shadow-sm">
                        {selectedCustomer.name[0] || 'C'}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">{selectedCustomer.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Registered since {selectedCustomer.created_at ? selectedCustomer.created_at.slice(0,10) : "N/A"}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setPaymentModalOpen(true)}
                        className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200 text-xs px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all duration-200 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Receive Payment</span>
                      </button>
                      <button
                        onClick={handleSendReminder}
                        disabled={outstandingBalance <= 0}
                        className={`text-xs px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all duration-200 border shadow-sm ${
                          outstandingBalance > 0
                            ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100/80 cursor-pointer"
                            : "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Remind Dues</span>
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                        className="bg-rose-50 text-rose-700 hover:bg-rose-100/85 border border-rose-200 text-xs px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all duration-200 shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm border-b border-slate-200">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{selectedCustomer.email || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 flex-1">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{selectedCustomer.address || "Kadi"}</span>
                    </div>
                  </div>

                  {/* Financial Metrics Cards */}
                  <div className="grid grid-cols-3 gap-4 py-6 border-b border-slate-200">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center shadow-sm">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Billed</p>
                      <p className="text-lg font-bold text-slate-800 font-mono mt-1">₹{totalBilled}</p>
                    </div>
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg text-center shadow-sm">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Total Paid</p>
                      <p className="text-lg font-bold text-emerald-700 font-mono mt-1">₹{totalPaid}</p>
                    </div>
                    <div className={`p-3 rounded-lg text-center border shadow-sm ${
                      outstandingBalance > 0 
                        ? "bg-rose-50 border-rose-200" 
                        : "bg-slate-50 border-slate-200"
                    }`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${outstandingBalance > 0 ? "text-rose-600" : "text-slate-500"}`}>Outstanding</p>
                      <p className={`text-lg font-bold font-mono mt-1 ${outstandingBalance > 0 ? "text-rose-600" : "text-slate-600"}`}>₹{outstandingBalance}</p>
                    </div>
                  </div>

                  {/* Tab Selector */}
                  <div className="flex gap-2 p-1 bg-slate-100 border border-slate-200 rounded-lg my-5">
                    <button
                      onClick={() => setActiveTab("stitching")}
                      className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded transition-all duration-200 ${
                        activeTab === "stitching"
                          ? "bg-white text-red-700 shadow-sm border border-slate-200/50"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Stitching History
                    </button>
                    <button
                      onClick={() => setActiveTab("ledger")}
                      className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded transition-all duration-200 ${
                        activeTab === "ledger"
                          ? "bg-white text-red-700 shadow-sm border border-slate-200/50"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Payment Ledger (Khata)
                    </button>
                  </div>

                  {/* Tabs content rendering */}
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {activeTab === "stitching" ? (
                      selectedCustomerOrders.length === 0 ? (
                        <p className="text-xs text-slate-500 italic text-center py-4">No stitching orders logged yet.</p>
                      ) : (
                        selectedCustomerOrders.map((o: any, idx: number) => (
                          <div key={o.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center hover:border-red-200 transition-all duration-150 shadow-sm">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-red-600 font-mono">{o.invoice_id}</span>
                                <span className="text-xs font-semibold text-slate-700 capitalize">
                                  {o.items.map((i: any) => i.item_type).join(", ")}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                                <Calendar className="w-3 h-3" />
                                <span>Due: {o.delivery_date}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span>Bill: ₹{o.total_price}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-[10px] text-slate-400">Dues</p>
                                <p className={`text-xs font-semibold ${o.remaining_payment > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                  ₹{o.remaining_payment}
                                </p>
                              </div>
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                                o.status === "Delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                              }`}>
                                {o.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )
                    ) : (
                      ledgerEntries.length === 0 ? (
                        <p className="text-xs text-slate-500 italic text-center py-4">No billing or payments recorded.</p>
                      ) : (
                        ledgerEntries.map((entry: any, idx: number) => (
                          <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center hover:border-red-200 transition-all duration-150 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg flex items-center justify-center ${
                                entry.type === "charge" 
                                  ? "bg-rose-50 text-rose-600 border border-rose-200" 
                                  : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              }`}>
                                <IndianRupee className="w-3.5 h-3.5" />
                              </div>
                              
                              <div>
                                <p className="text-xs font-semibold text-slate-700">{entry.description}</p>
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-500 mt-0.5">
                                  <Calendar className="w-3 h-3" />
                                  <span>{entry.date}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className={`text-xs font-mono font-bold ${
                                  entry.type === "charge" ? "text-rose-600" : "text-emerald-600"
                                }`}>
                                  {entry.type === "charge" ? "+" : "-"}₹{entry.amount}
                                </span>
                              </div>
                              
                              {entry.type === "payment" ? (
                                <button
                                  onClick={() => handleDeletePayment(entry.id)}
                                  className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-all duration-150"
                                  title="Void Transaction"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="w-5" />
                              )}
                            </div>
                          </div>
                        ))
                      )
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="bg-white border border-slate-200 p-8 text-center rounded-xl opacity-70 shadow-sm">
                  <Scissors className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Select a customer from the registry to view details, measurements, and payment ledger.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Receive Payment Modal Dialog */}
      <AnimatePresence>
        {paymentModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white border border-slate-200 p-6 rounded-xl shadow-2xl relative"
            >
              <button 
                onClick={() => setPaymentModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all duration-150"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                <CreditCard className="w-5 h-5 text-red-600" />
                <span>Receive Payment (भुगतान प्राप्त करें)</span>
              </h3>

              <form onSubmit={handleReceivePayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Customer</label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedCustomer.name} (${selectedCustomer.phone})`}
                    className="w-full custom-input text-xs bg-slate-50 text-slate-500 border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Amount (INR)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold font-mono">₹</span>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 2500"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className="w-full custom-input pl-7 text-sm font-mono text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Payment Mode
                    </label>
                    <select
                      value={payMode}
                      onChange={(e) => setPayMode(e.target.value)}
                      className="w-full custom-input text-sm text-slate-700"
                    >
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Cash">Cash (नकद)</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Link to Order (Optional)</label>
                  <select
                    value={payOrderId}
                    onChange={(e) => setPayOrderId(e.target.value)}
                    className="w-full custom-input text-xs text-slate-700"
                  >
                    <option value="">No specific order / General Account</option>
                    {selectedCustomerOrders
                      .filter((o) => o.remaining_payment > 0)
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.invoice_id} ({o.items.map((i: any) => i.item_type.toUpperCase()).join(", ")}) - ₹{o.remaining_payment} due
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Payment Date</label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full custom-input text-sm font-mono text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Remarks / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Received final settlement, Part advance payment"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    className="w-full custom-input text-xs text-slate-700"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="submit" className="btn-crimson flex-1 py-2.5 text-sm shadow-sm">
                    Record Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPayAmount("");
                      setPayNotes("");
                      setPayOrderId("");
                      setPaymentModalOpen(false);
                    }}
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
    </div>
  );
}
