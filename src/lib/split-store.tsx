"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ChatItem, Group, Person, Reminder, Split } from "./split-types";
import { ME, findContact, personFromUpi } from "./contacts";
import { initialSettled } from "./split-math";

type NewChatItem =
  | { kind: "system"; text: string }
  | { kind: "message"; from: string; text: string };

export type GroupRecord = {
  group: Group;
  chat: ChatItem[];
  splits: Record<string, Split>;
  reminder: Reminder | null;
};

// A couple of squads that already existed before this session, so "recently formed" and the
// group chat list have something real to show on first load.
const SEED_GROUPS: Record<string, GroupRecord> = {
  g_flat4b: {
    group: { name: "Flat 4B", emoji: "🏠", members: [ME, findContact("rahul")!, findContact("neha")!] },
    chat: [
      { id: "s1", kind: "system", text: "You created 🏠 Flat 4B" },
      { id: "s2", kind: "system", text: "Rahul & Neha joined the squad" },
      { id: "s3", kind: "message", from: "rahul", text: "rent due kal hai guys 👀" },
      { id: "s4", kind: "split", splitId: "sp1" },
    ],
    splits: {
      sp1: {
        id: "sp1",
        total: 18000,
        note: "🏠 Rent",
        mode: "equal",
        paid: { me: 18000 },
        owed: { me: 6000, rahul: 6000, neha: 6000 },
        settled: { me: true, rahul: true, neha: false },
      },
    },
    reminder: null,
  },
  g_weekend: {
    group: { name: "Weekend Squad", emoji: "🍕", members: [ME, findContact("aditi")!, findContact("priya")!] },
    chat: [
      { id: "s5", kind: "system", text: "You created 🍕 Weekend Squad" },
      { id: "s6", kind: "system", text: "Aditi & Priya joined the squad" },
      { id: "s7", kind: "message", from: "aditi", text: "movie tonight? 🎬" },
    ],
    splits: {},
    reminder: null,
  },
};
const SEED_GROUP_ORDER = ["g_weekend", "g_flat4b"];

// a UPI-only contact (not in CONTACTS) to seed the "Other" filter chip in the chats hub
const CHAIWALA = personFromUpi("rajukirana@paytm");

// Mock 1:1 "chats" — not tied to a group. Keyed by person id.
const SEED_INDIVIDUAL_PEOPLE: Record<string, Person> = {
  aditi: findContact("aditi")!,
  rahul: findContact("rahul")!,
  mom: findContact("mom")!,
  [CHAIWALA.id]: CHAIWALA,
};
const SEED_INDIVIDUAL_CHATS: Record<string, ChatItem[]> = {
  aditi: [
    { id: "i1", kind: "message", from: "aditi", text: "thanks for splitting that! 🍕" },
    { id: "i2", kind: "message", from: "me", text: "np, same time next week? 😄" },
  ],
  rahul: [{ id: "i3", kind: "message", from: "rahul", text: "bhai rent kal bhejta hoon" }],
  mom: [{ id: "i4", kind: "message", from: "mom", text: "beta paisa mil gaya, thank you ❤️" }],
  [CHAIWALA.id]: [{ id: "i5", kind: "message", from: CHAIWALA.id, text: "Order ready whenever you are! ☕" }],
};

type SplitStore = {
  draft: Person[];
  toggleDraft: (p: Person) => void;
  startSquad: () => void;

  groupOrder: string[]; // most recently opened/created first
  groups: Record<string, GroupRecord>;
  createGroup: (name: string, emoji: string) => void;
  openGroup: (id: string) => void;

  // the currently open group, mirrored flat for convenience — same shape the screens always used
  currentGroupId: string | null;
  group: Group | null;
  chat: ChatItem[];
  post: (item: NewChatItem) => void;
  splits: Record<string, Split>;
  addSplit: (split: Omit<Split, "id" | "settled">) => string;
  settle: (splitId: string, personId: string) => void;
  reminder: Reminder | null;
  setReminder: (r: Reminder | null) => void;

  individualChats: Record<string, ChatItem[]>;
  individualPeople: Record<string, Person>;
  postIndividual: (personId: string, item: NewChatItem) => void;
  startIndividualChat: (p: Person) => void;
};

const Ctx = createContext<SplitStore | null>(null);

export function useSplitStore() {
  const store = useContext(Ctx);
  if (!store) throw new Error("useSplitStore must be used inside SplitProvider");
  return store;
}

