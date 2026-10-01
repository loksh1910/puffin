"use client";

import { useState } from "react";
import { motion, useMotionValue } from "framer-motion";
import { Sheet } from "@/components/sheet";
import { Avatar } from "@/components/avatar";
import { Toggle } from "@/components/toggle";
import { CreatureHead, CreaturePaws } from "@/components/creature-head";
import { MiniCalendar } from "@/components/mini-calendar";
import { formatINR } from "@/lib/format";
import { netFor } from "@/lib/split-math";
import { startOfDay, addDays, fmtDay } from "@/lib/date";
import type { Group, Reminder, Split } from "@/lib/split-types";

const TIMES = ["9 AM", "10 AM", "1 PM", "6 PM", "9 PM"];

type Quick = "tomorrow" | "weekend" | "in3" | "pick";

const nextSaturday = (d: Date) => addDays(d, (6 - d.getDay() + 7) % 7 || 7);

function namesList(names: string[]) {
  return names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} & ${names.at(-1)}`;
}

function ReminderBody({
  group,
  splits,
  onSet,
}: {
  group: Group;
  splits: Split[];
  onSet: (r: Reminder) => void;
}) {
  const [today] = useState(() => startOfDay(new Date()));
  const quickDates: Record<Exclude<Quick, "pick">, Date> = {
    tomorrow: addDays(today, 1),
    weekend: nextSaturday(today),
    in3: addDays(today, 3),
  };
  const [quick, setQuick] = useState<Quick>("tomorrow");
  const [date, setDate] = useState(quickDates.tomorrow);
  const [time, setTime] = useState("10 AM");
  const [repeat, setRepeat] = useState(false);

  const friends = group.members.slice(1);
  // what each friend still owes across the squad's splits
  const dues = Object.fromEntries(
    friends.map((f) => [
      f.id,
      splits.reduce((sum, s) => (!s.settled[f.id] && netFor(s, f.id) < 0 ? sum - netFor(s, f.id) : sum), 0),
    ])
  );
  const owing = friends.filter((f) => dues[f.id] > 0);
  const [who, setWho] = useState<string[]>(() => (owing.length ? owing : friends).map((f) => f.id));

  const lookX = useMotionValue(0);
  const lookY = useMotionValue(5);

  const pickQuick = (q: Exclude<Quick, "pick">) => {
    setQuick(q);
    setDate(quickDates[q]);
  };

  const chosen = friends.filter((f) => who.includes(f.id));
  const owingChosen = chosen.filter((f) => dues[f.id] > 0);
  const preview = !chosen.length
    ? "Pick who to remind 👇"
    : owingChosen.length
      ? `Hey ${namesList(chosen.map((c) => c.short))}! 👋 Friendly nudge from Fin — ${namesList(
          owingChosen.map((c) => `${c.short} owes ₹${formatINR(dues[c.id])}`)
        )} in ${group.emoji} ${group.name}.`
      : `Hey ${namesList(chosen.map((c) => c.short))}! 👋 Quick reminder from ${group.emoji} ${group.name} — let's settle up soon.`;

  const label = `${fmtDay(date)} · ${time}${repeat ? " · monthly" : ""}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-5 pb-1 pt-3">
        <p className="text-[17px] font-bold text-foreground">Remind the squad ⏰</p>
        <p className="text-[12px] text-muted-foreground">Fin will ping them so you don&apos;t have to be the bad guy</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(
            [
              ["tomorrow", "Tomorrow"],
              ["weekend", "This weekend"],
              ["in3", "In 3 days"],
            ] as const
          ).map(([q, text]) => (
            <button
              key={q}
              type="button"
              onClick={() => pickQuick(q)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-all ${
                quick === q ? "bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/25" : "bg-muted text-foreground"
              }`}
            >
              {text}
            </button>
          ))}
          <span
            className={`shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-semibold ${
              quick === "pick" ? "bg-gradient-to-r from-primary to-secondary text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            📅 {quick === "pick" ? fmtDay(date) : "Pick a date"}
          </span>
        </div>

        {/* mini calendar */}
        <div className="mt-3">
          <MiniCalendar
            selected={date}
            onSelect={(d) => {
              setDate(d);
              setQuick("pick");
            }}
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TIMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTime(t)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${
                time === t ? "bg-foreground text-white" : "bg-muted text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3">
          <div className="leading-tight">
            <p className="text-[13px] font-semibold text-foreground">Repeat every month</p>
            <p className="text-[11px] text-muted-foreground">Handy for rent & subscriptions 🏠</p>
          </div>
          <Toggle on={repeat} onChange={setRepeat} label="" ariaLabel="Repeat every month" />
        </div>

        <p className="mt-4 text-[13px] font-bold text-foreground">Who gets the ping</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {friends.map((f) => {
            const on = who.includes(f.id);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setWho((w) => (on ? w.filter((x) => x !== f.id) : [...w, f.id]))}
                className="flex w-14 flex-col items-center gap-1"
              >
                <span className={`rounded-full transition-all ${on ? "ring-[2.5px] ring-primary ring-offset-2 ring-offset-card" : "opacity-40"}`}>
                  <Avatar person={f} size={40} />
                </span>
                <span className="text-[10.5px] text-foreground">{f.short}</span>
                {dues[f.id] > 0 && <span className="-mt-1 text-[9.5px] font-semibold text-secondary">₹{formatINR(dues[f.id])}</span>}
              </button>
            );
          })}
        </div>

        {/* what the squad will see, in the creature's voice */}
        <div className="relative mt-16">
          <div className="pointer-events-none absolute -top-[56px] right-6 h-[58px] w-[96px] overflow-hidden">
            <CreatureHead lookX={lookX} lookY={lookY} />
          </div>
          <div className="pointer-events-none absolute -top-[8px] right-[48px] z-20">
            <CreaturePaws />
          </div>
          <motion.div
            key={preview}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            className="relative z-10 rounded-3xl rounded-tr-md bg-accent px-4 py-3 text-[13px] leading-snug text-accent-foreground"
          >
            {preview}
          </motion.div>
        </div>
      </div>

      <div className="shrink-0 px-5 pb-7 pt-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          disabled={!who.length}
          onClick={() => onSet({ label, repeat, who })}
          className="w-full rounded-full bg-gradient-to-r from-primary to-secondary py-4 text-[14.5px] font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-35 disabled:shadow-none"
        >
          Set reminder · {label}
        </motion.button>
      </div>
    </div>
  );
}

export function ReminderSheet({
  open,
  group,
  splits,
  onClose,
  onSet,
}: {
  open: boolean;
  group: Group;
  splits: Split[];
  onClose: () => void;
  onSet: (r: Reminder) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose}>
      <ReminderBody group={group} splits={splits} onSet={onSet} />
    </Sheet>
  );
}
