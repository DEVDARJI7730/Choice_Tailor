"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Users, ShoppingBag, Truck, IndianRupee, Sparkles, TrendingUp, ChevronRight, PlusCircle, Printer } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    customers_count: 32,
    active_orders_count: 8,
    completed_orders_count: 24,
    todays_deliveries: 2,
    total_revenue: 48900.0,
    pending_collection: 12400.0,
  });

  const [aiWorkload, setAiWorkload] = useState({
    active_orders_count: 8,
    workload_status: "Normal",
    recommended_buffer_days: 0,
    prediction_insights: "Workload is nominal. Orders are on schedule.",
  });
  const [mounted, setMounted] = useState(false);

  // Mock list of today's deliveries
  const [todaysDeliveries, setTodaysDeliveries] = useState([
    { id: "1", customer: "Mr. Amit Mehta", items: "1 Kurta", status: "Trial Scheduled" },
    { id: "2", customer: "Mr. Harish Patel", items: "1 Suit (Wedding)", status: "Pending Pickup" },
  ]);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchDashboardData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch summary stats
        const summaryRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/reports/summary`, { headers });
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setStats(summaryData);
        }

        // Fetch workload predict
        const workloadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/ai/predict-delivery`, { headers });
        if (workloadRes.ok) {
          const workloadData = await workloadRes.json();
          setAiWorkload(workloadData);
        }
      } catch (err) {
        console.warn("Failed to load live data from backend server. Using mock data fallbacks.");
      }
    };

    fetchDashboardData();
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 font-sans tracking-tight">
              Choice Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Welcome back, Admin. Real-time updates for Nr. Nilkanth Lodge shop.
            </p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => router.push("/orders")}
              className="btn-crimson px-4 py-2.5 flex items-center gap-2 text-sm shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Order</span>
            </button>
            <button 
              onClick={() => {
                const token = localStorage.getItem("token");
                window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/reports/sales/excel?token=${token}`, "_blank");
              }}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm transition-all duration-200 shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* AI Workload Warning Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-xl bg-white border border-slate-200 border-l-4 border-l-red-600 flex items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50 text-red-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-red-600 font-bold uppercase tracking-wider">Choice AI Delivery Assistant</p>
              <p className="text-sm text-slate-600 mt-0.5">{aiWorkload.prediction_insights}</p>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs text-slate-400">Current Queue Capacity</span>
            <span className="text-sm font-semibold text-slate-700">{aiWorkload.active_orders_count} {aiWorkload.active_orders_count === 1 ? "order" : "orders"} active</span>
          </div>
        </motion.div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {[
            { title: "Total Customers", value: stats.customers_count, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { title: "Active Stitch Orders", value: stats.active_orders_count, icon: ShoppingBag, color: "text-amber-600", bg: "bg-amber-50" },
            { title: "Today's Deliveries", value: stats.todays_deliveries, icon: Truck, color: "text-emerald-600", bg: "bg-emerald-50" }
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white border border-slate-200 p-6 rounded-xl relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
                  <div className={`p-2.5 rounded-lg ${card.bg} ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-800 font-mono">{card.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 gap-8">
          
          {/* Custom SVG Line Chart */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Revenue Analytics</h3>
                <p className="text-xs text-slate-400">Choice Tailors monthly revenue progression</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12.4%</span>
              </div>
            </div>

            {/* Custom Responsive SVG Chart */}
            <div className="h-64 w-full relative">
              <svg className="w-full h-full" viewBox="0 0 600 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Horizontal grid lines */}
                <line x1="40" y1="40" x2="580" y2="40" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="40" y1="100" x2="580" y2="100" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="40" y1="160" x2="580" y2="160" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="40" y1="220" x2="580" y2="220" stroke="#cbd5e1" />

                {/* X Axis Labels */}
                <text x="40" y="235" fill="#64748b" fontSize="10" textAnchor="middle">Jan</text>
                <text x="130" y="235" fill="#64748b" fontSize="10" textAnchor="middle">Feb</text>
                <text x="220" y="235" fill="#64748b" fontSize="10" textAnchor="middle">Mar</text>
                <text x="310" y="235" fill="#64748b" fontSize="10" textAnchor="middle">Apr</text>
                <text x="400" y="235" fill="#64748b" fontSize="10" textAnchor="middle">May</text>
                <text x="490" y="235" fill="#64748b" fontSize="10" textAnchor="middle">Jun</text>
                <text x="580" y="235" fill="#64748b" fontSize="10" textAnchor="middle">Jul</text>

                {/* Line Path */}
                <path
                  d="M 40 200 L 130 180 L 220 140 L 310 190 L 400 130 L 490 80 L 580 90"
                  stroke="url(#chart-grad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Chart Area Fill Gradient */}
                <path
                  d="M 40 200 L 130 180 L 220 140 L 310 190 L 400 130 L 490 80 L 580 90 L 580 220 L 40 220 Z"
                  fill="url(#chart-fill-grad)"
                />

                {/* Data Points Glow */}
                <circle cx="490" cy="80" r="5" fill="#a82c2c" />
                <circle cx="490" cy="80" r="10" stroke="#a82c2c" strokeWidth="2" strokeOpacity="0.2" />

                {/* Defs for gradients */}
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#a82c2c" />
                    <stop offset="100%" stopColor="#aa7c11" />
                  </linearGradient>
                  <linearGradient id="chart-fill-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a82c2c" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#a82c2c" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
