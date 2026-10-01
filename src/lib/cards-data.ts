import { BankCard } from "./types";

export const cards: BankCard[] = [
  {
    id: "sbi",
    bank: "SBI",
    bankFullName: "State Bank of India",
    last4: "4821",
    gradient: "linear-gradient(135deg, #6a3de8 0%, #9333ea 55%, #c026d3 100%)",
    textClass: "text-white",
  },
  {
    id: "hdfc",
    bank: "HDFC",
    bankFullName: "HDFC Bank",
    last4: "7734",
    gradient: "linear-gradient(135deg, #ff5fa2 0%, #ff8bc6 55%, #ffb3d9 100%)",
    textClass: "text-white",
  },
  {
    id: "pnb",
    bank: "PNB",
    bankFullName: "Punjab National Bank",
    last4: "1092",
    gradient: "linear-gradient(135deg, #2e1a47 0%, #4c2a85 55%, #7c3aed 100%)",
    textClass: "text-white",
  },
];
