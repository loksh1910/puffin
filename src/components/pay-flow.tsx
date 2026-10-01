"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FlowStep } from "@/lib/types";
import { ToastProvider } from "@/components/toast";
import { HomeScreen } from "@/components/screens/home-screen";
import { QRScanScreen } from "@/components/screens/qr-scan-screen";
import { AmountScreen } from "@/components/screens/amount-screen";
import { CheckoutScreen } from "@/components/screens/checkout-screen";
import { ProcessingScreen } from "@/components/screens/processing-screen";
import { SuccessScreen } from "@/components/screens/success-screen";
import { SquadScreen } from "@/components/split/squad-screen";
import { NameScreen } from "@/components/split/name-screen";
import { SplitRoom, SettleUpRequest } from "@/components/split/split-room";
import { BalanceLockScreen } from "@/components/screens/balance-lock-screen";
import { BalanceScreen } from "@/components/screens/balance-screen";
import { ChatsScreen } from "@/components/chats-screen";
import { IndividualChatScreen } from "@/components/individual-chat-screen";
import { RemindersScreen } from "@/components/reminders-screen";
import { useSplitStore } from "@/lib/split-store";
import { useResponsibilities } from "@/lib/responsibilities-store";
import { useSubscriptions } from "@/lib/subscriptions-store";
import { QR_RECIPIENT, personFromName } from "@/lib/contacts";
import { formatINR } from "@/lib/format";
import type { Person } from "@/lib/split-types";
import type { Responsibility } from "@/lib/responsibilities-store";
import type { Subscription } from "@/lib/subscriptions-store";

type Origin = "qr" | "settle" | "individual" | "responsibility" | "subscription";
// which screen to return to once a responsibility/subscription payment finishes or is cancelled
type ReturnStep = "home" | "reminders";

