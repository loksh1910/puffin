"use client";

import { BANK_ACCOUNTS, balanceStatus } from "@/lib/bank-account";

// Same visual language as the checkout screen's cards (chip, contactless, masked number) but
// this one represents the linked bank account itself, with a lock-gated "Check Balance" footer.
// Always shows the primary account — switching accounts happens after unlocking.
export function BankBalanceCard({ onCheck }: { onCheck: () => void }) {
  const account = BANK_ACCOUNTS[0];
  const status = balanceStatus(account.balance, account.minBalance);

  return (
    <div className="mx-5 mt-4">
      <p className="mb-2 text-[13.5px] font-semibold text-foreground">Your Account</p>
      <button
        type="button"
        onClick={onCheck}
        className="relative block w-full overflow-hidden rounded-3xl text-left shadow-lg shadow-primary/10 transition-transform active:scale-[0.98]"
      >
        <div className="relative p-4 pb-3.5" style={{ background: account.gradient }}>
          <div className="absolute -right-6 -top-10 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute -left-4 -bottom-10 h-24 w-24 rounded-full bg-white/10" />

          <div className="relative flex items-start justify-between">
            <svg width="26" height="20" viewBox="0 0 26 20" fill="none">
              <rect width="26" height="20" rx="4" fill="#FFD966" fillOpacity="0.9" />
              <path d="M0 7h26M0 13h26M9 0v20M17 0v20" stroke="#8a6b1f" strokeWidth="0.6" opacity="0.5" />
            </svg>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M8 9a5.5 5.5 0 018 0M5.5 6.2a9 9 0 0113 0M10.6 12a2 2 0 013 0"
                stroke="white"
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity="0.9"
              />
            </svg>
          </div>

          <p className="relative mt-3.5 text-[14.5px] font-semibold tracking-[0.18em] text-white/95">
            •••• •••• •••• {account.last4}
          </p>

          <div className="relative mt-2.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-white/75">Savings Account</span>
            <span className="text-[13px] font-bold text-white">{account.bank}</span>
          </div>

          {status !== "ok" && (
            <span
              className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-sm ${
                status === "low" ? "bg-danger" : "bg-warning"
              }`}
            >
              {status === "low" ? "⚠️ Low balance" : "⚠️ Getting low"}
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 bg-card py-2.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-primary">
            <rect x="5" y="11" width="14" height="9" rx="2.5" stroke="currentColor" strokeWidth="2" />
            <path d="M8 11V8a4 4 0 118 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-[12.5px] font-semibold text-primary">Check Balance</span>
        </div>
      </button>
    </div>
  );
}
