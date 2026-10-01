import type { BankCard } from "./types";

// same shape as the payment cards, plus the fields the balance screen needs — these
// ARE the accounts behind the SBI/HDFC/PNB cards used everywhere else in the app
export type BankAccount = BankCard & {
  balance: number;
  minBalance: number;
};

export const BANK_ACCOUNTS: BankAccount[] = [
  {
    id: "sbi",
    bank: "SBI",
    bankFullName: "State Bank of India",
    last4: "4821",
    gradient: "linear-gradient(135deg, #6a3de8 0%, #9333ea 55%, #c026d3 100%)",
    textClass: "text-white",
    balance: 1450,
    minBalance: 2000,
  },
  {
    id: "hdfc",
    bank: "HDFC",
    bankFullName: "HDFC Bank",
    last4: "7734",
    gradient: "linear-gradient(135deg, #ff5fa2 0%, #ff8bc6 55%, #ffb3d9 100%)",
    textClass: "text-white",
    balance: 8250,
    minBalance: 2500,
  },
  {
    id: "pnb",
    bank: "PNB",
    bankFullName: "Punjab National Bank",
    last4: "1092",
    gradient: "linear-gradient(135deg, #2e1a47 0%, #4c2a85 55%, #7c3aed 100%)",
    textClass: "text-white",
    balance: 640,
    minBalance: 1000,
  },
];

export type BalanceStatus = "ok" | "near" | "low";

export function balanceStatus(balance: number, minBalance: number): BalanceStatus {
  if (balance < minBalance) return "low";
  if (balance < minBalance * 1.25) return "near";
  return "ok";
}
