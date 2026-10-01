"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { StatusBar } from "@/components/status-bar";
import { Avatar } from "@/components/avatar";
import { CreatureHead, CreaturePaws } from "@/components/creature-head";
import { FakeKeyboard, Suggestion } from "@/components/fake-keyboard";
import { useSplitStore } from "@/lib/split-store";
import type { ChatItem, Person } from "@/lib/split-types";

const QUICK_REPLIES: Suggestion[] = [
  { emoji: "😂", label: "lol" },
  { emoji: "🙌", label: "On it" },
  { emoji: "💸", label: "Paying now" },
  { emoji: "🙏", label: "Thanks!" },
  { emoji: "👀", label: "Who's in?" },
];

const CANNED = ["haha okay 😂", "fr fr", "say less 🫡", "count me in!", "👀👀", "wait what 😭"];

type Pending = { from: string; text: string };

function TypingBubble({ person }: { person: Person }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-end gap-2"
    >
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

export function ChatScreen({
  onBack,
  onSplit,
  onReminder,
  renderSplit,
}: {
  onBack: () => void;
  onSplit: () => void;
  onReminder: () => void;
  renderSplit: (splitId: string) => React.ReactNode;
}) {
  const { group, chat, post, reminder, splits } = useSplitStore();
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [typingFrom, setTypingFrom] = useState<string | null>(null);
  // a fresh squad gets a hello from the first friend
  const [pending, setPending] = useState<Pending | null>(() =>
    group && chat.length <= 2 && group.members[1]
      ? { from: group.members[1].id, text: "yayyy finally a group 🎉" }
      : null
  );
  const replyTurn = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sleepyX = useMotionValue(0);
  const sleepyY = useMotionValue(0);

  useEffect(() => {
    if (!pending) return;
    const showTyping = setTimeout(() => setTypingFrom(pending.from), 700);
    const deliver = setTimeout(() => {
      setTypingFrom(null);
      post({ kind: "message", from: pending.from, text: pending.text });
      setPending(null);
    }, 2200);
    return () => {
      clearTimeout(showTyping);
      clearTimeout(deliver);
    };
  }, [pending, post]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.length, typingFrom, typing]);

  if (!group) return null;
  const friends = group.members.slice(1);
  const byId = (id: string) => group.members.find((m) => m.id === id);
  const hasSplits = Object.keys(splits).length > 0;

  const send = (message: string) => {
    const clean = message.trim();
    if (!clean) return;
    post({ kind: "message", from: "me", text: clean });
    setText("");
    const friend = friends[replyTurn.current % friends.length];
    setPending({ from: friend.id, text: CANNED[replyTurn.current % CANNED.length] });
    replyTurn.current += 1;
  };

  const renderItem = (item: ChatItem) => {
    if (item.kind === "system") {
      return (
        <div className="flex justify-center">
          <span className="rounded-full bg-muted px-3 py-1 text-center text-[11.5px] text-muted-foreground">{item.text}</span>
        </div>
      );
    }
    if (item.kind === "split") return renderSplit(item.splitId);
    const mine = item.from === "me";
    const sender = byId(item.from);
    if (mine) {
      return (
        <div className="flex justify-end">
          <p className="max-w-[75%] rounded-2xl rounded-br-md bg-gradient-to-br from-primary to-secondary px-3.5 py-2 text-[14px] text-white shadow-sm shadow-primary/20">
            {item.text}
          </p>
        </div>
      );
    }
    return (
      <div className="flex items-end gap-2">
        {sender && <Avatar person={sender} size={28} />}
        <div className="max-w-[75%]">
          <p className="mb-0.5 ml-1 text-[10.5px] font-medium text-muted-foreground">{sender?.short}</p>
          <p className="rounded-2xl rounded-bl-md bg-card px-3.5 py-2 text-[14px] text-foreground shadow-sm shadow-black/5">{item.text}</p>
        </div>
      </div>
    );
  };

  const typer = typingFrom ? byId(typingFrom) : null;

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
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-[20px]">{group.emoji}</span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[15px] font-semibold text-foreground">{group.name}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {group.members.slice(0, 4).map((m) => (
                  <Avatar key={m.id} person={m} size={16} className="ring-[1.5px] ring-card" />
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground">{group.members.length} members</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onReminder}
            aria-label="Set a reminder"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary transition-transform active:scale-90"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
              <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
              <path d="M3.5 10h17M8 3v4M16 3v4" />
              <circle cx="12" cy="15" r="1.3" fill="currentColor" stroke="none" />
            </svg>
            {reminder && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-accent bg-secondary"
              />
            )}
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onClick={() => setTyping(false)}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <AnimatePresence initial={false}>
          {chat.map((item) => (
            <motion.div
              key={item.id}
              layout="position"
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            >
              {renderItem(item)}
            </motion.div>
          ))}
          {typer && <TypingBubble key="typing" person={typer} />}
        </AnimatePresence>

        {!hasSplits && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-auto flex justify-center pt-14"
          >
            <div className="relative w-[250px]">
              <div className="absolute -top-[52px] left-1/2 -ml-[48px]">
                <motion.div animate={{ y: [0, 2, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}>
                  <CreatureHead lookX={sleepyX} lookY={sleepyY} eyes="sleepy" mouth="snore" />
                </motion.div>
              </div>
              <div className="relative z-10 rounded-3xl bg-card px-5 py-4 text-center shadow-md shadow-black/5">
                <p className="text-[13.5px] font-semibold text-foreground">Paid for something?</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Tap <span className="font-bold text-primary">₹ Split</span> and I&apos;ll slice it up for the squad 🍕
                </p>
              </div>
              <div className="absolute -top-[8px] left-1/2 z-20 -ml-[24px]">
                <CreaturePaws />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* composer */}
      <div className="shrink-0 bg-card px-3 pb-3 pt-2.5 shadow-[0_-2px_12px_rgba(60,20,90,0.06)]">
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={() => {
              setTyping(false);
              onSplit();
            }}
            whileTap={{ scale: 0.92 }}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-secondary pl-3 pr-4 text-[14px] font-bold text-white shadow-md shadow-primary/30"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-[13px]">₹</span>
            Split
          </motion.button>
          <div className="flex h-11 min-w-0 flex-1 items-center rounded-full bg-muted px-4">
            <input
              inputMode="none"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setTyping(true)}
              onKeyDown={(e) => e.key === "Enter" && send(text)}
              placeholder="Message the squad…"
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
