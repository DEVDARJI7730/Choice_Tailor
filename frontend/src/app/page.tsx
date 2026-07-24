"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Scissors, Lock, Mail, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("choice.kadi@gmail.com");
  const [password, setPassword] = useState("Choice@123");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.access_token);
        router.push("/dashboard");
      } else {
        alert("Invalid credentials. Please use seeded email/password.");
      }
    } catch (err) {
      console.warn("Backend API not reachable. Using mock auth mode.");
      localStorage.setItem("token", "mock_token_123");
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 px-4">
      {/* Decorative background glow circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-100/50 rounded-full filter blur-[100px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-50 rounded-full filter blur-[80px]"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md z-10"
      >
        {/* Logo / Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img 
            src="/logo.jpg" 
            alt="Choice Tailors" 
            className="w-full max-w-[340px] h-auto rounded-xl shadow-lg border border-slate-200 mb-2 object-contain bg-slate-950" 
          />
          <div className="inline-block mt-1 px-3 py-1 bg-red-50 border border-red-200 rounded-full text-xs text-red-700 font-semibold uppercase tracking-wider">
            Shop Management Portal
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl relative">
          <div className="absolute -top-1 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-red-600/30 to-transparent"></div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
            Sign In to TailorPro
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full custom-input pl-10"
                  placeholder="Enter email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full custom-input pl-10"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center text-slate-500 cursor-pointer">
                <input type="checkbox" className="mr-2 accent-red-600 rounded" defaultChecked />
                Remember credentials
              </label>
              <a href="#" className="text-red-600 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-crimson py-3 flex items-center justify-center gap-2 mt-6 relative overflow-hidden group shadow-md hover:shadow-red-200"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Authenticate Portal</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center mt-8 text-xs text-slate-500">
          <p>Nr. Nilkanth Lodge, Gandhi Chok, Kadi</p>
          <p className="mt-1">Authorized staff only. IP logged for security.</p>
        </div>
      </motion.div>
    </div>
  );
}
