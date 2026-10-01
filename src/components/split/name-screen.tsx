"use client";

import { useEffect, useState } from "react";
import { animate, motion, AnimatePresence, useMotionValue } from "framer-motion";
import { StatusBar } from "@/components/status-bar";
import { Avatar } from "@/components/avatar";
import { CreatureHead, CreaturePaws } from "@/components/creature-head";
import { FakeKeyboard, Suggestion } from "@/components/fake-keyboard";
import { ME } from "@/lib/contacts";
import { useSplitStore } from "@/lib/split-store";

const NAME_MAX = 24;

const NAME_SUGGESTIONS: Suggestion[] = [
  { emoji: "🏖️", label: "Goa Trip" },
  { emoji: "🏠", label: "Flat 4B" },
  { emoji: "🍕", label: "Friday Dinner" },
  { emoji: "🥗", label: "Office Lunch" },
  { emoji: "🎬", label: "Movie Night" },
  { emoji: "🎂", label: "Birthday Bash" },
];

const FUN_NAMES: Suggestion[] = [
  { emoji: "💸", label: "The Broke Bunch" },
  { emoji: "☕", label: "Chai & Chill" },
  { emoji: "🍕", label: "Split Happens" },
  { emoji: "💅", label: "Budget Baddies" },
  { emoji: "🍛", label: "Dal Chawal Gang" },
  { emoji: "🧢", label: "No Cap Crew" },
  { emoji: "🦥", label: "Lazy Sunday Club" },
  { emoji: "🌮", label: "Taco 'Bout It" },
];

const EMOJIS = ["🍕", "🏖️", "🏠", "🎉", "✈️", "🎬", "🍻", "☕", "🎂", "🥗", "💸", "💅", "🍛", "🧢", "🦥", "🌮"];

export function NameScreen({ onBack, onCreate }: { onBack: () => void; onCreate: () => void }) {
  const { draft, createGroup } = useSplitStore();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🍕");
  const [typing, setTyping] = useState(true);
  const [flip, setFlip] = useState(0);
  const [rolls, setRolls] = useState(0);
  const [cheer, setCheer] = useState(0);
  const lookX = useMotionValue(0);
  const lookDown = useMotionValue(5);

  const members = [ME, ...draft];

  // eyes follow the end of the name as it's written on the sign
  useEffect(() => {
    const c = animate(lookX, Math.max(-4.5, Math.min(4.5, (name.length - 8) / 2)), { duration: 0.2 });
    return () => c.stop();
  }, [name.length, lookX]);

  useEffect(() => {
    if (!cheer) return;
    const t = setTimeout(() => setCheer(0), 700);
    return () => clearTimeout(t);
  }, [cheer]);

  const applyName = (s: Suggestion) => {
    setName(s.label);
    setEmoji(s.emoji);
    setFlip((f) => f + 1);
    setCheer((c) => c + 1);
  };

  const rollDice = () => {
    const options = FUN_NAMES.filter((f) => f.label !== name);
    applyName(options[Math.floor(Math.random() * options.length)]);
    setRolls((r) => r + 1);
  };

  const create = () => {
    createGroup(name.trim(), emoji);
    onCreate();
  };

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
        <p className="text-[15px] font-semibold text-foreground">Name your squad</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* the creature holds up the squad's name */}
        <div className="flex justify-center pt-16">
          <motion.div
            animate={{ rotate: [-2.5, 1.5, -2.5] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-[272px]"
          >
            <motion.div
              key={`hop-${cheer}`}
              initial={cheer ? { y: -10 } : false}
              animate={{ y: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 12 }}
              className="absolute -top-[58px] left-1/2 -ml-[48px]"
            >
              <CreatureHead lookX={lookX} lookY={lookDown} eyes={cheer ? "happy" : "open"} />
            </motion.div>

            <div className="relative z-10 rounded-[26px] bg-gradient-to-br from-primary to-secondary p-[3px] shadow-xl shadow-primary/25">
              <div className="flex min-h-[112px] items-center justify-center rounded-[23px] bg-card px-6 py-5" style={{ perspective: 600 }}>
                <motion.p
                  key={flip}
                  initial={flip ? { rotateX: -90, opacity: 0 } : false}
                  animate={{ rotateX: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className={`text-center text-[24px] font-extrabold leading-tight ${
                    name ? "text-foreground" : "text-muted-foreground/60"
                  }`}
                >
                  {name || "Your squad name"}
                </motion.p>
              </div>
            </div>

            <span className="absolute -left-3 -top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-card text-[22px] shadow-md ring-2 ring-accent">
              {emoji}
            </span>
            <div className="absolute -top-[8px] left-1/2 z-20 -ml-[24px]">
              <CreaturePaws />
            </div>
          </motion.div>
        </div>

        {/* emoji for the group */}
        <div className="mt-6 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[19px] transition-all active:scale-90 ${
                emoji === e ? "bg-accent ring-2 ring-primary" : "bg-card shadow-sm shadow-black/5"
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        {/* name field + dice */}
        <div className="mx-5 mt-4 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center rounded-2xl bg-card px-4 py-3 shadow-sm shadow-black/5 ring-1 ring-border focus-within:ring-2 focus-within:ring-primary/40">
            <input
              autoFocus
              inputMode="none"
              value={name}
              maxLength={NAME_MAX}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setTyping(true)}
              onKeyDown={(e) => e.key === "Enter" && setTyping(false)}
              placeholder="e.g. Goa Trip"
              className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none"
            />
            <span className="text-[10.5px] tabular-nums text-muted-foreground">
              {name.length}/{NAME_MAX}
            </span>
          </div>
          <motion.button
            type="button"
            onClick={rollDice}
            aria-label="Random name"
            whileTap={{ scale: 0.9 }}
            className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-2xl bg-accent text-[24px]"
          >
            <motion.span
              key={rolls}
              initial={rolls ? { rotate: -540, scale: 0.6, y: -14 } : false}
              animate={{ rotate: 0, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
            >
              🎲
            </motion.span>
          </motion.button>
        </div>

        <div className="mx-5 mt-4 flex items-center gap-2 pb-4">
          <div className="flex -space-x-2">
            {members.slice(0, 5).map((m) => (
              <Avatar key={m.id} person={m} size={26} className="ring-2 ring-background" />
            ))}
          </div>
          <p className="text-[12px] text-muted-foreground">
            {members.length} in the squad · {members.slice(1).map((m) => m.short).join(", ")}
          </p>
        </div>
      </div>

      <div className="shrink-0 px-5 pb-3 pt-2">
        <button
          type="button"
          disabled={!name.trim()}
          onClick={create}
          className="w-full rounded-full bg-gradient-to-r from-primary to-secondary py-4 text-[15px] font-semibold text-white shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-35 disabled:shadow-none"
        >
          Create squad 🎉
        </button>
      </div>

      <AnimatePresence initial={false}>
        {typing && (
          <FakeKeyboard
            key="kb"
            value={name}
            onChange={setName}
            onDone={() => setTyping(false)}
            suggestions={NAME_SUGGESTIONS}
            onSuggestion={applyName}
            maxLength={NAME_MAX}
          />
        )}
      </AnimatePresence>
      {!typing && <div className="h-5 shrink-0" />}
    </div>
  );
}
