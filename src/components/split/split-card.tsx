"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/avatar";
import { PizzaChart, SLICE_COLORS } from "@/components/split/pizza-chart";
import { formatINR, noteLabel } from "@/lib/format";
import { netFor } from "@/lib/split-math";
import type { Group, Split } from "@/lib/split-types";

export const involvedIn = (split: Split, group: Group) =>
  group.members.filter((m) => (split.owed[m.id] ?? 0) > 0 || (split.paid[m.id] ?? 0) > 0);

export function payerNames(split: Split, group: Group) {
  return Object.keys(split.paid)
    .map((id) => (id === "me" ? "you" : group.members.find((m) => m.id === id)?.short ?? "someone"))
    .join(" & ");
}

export function SplitCard({
  split,
  group,
  onOpen,
  onSettleUp,
}: {
  split: Split;
  group: Group;
  onOpen: () => void;
  onSettleUp: () => void;
}) {
  const people = involvedIn(split, group);
  const settledCount = people.filter((p) => split.settled[p.id]).length;
  const allSettled = settledCount === people.length;
  const myNet = netFor(split, "me");
  const iOwe = myNet < 0 && !split.settled.me;
  const parts = group.members.map((m, i) => ({ person: m, value: split.owed[m.id] ?? 0, color: SLICE_COLORS[i % SLICE_COLORS.length] }));

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      initial={{ y: -30, scale: 0.9 }}
      animate={{ y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 15 }}
      whileTap={{ scale: 0.98 }}
      className="mx-auto w-full max-w-[340px] cursor-pointer rounded-3xl bg-card p-4 text-left shadow-md shadow-primary/10 ring-1 ring-border"
    >
      <div className="flex items-center gap-3">
        <PizzaChart parts={parts} size={44} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[14px] font-bold text-foreground">{split.note ? noteLabel(split.note) : "Expense"}</p>
          <p className="truncate text-[11.5px] text-muted-foreground">Paid by {payerNames(split, group)}</p>
        </div>
        <p className="text-[18px] font-extrabold tabular-nums text-foreground">₹{formatINR(split.total)}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2.5 pl-1">
        {people.map((p) => (
          <motion.span key={p.id} animate={split.settled[p.id] ? { scale: [1, 1.25, 1] } : {}} transition={{ duration: 0.4 }}>
            <Avatar person={p} size={28} status={split.settled[p.id] ? "paid" : "pending"} />
          </motion.span>
        ))}
      </div>

      {allSettled ? (
        <p className="mt-3 rounded-2xl bg-success/10 py-2 text-center text-[13px] font-bold text-success">All settled 🎉</p>
      ) : (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              animate={{ width: `${(settledCount / people.length) * 100}%` }}
              transition={{ type: "spring", stiffness: 160, damping: 22 }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
            />
          </div>
          <p className="mt-1.5 text-[11.5px] font-medium text-muted-foreground">
            {settledCount} of {people.length} settled
          </p>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        {myNet > 0 ? (
          <p className="text-[13px] font-semibold text-success">You get back ₹{formatINR(myNet)}</p>
        ) : iOwe ? (
          <p className="text-[13px] font-semibold text-secondary">You owe ₹{formatINR(-myNet)}</p>
        ) : myNet < 0 ? (
          <p className="text-[13px] font-semibold text-success">You paid your share ✓</p>
        ) : people.some((p) => p.id === "me") ? (
          <p className="text-[13px] font-semibold text-success">You&apos;re square ✓</p>
        ) : (
          <p className="text-[13px] font-semibold text-muted-foreground">You&apos;re not in this one</p>
        )}
        {iOwe ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSettleUp();
            }}
            className="rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-1.5 text-[12.5px] font-bold text-white shadow-md shadow-primary/25 active:scale-95"
          >
            Pay
          </button>
        ) : (
          <span className="text-[12px] font-semibold text-primary">See who paid →</span>
        )}
      </div>
    </motion.div>
  );
}
