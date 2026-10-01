export type Transaction = {
  id: string;
  title: string;
  subtitle: string;
  // positive = credit, negative = debit
  amount: number;
  emoji: string;
};

export const TRANSACTIONS: Transaction[] = [
  { id: "t1", title: "Paid to Aditi Sharma", subtitle: "Today, 2:15 PM", amount: -250, emoji: "🍕" },
  { id: "t2", title: "Chai Tapri", subtitle: "Today, 9:05 AM", amount: -20, emoji: "☕" },
  { id: "t3", title: "Received from Rahul Kapoor", subtitle: "Yesterday, 6:40 PM", amount: 600, emoji: "💸" },
  { id: "t4", title: "Netflix", subtitle: "Yesterday, 12:00 AM", amount: -649, emoji: "🎬" },
  { id: "t5", title: "Auto Bhaiya", subtitle: "Yesterday, 7:50 PM", amount: -80, emoji: "🛺" },
  { id: "t6", title: "Rent — Flat 4B", subtitle: "2 Sept, 8:00 AM", amount: -18000, emoji: "🏠" },
  { id: "t7", title: "Salary credited", subtitle: "1 Sept, 10:02 AM", amount: 45000, emoji: "💼" },
  { id: "t8", title: "Cashback received", subtitle: "31 Aug, 11:00 AM", amount: 45, emoji: "🎉" },
];
