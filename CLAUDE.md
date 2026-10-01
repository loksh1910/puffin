@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Fin** is a UI/UX portfolio project: a playful redesign of Paytm's UPI person-to-person (P2P) payment flow, aimed at Gen Z. It's an independent product redesign (inspired by a design-competition brief), not a full Paytm clone. Only specific flows get built, one at a time.

Core insight driving the project: in Paytm and GPay, **splitting a bill with friends is hard to find** (Paytm hides it in messages; GPay makes you pick a friend, then form a group, then split). Payments also feel anxious and clinical. Fin makes paying someone feel **playful, interactive and calming**, including the scary moments (pending, slow, failed).

The owner is a designer, not a developer. They share requirements in chunks and want to finish explaining before being asked questions. Explain technical tradeoffs in plain design terms.

### Scope (from the brief)
Use cases: splitting a restaurant bill, rent to a flatmate (recurring), parent → child in another city, instant send to family/friends.

Planned flows:
1. **Scan & pay** ← *built*
2. **Split-a-bill** ← *built (group creation, itemized vs equal split, tracking who's paid)*
3. Recurring transfer (rent, monthly allowance)
4. Contact quick-send (favorites, recents, QR fallback)
5. Request money

Themes to design well across flows: smart amount suggestions from past transactions, notes/tags that build a mini history, a persistent group ledger (e.g. flatmates), calm failed/pending states, safety friction for new/unverified UPI IDs, and offline/low-network states.

## What's built

The whole app is **frontend-only, with no backend**. Recipients, cards, amounts, chat replies and payments are all mocked client-side. The flow is a single-page state machine inside a phone mockup:

`home → qr-scan → amount → checkout → processing → success → (Done) home`
`home → split-squad → split-name → split-chat` (+ settle-up rejoins `amount`/`checkout`/`processing`/`success`, then returns to `split-chat`)
`home → chats → individual-chat` (+ paying from a 1:1 chat rejoins `amount`/`checkout`/`processing`/`success`, then returns to `individual-chat`)
`home → reminders` (tapping a split reminder jumps straight into that group's `split-chat`)

`recipient` is now a `Person` (`src/lib/split-types.ts`), not a hardcoded "Aditi Sharma" — `amount`/`checkout`/`processing`/`success` all take one as a prop. QR scan uses `QR_RECIPIENT` (Aditi) from `src/lib/contacts.ts`; settle-up passes whoever is owed money on that split.

- **Home**: Paytm-like layout reskinned in pink/purple. There is no hero banner — it was removed (redundant with the quick-actions dock and the Money Transfer grid; nobody would tap a duplicate CTA). Sections top to bottom: **Reminders strip** (collapses away when nothing's pending — see "Reminders" below), **Your Account** (bank balance card), Money Transfer, Pay again (friends), **Responsibilities** (Rent / EMI / Repay loan with due hints + dashed Add, which opens a real sheet), **Frequently paid | Subscriptions** (segmented toggle; everyday vendors with quick-pay pills vs. subscriptions with renewal dates and a monthly total), Recharge & Bills. Only Scan QR, Split with friends, Check Balance, the bell icon (Chats), and the Reminders strip actually navigate; everything else shows a "Coming soon ✨" toast. The home sections live in `src/components/home/`.
  - **Money Transfer** is a 3-col/2-row grid (`ActionButton`, no longer a single flex row): Scan any QR, Split with friends, Pay Anyone, **Bank Transfer**, **Mobile Recharge**, History.
  - **Quick actions** (`quick-actions-dock.tsx`) replace the old floating Scan QR pill. The mascot sleeps at the bottom edge: sleepy ‿ ‿ eyes, snoring mouth, slow breathing, floating "z"s.
  - Tap it and it wakes with a "!" and three actions fan out on a semicircle above it: Split with friends / **Scan QR** (centre, larger, gradient) / Pay anyone. A blurred dim layer covers the page.
  - Tapping the creature again, the dim layer, or an action closes it.
  - A one-time "Psst… tap me for quick pay" nudge shows once per page load.

### Check Balance

- **Home card** (`home/bank-balance-card.tsx`): a card-clipart in the same visual language as the checkout screen's cards (chip, contactless icon, masked digits), representing the linked account — same bank/last4 as the SBI card everywhere else in the app. A badge (top-right, visible without unlocking anything) reads "⚠️ Low balance" or "⚠️ Getting low" — see `src/lib/bank-account.ts`'s `balanceStatus()`, which compares the mock balance against `minBalance` (below it = `"low"`, within 25% above it = `"near"`). A footer bar ("🔒 Check Balance") opens the lock screen.
- **Lock screen** (`balance-lock-screen.tsx`): a 4-digit PIN pad (any 4 digits unlocks, same convention as the payment PIN) or a **fingerprint** button that plays a pulsing-ring scan animation for ~950ms. Either path calls `onUnlock`. No mascot here — deliberately: it's a more private moment than the payment flow, and the joke about peeking is saved for the reveal screen instead.
- **Balance screen** (`balance-screen.tsx`): shows the balance, a **Switch Bank Account** button, a status banner if `"low"`/`"near"`, a **notify-me** card (toggle + suggestion chips ₹500/₹1,000/₹2,000 + **Custom**, which opens a small digit-only keypad and an editable "Below ₹X" pill once set), and a scrollable **transaction history** (`src/lib/transactions.ts`) with a **"View full transaction history →"** stub CTA at the bottom.
  - **`BalancePeeker`** (`balance-peeker.tsx`) peeks over the top of the balance card on an endless loop: curious open eyes glancing at the number (~2s), then it catches itself and **covers its eyes with its paws** (`eyes="covering"`, a new pose on `CreatureHead` — two paw-shaped ellipses drawn directly over the eye sockets, distinct from `CreaturePaws`, which grips edges), with a "Not peeking, promise 🙈" bubble, then back to open. This is the one place in the app where the mascot's peeking is played as *respecting* privacy rather than being nosy.
  - **Multiple linked accounts**: `src/lib/bank-account.ts` exports `BANK_ACCOUNTS` (SBI/HDFC/PNB — `BankAccount = BankCard & {balance, minBalance}`, so the array doubles as valid `CardStack`/`CardFace` input). The home card and the initial lock screen always gate the primary account (`BANK_ACCOUNTS[0]`); switching only happens once inside the unlocked balance screen.
  - **`SwitchAccountSheet`** (`switch-account-sheet.tsx`): a **content-sized `Sheet`, deliberately not `full`.** The whole interaction — creature, cards, PIN pad — is thumb-reachable: it lives in the bottom ~45% of the screen, not spread across it. This was a real correction: the first version used a near-fullscreen sheet and put the draggable cards up near the top, which the user flagged against the standard one-handed-reach chart ("Hard" top third / "Stretch" middle / "Easy" bottom third — see thumb-zone UX principle) as making people stretch their thumb uncomfortably. Keep new sheets content-sized by default; only go `full` when a flow genuinely needs the whole screen (like the 3-step split sheet).
    - Reuses `CardStack` (swipe left/right, drag **up** to pick — same gesture as the checkout screen's card picker) with `kind="Savings Account"` and a shorter `insertThreshold` (55px vs. the default 85) — CardStack now takes this as an optional prop so a "nearby" target needs a shorter drag than a full-screen one.
    - **`ReachingCreature`** (`reaching-creature.tsx`) sits at the top of the sheet at natural size (same 96×78 head as everywhere else — don't shrink it for "compactness"; the height win comes from the sheet, not the character), arms extending down (animated `height` on a div, not path-morphing) when a card is dragged, saying "Give me the card! 🙌" → "Almost there… 👀".
    - Dropping a card flies it up toward the creature, then a compact 4-digit PIN pad (any digits work, same convention as the rest of the app) appears in the same low position; completing it calls `onSelect`, swaps the account shown on the balance screen, and resets the notify-me state (a different account may want a different threshold).
- **QR scan**: simulated camera. A mock QR code sits blurry behind the viewfinder while a scan line sweeps, then snaps into focus. It auto-detects after 2.2s, or on tap.
- **Amount**: a custom keypad plus a **calculator row (+ − × ÷)**.
  - Typing `20×5` shows a live "= ₹100" and the Pay button pays the result.
  - Evaluation is in `src/lib/calc.ts`: correct operator precedence, 2-decimal rounding, divide-by-zero handling, and **never `eval`**. The ₹1,00,000 UPI limit is enforced.
  - Quick-amount chips ("based on what you usually send") show when you're not in calculator mode.
  - Desktop viewers can type digits and operators on their real keyboard.
- **Note**: an "Add a note" pill grows (Framer `layout`) into an input. A **fake phone keyboard** (`fake-keyboard.tsx`) slides up in place of the keypad.
  - Predictive suggestion chips (🍕 Food, 🎬 Movie, 🏠 Rent…) filter as you type and replace the partial word.
  - The note travels to the success screen.
  - The input uses `inputMode="none"` so real phones don't open a second, native keyboard.
- **Checkout**: the signature interaction. A POS card machine sits above a fanned stack of 3 cards (SBI, HDFC, PNB).
  - Swipe the front card left/right to switch cards; drag it **up** to insert it. The card flies into the slot and a swipe animation plays through the reader.
  - Below the cards is a dashed secondary **"+ Add another card"** button, which shows a "coming soon" toast for now.
  - **Card picking:** the creature (`craning-creature.tsx`) peeks up from the screen's bottom edge with paws on the ledge. It's the same dome-headed character as on the machine.
    - It rises on tiptoes now and then to see the cards. While a card is dragged it stretches up with an open-mouthed "ooh", pushes with its paws, and its pupils follow the drag offset (`CardStack` → `onDragMove`/`onDragStateChange`).
    - It does a little hop when the active card changes.
    - It lives in a `flex-1 overflow-hidden` slot at the bottom of the stage and measures that slot. On short screens it rises less instead of getting its ears clipped or covering the button.
  - **PIN step**: the machine zooms in, scaling to fit the space available, and shows the amount and PIN dots.
  - The header back arrow becomes **✕**, which cancels and returns to the amount page with amount and note kept.
  - A bank row under the machine shows the card, with a **Change** button that returns to the card stack and clears the PIN.
  - The machine's own keys also work: digits, red ✕ = cancel, yellow ‹ = delete. Green ✓ doesn't pay; it makes the creature wiggle and ask to be swiped.
  - **The creature is the app's hero/mascot.** While you type the PIN it shimmies left and right along the machine's top edge. It waddles, its paws go hand-over-hand, and its pupils stay locked on the machine screen via `useTransform` of its x position. When the PIN is complete it ducks with closed eyes and says "I saw nothing, promise 🙈".
  - **Swipe to pay** (`swipe-to-pay.tsx`) is the only way to pay. About 1.3s after the PIN is complete (`HOP_DELAY`), the creature drops off the machine (`gone`) and arcs into the slider's dashed seat as `CreatureBall`.
    - **Idle:** it nudges right every couple of seconds. Tapping instead of dragging makes it wiggle and say "Hold me & swipe →".
    - **Dragging:** it lifts, leans with drag velocity and opens its mouth, and a light trail fills in behind it.
    - **Past 82%:** it gets excited and the trail becomes the full brand gradient.
    - **Released early:** it springs back.
    - **Completed:** "Sending ₹X…" appears and it does a victory hop.
    - Deleting a PIN digit sends it back up to the machine. The keyboard fallback is Enter/Space on the focused thumb.
- **Processing** (~3.8s): the creature walks a dotted arc from "You" to Aditi's avatar with a ₹ coin balanced on its head.
  - A gradient trail fills behind it as the progress bar, via `pathLength`, while cycling calming messages ("Breathe in… breathe out…") run underneath.
  - On arrival the coin drops into Aditi's avatar, "+₹X" floats up, and the creature switches to its happy face.
  - The route is a quadratic bezier in the file; the creature's position and lean are computed from it.
- **Success**: a check-mark draw with a confetti burst, the amount paid, the note, and a UPI ref. The creature pops up beside the tick, bouncing with raised paws (`CreatureBall cheer`), next to a "Delivered! 💜" bubble. On a normal payment, Done goes home; after a **settle-up** payment it records the settlement and returns to the squad chat instead (`PayFlow.finishPayment`).

No failure branch exists yet; payments always succeed. The failed/pending states from the brief are future work.

### Split with friends

Tying metaphor: **the bill is a pizza the creature slices.** Everything under `src/components/split/` and the shared `SplitProvider` in `src/lib/split-store.tsx` (holds the in-progress squad, the current group, chat log, and all splits; wraps the whole app in `src/app/page.tsx`).

1. **Squad screen** (`squad-screen.tsx`): a "huddle" — dashed empty seats around a table, the creature peeking over the top. Tapping a contact seats them with a spring; tapping a seated person un-seats them (keyed by person id, so the rest re-flow). Search matches name/UPI; a raw UPI ID that isn't a contact shows a **safety card** ("⚠️ New to you — not in your contacts") before it can be added, per the brief's safety-friction requirement.
   - **No cap on squad size.** Only the first `HUDDLE_SEATS` (6, i.e. you + 5 friends) get a seat at the table — past that, the rest render as a plain removable chip list below it ("+N more in the squad"). The circular table just doesn't stay legible past ~6 faces; the group itself can be any size. Don't reintroduce a hard block on adding people — if the huddle ever needs to show more, grow the chip list, not a numeric limit.
2. **Name screen** (`name-screen.tsx`): the creature holds up a sign; the name renders on it live, with a 3D flip on each change. Suggestion chips, or a 🎲 that rolls a random fun name (`FUN_NAMES`). Creates the group via `createGroup` (you + everyone seated) and seeds the chat with join messages.
3. **Chat room** (`split-room.tsx` wraps `chat-screen.tsx` + three sheets): normal chat bubbles, a fake-keyboard with quick-reply suggestions, and a **₹ Split** pill by the composer. Friends "reply" on a timer (`CANNED` lines) to keep the room feeling alive. Empty state: the creature dozes at the bottom, "Tap ₹ Split and I'll slice it up 🍕". The header's calendar icon (**top right**, not left — deliberately not clashing with the back arrow) opens the reminder sheet.
4. **Split sheet** (`split-sheet.tsx`, a 3-step full-height `Sheet`):
   - **Step 1 — amount & payer.** The shared `CalcKeypad` (extracted from the amount screen; also used here and works the same way, `+ − × ÷` + real-keyboard support via `useCalcKeyboard`). "Paid by" is chips for a single payer, or toggle **Multiple people paid** for a per-person amount list with a live colour-coded stacked bar toward the total. A `Judge` (creature) sweats 💧 while amounts don't add up and beams once they do.
   - **Step 2 — how to split.** A `PizzaChart` (`pizza-chart.tsx`) re-slices live with springs as you change things. Four modes, `SplitMode` in `split-types.ts`: **Equally** (tap to include/exclude), **Amounts** (per-person exact amounts, tap-to-focus + calc keypad), **Shares** (± stepper, e.g. "Rahul had 2 drinks"), **%** (sliders, must sum to 100). All math is in `src/lib/split-math.ts` — `computeSplit` returns `{owed, valid, remaining}`; `distribute` does a largest-remainder split in paise so shares always sum to the exact total (no rounding leaks). `split-math.ts` is pure and was verified with 9 standalone Node test cases before wiring in (operator precedence, exclusion, shares ratio, %, exact-amount balancing, divide-by-zero, rounding).
   - **Step 3 — note + confirm.** Same note pattern as the amount screen. **Split expense** triggers the "Sliced!" payoff: the pizza's slices burst apart (`explode` prop) with a cutter-swoosh SVG animation, while each involved member's avatar flies out to its own position holding its ₹ share, then the sheet closes and a `SplitCard` drops into the chat.
5. **Split card in chat** (`split-card.tsx`): pizza thumbnail, note, total, payer(s), a row of avatars with **status rings** (`Avatar` component: solid ring + ✓ badge = paid, dashed ring = pending), a progress bar ("2 of 4 settled"), and your position — "You get back ₹X" / "You owe ₹X · **Pay**" / "You're square ✓". `split-room.tsx` auto-settles one member a few seconds after a split is created (`later()` timers) so the "who's paid" progress visibly moves, matching the demo requirement.
6. **Details sheet** (`details-sheet.tsx`): full per-member breakdown (paid / share / net), **👋 Nudge** (posts a chat line, the person "replies" and auto-settles after a delay) and **💵** mark-as-paid-in-cash per pending member. If *you* owe, **Settle up** routes into the existing pay flow (`checkout` → `processing` → `success`) with the creditor as recipient, then returns here. When everyone's settled: confetti burst + the creature cheering + "All settled 🎉".
7. **Reminder sheet** (`reminder-sheet.tsx`): quick chips (Tomorrow / This weekend / In 3 days) or a real mini month calendar, a time chip row, a **Repeat every month** toggle (for rent), per-friend selection (defaults to whoever still owes across the group's splits), and a live preview bubble of the message in the creature's voice. Posts a system line and puts a dot on the calendar icon.

A chat room can hold **multiple independent splits** simultaneously — each `Split` is tracked separately in the store by id, so settling one doesn't touch another.

`split-store.tsx` is **multi-group**: `groups: Record<string, GroupRecord>` + `groupOrder: string[]` (most-recently-opened first) + `openGroup(id)`, seeded with two demo squads ("🏠 Flat 4B", "🍕 Weekend Squad"). `group`/`chat`/`splits`/`reminder` are still exposed flat, mirroring whichever group `currentGroupId` points at, so `SplitRoom` and its children needed zero changes when this went multi-group. `squad-screen.tsx` shows a horizontally-scrollable **"Recently formed groups"** row (from `groupOrder`) above the huddle — tapping one calls `onOpenExisting(id)` and skips straight to that group's chat instead of rebuilding a squad.

### Chats hub & individual pay

The bell icon on Home opens **`chats-screen.tsx`**: a **Group** / **Individual** segmented tab. Group lists every squad from `groupOrder` with a live last-message preview; tapping one opens that group's `split-chat`. Individual lists 1:1 threads with **All / Your contacts / Other** filter chips — "Other" means `person.unverified` (added by raw UPI, not a saved contact; see `personFromUpi`) — plus a **+** button opening a lightweight contact-picker sheet to start a new thread with anyone in `CONTACTS`.

`split-store.tsx` also owns `individualChats: Record<personId, ChatItem[]>` and `individualPeople: Record<personId, Person>` (so a chat can exist with someone who isn't in `contacts.ts`), plus `postIndividual`/`startIndividualChat`. **`individual-chat-screen.tsx`** mirrors `chat-screen.tsx`'s bubble/typing-indicator/canned-reply pattern but posts to `postIndividual`, and its composer has a **₹ Pay** pill instead of **₹ Split**. Tapping Pay reuses the *same* `amount → checkout → processing → success` flow as everything else in `pay-flow.tsx` — `PayFlow` tracks a 3-way `origin: "qr" | "settle" | "individual"` (no more boolean flags) so back-buttons and `finishPayment` route back to the right screen (`individual-chat` posts a "Paid ₹X ✅" message + a canned thank-you reply) instead of always going home.

### Reminders

One unified feed across three domains, surfaced so a user sees what's about to be charged **before** they make another payment — see `src/lib/reminder-types.ts` (`ReminderItem`, `ReminderCategory`, `ReminderStatus`) and `src/lib/reminders.ts` (`statusOf`, `dueDateLabel`, `sortByUrgency`). `src/lib/use-reminders.ts` is a `useReminders()` hook (no arguments — due dates are resolved once at each store's own mount, not per call) that merges:
- **Responsibilities** — `responsibilities-store.tsx`'s `items`, each with a real `dueDate: Date | null`, `frequency: "once" | "monthly"`, a `payee: Person` (who gets paid — see below), and a `paid` flag (`markPaid(id)`).
- **Subscriptions** — `subscriptions-store.tsx`'s `items` (a real `SubscriptionsProvider`, not static data — see below).
- **Splits** — derived live from `split-store.tsx`: any split where `owed["me"] > 0` becomes a reminder ("You owe ₹X to [group]"), `completed` mirrors `settled["me"]`. These have no due date (`dueDate: null`) unless a real one is added later.

**Autopay never fails in this mock — but only if it's actually on.** `statusOf` keys off `item.autopay` (not category): an overdue item with `autopay: true` becomes `"completed"` (charged), everything else overdue-and-unpaid becomes `"expired"`. Since a subscription's `autopay` can be turned off (see below), a manual subscription behaves exactly like a responsibility once it's overdue. Items with no due date always sort last (`sortByUrgency`).

`home/reminders-strip.tsx` shows the top 3 non-completed items (soonest first) above the bank balance card, with a **View all** CTA — and renders nothing at all when the list is empty, by design (see the placement discussion below). **`reminders-screen.tsx`** (`FlowStep: "reminders"`) is the full page: search → 3-way type tabs (Responsibilities/Subscriptions/Splits) → two **`FilterDropdown`** popovers (`src/components/filter-dropdown.tsx`, a small reusable pill-button-that-opens-a-popover — labeled "Status" for All/Upcoming/Completed/Expired and "Frequency" for All/Monthly/Yearly; these were originally chip rows, replaced with dropdowns because the user found the chip clutter excessive) → list. **Every row is tappable, in every tab** — a responsibility row opens `ResponsibilityDetailSheet`, a subscription row opens `SubscriptionDetailSheet` (see below), a split row jumps into that group's chat (`onOpenGroup`). There's no separate inline quick-action pill on the row anymore; the detail sheet is the one place actions happen.

**Responsibility detail overlay** (`home/responsibility-detail-sheet.tsx`): opens from *either* a Home Responsibilities grid tile or a Reminders-page row (same sheet, same component, reused). Content-sized sheet showing due date, **payee** (avatar + name, from `item.payee`), amount, and a CTA. If `amount` is set, the CTA reads "Pay ₹X" and routes into the real pay flow (`PayFlow.startPayResponsibility(item, from)` — sets `origin: "responsibility"`, skips the amount-entry screen entirely since the amount's already fixed, same as settle-up does, straight to `checkout`); on success it calls `markPaid` and returns to wherever the flow started (see "returnStep" below). If `amount` is null, the CTA reads "Mark as paid" and calls `markPaid` directly with no payment flow. Every responsibility needs a payee: the 3 seeded ones use `personFromName("Deepak Verma")` (Rent), `personFromName("HDFC Bank")` (EMI), and the real `arjun` contact (Repay loan, since that's money owed to a friend, not an institution); anything added via `AddResponsibilitySheet` has a required **"Who do you pay?"** field alongside the label, turned into a `Person` via `personFromName`. `personFromName` (in `contacts.ts`) is the by-name sibling of `personFromUpi` — same muted "unverified" gradient treatment for a payee that isn't a saved contact.

**Subscriptions are a real store now** (`subscriptions-store.tsx`, `SubscriptionsProvider`/`useSubscriptions`, wraps `<PayFlow>` in `app/page.tsx` alongside the other two providers) — not static data, because each `Subscription` now carries mutable `autopay: boolean` (`setAutopay(id, on)`) and `paid: boolean` (`markPaid(id)`, only meaningful once autopay is off). Seeded: Netflix/Spotify/Amazon Prime start `autopay: true`, Gym membership starts `autopay: false` (so both branches of the detail sheet have a real example on first load). **`home/subscription-detail-sheet.tsx`** opens only from a Reminders-page Subscriptions row (never leads to a chat) and shows two mutually-exclusive views inside the same sheet (swapped via local `view` state, not a second `Sheet`): if `autopay` is on, an info view plus a **"Remove autopay"** button that swaps to a confirmation view ("Turn off autopay for X? ... Cancel / Turn off") before actually calling `setAutopay(id, false)`; if `autopay` is off, the same info view instead shows a **"Pay ₹X"** CTA that routes into the real pay flow via `PayFlow.startPaySubscription`, which invents a `Person` recipient with `personFromName(item.label)` since a subscription has no real payee/contact. **Gotcha already hit here**: the sheet must look up its `item` live from the store by id every render (`subscriptions.find(s => s.id === selectedId)`), not hold a snapshot object in `useState` — "Remove autopay" mutates the store in place *without closing the sheet*, so a snapshot goes stale and the sheet keeps showing "Autopay: On" even after the list behind it has already updated. `ResponsibilityDetailSheet`'s selection doesn't need this because every one of its mutations closes the sheet.

**Returning to where you came from**: because both detail sheets are now reachable from two different screens (Home *or* Reminders, for responsibilities; Reminders only, for subscriptions), `PayFlow` tracks a `returnStep: "home" | "reminders"` alongside `origin`, set by whichever screen calls `startPayResponsibility`/`startPaySubscription`. On success (or on back from checkout) it returns to `returnStep`, not a hardcoded screen — don't reintroduce a hardcoded `goHome()` for these two origins.

**Placement decision**: the reminders strip sits *above* the balance card, not below it. Reasoning kept for future work — a reminder has a shrinking shelf life (only useful before the next payment, worthless right after), while the balance card is stable, checkable-anytime status; the thing meant to change what you do next outranks the thing that's just informational. Don't move it back below the balance card without re-litigating this.

## Commands

```bash
npm run dev      # dev server (Turbopack), http://localhost:3000
npm run build    # production build + TypeScript check
npm run lint     # ESLint (flat config). Note: `next build` no longer lints in Next 16
```

Run `npm run build` and `npm run lint` before calling a change done. There is no test suite.

**Preview in Claude's browser pane:** `preview_start {name: "fin-dev"}`. The preview tool reads `.claude/launch.json` from the folder the *session was started in*:
- Sessions started in this repo use the local config (port 3000).
- Sessions started in the Loku AI Project folder use a `fin-dev` entry in Loku's `launch.json`, which runs this app on **port 3001** via `npm --prefix`.

Never use `loku-web`; that config serves a different project.

## Stack

Next.js **16** (App Router, Turbopack) + React 19.2 + TypeScript + Tailwind CSS v4 + **Framer Motion** (all animation and gestures). There's no shadcn/ui and no component library: every visual is hand-built with divs and inline SVG.

Next 16 differs from older Next.js. See `AGENTS.md`, and read `node_modules/next/dist/docs/` before using framework APIs. Notable changes: Turbopack is the default, `params`/`searchParams` are async-only, `next lint` is removed, and `middleware` is renamed `proxy`. None of these matter yet because the app is one static client-rendered route.

## Architecture

- `src/app/page.tsx`: renders `<PhoneFrame><PayFlow/></PhoneFrame>`.
- `src/components/pay-flow.tsx`: the flow state machine (`FlowStep` in `src/lib/types.ts`). It holds `step` and `amount`, and screens transition with `AnimatePresence`.
- `src/components/screens/*`: one file per step of the pay flow. Checkout keeps its own sub-phases (`select | inserting | swiping | zoom-pin`).
- `src/components/split/*`: the split-with-friends flow — see "Split with friends" above for what each file does.
- `src/lib/split-store.tsx`: `SplitProvider`/`useSplitStore` — the squad-in-progress, current `Group`, chat log, and all `Split`s. Wraps `<PayFlow>` in `src/app/page.tsx`.
- `src/lib/split-math.ts`: pure split calculation (`computeSplit`, `distribute`, `netFor`) — no React, testable standalone.
- `src/lib/contacts.ts`: mock contact list, `ME`, `QR_RECIPIENT`, and `personFromUpi` for the "add by raw UPI ID" path.
- `src/components/avatar.tsx`: gradient-initials avatar used everywhere a person appears, with an optional `status` ring (`paid` | `pending`).
- `src/components/sheet.tsx`: the bottom-sheet shell (`Sheet`) used by all three split sheets. `full` makes it near-fullscreen (the 3-step split sheet); otherwise it sizes to content.
- `src/components/calc-keypad.tsx`: `CalcKeypad` + `useCalcKeyboard`, extracted from the amount screen so the split sheet's amount/per-person fields reuse the exact same calculator.
- `src/components/toggle.tsx`: the pill switch used for "Multiple people paid" and "Repeat every month".
- `src/components/chats-screen.tsx`, `src/components/individual-chat-screen.tsx`: the bell-icon Chats hub and 1:1 chat screen — see "Chats hub & individual pay" above.
- `src/lib/reminder-types.ts`, `src/lib/reminders.ts`, `src/lib/use-reminders.ts`: the unified reminders feed — see "Reminders" above.
- `src/components/reminders-screen.tsx`, `src/components/home/reminders-strip.tsx`: the full reminders page and the home-screen preview strip.
- `src/components/filter-dropdown.tsx`: `FilterDropdown`, a small reusable pill-button-that-opens-a-popover, used for the Reminders page's Status/Frequency filters.
- `src/lib/responsibilities-store.tsx`: `ResponsibilitiesProvider`/`useResponsibilities` — the Home Responsibilities grid's data (real `dueDate`s, `payee`, `markPaid`), wraps `<PayFlow>` alongside `SplitProvider` in `src/app/page.tsx`.
- `src/lib/subscriptions-store.tsx`: `SubscriptionsProvider`/`useSubscriptions` — mutable `autopay`/`paid` per subscription, also wraps `<PayFlow>`.
- `src/components/home/responsibility-detail-sheet.tsx`, `src/components/home/subscription-detail-sheet.tsx`: the bottom-up detail overlays — see "Reminders" above for exactly how each works.
- `src/components/home/add-responsibility-sheet.tsx`: the "+Add" sheet on Home Responsibilities (emoji, label, **"Who do you pay?"**, optional amount, due-date chips + `mini-calendar.tsx`, monthly-repeat toggle).
- `src/components/mini-calendar.tsx`: the month-grid calendar (no past dates, today ringed) shared by the reminder sheet and the add-responsibility sheet.
- `src/lib/date.ts`: tiny date helpers (`startOfDay`, `addDays`, `fmtDay`) shared by anything that needs relative due-date math — see gotcha below on why these must be called per-render, never at module scope.
- `src/components/phone-frame.tsx`: design artboard is **432×880**. On ≥640px it renders as a device mockup scaled to fit the viewport; below 640px it goes full-bleed like a native app. It also renders a fake translucent touch cursor that follows the real mouse (`cursor: "none"` on the frame box + a ring `div` positioned from `pointermove`, same scale-correction as `transformPagePoint`) — added so screen recordings of the prototype show a finger-tap-style indicator instead of a desktop arrow. Skipped entirely on real touch devices (`matchMedia("(pointer: coarse)")`). The ring uses `mix-blend-difference`, not a flat translucent fill — a flat white circle looked fine on the pink page background but nearly vanished on the balance card's purple gradient; blend-difference guarantees contrast against any background color underneath.
- `src/components/pos-machine.tsx`, `card-stack.tsx`, `bank-card.tsx`: the checkout illustration pieces.
- Mascot:
  - **`creature-head.tsx` is the canonical character art**: dome head with flat sides that continue as its body, plus `CreaturePaws`. Its props are `eyes` (`open | happy | sleepy | covering`) and `mouth` (`smile | ooh | snore`). Anywhere it peeks over an edge must use it: `peeking-creature.tsx` over the machine, `craning-creature.tsx` up from the card screen's bottom edge, `home/quick-actions-dock.tsx` asleep on Home, and `balance-peeker.tsx` over the balance card. The user rejected a round-headed variant there as "looking like a cat", so don't redraw the character per screen. Pupils are steered by `lookX`/`lookY` motion values.
  - `creature-ball.tsx` is a rounder full-body variant, still used for the swipe thumb, loading courier and success cheer. Props: `mood` (`idle | dragging | armed | happy`), `gaze` and `cheer`.
  - Colours come from `CREATURE` in `creature-ball.tsx`.
- `src/components/fake-keyboard.tsx`: the on-screen QWERTY keyboard with note suggestions.
- `src/lib/calc.ts`: calculator input rules (`nextExpr`) and evaluation. It's pure, so it can be tested directly with Node, e.g. `node file.ts`, since Node 24 strips types natively.
- `src/lib/format.ts`: `formatINR` (Indian digit grouping: ₹1,00,000) and `noteLabel`.
- `src/components/toast.tsx`: `useToast()` for lightweight "coming soon" feedback.
- `src/lib/cards-data.ts`: the 3 mock bank cards.
- `src/lib/bank-account.ts` / `src/lib/transactions.ts`: the mock linked accounts (`BANK_ACCOUNTS`, min balance, `balanceStatus()`) and transaction history behind Check Balance.

## Design tokens

Light mode only. The brand is a **pink + purple** gradient. Tokens live in `src/app/globals.css` (`--primary: #9333ea` purple, `--secondary: #ff5fa2` pink, plus `accent`, `muted`, `success`, `danger`, etc.) and are exposed through Tailwind's `@theme inline`. Use the token classes (`bg-primary`, `text-muted-foreground`, `from-primary to-secondary`) rather than raw hex. Illustration-specific colours (creature purples, machine key colours) are the exception and live in their components. Font: Plus Jakarta Sans (`--font-jakarta`). The overall feel is rounded (`rounded-2xl`/`3xl`), soft shadows tinted purple, and springy motion.

## Gotchas (already hit, don't rediscover)

1. **Scaled frame vs. drag gestures.** `PhoneFrame` scales the whole device with CSS `transform`, which throws off Framer Motion drag distances. It wraps the app in `<MotionConfig transformPagePoint>` to map pointer coords back into frame space. Keep that in place, or card drag thresholds break on smaller screens.
2. **Screens with timers take callbacks in effect deps** (`onDetected`, `onComplete`, `onDone`). `PayFlow` passes `useCallback`-stable functions; inline arrows would restart the timers on every parent render.
3. **The creature's head is clipped by an `overflow-hidden` box that ends just below the machine's top edge**, so it only ever appears "over the wall". Its paws render in a separate layer *in front of* the machine. If you move or resize the machine, re-check both layers and the speech bubble position.
4. **The card drop → fly-in handoff.** The draggable stack card and the flying card are separate elements, both absolutely positioned in the same box. The flying card starts at the drop offset so there's no visual jump. Don't put them in normal document flow, or they stack during the exit animation.
5. The first visit to a screen in `next dev` can render blank for a second while Turbopack compiles. That's not a bug.
6. **Global CSS must go inside `@layer base`.** Unlayered rules in `globals.css` beat every Tailwind utility regardless of specificity. For example, an unlayered `:focus-visible` outline couldn't be turned off with `focus-visible:outline-none`.
7. **Measure with `offset*` sizes, not `getBoundingClientRect`** (`src/lib/use-element-size.ts`). Both the phone frame and the machine zoom use CSS `scale`, which skews bounding rects.
8. **Fake-keyboard keys call `preventDefault` on `pointerdown`.** This keeps focus (and the caret) in the note input. Remove it and every key tap blurs the input.
9. The browser pane's console log isn't cleared by reloads. Check the DOM before chasing an error that might be stale.
10. **Never put `initial={false}` on `PayFlow`'s `AnimatePresence`.** It propagates through the presence context to every motion element on the first screen, including ones that mount later. Keyframe/`repeat: Infinity` animations there then snap to their last frame and never run. This froze the sleeping creature and the hero coins on first load.
11. **Testing held drags:** the pane's drag action releases instantly, so to inspect a mid-drag state (slider "armed", creature straining), dispatch a synthetic `pointerdown` on the element plus `pointermove`s on `window`, then screenshot. Framer listens for moves on `window`, so if the user's real mouse is over the pane it can hijack the drag.
12. **Seat/list items in the squad huddle are keyed by person id, not by seat index.** Rendering one `<motion.button>` per fixed seat and swapping its child in place breaks add/remove animations and can desync from state entirely. Render one `AnimatePresence`-tracked element per *person*, each animating to its seat's `{x, y}`; removing someone then lets the rest re-flow correctly.
13. **`react-hooks/immutability` (an ESLint rule here) forbids reassigning a loop accumulator inside `.map()` during render**, e.g. building pie-slice start/end angles with a running `acc`. Compute each element's offset from a prefix-sum instead (`sweeps.slice(0, i).reduce(...)`).
14. **When a peeking creature has paws or a speech bubble, they must be siblings of the head's clipping box, never children of it.** The clipping box (`overflow-hidden`, sized to show only the head) is deliberately short; a paw or bubble positioned with a negative offset relative to *that same box* gets hard-clipped by it, producing a visible straight-edge artifact. `peeking-creature.tsx` gets this right (paws/bubble are separate top-level elements); an early version of `balance-peeker.tsx` nested them inside the clipping box by mistake and produced exactly this artifact — matched a screenshot the user sent, don't reintroduce it.
15. **`Toggle`'s knob (`src/components/toggle.tsx`) needs an explicit `left-0` class, not just `top-0.5`.** Its container `span` is a `relative` **inline** element (a bare `<span>`), and an absolutely-positioned child with no `left`/`right` set falls back to CSS's "static position" algorithm instead of anchoring to the container's edge — Framer Motion's `animate={{x: ...}}` then offsets from that wrong baseline, so the knob renders shifted right even when `off` (and can overflow the track). This was a real, reproducible bug (confirmed via `getBoundingClientRect`, not a testing artifact — a prior note here wrongly concluded the opposite from a same-call-timing false read; trust `getBoundingClientRect` reads called in their own dedicated call, just not ones read immediately after a scripted click in the *same* call). Fixed by adding `left-0` alongside `top-0.5`. Any new absolutely-positioned toggle knob needs both axes anchored, matching Loku's `left-0.5 top-0.5` pattern.
16. **Synthetic drag distances must account for `PhoneFrame`'s scale.** A scripted drag of N screen pixels moves N/scale pixels in the frame's own coordinate space (that's what `transformPagePoint` in `phone-frame.tsx` is for — it applies to real pointer events too). At a typical desktop-preview scale (~0.85), a 50px on-screen drag can cross an 55px-in-frame-space threshold. Don't conclude a threshold is broken from a screen-pixel test without converting first.
17. **A test script's own earlier actions can look like app bugs.** When manually driving the browser pane through a long flow, a split/payment created a few steps back for testing purposes (e.g. to force a "you owe money" state) will still be sitting in the chat later and can be mistaken for a phantom/duplicate. Check what you did before concluding something is broken.
18. **Never compute `new Date()` (or anything derived from it, like `addDays(today, n)`) at module scope in a file that seeds a store or static data** (this bit `responsibilities-store.tsx`'s and `subscriptions-store.tsx`'s seed data). A module-level constant is evaluated once per server process and then cached — the moment real time crosses midnight past whenever that process last (re)compiled, the server's stale "today" diverges from the client's freshly-computed one, and React throws a hydration mismatch (the tree gets torn down and rebuilt, which can also make in-flight clicks land on the wrong element right after). Fix: store relative offsets (`dueInDays: number`) in the static data, and resolve them to real `Date`s only inside a `useState(() => ...)` lazy initializer or `useMemo` in the *consuming* component/hook — that re-runs fresh per mount, which is what already keeps `reminder-sheet.tsx`/`squad-screen.tsx`/`mini-calendar.tsx` safe.
19. **Both the browser pane's screenshot and its console-message history can lag behind the actual DOM after a fast navigation.** A screenshot taken immediately after a click can show the *previous* screen (mid-transition or just stale), and `read_console_messages` can keep returning old errors that already stopped happening — including surviving a full dev-server restart and a `.next` cache wipe. If a screenshot or console output looks wrong right after an action, verify against `get_page_text`/`read_page` (which reflect the live DOM) before concluding the app is broken or a fix didn't take.
20. **A concrete hit of gotcha #6**: setting `bg-white` on `<body>` in `layout.tsx` silently did nothing — `globals.css` has an unlayered `body { background: var(--background); }` rule that always wins over a Tailwind utility class regardless of source order. `--background` (`#fff8fc`) is also the *phone's own* screen background (`PhoneFrame` applies `bg-background` to its own box), so the fix wasn't to change that shared token — it was to edit the unlayered `body` rule's `background` value directly, and drop the now-dead `bg-white` class from `layout.tsx`. If a `<body>`/global background change via a Tailwind class silently has no effect, check `globals.css` for an unlayered rule on that selector before assuming the class didn't apply.
21. **A detail sheet driven by `useState<T | null>(item)` goes stale if the sheet can mutate that same item's store data without closing.** `subscription-detail-sheet.tsx`'s "Remove autopay" flips `autopay` in the store and swaps the sheet to its own info view (no close) — with a snapshot object in state, the list behind it updated correctly but the open sheet kept showing "Autopay: On" (the true underlying bug, not a stale screenshot this time). Fixed by storing only the id (`selectedSubscriptionId`) and deriving the item fresh every render via `subscriptions.find(s => s.id === id)`. `ResponsibilityDetailSheet`'s `useState<Responsibility | null>` snapshot is fine as-is because every one of its actions closes the sheet before the underlying data could go stale — if a future action there stops closing the sheet, convert it to the same id-lookup pattern first.
