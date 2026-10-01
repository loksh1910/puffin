import type { Split, SplitMode } from "./split-types";

export type Allocation = {
  included: Record<string, boolean>;
  amounts: Record<string, number>;
  shares: Record<string, number>;
  percents: Record<string, number>;
};

export type SplitResult = {
  owed: Record<string, number>;
  valid: boolean;
  // leftover in the mode's own unit: rupees for "amount", percentage points for "percent"
  remaining: number;
};

export const round2 = (n: number) => Math.round(n * 100) / 100;

// Largest-remainder split in paise, so the parts always add back up to the exact total.
export function distribute(total: number, weights: Record<string, number>): Record<string, number> {
  const ids = Object.keys(weights).filter((id) => weights[id] > 0);
  const sum = ids.reduce((s, id) => s + weights[id], 0);
  const out: Record<string, number> = {};
  if (!sum) return out;

  const totalPaise = Math.round(total * 100);
  const parts = ids.map((id) => {
    const exact = (totalPaise * weights[id]) / sum;
    return { id, paise: Math.floor(exact), frac: exact - Math.floor(exact) };
  });
  let left = totalPaise - parts.reduce((s, p) => s + p.paise, 0);
  [...parts].sort((a, b) => b.frac - a.frac).forEach((p) => {
    if (left > 0) {
      p.paise += 1;
      left -= 1;
    }
  });
  parts.forEach((p) => (out[p.id] = p.paise / 100));
  return out;
}

export function computeSplit(total: number, memberIds: string[], mode: SplitMode, a: Allocation): SplitResult {
  const pick = (source: Record<string, number>) =>
    Object.fromEntries(memberIds.map((id) => [id, Math.max(0, source[id] ?? 0)]));

  if (mode === "equal") {
    const owed = distribute(total, Object.fromEntries(memberIds.map((id) => [id, a.included[id] ? 1 : 0])));
    return { owed, valid: total > 0 && Object.keys(owed).length > 0, remaining: 0 };
  }

  if (mode === "shares") {
    const shares = pick(a.shares);
    const owed = distribute(total, shares);
    return { owed, valid: total > 0 && Object.keys(owed).length > 0, remaining: 0 };
  }

  if (mode === "percent") {
    const pcts = pick(a.percents);
    const sum = Object.values(pcts).reduce((s, v) => s + v, 0);
    const remaining = round2(100 - sum);
    const valid = total > 0 && Math.abs(remaining) < 0.01;
    const owed = valid
      ? distribute(total, pcts)
      : Object.fromEntries(memberIds.map((id) => [id, round2((total * pcts[id]) / 100)]));
    return { owed, valid, remaining };
  }

  const owed = pick(a.amounts);
  const remaining = round2(total - Object.values(owed).reduce((s, v) => s + v, 0));
  return { owed, valid: total > 0 && Math.abs(remaining) < 0.005, remaining };
}

// positive: they're owed money back; negative: they still owe
export const netFor = (split: Pick<Split, "paid" | "owed">, id: string) =>
  round2((split.paid[id] ?? 0) - (split.owed[id] ?? 0));

export function initialSettled(split: Pick<Split, "paid" | "owed">, memberIds: string[]) {
  return Object.fromEntries(memberIds.map((id) => [id, netFor(split, id) >= 0]));
}
