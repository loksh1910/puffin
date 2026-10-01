"use client";

import { StatusBar } from "@/components/status-bar";
import { useToast } from "@/components/toast";
import { QuickActionsDock } from "@/components/home/quick-actions-dock";
import { Responsibilities } from "@/components/home/responsibilities";
import { FrequentAndSubscriptions } from "@/components/home/frequent-and-subscriptions";
import { BankBalanceCard } from "@/components/home/bank-balance-card";
import { RemindersStrip } from "@/components/home/reminders-strip";
import type { Responsibility } from "@/lib/responsibilities-store";

const RECENTS = [
  { name: "Aditi", initials: "AS", bg: "linear-gradient(135deg,#9333ea,#ff5fa2)" },
  { name: "Rahul", initials: "RK", bg: "linear-gradient(135deg,#6a3de8,#9333ea)" },
  { name: "Mom", initials: "M", bg: "linear-gradient(135deg,#ff5fa2,#ffb3d9)" },
  { name: "Flat 4B", initials: "4B", bg: "linear-gradient(135deg,#2e1a47,#7c3aed)" },
  { name: "Neha", initials: "NJ", bg: "linear-gradient(135deg,#c026d3,#ff8bc6)" },
];

function TopIcon({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-foreground shadow-sm active:scale-90 transition-transform"
      type="button"
    >
      {children}
    </button>
  );
}

function ActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-md shadow-primary/20">
        {children}
      </span>
      <span className="text-center text-[11.5px] font-medium leading-tight text-foreground">
        {label}
      </span>
    </button>
  );
}

function MiniIcon({ label, children }: { label: string; children: React.ReactNode }) {
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={() => toast("Coming soon ✨")}
      className="flex flex-col items-center gap-1.5 shrink-0 w-16 active:scale-95 transition-transform"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-primary">
        {children}
      </span>
      <span className="text-center text-[10.5px] leading-tight text-muted-foreground">
        {label}
      </span>
    </button>
  );
}

export function HomeScreen({
  onScanQR,
  onSplit,
  onCheckBalance,
  onOpenChats,
  onOpenReminders,
  onPayResponsibility,
}: {
  onScanQR: () => void;
  onSplit: () => void;
  onCheckBalance: () => void;
  onOpenChats: () => void;
  onOpenReminders: () => void;
  onPayResponsibility: (item: Responsibility) => void;
}) {
  const toast = useToast();

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <StatusBar />

      <div className="flex-1 overflow-y-auto pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* header */}
        <div className="flex items-center justify-between px-5 pt-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="currentColor" />
                <path
                  d="M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="text-[12.5px] leading-tight">
              <p className="font-semibold text-foreground">
                Get up to <span className="text-secondary">₹500</span> Fin Coins
              </p>
              <p className="text-muted-foreground">Complete your first split →</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TopIcon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </TopIcon>
            <TopIcon onClick={onOpenChats}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3a6 6 0 00-6 6v3.2c0 .5-.2 1-.5 1.4L4 15.5c-.6.8 0 2 1 2h14c1 0 1.6-1.2 1-2l-1.5-2a2 2 0 01-.5-1.4V9a6 6 0 00-6-6z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path d="M9.5 19.5a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </TopIcon>
          </div>
        </div>

        <RemindersStrip onViewAll={onOpenReminders} />

        <BankBalanceCard onCheck={onCheckBalance} />

        {/* money transfer */}
        <div className="mx-5 mt-4 rounded-3xl bg-card p-4 shadow-sm shadow-black/5">
          <p className="mb-3 text-[13.5px] font-semibold text-foreground">Money Transfer</p>
          <div className="grid grid-cols-3 gap-y-4">
            <ActionButton label="Scan any QR" onClick={onScanQR}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M14 14h2.5M14 18h2.5M18.5 14v2.5M18.5 18.5H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </ActionButton>
            <ActionButton label="Split with friends" onClick={onSplit}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
                <circle cx="17" cy="10" r="2.4" stroke="currentColor" strokeWidth="2" />
                <path d="M3.5 19c.5-3.2 2.8-5 5.5-5s5 1.8 5.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M15 15c2 0 4 1.2 4.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </ActionButton>
            <ActionButton label="Pay Anyone" onClick={() => toast("Coming soon ✨")}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="2" />
                <path d="M5 20c.6-4 3.3-6.2 7-6.2S18.4 16 19 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M16.5 6.5l2 2 3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </ActionButton>
            <ActionButton label="Bank Transfer" onClick={() => toast("Coming soon ✨")}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 3l9 5H3l9-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M3.5 20.5h17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </ActionButton>
            <ActionButton label="Mobile Recharge" onClick={() => toast("Coming soon ✨")}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="7" y="2" width="10" height="20" rx="2.5" stroke="currentColor" strokeWidth="2" />
                <path d="M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </ActionButton>
            <ActionButton label="History" onClick={() => toast("Coming soon ✨")}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 12a8 8 0 118 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 12V7M4 12h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </ActionButton>
          </div>
        </div>

        {/* recent people */}
        <div className="mx-5 mt-4 rounded-3xl bg-card p-4 shadow-sm shadow-black/5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13.5px] font-semibold text-foreground">Pay again</p>
            <span className="text-[12px] font-medium text-primary">All contacts</span>
          </div>
          <div className="flex justify-between">
            {RECENTS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => toast("Coming soon ✨")}
                className="flex w-14 flex-col items-center gap-1.5 active:scale-95 transition-transform"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full text-[13px] font-bold text-white"
                  style={{ background: p.bg }}
                >
                  {p.initials}
                </span>
                <span className="text-[11px] text-foreground">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <Responsibilities onPay={onPayResponsibility} />
        <FrequentAndSubscriptions />

        {/* recharge & bills - decorative */}
        <div className="mx-5 mt-4 rounded-3xl bg-card p-4 shadow-sm shadow-black/5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13.5px] font-semibold text-foreground">Recharge & Bills</p>
            <span className="text-[12px] font-medium text-primary">View All</span>
          </div>
          <div className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <MiniIcon label="Mobile Recharge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="7" y="2" width="10" height="20" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M11 18h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </MiniIcon>
            <MiniIcon label="Electricity">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </MiniIcon>
            <MiniIcon label="Credit Card">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="2.5" y="5.5" width="19" height="13" rx="2.4" stroke="currentColor" strokeWidth="1.8" />
                <path d="M2.5 10h19" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </MiniIcon>
            <MiniIcon label="DTH">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 18l6-13 6 13" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <circle cx="18" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </MiniIcon>
          </div>
        </div>

        <div className="mx-5 mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => toast("Coming soon ✨")}
            className="rounded-3xl bg-card p-4 text-left shadow-sm shadow-black/5 active:scale-[0.97] transition-transform"
          >
            <p className="text-[13px] font-semibold text-foreground">Refer & Win</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Get ₹100 per friend</p>
          </button>
          <button
            type="button"
            onClick={() => toast("Coming soon ✨")}
            className="rounded-3xl bg-card p-4 text-left shadow-sm shadow-black/5 active:scale-[0.97] transition-transform"
          >
            <p className="text-[13px] font-semibold text-foreground">Save in Gold</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Start with ₹10</p>
          </button>
        </div>
      </div>

      <QuickActionsDock
        onAction={(action) =>
          action === "scan" ? onScanQR() : action === "split" ? onSplit() : toast("Coming soon ✨")
        }
      />
    </div>
  );
}
