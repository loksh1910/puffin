"use client";

import { useState } from "react";
import { Sheet } from "@/components/sheet";
import { Avatar } from "@/components/avatar";
import { formatINR } from "@/lib/format";
import { dueDateLabel } from "@/lib/reminders";
import { startOfDay } from "@/lib/date";
import type { Responsibility } from "@/lib/responsibilities-store";

function DetailBody({ item, onPay }: { item: Responsibility; onPay: (item: Responsibility) => void }) {
  const [today] = useState(() => startOfDay(new Date()));

  return (
    <div className="px-5 pb-8 pt-3">
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-[26px]">{item.emoji}</span>
        <div className="leading-tight">
          <p className="text-[17px] font-bold text-foreground">{item.label}</p>
          <p className="text-[12px] text-muted-foreground">{item.frequency === "monthly" ? "Repeats every month" : "One-time"}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-3xl bg-muted/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-muted-foreground">Due date</span>
          <span className="text-[13.5px] font-semibold text-foreground">{dueDateLabel(item, today)}</span>
        </div>
        <div className="h-px bg-border/60" />
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-muted-foreground">Pay to</span>
          <div className="flex items-center gap-2">
            <Avatar person={item.payee} size={26} />
            <span className="text-[13.5px] font-semibold text-foreground">{item.payee.name}</span>
          </div>
        </div>
        <div className="h-px bg-border/60" />
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-muted-foreground">Amount</span>
          <span className="text-[17px] font-extrabold tabular-nums text-foreground">{item.amount ? `₹${formatINR(item.amount)}` : "Not set"}</span>
        </div>
      </div>

      <button
        type="button"
        disabled={item.paid}
        onClick={() => onPay(item)}
        className="mt-5 w-full rounded-full bg-gradient-to-r from-primary to-secondary py-4 text-[14.5px] font-semibold text-white shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
      >
        {item.paid ? "Already paid ✓" : item.amount ? `Pay ₹${formatINR(item.amount)}` : "Mark as paid"}
      </button>
    </div>
  );
}

export function ResponsibilityDetailSheet({
  item,
  onClose,
  onPay,
}: {
  item: Responsibility | null;
  onClose: () => void;
  onPay: (item: Responsibility) => void;
}) {
  return (
    <Sheet open={!!item} onClose={onClose}>
      {item && <DetailBody item={item} onPay={onPay} />}
    </Sheet>
  );
}
