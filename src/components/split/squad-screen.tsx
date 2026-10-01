"use client";

import { useEffect, useState } from "react";
import { animate, motion, AnimatePresence, useMotionValue } from "framer-motion";
import { StatusBar } from "@/components/status-bar";
import { Avatar } from "@/components/avatar";
import { CreatureHead, CreaturePaws } from "@/components/creature-head";
import { FakeKeyboard } from "@/components/fake-keyboard";
import { CONTACTS, ME, RECENT_IDS, personFromUpi } from "@/lib/contacts";
import { useSplitStore } from "@/lib/split-store";
import type { Person } from "@/lib/split-types";

// The circular table only has room to stay legible for so many faces. There's no cap on
// squad size itself — past this many, the rest overflow into a plain chip list below it.
const HUDDLE_SEATS = 6;
// seats around the table, as angles on an ellipse (0° = right, 90° = straight up); first seat is you
const ARC_START = 200;
const ARC_END = -20;
const SEAT_ANGLES = Array.from(
  { length: HUDDLE_SEATS },
  (_, i) => ARC_START + ((ARC_END - ARC_START) * i) / (HUDDLE_SEATS - 1)
);
const RX = 150;
const RY = 118;
const TABLE_Y = 176;
const UPI_PATTERN = /^[\w.-]{2,}@[a-z]{2,}$/i;

const seatPos = (i: number) => {
  const rad = (SEAT_ANGLES[i] * Math.PI) / 180;
  return { x: Math.cos(rad) * RX, y: TABLE_Y - Math.sin(rad) * RY, rad };
};

type Reaction = { kind: "add" | "remove"; n: number } | null;

