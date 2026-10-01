"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBar } from "@/components/status-bar";
import { Sheet } from "@/components/sheet";
import { Avatar } from "@/components/avatar";
import { CONTACTS } from "@/lib/contacts";
import { useSplitStore } from "@/lib/split-store";
import type { ChatItem } from "@/lib/split-types";

type Tab = "group" | "individual";
type Filter = "all" | "contacts" | "other";

function preview(chat: ChatItem[]): string {
  const last = chat.at(-1);
  if (!last) return "Say hi 👋";
  if (last.kind === "split") return "🍕 Split added";
  if (last.kind === "system") return last.text;
  return last.from === "me" ? `You: ${last.text}` : last.text;
}

function NewChatSheet({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = q ? CONTACTS.filter((c) => c.name.toLowerCase().includes(q) || c.upi.toLowerCase().includes(q)) : CONTACTS;

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="shrink-0 px-5 pb-1 pt-3 text-[17px] font-bold text-foreground">New chat</p>
        <div className="mx-5 mt-2 flex shrink-0 items-center gap-2 rounded-2xl bg-muted px-3.5 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-muted-foreground">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            inputMode="none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none"
          />
        </div>
        <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-5 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onPick(p.id);
                setQuery("");
              }}
              className="-mx-2 flex w-[calc(100%+16px)] items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors active:bg-accent/60"
            >
              <Avatar person={p} size={42} />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[14px] font-semibold text-foreground">{p.name}</p>
                <p className="truncate text-[11.5px] text-muted-foreground">{p.upi}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

export function ChatsScreen({
  onBack,
  onOpenGroup,
  onOpenIndividual,
}: {
  onBack: () => void;
  onOpenGroup: (groupId: string) => void;
  onOpenIndividual: (personId: string) => void;
}) {
  const { groupOrder, groups, individualChats, individualPeople, startIndividualChat } = useSplitStore();
  const [tab, setTab] = useState<Tab>("group");
  const [filter, setFilter] = useState<Filter>("all");
  const [pickerOpen, setPickerOpen] = useState(false);

  const individualIds = Object.keys(individualChats).filter((id) => individualPeople[id]);
  const filteredIndividual = individualIds.filter((id) => {
    if (filter === "all") return true;
    const p = individualPeople[id];
    return filter === "contacts" ? !p.unverified : !!p.unverified;
  });

  const openNewChat = (personId: string) => {
    const person = CONTACTS.find((c) => c.id === personId);
    if (person) startIndividualChat(person);
    setPickerOpen(false);
    onOpenIndividual(personId);
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
        <p className="flex-1 text-[16px] font-bold text-foreground">Chats</p>
        {tab === "individual" && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-label="New chat"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-primary transition-transform active:scale-90"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="mx-5 mt-3 flex shrink-0 rounded-full bg-muted p-1">
        {(["group", "individual"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`relative flex-1 rounded-full py-2 text-[12.5px] font-semibold ${tab === t ? "text-foreground" : "text-muted-foreground"}`}
          >
            {tab === t && (
              <motion.span layoutId="chats-tab-pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} className="absolute inset-0 rounded-full bg-card shadow-sm" />
            )}
            <span className="relative">{t === "group" ? "Group" : "Individual"}</span>
          </button>
        ))}
      </div>

      {tab === "individual" && (
        <div className="mt-2.5 flex shrink-0 gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(
            [
              ["all", "All"],
              ["contacts", "Your contacts"],
              ["other", "Other"],
            ] as const
          ).map(([f, text]) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all ${
                filter === f ? "bg-gradient-to-r from-primary to-secondary text-white shadow-sm shadow-primary/25" : "bg-muted text-foreground"
              }`}
            >
              {text}
            </button>
          ))}
        </div>
      )}

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <AnimatePresence mode="wait" initial={false}>
          {tab === "group" ? (
            <motion.div key="group" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {groupOrder.length === 0 && (
                <p className="py-10 text-center text-[13px] text-muted-foreground">No groups yet — split a bill to start one 🍕</p>
              )}
              {groupOrder.map((id) => {
                const rec = groups[id];
                if (!rec) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onOpenGroup(id)}
                    className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors active:bg-accent/50"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-[22px]">{rec.group.emoji}</span>
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate text-[14px] font-semibold text-foreground">{rec.group.name}</p>
                      <p className="truncate text-[12px] text-muted-foreground">{preview(rec.chat)}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{rec.group.members.length} members</span>
                  </button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div key="individual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {filteredIndividual.length === 0 && (
                <p className="py-10 text-center text-[13px] text-muted-foreground">No chats here yet</p>
              )}
              {filteredIndividual.map((id) => {
                const p = individualPeople[id];
                const chat = individualChats[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onOpenIndividual(id)}
                    className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors active:bg-accent/50"
                  >
                    <Avatar person={p} size={48} />
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate text-[14px] font-semibold text-foreground">{p.name}</p>
                      <p className="truncate text-[12px] text-muted-foreground">{preview(chat)}</p>
                    </div>
                    {p.unverified && <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">UPI</span>}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <NewChatSheet open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={openNewChat} />
    </div>
  );
}