const firstNames = (people: Person[]) => {
  const names = people.map((p) => p.short);
  return names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} & ${names.at(-1)}`;
};

export function SplitProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<Person[]>([]);
  const [groups, setGroups] = useState<Record<string, GroupRecord>>(SEED_GROUPS);
  const [groupOrder, setGroupOrder] = useState<string[]>(SEED_GROUP_ORDER);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [individualChats, setIndividualChats] = useState<Record<string, ChatItem[]>>(SEED_INDIVIDUAL_CHATS);
  const [individualPeople, setIndividualPeople] = useState<Record<string, Person>>(SEED_INDIVIDUAL_PEOPLE);
  const counter = useRef(0);
  const nextId = useCallback(() => `c${++counter.current}`, []);

  const toggleDraft = useCallback((p: Person) => {
    setDraft((d) => (d.some((x) => x.id === p.id) ? d.filter((x) => x.id !== p.id) : [...d, p]));
  }, []);

  const startSquad = useCallback(() => setDraft([]), []);

  const createGroup = useCallback(
    (name: string, emoji: string) => {
      const id = nextId();
      const record: GroupRecord = {
        group: { name, emoji, members: [ME, ...draft] },
        chat: [
          { id: nextId(), kind: "system", text: `You created ${emoji} ${name}` },
          { id: nextId(), kind: "system", text: `${firstNames(draft)} joined the squad` },
        ],
        splits: {},
        reminder: null,
      };
      setGroups((all) => ({ ...all, [id]: record }));
      setGroupOrder((order) => [id, ...order.filter((x) => x !== id)]);
      setCurrentGroupId(id);
    },
    [draft, nextId]
  );

  const openGroup = useCallback((id: string) => {
    setCurrentGroupId(id);
    setGroupOrder((order) => [id, ...order.filter((x) => x !== id)]);
  }, []);

  const updateCurrent = useCallback(
    (fn: (rec: GroupRecord) => GroupRecord) => {
      setGroups((all) => {
        if (!currentGroupId || !all[currentGroupId]) return all;
        return { ...all, [currentGroupId]: fn(all[currentGroupId]) };
      });
    },
    [currentGroupId]
  );

  const post = useCallback(
    (item: NewChatItem) => updateCurrent((rec) => ({ ...rec, chat: [...rec.chat, { ...item, id: nextId() }] })),
    [updateCurrent, nextId]
  );

  const addSplit = useCallback(
    (s: Omit<Split, "id" | "settled">) => {
      const id = nextId();
      const settled = initialSettled(s, Object.keys(s.owed).concat(Object.keys(s.paid)));
      const split: Split = { ...s, id, settled };
      updateCurrent((rec) => ({
        ...rec,
        splits: { ...rec.splits, [id]: split },
        chat: [...rec.chat, { id: nextId(), kind: "split", splitId: id }],
      }));
      return id;
    },
    [updateCurrent, nextId]
  );

  const settle = useCallback(
    (splitId: string, personId: string) =>
      updateCurrent((rec) => {
        const s = rec.splits[splitId];
        if (!s) return rec;
        return { ...rec, splits: { ...rec.splits, [splitId]: { ...s, settled: { ...s.settled, [personId]: true } } } };
      }),
    [updateCurrent]
  );

  const setReminder = useCallback((r: Reminder | null) => updateCurrent((rec) => ({ ...rec, reminder: r })), [updateCurrent]);

  const postIndividual = useCallback(
    (personId: string, item: NewChatItem) =>
      setIndividualChats((all) => ({ ...all, [personId]: [...(all[personId] ?? []), { ...item, id: nextId() }] })),
    [nextId]
  );

  const startIndividualChat = useCallback((p: Person) => {
    setIndividualPeople((all) => (all[p.id] ? all : { ...all, [p.id]: p }));
    setIndividualChats((all) => (all[p.id] ? all : { ...all, [p.id]: [] }));
  }, []);

  const current = currentGroupId ? groups[currentGroupId] : null;

  const value = useMemo(
    () => ({
      draft,
      toggleDraft,
      startSquad,
      groupOrder,
      groups,
      createGroup,
      openGroup,
      currentGroupId,
      group: current?.group ?? null,
      chat: current?.chat ?? [],
      post,
      splits: current?.splits ?? {},
      addSplit,
      settle,
      reminder: current?.reminder ?? null,
      setReminder,
      individualChats,
      individualPeople,
      postIndividual,
      startIndividualChat,
    }),
    [
      draft,
      toggleDraft,
      startSquad,
      groupOrder,
      groups,
      createGroup,
      openGroup,
      currentGroupId,
      current,
      post,
      addSplit,
      settle,
      setReminder,
      individualChats,
      individualPeople,
      postIndividual,
      startIndividualChat,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
