"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet } from "@/components/sheet";
import { Toggle } from "@/components/toggle";
import { CalcKeypad, useCalcKeyboard } from "@/components/calc-keypad";
import { FakeKeyboard } from "@/components/fake-keyboard";
import { MiniCalendar } from "@/components/mini-calendar";
import { evaluate, hasOperator, prettyExpr } from "@/lib/calc";
import { formatINR } from "@/lib/format";
import { startOfDay, addDays, fmtDay } from "@/lib/date";
import { personFromName } from "@/lib/contacts";
import type { Responsibility } from "@/lib/responsibilities-store";

const EMOJIS = ["💰", "🏠", "💡", "📱", "🚗", "🎓", "💳", "🤝"];
type Due = "none" | "week" | "pick";
type Focus = "label" | "payee" | "amount" | null;

function AddResponsibilityBody({
  onCancel,
  onAdd,
}: {
  onCancel: () => void;
  onAdd: (r: Omit<Responsibility, "id" | "paid">) => void;
}) {
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [label, setLabel] = useState("");
  const [payTo, setPayTo] = useState("");
  const [focus, setFocus] = useState<Focus>(null);
  const [amountExpr, setAmountExpr] = useState("");
  const [due, setDue] = useState<Due>("none");
  const [pickedDate, setPickedDate] = useState(() => addDays(startOfDay(new Date()), 1));
  const [repeat, setRepeat] = useState(false);

  useCalcKeyboard(focus === "amount", (key) => setAmountExpr((p) => (key === "⌫" ? p.slice(0, -1) : p + key)));
  const amountEval = evaluate(amountExpr);
  const amount = amountEval.ok && amountEval.value > 0 ? amountEval.value : null;

  const dueDate = due === "none" ? null : due === "week" ? addDays(startOfDay(new Date()), 5) : pickedDate;

  const canAdd = label.trim().length > 0 && payTo.trim().length > 0;
  const focusField = (f: Focus) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setFocus(f);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-5 pb-1 pt-3">
        <p className="text-[17px] font-bold text-foreground">Add a responsibility</p>
        <p className="text-[12px] text-muted-foreground">Fin will track it alongside rent & EMIs</p>
      </div>

      <div onClick={() => setFocus(null)} className="min-h-0 flex-1 overflow-y-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[19px] transition-all ${
                emoji === e ? "bg-gradient-to-br from-primary to-secondary shadow-md shadow-primary/25" : "bg-muted"
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={focusField("label")}
          className={`mt-3 flex w-full items-center gap-2 rounded-2xl px-4 py-3.5 text-left transition-all ${
            focus === "label" ? "bg-muted ring-2 ring-primary/40" : "bg-muted"
          }`}
        >
          <span className={`flex-1 truncate text-[14px] ${label ? "font-medium text-foreground" : "text-muted-foreground"}`}>
            {label || "What is it? e.g. Gym membership"}
          </span>
          {focus === "label" && <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} className="h-5 w-[2px] rounded bg-primary" />}
        </button>

        <button
          type="button"
          onClick={focusField("payee")}
          className={`mt-2.5 flex w-full items-center gap-2 rounded-2xl px-4 py-3.5 text-left transition-all ${
            focus === "payee" ? "bg-muted ring-2 ring-primary/40" : "bg-muted"
          }`}
        >
          <span className={`flex-1 truncate text-[14px] ${payTo ? "font-medium text-foreground" : "text-muted-foreground"}`}>
            {payTo || "Who do you pay? e.g. Landlord name"}
          </span>
          {focus === "payee" && <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} className="h-5 w-[2px] rounded bg-primary" />}
        </button>

        <button
          type="button"
          onClick={focusField("amount")}
          className={`mt-2.5 w-full rounded-2xl px-4 py-3.5 text-left transition-all ${focus === "amount" ? "bg-accent/70 ring-2 ring-primary/40" : "bg-muted"}`}
        >
          <span className="text-[12px] font-medium text-muted-foreground">Amount (optional)</span>
          <div className="flex items-baseline gap-1.5">
            <div className="flex items-baseline gap-1">
              <span className="text-[18px] font-bold text-muted-foreground">₹</span>
              <span className="text-[22px] font-extrabold tabular-nums text-foreground">{amountExpr ? prettyExpr(amountExpr) : "0"}</span>
            </div>
            {hasOperator(amountExpr) && amountEval.ok && (
              <span className="rounded-full bg-card px-2.5 py-0.5 text-[12px] font-bold text-primary">= ₹{formatINR(amountEval.value)}</span>
            )}
          </div>
        </button>

        <p className="mt-4 text-[13px] font-bold text-foreground">When&apos;s it due</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(
            [
              ["none", "No due date"],
              ["week", "This week"],
              ["pick", "Pick a date"],
            ] as const
          ).map(([d, text]) => (
            <button
              key={d}
              type="button"
              onClick={() => setDue(d)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-all ${
                due === d ? "bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/25" : "bg-muted text-foreground"
              }`}
            >
              {d === "pick" && due === "pick" ? fmtDay(pickedDate) : text}
            </button>
          ))}
        </div>

        {due === "pick" && (
          <div className="mt-3">
            <MiniCalendar selected={pickedDate} onSelect={setPickedDate} />
          </div>
        )}

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3">
          <div className="leading-tight">
            <p className="text-[13px] font-semibold text-foreground">Repeats every month</p>
            <p className="text-[11px] text-muted-foreground">Handy for rent & subscriptions 🏠</p>
          </div>
          <Toggle on={repeat} onChange={setRepeat} label="" ariaLabel="Repeats every month" />
        </div>
      </div>

      {focus !== "label" && focus !== "payee" && focus !== "amount" && (
        <div className="shrink-0 px-5 pb-7 pt-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            disabled={!canAdd}
            onClick={() => {
              onAdd({
                emoji,
                label: label.trim(),
                amount,
                dueDate,
                frequency: repeat ? "monthly" : "once",
                payee: personFromName(payTo),
              });
              onCancel();
            }}
            className="w-full rounded-full bg-gradient-to-r from-primary to-secondary py-4 text-[14.5px] font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-35 disabled:shadow-none"
          >
            {!label.trim() ? "Give it a name first" : !payTo.trim() ? "Who do you pay?" : `Add ${label.trim()}`}
          </motion.button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {focus === "label" && <FakeKeyboard key="kb-label" value={label} onChange={setLabel} onDone={() => setFocus(null)} suggestions={[]} />}
        {focus === "payee" && <FakeKeyboard key="kb-payee" value={payTo} onChange={setPayTo} onDone={() => setFocus(null)} suggestions={[]} />}
      </AnimatePresence>
      {focus === "amount" && <CalcKeypad onKey={(key) => setAmountExpr((p) => (key === "⌫" ? p.slice(0, -1) : p + key))} expr={amountExpr} compact />}
    </div>
  );
}

export function AddResponsibilitySheet({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (r: Omit<Responsibility, "id" | "paid">) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose}>
      <AddResponsibilityBody onCancel={onClose} onAdd={onAdd} />
    </Sheet>
  );
}
