import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Store, BarChart3, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DamshiqueHome() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [hoverIntent, setHoverIntent] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
    const t = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(t);
  }, []);

  const cloudIntensity = hoverIntent ? "40" : "25";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef2f7] text-slate-900">
      {/* Cloud background – shared by loading + home */}
      <div className="absolute inset-0 pointer-events-none">
        {/* White + blue cloud background (always visible) */}
        <div className="absolute -top-48 -left-48 h-[700px] w-[700px] rounded-full bg-white/55 blur-3xl animate-[pulse_9s_ease-in-out_infinite]" />
        <div className="absolute top-1/4 -right-48 h-[600px] w-[600px] rounded-full bg-sky-300/35 blur-3xl animate-[pulse_11s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 left-1/3 h-[800px] w-[800px] rounded-full bg-blue-400/25 blur-3xl animate-[pulse_13s_ease-in-out_infinite]" />
      </div>

      {/* Loading → Home morph */}
      <AnimatePresence>
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 flex min-h-screen items-center justify-center"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex flex-col items-center gap-4"
            >
              <img
                src="/logo.png"
                alt="Damshique Bot logo"
                className="h-16 w-16 rounded-xl shadow-md"
              />
              <div className="text-2xl font-semibold">Damshique Bot</div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6"
          >
            <div className="mb-8 flex flex-col items-center gap-3">
              <img
                src="/logo.png"
                alt="Damshique Bot logo"
                className="h-20 w-20 rounded-2xl shadow-md"
              />
              <h1 className="text-3xl font-semibold">Damshique Bot</h1>
            </div>

            {/* Search */}
            <div className="relative w-full max-w-2xl">
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowResults(e.target.value.length > 0);
                }}
                placeholder="Search for employees, merchants, invoices"
                className="h-14 pr-14 rounded-2xl bg-white/70 text-slate-900 placeholder:text-slate-400 backdrop-blur-md border border-slate-200 shadow-md focus:scale-[1.02] transition"
              />
              <button
                onClick={() => setShowResults(true)}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m1.85-5.65a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" /></svg>
              </button>
            </div>

            {/* AI Search results panel */}
            <AnimatePresence>
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-4 w-full max-w-2xl rounded-2xl bg-white/80 dark:bg-black/70 backdrop-blur-xl p-4 text-sm"
                >
                  <p className="opacity-60">AI Search Results</p>
                  <ul className="mt-2 space-y-2">
                    <li>Employee · Ahmed · Travel expense</li>
                    <li>Merchant · Uber · £120 invoice</li>
                    <li>Report · December spending</li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div
              className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6"
              onMouseEnter={() => setHoverIntent(true)}
              onMouseLeave={() => setHoverIntent(false)}
            >
              <Action icon={<Users />} label="Employees" />
              <Action icon={<Store />} label="Merchants" />
              <Action icon={<BarChart3 />} label="Reports" />
              <Action icon={<Bot />} label="Bot" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Action({ icon, label }) {
  return (
    <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
      <Button className="h-20 w-40 rounded-2xl bg-white/70 text-slate-800 hover:bg-sky-100 shadow-md border border-slate-200 flex flex-col gap-2 transition-all">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </Button>
    </motion.div>
  );
}

