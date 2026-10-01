"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { StatusBar } from "@/components/status-bar";
import { Avatar } from "@/components/avatar";
import { CreatureHead, CreaturePaws } from "@/components/creature-head";
import { FakeKeyboard, Suggestion } from "@/components/fake-keyboard";
import { useSplitStore } from "@/lib/split-store";
import type { Person } from "@/lib/split-types";

const QUICK_REPLIES: Suggestion[] = [
  { emoji: "😂", label: "lol" },
  { emoji: "🙌", label: "On it" },
  { emoji: "💸", label: "Paying now" },
  { emoji: "🙏", label: "Thanks!" },
  { emoji: "👍", label: "Sounds good" },
];

const CANNED = ["haha okay 😂", "sure thing!", "sounds good 👍", "got it, thanks!", "😄", "will do!"];

function TypingBubble({ person }: { person: Person }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-end gap-2">
      <Avatar person={person} size={28} />
      <div className="flex gap-1 rounded-2xl rounded-bl-md bg-card px-3.5 py-3 shadow-sm shadow-black/5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function IndividualChatScreen({ person, onBack, onPay }: { person: Person; onBack: () => void; onPay: () => void }) {
  const { individualChats, postIndividual } = useSplitStore();
  const chat = individualChats[person.id] ?? [];
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [typingReply, setTypingReply] = useState(false);
  const [pending, setPending] = useState<{ text: string } | null>(null);
  const replyTurn = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sleepyX = useMotionValue(0);
  const sleepyY = useMotionValue(0);

  useEffect(() => {
    if (!pending) return;
    const showTyping = setTimeout(() => setTypingReply(true), 500);
    const deliver = setTimeout(() => {
      setTypingReply(false);
      postIndividual(person.id, { kind: "message", from: person.id, text: pending.text });
      setPending(null);
    }, 1800);
    return () => {
      clearTimeout(showTyping);
      clearTimeout(deliver);
    };
  }, [pending, postIndividual, person.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.length, typingReply, typing]);

  const send = (message: string) => {
    const clean = message.trim();
    if (!clean) return;
    postIndividual(person.id, { kind: "message", from: "me", text: clean });
    setText("");
    setPending({ text: CANNED[replyTurn.current % CANNED.length] });
    replyTurn.current += 1;
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#fbf6fe]">
      <div className="shrink-0 bg-card shadow-[0_2px_12px_rgba(60,20,90,0.06)]">
        <StatusBar />
        <div className="flex items-center gap-3 px-4 pb-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary transition-transform active:scale-90"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <Avatar person={person} size={40} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[15px] font-semibold text-foreground">{person.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{person.upi}</p>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        onClick={() => setTyping(false)}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <AnimatePresence initial={false}>
          {chat.map((item) => {
            if (item.kind !== "message") return null;
            const mine = item.from === "me";
            return (
              <motion.div
                key={item.id}
                layout="position"
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              >
                {mine ? (
                  <div className="flex justify-end">
                    <p className="max-w-[75%] rounded-2xl rounded-br-md bg-gradient-to-br from-primary to-secondary px-3.5 py-2 text-[14px] text-white shadow-sm shadow-primary/20">
                      {item.text}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    <Avatar person={person} size={28} />
                    <p className="max-w-[75%] rounded-2xl rounded-bl-md bg-card px-3.5 py-2 text-[14px] text-foreground shadow-sm shadow-black/5">
                      {item.text}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
          {typingReply && <TypingBubble key="typing" person={person} />}
        </AnimatePresence>

        {!chat.length && !typingReply && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-auto flex justify-center pt-14"
          >
            <div className="relative w-[230px]">
              <div className="absolute -top-[52px] left-1/2 -ml-[48px]">
                <motion.div animate={{ y: [0, 2, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}>
                  <CreatureHead lookX={sleepyX} lookY={sleepyY} eyes="sleepy" mouth="snore" />
                </motion.div>
              </div>
              <div className="relative z-10 rounded-3xl bg-card px-5 py-4 text-center shadow-md shadow-black/5">
                <p className="text-[13.5px] font-semibold text-foreground">Say hi to {person.short} 👋</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">Or tap ₹ Pay to send them money</p>
              </div>
              <div className="absolute -top-[8px] left-1/2 z-20 -ml-[24px]">
                <CreaturePaws />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="shrink-0 bg-card px-3 pb-3 pt-2.5 shadow-[0_-2px_12px_rgba(60,20,90,0.06)]">
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={() => {
              setTyping(false);
              onPay();
            }}
            whileTap={{ scale: 0.92 }}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-secondary pl-3 pr-4 text-[14px] font-bold text-white shadow-md shadow-primary/30"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-[13px]">₹</span>
            Pay
          </motion.button>
          <div className="flex h-11 min-w-0 flex-1 items-center rounded-full bg-muted px-4">
            <input
              inputMode="none"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setTyping(true)}
              onKeyDown={(e) => e.key === "Enter" && send(text)}
              placeholder={`Message ${person.short}…`}
              className="min-w-0 flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none"
            />
          </div>
          <AnimatePresence>
            {text.trim() && (
              <motion.button
                type="button"
                initial={{ scale: 0, width: 0 }}
                animate={{ scale: 1, width: 44 }}
                exit={{ scale: 0, width: 0 }}
                onClick={() => send(text)}
                aria-label="Send"
                className="flex h-11 shrink-0 items-center justify-center rounded-full bg-foreground text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 12l16-8-6 16-2.5-6.5L4 12z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {typing && (
          <FakeKeyboard
            key="kb"
            value={text}
            onChange={setText}
            onDone={() => (text.trim() ? send(text) : setTyping(false))}
            suggestions={QUICK_REPLIES}
            onSuggestion={(s) => send(`${s.label} ${s.emoji}`)}
            maxLength={120}
            doneLabel="Send"
          />
        )}
      </AnimatePresence>
      {!typing && <div className="h-5 shrink-0 bg-card" />}
    </div>
  );
}
