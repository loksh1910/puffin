export type ReminderCategory = "responsibility" | "subscription" | "split";
export type ReminderFrequency = "once" | "monthly" | "yearly";
export type ReminderStatus = "upcoming" | "completed" | "expired";

export type ReminderItem = {
  id: string;
  category: ReminderCategory;
  emoji: string;
  label: string;
  subtitle?: string;
  amount: number | null;
  dueDate: Date | null;
  frequency: ReminderFrequency;
  completed: boolean;
  // subscriptions only: charged automatically, so overdue-and-unpaid still counts as settled
  autopay?: boolean;
  // splits only: which group to jump into when the reminder is tapped
  groupId?: string;
};
