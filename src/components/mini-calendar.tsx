"use client";

import { useState } from "react";
import { startOfDay } from "@/lib/date";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

// A compact month grid — no past dates, today ringed, selected day filled. Shared by the
// reminder sheet and the add-responsibility sheet so the two don't drift apart.
export function MiniCalendar({ selected, onSelect }: { selected: Date; onSelect: (d: Date) => void }) {
  const [today] = useState(() => startOfDay(new Date()));
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));

  const firstWeekday = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];
  const canGoBack = month > new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div className="rounded-3xl bg-muted/60 p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <button
          type="button"
          disabled={!canGoBack}
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          aria-label="Previous month"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-card text-primary disabled:opacity-30"
        >
          ‹
        </button>
        <p className="text-[13px] font-bold text-foreground">
          {month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          aria-label="Next month"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-card text-primary"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="text-[10.5px] font-semibold text-muted-foreground">
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const past = d < today;
          const isSelected = sameDay(d, selected);
          const isToday = sameDay(d, today);
          return (
            <button key={i} type="button" disabled={past} onClick={() => onSelect(d)} className="flex h-8 items-center justify-center">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[12.5px] font-semibold transition-all ${
                  isSelected
                    ? "bg-gradient-to-br from-primary to-secondary text-white shadow-md shadow-primary/30"
                    : past
                      ? "text-muted-foreground/40"
                      : isToday
                        ? "text-primary ring-1 ring-primary/40"
                        : "text-foreground"
                }`}
              >
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
