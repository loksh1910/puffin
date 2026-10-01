"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBar } from "@/components/status-bar";
import { Toggle } from "@/components/toggle";
import { BalancePeeker } from "@/components/balance-peeker";
import { SwitchAccountSheet } from "@/components/switch-account-sheet";
import { useToast } from "@/components/toast";
import { BANK_ACCOUNTS, balanceStatus } from "@/lib/bank-account";
import { TRANSACTIONS } from "@/lib/transactions";
import { formatINR } from "@/lib/format";

const SUGGESTIONS = [500, 1000, 2000];
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export function BalanceScreen({ onBack }: { onBack: () => void }) {
  const toast = useToast();
  const [accountId, setAccountId] = useState(BANK_ACCOUNTS[0].id);
  const [switchOpen, setSwitchOpen] = useState(false);
  const account = BANK_ACCOUNTS.find((a) => a.id === accountId) ?? BANK_ACCOUNTS[0];
  const status = balanceStatus(account.balance, account.minBalance);
  const [notifyOn, setNotifyOn] = useState(false);
  const [threshold, setThreshold] = useState<number | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const pickThreshold = (v: number) => {
    setThreshold(v);
    setNotifyOn(true);
    setCustomOpen(false);
  };

  const pressCustom = (k: string) => {
    if (!k) return;
    if (k === "⌫") return setCustomValue((v) => v.slice(0, -1));
    if (customValue.length >= 6) return;
    setCustomValue((v) => v + k);
  };

  const confirmCustom = () => {
    const v = Number(customValue);
    if (v > 0) pickThreshold(v);
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
        <p className="text-[15px] font-semibold text-foreground">Bank Balance</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* balance card, with the creature peeking (and un-peeking) over the top */}
        <div className="relative mt-14">
          <BalancePeeker />
          <div
            key={account.id}
            className="relative overflow-hidden rounded-3xl p-5 text-center text-white shadow-lg shadow-primary/20"
            style={{ background: account.gradient }}
          >
            <div className="absolute -right-6 -top-10 h-28 w-28 rounded-full bg-white/10" />
            <div className="absolute -left-4 -bottom-10 h-24 w-24 rounded-full bg-white/10" />
            <p className="relative text-[12.5px] font-medium text-white/80">Available Balance</p>
            <p className="relative mt-1 text-[36px] font-extrabold tabular-nums">₹{formatINR(account.balance)}</p>
            <p className="relative mt-1 text-[12px] text-white/75">
              {account.bankFullName} •••• {account.last4}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSwitchOpen(true)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-card py-2.5 text-[12.5px] font-semibold text-primary shadow-sm shadow-black/5 transition-transform active:scale-[0.98]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M7 7h11l-3-3M17 17H6l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Switch Bank Account
        </button>

        {status !== "ok" && (
          <div
            className={`mt-3 rounded-2xl px-4 py-3 text-[12.5px] font-medium ${
              status === "low" ? "bg-danger/10 text-danger" : "bg-warning/10 text-[#92650a]"
            }`}
          >
            {status === "low"
              ? `⚠️ Your balance is below the minimum of ₹${formatINR(account.minBalance)} — consider adding funds.`
              : `⚠️ Getting close to your minimum balance of ₹${formatINR(account.minBalance)}.`}
          </div>
        )}

        {/* notify me */}
        <div className="mt-4 rounded-3xl bg-card p-4 shadow-sm shadow-black/5">
          <div className="flex items-center justify-between gap-3">
            <div className="leading-tight">
              <p className="text-[13.5px] font-semibold text-foreground">🔔 Notify me when it&apos;s low</p>
              <p className="text-[11px] text-muted-foreground">We&apos;ll ping you before it runs out</p>
            </div>
            <Toggle on={notifyOn} onChange={setNotifyOn} label="" ariaLabel="Notify me when balance is low" />
          </div>

          <AnimatePresence initial={false}>
            {notifyOn && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {threshold !== null && !customOpen ? (
                  <div className="mt-3 flex items-center justify-between rounded-2xl bg-accent px-3.5 py-2.5">
                    <span className="text-[13px] font-semibold text-primary">Below ₹{formatINR(threshold)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomOpen(true);
                        setCustomValue(String(threshold));
                      }}
                      className="text-[12px] font-semibold text-primary underline underline-offset-2"
                    >
                      Edit
                    </button>
                  </div>
                ) : customOpen ? (
                  <div className="mt-3">
                    <div className="flex items-center justify-between rounded-2xl bg-muted px-3.5 py-2.5">
                      <span className="text-[15px] font-bold tabular-nums text-foreground">₹{customValue || "0"}</span>
                      <button
                        type="button"
                        onClick={confirmCustom}
                        disabled={!Number(customValue)}
                        className="rounded-full bg-primary px-3 py-1 text-[12px] font-semibold text-white disabled:opacity-40"
                      >
                        Set
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1">
                      {KEYS.map((k, i) => (
                        <button
                          key={i}
                          type="button"
                          disabled={!k}
                          onClick={() => pressCustom(k)}
                          className="flex h-10 items-center justify-center rounded-xl text-[15px] font-semibold text-foreground transition-colors active:bg-accent disabled:opacity-0"
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {SUGGESTIONS.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => pickThreshold(v)}
                        className="rounded-full bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-primary transition-transform active:scale-95"
                      >
                        ₹{formatINR(v)}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCustomOpen(true)}
                      className="rounded-full bg-muted px-3.5 py-1.5 text-[12.5px] font-semibold text-foreground transition-transform active:scale-95"
                    >
                      Custom
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* transaction history */}
        <div className="mt-4 rounded-3xl bg-card p-4 shadow-sm shadow-black/5">
          <p className="mb-1 text-[13.5px] font-semibold text-foreground">Recent Transactions</p>
          <div className="flex flex-col">
            {TRANSACTIONS.map((t) => (
              <div key={t.id} className="flex items-center gap-3 border-b border-border/60 py-2.5 last:border-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-[16px]">
                  {t.emoji}
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-[13px] font-semibold text-foreground">{t.title}</p>
                  <p className="text-[11px] text-muted-foreground">{t.subtitle}</p>
                </div>
                <span className={`text-[13px] font-bold tabular-nums ${t.amount > 0 ? "text-success" : "text-foreground"}`}>
                  {t.amount > 0 ? "+" : "-"}₹{formatINR(Math.abs(t.amount))}
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => toast("Coming soon ✨")}
            className="mt-2 w-full rounded-2xl bg-accent py-2.5 text-center text-[12.5px] font-semibold text-primary transition-transform active:scale-[0.98]"
          >
            View full transaction history →
          </button>
        </div>
      </div>

      <SwitchAccountSheet
        open={switchOpen}
        currentId={accountId}
        onClose={() => setSwitchOpen(false)}
        onSelect={(a) => {
          setAccountId(a.id);
          setSwitchOpen(false);
          // a different account's balance may have a different notify preference — start fresh
          setNotifyOn(false);
          setThreshold(null);
          setCustomOpen(false);
          setCustomValue("");
        }}
      />
    </div>
  );
}
