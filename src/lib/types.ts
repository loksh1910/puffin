export type FlowStep =
  | "home"
  | "qr-scan"
  | "amount"
  | "checkout"
  | "processing"
  | "success"
  | "split-squad"
  | "split-name"
  | "split-chat"
  | "balance-lock"
  | "balance"
  | "chats"
  | "individual-chat"
  | "reminders";

export type BankCard = {
  id: string;
  bank: "SBI" | "HDFC" | "PNB";
  bankFullName: string;
  last4: string;
  gradient: string;
  textClass: string;
};

export type PaymentOutcome = "success" | "failed";
