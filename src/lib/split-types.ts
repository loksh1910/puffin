export type Person = {
  id: string;
  name: string;
  short: string;
  initials: string;
  upi: string;
  gradient: string;
  // added by a raw UPI ID that isn't in contacts
  unverified?: boolean;
};

export type Group = {
  name: string;
  emoji: string;
  members: Person[]; // includes ME first
};

export type SplitMode = "equal" | "amount" | "shares" | "percent";

export type Split = {
  id: string;
  total: number;
  note: string;
  mode: SplitMode;
  paid: Record<string, number>; // who fronted the money, and how much
  owed: Record<string, number>; // each member's share of the bill
  settled: Record<string, boolean>; // has this member squared up their share
};

export type ChatItem =
  | { id: string; kind: "system"; text: string }
  | { id: string; kind: "message"; from: string; text: string }
  | { id: string; kind: "split"; splitId: string };

export type Reminder = {
  label: string;
  repeat: boolean;
  who: string[];
};
