"use client";

import { useMemo } from "react";
import { useResponsibilities } from "./responsibilities-store";
import { useSubscriptions } from "./subscriptions-store";
import { useSplitStore } from "./split-store";
import type { ReminderItem } from "./reminder-types";

export function useReminders(): ReminderItem[] {
  const { items: responsibilities } = useResponsibilities();
  const { items: subscriptions } = useSubscriptions();
  const { groups, groupOrder } = useSplitStore();

  return useMemo(() => {
    const respItems: ReminderItem[] = responsibilities.map((r) => ({
      id: `responsibility:${r.id}`,
      category: "responsibility",
      emoji: r.emoji,
      label: r.label,
      subtitle: r.payee.name,
      amount: r.amount,
      dueDate: r.dueDate,
      frequency: r.frequency,
      completed: r.paid,
    }));

    const subItems: ReminderItem[] = subscriptions.map((s) => ({
      id: `subscription:${s.id}`,
      category: "subscription",
      emoji: s.emoji,
      label: s.label,
      subtitle: s.autopay ? "Autopay" : "Manual",
      amount: s.amount,
      dueDate: s.dueDate,
      frequency: s.frequency,
      completed: s.autopay ? false : s.paid,
      autopay: s.autopay,
    }));

    const splitItems: ReminderItem[] = groupOrder.flatMap((groupId) => {
      const rec = groups[groupId];
      if (!rec) return [];
      return Object.values(rec.splits)
        .filter((s) => (s.owed["me"] ?? 0) > 0)
        .map((s) => ({
          id: `split:${groupId}:${s.id}`,
          category: "split" as const,
          emoji: rec.group.emoji,
          label: s.note || "Split",
          subtitle: rec.group.name,
          amount: s.owed["me"],
          dueDate: null,
          frequency: "once" as const,
          completed: s.settled["me"] ?? false,
          groupId,
        }));
    });

    return [...respItems, ...subItems, ...splitItems];
  }, [responsibilities, subscriptions, groups, groupOrder]);
}
