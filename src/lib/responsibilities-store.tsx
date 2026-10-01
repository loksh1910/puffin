"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { addDays, startOfDay } from "./date";
import { findContact, personFromName } from "./contacts";
import type { Person } from "./split-types";

export type Responsibility = {
  id: string;
  emoji: string;
  label: string;
  amount: number | null;
  dueDate: Date | null;
  frequency: "once" | "monthly";
  payee: Person;
  paid: boolean;
};

// Due dates are offsets from "today", resolved inside the useState initializer below
// (which runs once per mount) rather than at module load — a Date baked in at import
// time would go stale the moment the server process outlives midnight, causing a
// server/client hydration mismatch. Repay loan has no fixed due date, same as it
// always has in this mock — just a running balance.
const SEED_OFFSETS: {
  id: string;
  emoji: string;
  label: string;
  amount: number | null;
  dueInDays: number | null;
  frequency: "once" | "monthly";
  payee: Person;
}[] = [
  { id: "rent", emoji: "🏠", label: "Rent", amount: 18000, dueInDays: 3, frequency: "monthly", payee: personFromName("Deepak Verma") },
  { id: "emi", emoji: "🚗", label: "EMI", amount: 4200, dueInDays: 8, frequency: "monthly", payee: personFromName("HDFC Bank") },
  { id: "loan", emoji: "🤝", label: "Repay loan", amount: 12000, dueInDays: null, frequency: "once", payee: findContact("arjun")! },
];

type Store = {
  items: Responsibility[];
  add: (r: Omit<Responsibility, "id" | "paid">) => void;
  markPaid: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function useResponsibilities() {
  const store = useContext(Ctx);
  if (!store) throw new Error("useResponsibilities must be used inside ResponsibilitiesProvider");
  return store;
}

export function ResponsibilitiesProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Responsibility[]>(() => {
    const today = startOfDay(new Date());
    return SEED_OFFSETS.map((s) => ({
      id: s.id,
      emoji: s.emoji,
      label: s.label,
      amount: s.amount,
      dueDate: s.dueInDays === null ? null : addDays(today, s.dueInDays),
      frequency: s.frequency,
      payee: s.payee,
      paid: false,
    }));
  });
  const counter = useRef(0);

  const add = useCallback((r: Omit<Responsibility, "id" | "paid">) => {
    setItems((all) => [...all, { ...r, id: `resp${++counter.current}`, paid: false }]);
  }, []);

  const markPaid = useCallback((id: string) => {
    setItems((all) => all.map((r) => (r.id === id ? { ...r, paid: true } : r)));
  }, []);

  const value = useMemo(() => ({ items, add, markPaid }), [items, add, markPaid]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
