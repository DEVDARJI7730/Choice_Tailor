"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Scissors, LayoutDashboard, Users, Ruler, ShoppingBag, CreditCard, LogOut, Phone, Menu, X } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close sidebar on navigation change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Measurements", href: "/measurements", icon: Ruler },
    { name: "Stitch Orders", href: "/orders", icon: ShoppingBag },
    { name: "Billing & GST", href: "/billing", icon: CreditCard },
  ];

  if (!mounted) {
    return <aside className="hidden md:flex w-64 bg-slate-50 border-r border-slate-200 h-screen sticky top-0" />;
  }

  return (
    <>
      {/* Mobile Floating Menu Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed bottom-6 right-6 z-40 w-12 h-12 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 focus:outline-none"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay / Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-50 border-r border-slate-200 flex flex-col justify-between h-screen transition-transform duration-300 ease-in-out md:translate-x-0 md:relative md:flex md:sticky md:top-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand & Close button */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
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

            {/* Mobile Close Icon Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
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
    </>
  );
}