export function PayFlow() {
  const { startSquad, settle, post, openGroup, individualPeople, postIndividual } = useSplitStore();
  const { markPaid: markResponsibilityPaid } = useResponsibilities();
  const { markPaid: markSubscriptionPaid } = useSubscriptions();
  const [step, setStep] = useState<FlowStep>("home");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [recipient, setRecipient] = useState<Person>(QR_RECIPIENT);
  const [origin, setOrigin] = useState<Origin>("qr");
  const [returnStep, setReturnStep] = useState<ReturnStep>("home");
  // set while paying back a split, so we land back in the squad chat afterwards
  const [settling, setSettling] = useState<SettleUpRequest | null>(null);
  // set while paying someone from their 1:1 chat, so we land back in that chat afterwards
  const [chatPersonId, setChatPersonId] = useState<string | null>(null);
  // set while paying off a responsibility/subscription from its detail sheet
  const [payingResponsibilityId, setPayingResponsibilityId] = useState<string | null>(null);
  const [payingSubscriptionId, setPayingSubscriptionId] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const resetPaymentState = useCallback(() => {
    setAmount(0);
    setNote("");
    setSettling(null);
    setChatPersonId(null);
    setPayingResponsibilityId(null);
    setPayingSubscriptionId(null);
    setOrigin("qr");
  }, []);

  const goHome = useCallback(() => {
    resetPaymentState();
    setStep("home");
  }, [resetPaymentState]);
  const goAmount = useCallback(() => setStep("amount"), []);
  const goProcessing = useCallback(() => setStep("processing"), []);
  const goSuccess = useCallback(() => setStep("success"), []);
  const onDetected = useCallback(() => {
    setOrigin("qr");
    setRecipient(QR_RECIPIENT);
    setStep("amount");
  }, []);

  const startSettleUp = (r: SettleUpRequest) => {
    setOrigin("settle");
    setSettling(r);
    setRecipient(r.to);
    setAmount(r.amount);
    setNote(r.note);
    setStep("checkout");
  };

  const startPayIndividual = (person: Person) => {
    setOrigin("individual");
    setChatPersonId(person.id);
    setRecipient(person);
    setAmount(0);
    setNote("");
    setStep("amount");
  };

  const startPayResponsibility = (item: Responsibility, from: ReturnStep = "home") => {
    setOrigin("responsibility");
    setReturnStep(from);
    setPayingResponsibilityId(item.id);
    setRecipient(item.payee);
    setAmount(item.amount ?? 0);
    setNote(item.label);
    setStep("checkout");
  };

  const startPaySubscription = (item: Subscription, from: ReturnStep = "reminders") => {
    setOrigin("subscription");
    setReturnStep(from);
    setPayingSubscriptionId(item.id);
    setRecipient(personFromName(item.label));
    setAmount(item.amount);
    setNote(item.label);
    setStep("checkout");
  };

  const finishPayment = () => {
    if (origin === "settle" && settling) {
      settle(settling.splitId, "me");
      post({ kind: "system", text: `You settled ₹${formatINR(settling.amount)} with ${settling.to.short} ✅` });
      setSettling(null);
      setStep("split-chat");
      return;
    }
    if (origin === "individual" && chatPersonId) {
      const personId = chatPersonId;
      postIndividual(personId, { kind: "message", from: "me", text: `Paid ₹${formatINR(amount)} ✅${note ? ` · ${note}` : ""}` });
      later(() => postIndividual(personId, { kind: "message", from: personId, text: "received, thank you! 🙏" }), 1800);
      setStep("individual-chat");
      return;
    }
    if (origin === "responsibility" && payingResponsibilityId) {
      markResponsibilityPaid(payingResponsibilityId);
      resetPaymentState();
      setStep(returnStep);
      return;
    }
    if (origin === "subscription" && payingSubscriptionId) {
      markSubscriptionPaid(payingSubscriptionId);
      resetPaymentState();
      setStep(returnStep);
      return;
    }
    goHome();
  };

  return (
    <ToastProvider>
      {/* no initial={false} here: it propagates to every motion element on the first screen and
          stops their looping animations (the sleeping creature, hero coins) from ever starting */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="h-full"
        >
          {step === "home" && (
            <HomeScreen
              onScanQR={() => setStep("qr-scan")}
              onSplit={() => {
                startSquad();
                setStep("split-squad");
              }}
              onCheckBalance={() => setStep("balance-lock")}
              onOpenChats={() => setStep("chats")}
              onOpenReminders={() => setStep("reminders")}
              onPayResponsibility={(item) => startPayResponsibility(item, "home")}
            />
          )}
          {step === "balance-lock" && <BalanceLockScreen onBack={goHome} onUnlock={() => setStep("balance")} />}
          {step === "balance" && <BalanceScreen onBack={goHome} />}
          {step === "qr-scan" && <QRScanScreen onDetected={onDetected} onBack={goHome} />}
          {step === "amount" && (
            <AmountScreen
              recipient={recipient}
              initialAmount={amount}
              initialNote={note}
              onBack={() => (origin === "individual" ? setStep("individual-chat") : setStep("qr-scan"))}
              onPay={(a, n) => {
                setAmount(a);
                setNote(n);
                setStep("checkout");
              }}
            />
          )}
          {step === "checkout" && (
            <CheckoutScreen
              amount={amount}
              recipient={recipient}
              onBack={
                origin === "settle"
                  ? () => {
                      setSettling(null);
                      setStep("split-chat");
                    }
                  : origin === "individual"
                    ? () => setStep("individual-chat")
                    : origin === "responsibility"
                      ? () => {
                          setPayingResponsibilityId(null);
                          setStep(returnStep);
                        }
                      : origin === "subscription"
                        ? () => {
                            setPayingSubscriptionId(null);
                            setStep(returnStep);
                          }
                        : goAmount
              }
              onComplete={goProcessing}
            />
          )}
          {step === "processing" && <ProcessingScreen amount={amount} recipient={recipient} onDone={goSuccess} />}
          {step === "success" && <SuccessScreen amount={amount} note={note} recipient={recipient} onDone={finishPayment} />}
          {step === "split-squad" && (
            <SquadScreen
              onBack={goHome}
              onNext={() => setStep("split-name")}
              onOpenExisting={(id) => {
                openGroup(id);
                setStep("split-chat");
              }}
            />
          )}
          {step === "split-name" && (
            <NameScreen onBack={() => setStep("split-squad")} onCreate={() => setStep("split-chat")} />
          )}
          {step === "split-chat" && <SplitRoom onBack={goHome} onSettleUp={startSettleUp} />}
          {step === "chats" && (
            <ChatsScreen
              onBack={goHome}
              onOpenGroup={(id) => {
                openGroup(id);
                setStep("split-chat");
              }}
              onOpenIndividual={(id) => {
                setChatPersonId(id);
                setStep("individual-chat");
              }}
            />
          )}
          {step === "individual-chat" && chatPersonId && individualPeople[chatPersonId] && (
            <IndividualChatScreen
              person={individualPeople[chatPersonId]}
              onBack={() => setStep("chats")}
              onPay={() => startPayIndividual(individualPeople[chatPersonId])}
            />
          )}
          {step === "reminders" && (
            <RemindersScreen
              onBack={goHome}
              onOpenGroup={(id) => {
                openGroup(id);
                setStep("split-chat");
              }}
              onPayResponsibility={(item) => startPayResponsibility(item, "reminders")}
              onPaySubscription={(item) => startPaySubscription(item, "reminders")}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </ToastProvider>
  );
}
