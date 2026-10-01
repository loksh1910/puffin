import { startOfDay, fmtDay } from "./date";
import type { ReminderItem, ReminderStatus } from "./reminder-types";

// Autopay never fails in this world — once a subscription on autopay's date passes it's simply
// "completed" (charged), never "expired" (missed) the way a manual payment can be. A subscription
// with autopay turned off behaves exactly like a responsibility: overdue-and-unpaid is "expired".
export function statusOf(item: Pick<ReminderItem, "dueDate" | "completed" | "autopay">, today: Date): ReminderStatus {
  if (item.completed) return "completed";
  if (!item.dueDate) return "upcoming";
  const overdue = startOfDay(item.dueDate).getTime() < startOfDay(today).getTime();
  if (!overdue) return "upcoming";
  return item.autopay ? "completed" : "expired";
}

export function dueDateLabel(item: Pick<ReminderItem, "dueDate">, today: Date): string {
  if (!item.dueDate) return "No due date";
  const days = Math.round((startOfDay(item.dueDate).getTime() - startOfDay(today).getTime()) / 86400000);
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days === -1) return "Overdue by 1 day";
  if (days < 0) return `Overdue by ${-days} days`;
  if (days <= 6) return `Due in ${days} days`;
  return `Due ${fmtDay(item.dueDate)}`;
}

// items with no due date sort to the end — we can't judge their urgency by date
export function sortByUrgency(items: ReminderItem[]): ReminderItem[] {
  return [...items].sort((a, b) => (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity));
}
