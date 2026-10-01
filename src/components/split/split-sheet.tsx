"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { Sheet } from "@/components/sheet";
import { Avatar } from "@/components/avatar";
import { CalcKeypad, useCalcKeyboard } from "@/components/calc-keypad";
import { CreatureHead, CreaturePaws } from "@/components/creature-head";
import { FakeKeyboard } from "@/components/fake-keyboard";
import { Toggle } from "@/components/toggle";
import { PizzaChart, SLICE_COLORS } from "@/components/split/pizza-chart";
import { evaluate, hasOperator, nextExpr, prettyExpr } from "@/lib/calc";
import { formatINR, noteLabel } from "@/lib/format";
import { computeSplit, distribute, round2 } from "@/lib/split-math";
import type { Group, Split, SplitMode } from "@/lib/split-types";

export type NewSplit = Omit<Split, "id" | "settled">;

const MODES: { id: SplitMode; label: string }[] = [
  { id: "equal", label: "Equally" },
  { id: "amount", label: "Amounts" },
  { id: "shares", label: "Shares" },
  { id: "percent", label: "%" },
];

const MODE_SUMMARY: Record<SplitMode, string> = {
  equal: "split equally",
  amount: "split by exact amounts",
  shares: "split by shares",
  percent: "split by percentage",
};

const val = (expr: string | undefined) => {
  const r = evaluate(expr ?? "");
  return r.ok ? Math.max(0, r.value) : 0;
};

// focus-and-type: the first digit after tapping a field replaces what's there, like a calculator
function applyKey(prev: string, key: string, fresh: boolean) {
  if (fresh && /^[0-9.]$/.test(key)) return nextExpr("", key);
  if (fresh && key === "⌫") return "";
  return nextExpr(prev, key);
}

