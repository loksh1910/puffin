"use client";

import { useState } from "react";
import { useResponsibilities, type Responsibility } from "@/lib/responsibilities-store";
import { AddResponsibilitySheet } from "@/components/home/add-responsibility-sheet";
import { ResponsibilityDetailSheet } from "@/components/home/responsibility-detail-sheet";
import { dueDateLabel, statusOf } from "@/lib/reminders";
import { startOfDay } from "@/lib/date";
import { formatINR } from "@/lib/format";

const ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// The 3 seeded responsibilities get hand-drawn line icons; anything the user adds
// afterwards falls back to the emoji they picked in AddResponsibilitySheet.
const SEED_ICONS: Record<string, React.ReactNode> = {
  rent: (
    <svg {...ICON_PROPS}>
      <path d="M4 11l8-6.5 8 6.5v8.5a1 1 0 01-1 1h-4.5v-5.5h-5v5.5H5a1 1 0 01-1-1V11z" />
    </svg>
  ),
  emi: (
    <svg {...ICON_PROPS}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4M9.5 16.5l5-4" />
      <circle cx="9.8" cy="12.8" r="0.6" fill="currentColor" />
      <circle cx="14.2" cy="16.2" r="0.6" fill="currentColor" />
    </svg>
  ),
  loan: (
    <svg {...ICON_PROPS}>
      <rect x="2.5" y="6.5" width="19" height="11" rx="2.5" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 9.5v5M18 9.5v5" />
    </svg>
  ),
};

// Money you owe on a schedule — kept separate from people you pay, since these come with due dates.
export function Responsibilities({ onPay }: { onPay: (item: Responsibility) => void }) {
  const { items, add, markPaid } = useResponsibilities();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<Responsibility | null>(null);
  const [today] = useState(() => startOfDay(new Date()));

  const handlePay = (item: Responsibility) => {
    setSelected(null);
    if (item.amount === null) markPaid(item.id);
    else onPay(item);
  };

  return (
    <div className="mx-5 mt-4 rounded-3xl bg-card p-4 shadow-sm shadow-black/5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13.5px] font-semibold text-foreground">Responsibilities</p>
        <span className="text-[12px] font-medium text-primary">Manage</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => {
          const status = statusOf({ dueDate: item.dueDate, completed: item.paid }, today);
          const urgent = status === "expired" || (status === "upcoming" && item.dueDate ? dueDateLabel(item, today).startsWith("Due in") : false);
          const label = item.amount ? `₹${formatINR(item.amount)} · ${dueDateLabel(item, today)}` : dueDateLabel(item, today);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className="flex flex-col items-center gap-1.5 transition-transform active:scale-95"
            >
              <span className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-accent ${SEED_ICONS[item.id] ? "text-primary" : "text-[22px]"}`}>
                {SEED_ICONS[item.id] ?? item.emoji}
                {item.paid && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card bg-success">
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
                {!item.paid && urgent && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-secondary" />}
              </span>
              <span className="text-center text-[11.5px] font-medium leading-tight text-foreground">{item.label}</span>
              <span
                className={`-mt-1 text-center text-[10px] leading-tight ${
                  item.paid ? "text-success" : urgent ? "font-semibold text-secondary" : "text-muted-foreground"
                }`}
              >
                {item.paid ? "Paid ✓" : label}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex flex-col items-center gap-1.5 transition-transform active:scale-95"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-center text-[11.5px] font-medium leading-tight text-foreground">Add</span>
        </button>
      </div>

      <AddResponsibilitySheet open={sheetOpen} onClose={() => setSheetOpen(false)} onAdd={add} />
      <ResponsibilityDetailSheet item={selected} onClose={() => setSelected(null)} onPay={handlePay} />
    </div>
  );
}
