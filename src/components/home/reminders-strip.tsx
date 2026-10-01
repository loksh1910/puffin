"use client";

import { useState } from "react";
import { useReminders } from "@/lib/use-reminders";
import { statusOf, dueDateLabel, sortByUrgency } from "@/lib/reminders";
import { startOfDay } from "@/lib/date";
import { formatINR } from "@/lib/format";

// Collapses away entirely when nothing needs attention — it only exists to interrupt
// you before a payment, not to sit there as permanent chrome.
export function RemindersStrip({ onViewAll }: { onViewAll: () => void }) {
  const [today] = useState(() => startOfDay(new Date()));
  const reminders = useReminders();

  const pending = sortByUrgency(reminders.filter((r) => statusOf(r, today) !== "completed")).slice(0, 3);
  if (!pending.length) return null;

  return (
    <div className="mx-5 mt-3 rounded-3xl bg-card p-4 shadow-sm shadow-black/5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13.5px] font-semibold text-foreground">Reminders</p>
        <button type="button" onClick={onViewAll} className="text-[12px] font-medium text-primary">
          View all
        </button>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {pending.map((r) => {
          const status = statusOf(r, today);
          const expired = status === "expired";
          return (
            <button
              key={r.id}
              type="button"
              onClick={onViewAll}
              className={`flex shrink-0 items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-transform active:scale-95 ${
                expired ? "bg-danger/10" : "bg-accent/70"
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card text-[17px]">{r.emoji}</span>
              <div className="leading-tight">
                <p className="max-w-[110px] truncate text-[12.5px] font-semibold text-foreground">{r.label}</p>
                <p className={`text-[10.5px] font-medium ${expired ? "text-danger" : "text-muted-foreground"}`}>
                  {r.amount ? `₹${formatINR(r.amount)} · ` : ""}
                  {dueDateLabel(r, today)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
