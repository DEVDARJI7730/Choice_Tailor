"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Scissors, LayoutDashboard, Users, Ruler, ShoppingBag, CreditCard, LogOut, Phone } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Measurements", href: "/measurements", icon: Ruler },
    { name: "Stitch Orders", href: "/orders", icon: ShoppingBag },
    { name: "Billing & GST", href: "/billing", icon: CreditCard },
  ];

  if (!mounted) {
    return <aside className="w-64 bg-slate-50 border-r border-slate-200 h-screen sticky top-0" />;
  }

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Brand */}
        <div className="p-6 border-b border-slate-200">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center border border-red-700 shadow-sm shadow-red-200">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-md font-bold tracking-tight text-slate-800">
                Choice Tailors
              </h2>
              <span className="text-[10px] text-slate-500 tracking-wider uppercase block">
                Gents Only Specialist
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-red-50 border-l-4 border-red-600 text-red-700"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-red-600" : "text-slate-500"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Info & Logout */}
      <div className="p-4 border-t border-slate-200 space-y-3">
        <div className="p-3 bg-slate-100/75 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold mb-1">
            <Phone className="w-3.5 h-3.5 text-red-600" />
            <span>Customer Helpline</span>
          </div>
          <p className="text-xs text-slate-600 font-bold font-mono">9925256898</p>
        </div>
        
        <button
          onClick={() => {
            localStorage.removeItem("token");
            router.push("/");
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Portal</span>
        </button>
      </div>
    </aside>
  );
}
