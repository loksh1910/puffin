"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBar } from "@/components/status-bar";
import { FakeKeyboard, NOTE_MAX } from "@/components/fake-keyboard";
import { CalcKeypad, useCalcKeyboard } from "@/components/calc-keypad";
import { Avatar } from "@/components/avatar";
import { evaluate, hasOperator, nextExpr, prettyExpr } from "@/lib/calc";
import { formatINR, noteLabel } from "@/lib/format";
import type { Person } from "@/lib/split-types";

const UPI_LIMIT = 100000;
const QUICK_AMOUNTS = [100, 250, 500];

export function AmountScreen({
  recipient,
  initialAmount,
  initialNote,
  onBack,
  onPay,
}: {
  recipient: Person;
  initialAmount: number;
  initialNote: string;
  onBack: () => void;
  onPay: (amount: number, note: string) => void;
}) {
  const [expr, setExpr] = useState(() => (initialAmount > 0 ? String(initialAmount) : ""));
  const [note, setNote] = useState(initialNote);
  const [noteOpen, setNoteOpen] = useState(false);

  const press = (key: string) => setExpr((prev) => nextExpr(prev, key));
  useCalcKeyboard(!noteOpen, press);

  const evaluation = evaluate(expr);
  const calcMode = hasOperator(expr);
  const value = evaluation.ok ? evaluation.value : 0;

  let payLabel = `Pay ₹${formatINR(value)}`;
  if (!evaluation.ok) payLabel = evaluation.reason === "divide-by-zero" ? "Can't divide by 0 🙃" : "Enter an amount";
  else if (value <= 0) payLabel = "Amount must be above ₹0";
  else if (value > UPI_LIMIT) payLabel = "UPI limit is ₹1,00,000 per payment";
  const canPay = evaluation.ok && value > 0 && value <= UPI_LIMIT;

  const display = expr ? prettyExpr(expr) : "0";
  const size = display.length <= 8 ? "text-5xl" : display.length <= 13 ? "text-4xl" : "text-3xl";

  const closeNote = () => {
    setNote((n) => n.trim());
    setNoteOpen(false);
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 pt-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-primary active:scale-90 transition-transform"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="text-[14px] font-semibold text-foreground">Pay contact</p>
      </div>

      {/* recipient */}
      <div className="flex flex-col items-center pt-3">
        <Avatar person={recipient} size={56} className="shadow-md" />
        <p className="mt-2 text-[15px] font-semibold text-foreground">{recipient.name}</p>
        <p className="text-[12px] text-muted-foreground">{recipient.upi}</p>
      </div>

      {/* amount + note */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
        <div className="flex max-w-full items-baseline justify-center gap-1">
          <span className="text-3xl font-bold text-muted-foreground">₹</span>
          <span className={`${size} break-all text-center font-bold tabular-nums text-foreground`}>{display}</span>
          <motion.span
            animate={{ opacity: noteOpen ? 0 : [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="ml-0.5 h-8 w-[3px] shrink-0 self-center rounded-full bg-primary"
          />
        </div>

        <div className="mt-3 flex min-h-[58px] flex-col items-center">
          <AnimatePresence mode="wait" initial={false}>
            {calcMode ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: -6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`rounded-full px-4 py-1.5 text-[15px] font-bold ${
                  evaluation.ok ? "bg-accent text-primary" : "bg-danger/10 text-danger"
                }`}
              >
                {evaluation.ok ? `= ₹${formatINR(value)}` : evaluation.reason === "divide-by-zero" ? "Can't divide by 0" : "…"}
              </motion.div>
            ) : !noteOpen ? (
              <motion.div
                key="chips"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="flex gap-2">
                  {QUICK_AMOUNTS.map((qa) => (
                    <button
                      key={qa}
                      type="button"
                      onClick={() => setExpr(String(qa))}
                      className="rounded-full bg-accent px-3.5 py-1.5 text-[12.5px] font-medium text-primary active:scale-95 transition-transform"
                    >
                      ₹{qa}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">Based on what you usually send {recipient.short}</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* note: a pill that grows into an input */}
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          style={{ borderRadius: 18 }}
          className={`mt-2 flex items-center gap-2 overflow-hidden bg-card shadow-sm shadow-black/5 ${
            noteOpen ? "w-full px-4 py-3 ring-2 ring-primary/40" : "px-3.5 py-2"
          }`}
        >
          {noteOpen ? (
            <motion.div layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full items-center gap-2">
              <span className="text-[15px]">📝</span>
              <input
                autoFocus
                inputMode="none"
                value={note}
                maxLength={NOTE_MAX}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && closeNote()}
                placeholder="What's this for?"
                className="min-w-0 flex-1 bg-transparent text-[14px] text-foreground outline-none focus-visible:outline-none placeholder:text-muted-foreground"
              />
              <span className="shrink-0 text-[10.5px] tabular-nums text-muted-foreground">
                {note.length}/{NOTE_MAX}
              </span>
            </motion.div>
          ) : note ? (
            <motion.div layout="position" className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNoteOpen(true)}
                className="max-w-[230px] truncate text-[13px] font-medium text-foreground"
              >
                {noteLabel(note)}
              </button>
              <button
                type="button"
                onClick={() => setNote("")}
                aria-label="Remove note"
                className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] text-muted-foreground"
              >
                ✕
              </button>
            </motion.div>
          ) : (
            <motion.button
              layout="position"
              type="button"
              onClick={() => setNoteOpen(true)}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-primary"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M4 20h4L19 9l-4-4L4 16v4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              Add a note
            </motion.button>
          )}
        </motion.div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {noteOpen ? (
          <FakeKeyboard key="keyboard" value={note} onChange={setNote} onDone={closeNote} />
        ) : (
          <motion.div
            key="keypad"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30, transition: { duration: 0.12 } }}
          >
            <CalcKeypad onKey={press} expr={expr} />

            <div className="px-6 pb-8">
              <button
                type="button"
                disabled={!canPay}
                onClick={() => onPay(value, note.trim())}
                className="w-full rounded-full bg-gradient-to-r from-primary to-secondary py-4 text-[15px] font-semibold text-white shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-35 disabled:shadow-none"
              >
                {payLabel}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
