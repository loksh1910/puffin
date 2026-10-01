"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { addDays, startOfDay } from "./date";

export type Subscription = {
  id: string;
  emoji: string;
  label: string;
  amount: number;
  dueDate: Date;
  frequency: "monthly" | "yearly";
  bg: string;
  autopay: boolean;
  // only meaningful once autopay is off — has the user manually paid this cycle
  paid: boolean;
};

// Due dates are offsets from "today", resolved inside the useState initializer below (which
// runs once per mount) rather than at module load — see the responsibilities-store gotcha in
// Fin's CLAUDE.md about module-level Date computation going stale across a server restart.
const SEED_OFFSETS: {
  id: string;
  emoji: string;
  label: string;
  amount: number;
  dueInDays: number;
  frequency: "monthly" | "yearly";
  bg: string;
  autopay: boolean;
}[] = [
  { id: "netflix", emoji: "🎬", label: "Netflix", amount: 649, dueInDays: 4, frequency: "monthly", bg: "#ffe4e6", autopay: true },
  { id: "spotify", emoji: "🎧", label: "Spotify", amount: 119, dueInDays: 9, frequency: "monthly", bg: "#e6f9ee", autopay: true },
  { id: "gym", emoji: "🏋️", label: "Gym membership", amount: 1500, dueInDays: 17, frequency: "monthly", bg: "#efe7ff", autopay: false },
  { id: "prime", emoji: "📦", label: "Amazon Prime", amount: 1499, dueInDays: 45, frequency: "yearly", bg: "#fff1d6", autopay: true },
];

type Store = {
  items: Subscription[];
  setAutopay: (id: string, on: boolean) => void;
  markPaid: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function useSubscriptions() {
  const store = useContext(Ctx);
  if (!store) throw new Error("useSubscriptions must be used inside SubscriptionsProvider");
  return store;
}

export function SubscriptionsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Subscription[]>(() => {
    const today = startOfDay(new Date());
    return SEED_OFFSETS.map((s) => ({
      id: s.id,
      emoji: s.emoji,
      label: s.label,
      amount: s.amount,
      dueDate: addDays(today, s.dueInDays),
      frequency: s.frequency,
      bg: s.bg,
      autopay: s.autopay,
      paid: false,
    }));
  });

  const setAutopay = useCallback((id: string, on: boolean) => {
    setItems((all) => all.map((s) => (s.id === id ? { ...s, autopay: on } : s)));
  }, []);

  const markPaid = useCallback((id: string) => {
    setItems((all) => all.map((s) => (s.id === id ? { ...s, paid: true } : s)));
  }, []);

  const value = useMemo(() => ({ items, setAutopay, markPaid }), [items, setAutopay, markPaid]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
