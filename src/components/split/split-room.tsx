"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatScreen } from "@/components/split/chat-screen";
import { SplitSheet, NewSplit } from "@/components/split/split-sheet";
import { SplitCard } from "@/components/split/split-card";
import { DetailsSheet } from "@/components/split/details-sheet";
import { ReminderSheet } from "@/components/split/reminder-sheet";
import { useSplitStore } from "@/lib/split-store";
import { netFor } from "@/lib/split-math";
import { formatINR, noteLabel } from "@/lib/format";
import type { Person, Reminder, Split } from "@/lib/split-types";

export type SettleUpRequest = { splitId: string; to: Person; amount: number; note: string };

// The squad's chat plus everything that slides over it: the split sheet, "who paid" details and reminders.
export function SplitRoom({ onBack, onSettleUp }: { onBack: () => void; onSettleUp: (r: SettleUpRequest) => void }) {
  const { group, splits, addSplit, settle, post, setReminder } = useSplitStore();
  const [splitOpen, setSplitOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  if (!group) return null;

  const label = (s: Pick<Split, "note">) => (s.note ? noteLabel(s.note) : "the last split");

  const settleUpFor = (split: Split) => {
    // pay whoever is owed the most on this split
    const creditor = group.members
      .filter((m) => m.id !== "me")
      .sort((a, b) => netFor(split, b.id) - netFor(split, a.id))[0];
    onSettleUp({ splitId: split.id, to: creditor, amount: -netFor(split, "me"), note: split.note });
  };

  const handleSplit = (s: NewSplit) => {
    const id = addSplit(s);
    setSplitOpen(false);
    // someone who owes pays up a few seconds later, so the card visibly fills in
    const first = group.members.find((m) => m.id !== "me" && netFor(s, m.id) < 0);
    if (first) {
      const amount = formatINR(-netFor(s, first.id));
      later(() => post({ kind: "message", from: first.id, text: "paid! 🙌" }), 3400);
      later(() => {
        settle(id, first.id);
        post({ kind: "system", text: `${first.short} settled ₹${amount} ✅` });
      }, 3600);
    }
  };

  const nudge = (split: Split, p: Person) => {
    const amount = formatINR(-netFor(split, p.id));
    post({ kind: "system", text: `👋 You nudged ${p.short} about ₹${amount} for ${label(split)}` });
    later(() => post({ kind: "message", from: p.id, text: "omg sorry!! paying now 🏃" }), 2200);
    later(() => {
      settle(split.id, p.id);
      post({ kind: "system", text: `${p.short} settled ₹${amount} ✅` });
    }, 4400);
  };

  const cash = (split: Split, p: Person) => {
    settle(split.id, p.id);
    post({ kind: "system", text: `💵 ${p.short} paid you ₹${formatINR(-netFor(split, p.id))} in cash` });
  };

  const setReminderAndPost = (r: Reminder) => {
    setReminder(r);
    setReminderOpen(false);
    const names = group.members.filter((m) => r.who.includes(m.id)).map((m) => m.short);
    post({ kind: "system", text: `⏰ Reminder set for ${r.label} · pinging ${names.join(", ")}` });
  };

  const details = detailsId ? splits[detailsId] ?? null : null;

  return (
    <div className="relative h-full">
      <ChatScreen
        onBack={onBack}
        onSplit={() => setSplitOpen(true)}
        onReminder={() => setReminderOpen(true)}
        renderSplit={(splitId) => {
          const split = splits[splitId];
          if (!split) return null;
          return (
            <SplitCard split={split} group={group} onOpen={() => setDetailsId(splitId)} onSettleUp={() => settleUpFor(split)} />
          );
        }}
      />

      <SplitSheet open={splitOpen} group={group} onClose={() => setSplitOpen(false)} onSplit={handleSplit} />

      <DetailsSheet
        split={details}
        group={group}
        onClose={() => setDetailsId(null)}
        onNudge={(p) => details && nudge(details, p)}
        onCash={(p) => details && cash(details, p)}
        onSettleUp={() => details && settleUpFor(details)}
      />

      <ReminderSheet
        open={reminderOpen}
        group={group}
        splits={Object.values(splits)}
        onClose={() => setReminderOpen(false)}
        onSet={setReminderAndPost}
      />
    </div>
  );
}
