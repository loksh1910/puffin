"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { StatusBar } from "@/components/status-bar";
import { FilterDropdown } from "@/components/filter-dropdown";
import { ResponsibilityDetailSheet } from "@/components/home/responsibility-detail-sheet";
import { SubscriptionDetailSheet } from "@/components/home/subscription-detail-sheet";
import { useReminders } from "@/lib/use-reminders";
import { useResponsibilities, type Responsibility } from "@/lib/responsibilities-store";
import { useSubscriptions, type Subscription } from "@/lib/subscriptions-store";
import { statusOf, dueDateLabel, sortByUrgency } from "@/lib/reminders";
import { startOfDay } from "@/lib/date";
import { formatINR } from "@/lib/format";
import type { ReminderCategory, ReminderItem, ReminderStatus } from "@/lib/reminder-types";

type FreqFilter = "all" | "monthly" | "yearly";

const TYPE_TABS: { id: ReminderCategory; label: string }[] = [
  { id: "responsibility", label: "Responsibilities" },
  { id: "subscription", label: "Subscriptions" },
  { id: "split", label: "Splits" },
];

const STATUS_OPTIONS: { id: "all" | ReminderStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "expired", label: "Expired" },
];

const FREQ_OPTIONS: { id: FreqFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

const STATUS_STYLE: Record<ReminderStatus, string> = {
  upcoming: "bg-accent text-primary",
  completed: "bg-success/15 text-success",
  expired: "bg-danger/15 text-danger",
};

export function RemindersScreen({
  onBack,
  onOpenGroup,
  onPayResponsibility,
  onPaySubscription,
}: {
  onBack: () => void;
  onOpenGroup: (groupId: string) => void;
  onPayResponsibility: (item: Responsibility) => void;
  onPaySubscription: (item: Subscription) => void;
}) {
  const [today] = useState(() => startOfDay(new Date()));
  const reminders = useReminders();
  const { items: responsibilities, markPaid } = useResponsibilities();
  const { items: subscriptions, setAutopay } = useSubscriptions();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ReminderCategory>("responsibility");
  const [status, setStatus] = useState<"all" | ReminderStatus>("all");
  const [freq, setFreq] = useState<FreqFilter>("all");
  const [selectedResponsibility, setSelectedResponsibility] = useState<Responsibility | null>(null);
  // an id, not a snapshot — "Remove autopay" mutates the store in place while the sheet stays
  // open, so the sheet must re-read the live item every render instead of showing a stale copy
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const selectedSubscription = subscriptions.find((s) => s.id === selectedSubscriptionId) ?? null;

  const q = query.trim().toLowerCase();
  const filtered = sortByUrgency(
    reminders
      .filter((r) => r.category === type)
      .filter((r) => !q || r.label.toLowerCase().includes(q) || r.subtitle?.toLowerCase().includes(q))
      .filter((r) => status === "all" || statusOf(r, today) === status)
      .filter((r) => freq === "all" || r.frequency === freq)
  );

  const openRow = (r: ReminderItem) => {
    if (r.category === "responsibility") {
      const raw = responsibilities.find((x) => x.id === r.id.replace("responsibility:", ""));
      if (raw) setSelectedResponsibility(raw);
    } else if (r.category === "subscription") {
      setSelectedSubscriptionId(r.id.replace("subscription:", ""));
    } else if (r.category === "split" && r.groupId) {
      onOpenGroup(r.groupId);
    }
  };

  const handlePayResponsibility = (item: Responsibility) => {
    setSelectedResponsibility(null);
    if (item.amount === null) markPaid(item.id);
    else onPayResponsibility(item);
  };

  const handlePaySubscription = (item: Subscription) => {
    setSelectedSubscriptionId(null);
    onPaySubscription(item);
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 pt-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-primary transition-transform active:scale-90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="text-[16px] font-bold text-foreground">Reminders</p>
      </div>

      <div className="mx-5 mt-3 flex shrink-0 items-center gap-2 rounded-2xl bg-muted px-3.5 py-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-muted-foreground">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          inputMode="none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reminders"
          className="min-w-0 flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} className="text-[12px] font-semibold text-muted-foreground">
            Clear
          </button>
        )}
      </div>

      <div className="mx-5 mt-3 flex shrink-0 rounded-full bg-muted p-1">
        {TYPE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            className={`relative flex-1 rounded-full py-2 text-[12px] font-semibold ${type === t.id ? "text-foreground" : "text-muted-foreground"}`}
          >
            {type === t.id && (
              <motion.span layoutId="reminders-type-pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} className="absolute inset-0 rounded-full bg-card shadow-sm" />
            )}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex shrink-0 gap-2 px-5">
        <FilterDropdown label="Status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
        <FilterDropdown label="Frequency" value={freq} options={FREQ_OPTIONS} onChange={setFreq} />
      </div>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-5 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {!filtered.length && <p className="py-10 text-center text-[13px] text-muted-foreground">No reminders match here</p>}

        {filtered.map((r) => {
          const st = statusOf(r, today);
          const suffix = r.category === "subscription" ? (r.frequency === "yearly" ? "/yr" : "/mo") : "";
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => openRow(r)}
              className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors active:bg-accent/40"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-[19px]">{r.emoji}</span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[13.5px] font-semibold text-foreground">{r.label}</p>
                <p className="truncate text-[11.5px] text-muted-foreground">
                  {r.subtitle ? `${r.subtitle} · ` : ""}
                  {dueDateLabel(r, today)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {r.amount !== null && (
                  <span className="text-[13px] font-bold tabular-nums text-foreground">
                    ₹{formatINR(r.amount)}
                    {suffix && <span className="text-[10px] font-medium text-muted-foreground">{suffix}</span>}
                  </span>
                )}
                <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold capitalize ${STATUS_STYLE[st]}`}>{st}</span>
              </div>
            </button>
          );
        })}
      </div>

      <ResponsibilityDetailSheet item={selectedResponsibility} onClose={() => setSelectedResponsibility(null)} onPay={handlePayResponsibility} />
      <SubscriptionDetailSheet
        item={selectedSubscription}
        onClose={() => setSelectedSubscriptionId(null)}
        onRemoveAutopay={(item) => setAutopay(item.id, false)}
        onPay={handlePaySubscription}
      />
    </div>
  );
}