// The creature peeks over whatever it's judging: sweating while numbers don't add up, beaming once they do.
// `sink` is how far below the edge its head keeps going (hidden behind the thing it peeks over).
function Judge({ state, sink = 4 }: { state: "idle" | "off" | "ok"; sink?: number }) {
  const lookX = useMotionValue(0);
  const lookY = useMotionValue(5);
  return (
    <>
      <div className="pointer-events-none absolute left-1/2 -ml-[48px] w-[96px] overflow-hidden" style={{ top: -56, height: 56 + sink }}>
        <motion.div
          key={state}
          className="absolute left-0 top-0"
          initial={{ y: state === "ok" ? -8 : 0 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 12 }}
        >
          <CreatureHead lookX={lookX} lookY={lookY} eyes={state === "ok" ? "happy" : "open"} mouth={state === "off" ? "ooh" : "smile"} />
        </motion.div>
        <AnimatePresence>
          {state === "off" && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: [0, 1, 1, 0], y: [-4, 0, 8, 14] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="absolute right-1 top-3 text-[13px]"
            >
              💧
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="absolute -top-[8px] left-1/2 z-20 -ml-[24px]">
        <CreaturePaws />
      </div>
    </>
  );
}

function SplitSheetBody({ group, onCancel, onSplit }: { group: Group; onCancel: () => void; onSplit: (s: NewSplit) => void }) {
  const members = group.members;
  const ids = members.map((m) => m.id);
  const colorOf = (id: string) => SLICE_COLORS[ids.indexOf(id) % SLICE_COLORS.length];

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [totalExpr, setTotalExpr] = useState("");
  const [multi, setMulti] = useState(false);
  const [payer, setPayer] = useState("me");
  const [paidExpr, setPaidExpr] = useState<Record<string, string>>({});
  const [focus, setFocus] = useState("total");
  const fresh = useRef(false);
  const [mode, setMode] = useState<SplitMode>("equal");
  const [included, setIncluded] = useState<Record<string, boolean>>(() => Object.fromEntries(ids.map((id) => [id, true])));
  const [owedExpr, setOwedExpr] = useState<Record<string, string>>({});
  const [shares, setShares] = useState<Record<string, number>>(() => Object.fromEntries(ids.map((id) => [id, 1])));
  const [percents, setPercents] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [noteTyping, setNoteTyping] = useState(false);
  const [slicing, setSlicing] = useState(false);
  const [burst, setBurst] = useState(false);

  const total = val(totalExpr);
  const totalEval = evaluate(totalExpr);

  const paid: Record<string, number> = multi
    ? Object.fromEntries(ids.map((id): [string, number] => [id, round2(val(paidExpr[id]))]).filter(([, v]) => v > 0))
    : total > 0
      ? { [payer]: total }
      : {};
  const paidSum = round2(Object.values(paid).reduce((s, v) => s + v, 0));
  const paidLeft = round2(total - paidSum);
  const paidOk = total > 0 && (!multi || (paidSum > 0 && Math.abs(paidLeft) < 0.005));

  const result = computeSplit(total, ids, mode, {
    included,
    amounts: Object.fromEntries(ids.map((id) => [id, val(owedExpr[id])])),
    shares,
    percents,
  });

  const focusField = (f: string) => {
    setFocus(f);
    fresh.current = true;
  };

  const onKey = (key: string) => {
    const wasFresh = fresh.current;
    fresh.current = false;
    if (focus === "total") setTotalExpr((p) => applyKey(p, key, wasFresh));
    else if (focus.startsWith("paid:")) {
      const id = focus.slice(5);
      setPaidExpr((m) => ({ ...m, [id]: applyKey(m[id] ?? "", key, wasFresh) }));
    } else if (focus.startsWith("owe:")) {
      const id = focus.slice(4);
      setOwedExpr((m) => ({ ...m, [id]: applyKey(m[id] ?? "", key, wasFresh) }));
    }
  };

  const keypadOn = !slicing && (step === 1 || (step === 2 && mode === "amount" && focus.startsWith("owe:")));
  useCalcKeyboard(keypadOn, onKey);
  const focusedExpr =
    focus === "total" ? totalExpr : focus.startsWith("paid:") ? paidExpr[focus.slice(5)] ?? "" : owedExpr[focus.slice(4)] ?? "";

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
    setNoteTyping(false);
    if (next === 1) setFocus("total");
    if (next === 2) setFocus("");
  };

  const pickMode = (m: SplitMode) => {
    setMode(m);
    setFocus("");
    const equalW = Object.fromEntries(ids.map((id) => [id, 1]));
    if (m === "amount" && !Object.keys(owedExpr).length) {
      const even = distribute(total, equalW);
      setOwedExpr(Object.fromEntries(ids.map((id) => [id, String(even[id] ?? 0)])));
    }
    if (m === "percent" && !Object.keys(percents).length) setPercents(distribute(100, equalW));
  };

  const bumpShares = (id: string, d: number) =>
    setShares((s) => ({ ...s, [id]: Math.max(0, Math.min(20, (s[id] ?? 0) + d)) }));

  const toggleMulti = (on: boolean) => {
    setMulti(on);
    if (on) {
      setPaidExpr((m) => (Object.keys(m).length ? m : { [payer]: totalExpr }));
      focusField(`paid:${ids.find((id) => id !== payer) ?? payer}`);
    } else setFocus("total");
  };

  useEffect(() => {
    if (!slicing) return;
    const burstAt = setTimeout(() => setBurst(true), 650);
    const done = setTimeout(() => onSplit({ total, note: note.trim(), mode, paid, owed: result.owed }), 2000);
    return () => {
      clearTimeout(burstAt);
      clearTimeout(done);
    };
    // snapshot at the moment the user confirmed; nothing is editable while slicing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slicing]);

  // ---------- CTA text per step ----------
  let cta = "";
  let ctaOk = false;
  if (step === 1) {
    ctaOk = paidOk;
    if (!totalEval.ok || total <= 0) cta = totalEval.ok || totalEval.reason === "empty" ? "Enter the amount" : "Can't divide by 0 🙃";
    else if (!paidOk) cta = paidLeft > 0 ? `₹${formatINR(paidLeft)} still unaccounted` : `₹${formatINR(-paidLeft)} too much paid`;
    else cta = multi ? "Save & choose how to split →" : "Next: how to split →";
  } else if (step === 2) {
    ctaOk = result.valid;
    if (result.valid) cta = "Next: add a note →";
    else if (mode === "amount") cta = result.remaining > 0 ? `Assign ₹${formatINR(result.remaining)} more` : `₹${formatINR(-result.remaining)} over the bill`;
    else if (mode === "percent") cta = result.remaining > 0 ? `${result.remaining}% left to assign` : `${-result.remaining}% over 100`;
    else cta = "Pick at least one person";
  } else {
    ctaOk = true;
    cta = `Split ₹${formatINR(total)} 🍕`;
  }

  const titles = ["What did it cost?", "How should we slice it?", "Anything to add?"];
  const involved = members.filter((m) => (result.owed[m.id] ?? 0) > 0);
  const pizzaParts = members.map((m) => ({ person: m, value: result.owed[m.id] ?? 0, color: colorOf(m.id) }));

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* header */}
      <div className="flex shrink-0 items-center gap-3 px-5 pb-2 pt-3">
        <button
          type="button"
          onClick={() => (step === 1 ? onCancel() : go(step - 1))}
          aria-label={step === 1 ? "Close" : "Back"}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-primary transition-transform active:scale-90"
        >
          {step === 1 ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <p className="flex-1 text-[16px] font-bold text-foreground">{titles[step - 1]}</p>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <motion.span key={s} animate={{ width: s === step ? 18 : 6 }} className={`h-1.5 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div
          key={step}
          custom={dir}
          initial={{ opacity: 0, x: 30 * dir }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 * dir }}
          transition={{ duration: 0.2 }}
          className="flex min-h-0 flex-1 flex-col"
        >
          {step === 1 && (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => focusField("total")}
                  className={`mt-1 w-full rounded-3xl py-4 text-center transition-all ${focus === "total" ? "bg-accent/70 ring-2 ring-primary/40" : "bg-muted/60"}`}
                >
                  <span className="text-[12px] font-medium text-muted-foreground">Total bill</span>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-bold text-muted-foreground">₹</span>
                    <span className="text-[38px] font-extrabold tabular-nums text-foreground">{totalExpr ? prettyExpr(totalExpr) : "0"}</span>
                  </div>
                  {hasOperator(totalExpr) && totalEval.ok && (
                    <span className="mt-1 inline-block rounded-full bg-card px-3 py-0.5 text-[13px] font-bold text-primary">= ₹{formatINR(total)}</span>
                  )}
                </button>

                <div className="mt-5 flex items-center justify-between">
                  <p className="text-[13.5px] font-bold text-foreground">Paid by</p>
                  <Toggle on={multi} onChange={toggleMulti} label="Multiple people paid" />
                </div>

                {!multi ? (
                  <div className="mt-3 flex flex-wrap gap-2 pb-3">
                    {members.map((m) => (
                      <motion.button
                        key={m.id}
                        type="button"
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setPayer(m.id)}
                        className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-[13px] font-semibold transition-all ${
                          payer === m.id ? "bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/25" : "bg-muted text-foreground"
                        }`}
                      >
                        <Avatar person={m} size={28} />
                        {m.short}
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="pb-3">
                    {/* who covered how much, stacked toward the total */}
                    <div className="relative mt-14">
                      <Judge state={paidSum === 0 ? "idle" : paidOk ? "ok" : "off"} />
                      <div className="relative z-10 flex h-4 overflow-hidden rounded-full bg-muted">
                        {members.map((m) => {
                          const w = total > 0 ? Math.min(100, ((paid[m.id] ?? 0) / total) * 100) : 0;
                          return (
                            <motion.span
                              key={m.id}
                              animate={{ width: `${w}%` }}
                              transition={{ type: "spring", stiffness: 200, damping: 24 }}
                              style={{ background: colorOf(m.id) }}
                              className="h-full"
                            />
                          );
                        })}
                      </div>
                      <p className={`mt-1.5 text-center text-[12px] font-semibold ${paidOk ? "text-success" : "text-muted-foreground"}`}>
                        {paidOk
                          ? "Adds up perfectly ✓"
                          : paidLeft > 0
                            ? `₹${formatINR(paidLeft)} unaccounted 😬`
                            : `₹${formatINR(-paidLeft)} more than the bill 😬`}
                      </p>
                    </div>

                    <div className="mt-2 flex flex-col gap-1.5">
                      {members.map((m) => {
                        const f = `paid:${m.id}`;
                        const expr = paidExpr[m.id] ?? "";
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => focusField(f)}
                            className={`flex items-center gap-3 rounded-2xl px-3 py-2 transition-all ${focus === f ? "bg-accent/70 ring-2 ring-primary/40" : "bg-muted/50"}`}
                          >
                            <span className="h-8 w-1.5 rounded-full" style={{ background: colorOf(m.id) }} />
                            <Avatar person={m} size={30} />
                            <span className="flex-1 text-left text-[13.5px] font-semibold text-foreground">{m.short}</span>
                            <span className={`text-[15px] font-bold tabular-nums ${expr ? "text-foreground" : "text-muted-foreground/60"}`}>
                              ₹{expr ? prettyExpr(expr) : "0"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <CalcKeypad onKey={onKey} expr={focusedExpr} compact />
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex shrink-0 justify-center pb-2 pt-14">
                <div className="relative">
                  <Judge state={result.valid ? "ok" : mode === "amount" || mode === "percent" ? "off" : "idle"} sink={22} />
                  <div className="relative z-10">
                    <PizzaChart parts={pizzaParts} size={140}>
                      <p className="text-[13px] font-extrabold tabular-nums text-foreground">₹{formatINR(total)}</p>
                    </PizzaChart>
                  </div>
                </div>
              </div>

              <div className="mx-5 flex shrink-0 rounded-full bg-muted p-1">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => pickMode(m.id)}
                    className={`relative flex-1 rounded-full py-2 text-[12.5px] font-semibold ${mode === m.id ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {mode === m.id && (
                      <motion.span layoutId="split-mode-pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} className="absolute inset-0 rounded-full bg-card shadow-sm" />
                    )}
                    <span className="relative">{m.label}</span>
                  </button>
                ))}
              </div>

              {(mode === "amount" || mode === "percent") && (
                <p className={`mt-2 shrink-0 text-center text-[12px] font-semibold ${result.valid ? "text-success" : "text-secondary"}`}>
                  {result.valid
                    ? mode === "amount"
                      ? `All ₹${formatINR(total)} assigned ✓`
                      : "100% assigned ✓"
                    : mode === "amount"
                      ? result.remaining > 0
                        ? `₹${formatINR(result.remaining)} left to assign`
                        : `₹${formatINR(-result.remaining)} over the bill`
                      : result.remaining > 0
                        ? `${result.remaining}% left to assign`
                        : `${-result.remaining}% over 100`}
                </p>
              )}

              <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {members.map((m) => {
                  const owes = result.owed[m.id] ?? 0;
                  const color = colorOf(m.id);
                  return (
                    <div key={m.id} className="border-b border-border/60 py-2 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: color, opacity: owes > 0 ? 1 : 0.25 }} />
                        <Avatar person={m} size={32} />
                        <div className="min-w-0 flex-1 leading-tight">
                          <p className="truncate text-[13.5px] font-semibold text-foreground">{m.id === "me" ? "You" : m.short}</p>
                          <p className="text-[11.5px] tabular-nums text-muted-foreground">{owes > 0 ? `₹${formatINR(owes)}` : "Not in this one"}</p>
                        </div>

                        {mode === "equal" && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = { ...included, [m.id]: !included[m.id] };
                              if (Object.values(next).some(Boolean)) setIncluded(next);
                            }}
                            className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                              included[m.id] ? "bg-gradient-to-br from-primary to-secondary text-white" : "bg-muted text-muted-foreground"
                            }`}
                            aria-label={included[m.id] ? `Leave ${m.short} out` : `Include ${m.short}`}
                          >
                            {included[m.id] ? (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                              </svg>
                            )}
                          </button>
                        )}

                        {mode === "amount" && (
                          <button
                            type="button"
                            onClick={() => focusField(`owe:${m.id}`)}
                            className={`min-w-[92px] rounded-xl px-3 py-1.5 text-right text-[15px] font-bold tabular-nums transition-all ${
                              focus === `owe:${m.id}` ? "bg-accent ring-2 ring-primary/40 text-foreground" : "bg-muted text-foreground"
                            }`}
                          >
                            ₹{owedExpr[m.id] ? prettyExpr(owedExpr[m.id]) : "0"}
                          </button>
                        )}

                        {mode === "shares" && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => bumpShares(m.id, -1)}
                              aria-label={`Fewer shares for ${m.short}`}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[18px] font-bold text-primary active:scale-90"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-[15px] font-bold tabular-nums text-foreground">{shares[m.id] ?? 0}</span>
                            <button
                              type="button"
                              onClick={() => bumpShares(m.id, 1)}
                              aria-label={`More shares for ${m.short}`}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[18px] font-bold text-primary active:scale-90"
                            >
                              +
                            </button>
                          </div>
                        )}

                        {mode === "percent" && (
                          <span className="w-14 text-right text-[15px] font-bold tabular-nums text-foreground">{percents[m.id] ?? 0}%</span>
                        )}
                      </div>

                      {mode === "percent" && (
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={Math.round(percents[m.id] ?? 0)}
                          onChange={(e) => setPercents((p) => ({ ...p, [m.id]: Number(e.target.value) }))}
                          aria-label={`${m.short}'s percentage`}
                          className="mt-1.5 w-full"
                          style={{ accentColor: color }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {keypadOn && <CalcKeypad onKey={onKey} expr={focusedExpr} compact />}
            </>
          )}

          {step === 3 && (
            <div className="min-h-0 flex-1 overflow-y-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setNoteTyping(true)}
                className={`mt-1 flex w-full items-center gap-2 rounded-2xl px-4 py-3.5 text-left transition-all ${noteTyping ? "bg-card ring-2 ring-primary/40" : "bg-muted"}`}
              >
                <span className={`flex-1 truncate text-[14px] ${note ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                  {note ? noteLabel(note) : "📝 What was it for? e.g. 🍕 Dinner"}
                </span>
                {noteTyping && <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} className="h-5 w-[2px] rounded bg-primary" />}
              </button>

              <div className="mt-4 rounded-3xl bg-muted/60 p-4">
                <div className="flex items-center gap-4">
                  <PizzaChart parts={pizzaParts} size={84} />
                  <div className="min-w-0 flex-1 leading-snug">
                    <p className="text-[22px] font-extrabold tabular-nums text-foreground">₹{formatINR(total)}</p>
                    <p className="truncate text-[12.5px] font-medium text-foreground">{note ? noteLabel(note) : "Untitled expense"}</p>
                    <p className="text-[11.5px] text-muted-foreground">
                      Paid by{" "}
                      {Object.keys(paid)
                        .map((id) => (id === "me" ? "you" : members.find((m) => m.id === id)?.short))
                        .join(" & ")}{" "}
                      · {MODE_SUMMARY[mode]}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {involved.map((m) => (
                    <div key={m.id} className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorOf(m.id) }} />
                      <Avatar person={m} size={24} />
                      <span className="flex-1 text-[13px] text-foreground">{m.id === "me" ? "You" : m.short}</span>
                      <span className="text-[13px] font-bold tabular-nums text-foreground">₹{formatINR(result.owed[m.id])}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {!(step === 3 && noteTyping) && (
        <div className="shrink-0 px-5 pb-7 pt-2">
          <motion.button
            type="button"
            disabled={!ctaOk || slicing}
            whileTap={{ scale: 0.97 }}
            onClick={() => (step < 3 ? go(step + 1) : setSlicing(true))}
            className="w-full rounded-full bg-gradient-to-r from-primary to-secondary py-4 text-[15px] font-semibold text-white shadow-lg shadow-primary/25 transition-opacity disabled:opacity-35 disabled:shadow-none"
          >
            {cta}
          </motion.button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {step === 3 && noteTyping && (
          <FakeKeyboard key="kb" value={note} onChange={setNote} onDone={() => setNoteTyping(false)} />
        )}
      </AnimatePresence>

      {/* the payoff: the creature slices the pizza and the pieces fly out to the squad */}
      <AnimatePresence>
        {slicing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-t-[28px] bg-card/95 backdrop-blur-sm"
          >
            <div className="relative flex h-[300px] w-[300px] items-center justify-center">
              {involved.map((m, i) => {
                const a = (i / involved.length) * Math.PI * 2 - Math.PI / 2;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{ scale: 1, x: Math.cos(a) * 128, y: Math.sin(a) * 128 }}
                    transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.75 + i * 0.07 }}
                    className="absolute flex flex-col items-center"
                  >
                    <Avatar person={m} size={38} className="shadow-md" />
                    <span className="mt-0.5 rounded-full bg-card px-1.5 text-[10px] font-bold tabular-nums text-foreground shadow-sm">
                      ₹{formatINR(result.owed[m.id])}
                    </span>
                  </motion.div>
                );
              })}
              <motion.div initial={{ scale: 0.6, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 14 }} className="relative">
                <PizzaChart parts={pizzaParts} size={150} explode={burst} />
                {/* cutter swooshes */}
                <svg className="pointer-events-none absolute inset-0 overflow-visible" viewBox="0 0 150 150">
                  {[35, 125].map((deg, i) => (
                    <motion.line
                      key={deg}
                      x1={75 - Math.sin((deg * Math.PI) / 180) * 95}
                      y1={75 + Math.cos((deg * Math.PI) / 180) * 95}
                      x2={75 + Math.sin((deg * Math.PI) / 180) * 95}
                      y2={75 - Math.cos((deg * Math.PI) / 180) * 95}
                      stroke="white"
                      strokeWidth="4"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 1 }}
                      animate={{ pathLength: 1, opacity: [1, 1, 0] }}
                      transition={{ duration: 0.35, delay: 0.2 + i * 0.22 }}
                    />
                  ))}
                </svg>
              </motion.div>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-2 text-[18px] font-extrabold text-foreground"
            >
              Sliced! 🍕
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.15 }} className="text-[12.5px] text-muted-foreground">
              Sending everyone their share…
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SplitSheet({
  open,
  group,
  onClose,
  onSplit,
}: {
  open: boolean;
  group: Group;
  onClose: () => void;
  onSplit: (s: NewSplit) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} full>
      <SplitSheetBody group={group} onCancel={onClose} onSplit={onSplit} />
    </Sheet>
  );
}