export function SquadScreen({
  onBack,
  onNext,
  onOpenExisting,
}: {
  onBack: () => void;
  onNext: () => void;
  onOpenExisting: (groupId: string) => void;
}) {
  const { draft, toggleDraft, groupOrder, groups } = useSplitStore();
  const [query, setQuery] = useState("");
  const [typing, setTyping] = useState(false);
  const [reaction, setReaction] = useState<Reaction>(null);
  const lookX = useMotionValue(0);
  const lookY = useMotionValue(-2);

  const seated = [ME, ...draft];
  const huddle = seated.slice(0, HUDDLE_SEATS);
  const overflow = draft.slice(HUDDLE_SEATS - 1);
  const isIn = (p: Person) => draft.some((d) => d.id === p.id);

  useEffect(() => {
    if (!reaction) return;
    const t = setTimeout(() => setReaction(null), 800);
    return () => clearTimeout(t);
  }, [reaction]);

  const toggle = (p: Person) => {
    const adding = !isIn(p);
    toggleDraft(p);
    setReaction((r) => ({ kind: adding ? "add" : "remove", n: (r?.n ?? 0) + 1 }));
    // glance at the seat that just changed — anyone past the huddle just gets a glance at the last seat
    const seatIndex = Math.min(
      adding ? draft.length + 1 : Math.max(1, draft.findIndex((d) => d.id === p.id) + 1),
      HUDDLE_SEATS - 1
    );
    const seat = seatPos(seatIndex);
    animate(lookX, Math.cos(seat.rad) * 4.5, { duration: 0.25 });
    animate(lookY, -Math.sin(seat.rad) * 4, { duration: 0.25 });
  };

  const q = query.trim().toLowerCase();
  const results = q
    ? CONTACTS.filter((c) => c.name.toLowerCase().includes(q) || c.upi.toLowerCase().includes(q))
    : CONTACTS;
  const recents = RECENT_IDS.map((id) => CONTACTS.find((c) => c.id === id)!);
  const unknownUpi =
    UPI_PATTERN.test(query.trim()) && !CONTACTS.some((c) => c.upi.toLowerCase() === q) ? personFromUpi(query.trim()) : null;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 pt-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-primary transition-transform active:scale-90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="leading-tight">
          <p className="text-[15px] font-semibold text-foreground">Build your squad</p>
          <p className="text-[11.5px] text-muted-foreground">Who&apos;s splitting with you?</p>
        </div>
      </div>

      {/* jump straight back into a squad you've already built, instead of rebuilding it */}
      {groupOrder.length > 0 && (
        <div className="mt-3 shrink-0">
          <p className="mb-1.5 px-5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Recently formed groups
          </p>
          <div className="flex gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {groupOrder.map((id) => {
              const rec = groups[id];
              if (!rec) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onOpenExisting(id)}
                  className="flex shrink-0 items-center gap-2 rounded-2xl bg-accent/70 py-2 pl-2 pr-3.5 transition-transform active:scale-95"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-[17px]">{rec.group.emoji}</span>
                  <div className="text-left leading-tight">
                    <p className="text-[13px] font-semibold text-foreground">{rec.group.name}</p>
                    <div className="mt-0.5 flex -space-x-1.5">
                      {rec.group.members.slice(0, 3).map((m) => (
                        <Avatar key={m.id} person={m} size={15} className="ring-[1.5px] ring-accent" />
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* the huddle: everyone gathers round the table */}
      <div className="relative mx-auto h-[244px] w-full shrink-0">
        <div className="absolute left-1/2" style={{ top: TABLE_Y }}>
          {/* creature peeks over the table from behind */}
          <motion.div
            key={reaction?.kind === "add" ? `hop-${reaction.n}` : "still"}
            initial={reaction?.kind === "add" ? { y: -10 } : false}
            animate={reaction?.kind === "remove" ? { x: [0, -5, 5, -3, 0], y: 0 } : { x: 0, y: 0 }}
            transition={{ x: { duration: 0.4 }, y: { type: "spring", stiffness: 420, damping: 12 } }}
            className="absolute -left-[48px] -top-[90px]"
          >
            <CreatureHead
              lookX={lookX}
              lookY={lookY}
              eyes={reaction?.kind === "add" ? "happy" : "open"}
              mouth={reaction?.kind === "remove" ? "ooh" : "smile"}
            />
          </motion.div>

          <div className="absolute -left-[90px] -top-[31px] z-10 flex h-[62px] w-[180px] items-center justify-center rounded-[50%] bg-gradient-to-b from-[#f3e6fd] to-[#dcc4f5] shadow-[inset_0_-6px_0_rgba(120,60,170,0.15),0_10px_20px_-8px_rgba(90,30,140,0.35)]">
            <span className="text-[22px]">🍕</span>
          </div>
          <div className="absolute -left-[24px] -top-[40px] z-20">
            <CreaturePaws />
          </div>
        </div>

        {SEAT_ANGLES.map((_, i) => {
          const { x, y } = seatPos(i);
          return (
            <div
              key={i}
              className="absolute left-1/2 top-0 z-20 -ml-[23px] -mt-[23px] h-[46px] w-[46px] rounded-full border-2 border-dashed border-primary/20"
              style={{ transform: `translate(${x}px, ${y}px)` }}
            />
          );
        })}

        {/* people are keyed by who they are, not by seat, so when someone leaves the rest shuffle up */}
        <AnimatePresence>
          {huddle.map((person, i) => {
            const { x, y } = seatPos(i);
            return (
              <motion.button
                key={person.id}
                type="button"
                disabled={person.id === "me"}
                onClick={() => toggle(person)}
                aria-label={person.id === "me" ? "You" : `Remove ${person.short}`}
                initial={{ x, y: y + 50, scale: 0.3, opacity: 0 }}
                animate={{ x, y, scale: 1, opacity: 1 }}
                exit={{ scale: 1.6, opacity: 0, transition: { duration: 0.25 } }}
                transition={{ type: "spring", stiffness: 340, damping: 20 }}
                className="absolute left-1/2 top-0 z-30 -ml-[23px] -mt-[23px] h-[46px] w-[46px]"
              >
                <Avatar person={person} size={46} className="shadow-md" />
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* past the table, everyone else just gets a chip — still tappable to remove */}
      {overflow.length > 0 && (
        <div className="mx-5 mb-3 shrink-0">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            +{overflow.length} more in the squad
          </p>
          <div className="flex flex-wrap gap-2">
            {overflow.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p)}
                aria-label={`Remove ${p.short}`}
                className="flex items-center gap-1.5 rounded-full bg-accent py-1 pl-1 pr-2.5 transition-transform active:scale-95"
              >
                <Avatar person={p} size={24} />
                <span className="text-[12px] font-semibold text-foreground">{p.short}</span>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" className="text-primary">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* search */}
      <div className="mx-5 flex shrink-0 items-center gap-2 rounded-2xl bg-card px-3.5 py-3 shadow-sm shadow-black/5 ring-1 ring-border">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-muted-foreground">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          inputMode="none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setTyping(true)}
          onKeyDown={(e) => e.key === "Enter" && setTyping(false)}
          placeholder="Search name, number or UPI ID"
          className="min-w-0 flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} className="text-[12px] font-semibold text-muted-foreground">
            Clear
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {!q && (
          <>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Recent</p>
            <div className="mb-4 flex gap-4">
              {recents.map((p) => (
                <button key={p.id} type="button" onClick={() => toggle(p)} className="flex w-14 flex-col items-center gap-1">
                  <span className="relative">
                    <Avatar person={p} size={48} />
                    <AnimatePresence>
                      {isIn(p) && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-primary"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  <span className="text-[11px] text-foreground">{p.short}</span>
                </button>
              ))}
            </div>
            <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Contacts</p>
          </>
        )}

        {/* safety friction for a UPI ID we've never seen */}
        {unknownUpi && (
          <div className="mb-3 rounded-2xl border border-warning/40 bg-[#fff8e8] p-3">
            <div className="flex items-center gap-3">
              <Avatar person={unknownUpi} size={40} />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[13px] font-semibold text-foreground">{unknownUpi.upi}</p>
                <p className="text-[11px] font-medium text-[#a16207]">⚠️ New to you — not in your contacts</p>
              </div>
            </div>
            <p className="mt-2 text-[11.5px] text-muted-foreground">
              Double-check the UPI ID with them before adding. Money sent to the wrong ID is hard to get back.
            </p>
            <button
              type="button"
              onClick={() => {
                toggle(unknownUpi);
                setQuery("");
              }}
              className="mt-2.5 w-full rounded-xl bg-card py-2 text-[12.5px] font-semibold text-[#a16207] ring-1 ring-warning/40 active:scale-[0.98]"
            >
              {isIn(unknownUpi) ? "Added" : "I've checked — add anyway"}
            </button>
          </div>
        )}

        {results.map((p) => {
          const selected = isIn(p);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p)}
              className={`-mx-2 flex w-[calc(100%+16px)] items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors ${
                selected ? "bg-accent/70" : ""
              }`}
            >
              <Avatar person={p} size={42} />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[14px] font-semibold text-foreground">{p.name}</p>
                <p className="truncate text-[11.5px] text-muted-foreground">{p.upi}</p>
              </div>
              <motion.span
                animate={{ scale: selected ? [1, 1.25, 1] : 1 }}
                transition={{ duration: 0.3 }}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  selected ? "bg-gradient-to-br from-primary to-secondary text-white" : "bg-accent text-primary"
                }`}
              >
                {selected ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
              </motion.span>
            </button>
          );
        })}

        {q && !results.length && !unknownUpi && (
          <p className="py-6 text-center text-[13px] text-muted-foreground">
            No one called “{query}”. Try their UPI ID, like name@okhdfc
          </p>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {typing ? (
          <FakeKeyboard key="kb" value={query} onChange={setQuery} onDone={() => setTyping(false)} suggestions={[]} />
        ) : (
          <motion.div
            key="cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20, transition: { duration: 0.1 } }}
            className="shrink-0 px-5 pb-8 pt-2"
          >
            <button
              type="button"
              disabled={!draft.length}
              onClick={onNext}
              className="w-full rounded-full bg-gradient-to-r from-primary to-secondary py-4 text-[15px] font-semibold text-white shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-35 disabled:shadow-none"
            >
              {draft.length ? `Next · ${draft.length + 1} in the squad` : "Add at least one friend"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
