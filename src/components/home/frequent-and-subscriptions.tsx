"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/toast";
import { formatINR } from "@/lib/format";
import { startOfDay } from "@/lib/date";
import { dueDateLabel, statusOf } from "@/lib/reminders";
import { useSubscriptions } from "@/lib/subscriptions-store";

type Tab = "frequent" | "subscriptions";

const FREQUENT = [
  { emoji: "☕", name: "Chai Tapri", meta: "14× this month", amount: 20, bg: "#fff1d6" },
  { emoji: "🥛", name: "Ramesh Dairy", meta: "Every morning", amount: 60, bg: "#e8f4ff" },
  { emoji: "🛺", name: "Auto Bhaiya", meta: "9× this month", amount: 80, bg: "#e9f9ee" },
];

const TABS: { id: Tab; label: string }[] = [
  { id: "frequent", label: "Frequently paid" },
  { id: "subscriptions", label: "Subscriptions" },
];

export function FrequentAndSubscriptions() {
  const [tab, setTab] = useState<Tab>("frequent");
  const toast = useToast();
  const [today] = useState(() => startOfDay(new Date()));
  const { items: subscriptions } = useSubscriptions();
  const subTotal = subscriptions.filter((s) => s.frequency === "monthly").reduce((sum, s) => sum + s.amount, 0);

  const rows =
    tab === "frequent"
      ? FREQUENT.map((f) => ({ id: f.name, emoji: f.emoji, name: f.name, meta: f.meta, amount: f.amount, bg: f.bg, soon: false, suffix: "" }))
      : subscriptions.map((s) => {
          const status = statusOf({ dueDate: s.dueDate, completed: s.autopay ? false : s.paid, autopay: s.autopay }, today);
          const meta = status === "completed" ? "Renewed ✓" : dueDateLabel(s, today).replace(/^Due/, "Renews");
          const soon = status === "upcoming" && s.dueDate.getTime() - today.getTime() <= 5 * 86400000;
          return { id: s.id, emoji: s.emoji, name: s.label, meta, amount: s.amount, bg: s.bg, soon, suffix: s.frequency === "yearly" ? "/yr" : "/mo" };
        });

  return (
    <div className="mx-5 mt-4 rounded-3xl bg-card p-4 shadow-sm shadow-black/5">
      <div className="flex rounded-full bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative flex-1 rounded-full py-2 text-[12.5px] font-semibold transition-colors ${
              tab === t.id ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {tab === t.id && (
              <motion.span
                layoutId="home-tab-pill"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-full bg-card shadow-sm"
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: tab === "frequent" ? -12 : 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: tab === "frequent" ? 12 : -12 }}
          transition={{ duration: 0.18 }}
          className="mt-3 flex flex-col"
        >
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-3 py-2">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[18px]"
                style={{ background: row.bg }}
              >
                {row.emoji}
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[13px] font-semibold text-foreground">{row.name}</p>
                <p className={`text-[11px] ${row.soon ? "font-semibold text-secondary" : "text-muted-foreground"}`}>{row.meta}</p>
              </div>
              {tab === "frequent" ? (
                <button
                  type="button"
                  onClick={() => toast("Coming soon ✨")}
                  className="rounded-full bg-accent px-3 py-1.5 text-[12px] font-semibold text-primary transition-transform active:scale-95"
                >
                  Pay ₹{formatINR(row.amount)}
                </button>
              ) : (
                <span className="text-right text-[13px] font-semibold text-foreground">
                  ₹{formatINR(row.amount)}
                  <span className="text-[10.5px] font-medium text-muted-foreground">{row.suffix}</span>
                </span>
              )}
            </div>
          ))}

          {tab === "subscriptions" && (
            <div className="mt-1 flex items-center justify-between rounded-2xl bg-muted px-3 py-2.5">
              <span className="text-[12px] text-muted-foreground">You spend on subscriptions</span>
              <span className="text-[13px] font-bold text-foreground">₹{formatINR(subTotal)}/mo</span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
