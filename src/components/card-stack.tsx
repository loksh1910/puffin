"use client";

import { motion } from "framer-motion";
import { BankCard } from "@/lib/types";
import { CardFace } from "@/components/bank-card";

function relativeOffset(index: number, active: number, length: number) {
  const raw = (index - active + length) % length;
  // map 0 -> front, 1 -> behind-right, 2 (== -1) -> behind-left
  if (raw === 0) return 0;
  if (raw === 1) return 1;
  return -1;
}

export function CardStack({
  cards,
  activeIndex,
  onSwitch,
  onInsert,
  onDragMove,
  onDragStateChange,
  kind,
  insertThreshold = 85,
}: {
  cards: BankCard[];
  activeIndex: number;
  onSwitch: (index: number) => void;
  onInsert: (dropOffset: { x: number; y: number }) => void;
  onDragMove?: (offset: { x: number; y: number }) => void;
  onDragStateChange?: (dragging: boolean) => void;
  kind?: string;
  // how far up a card must be dragged to trigger onInsert — a shorter reach for contexts
  // where the target (e.g. a mascot) sits close by
  insertThreshold?: number;
}) {
  return (
    <div className="relative mx-auto h-[130px] w-[240px]">
      {cards.map((card, i) => {
        const rel = relativeOffset(i, activeIndex, cards.length);
        const isFront = rel === 0;

        return (
          <motion.div
            key={card.id}
            className="absolute inset-x-0 top-0"
            style={{ zIndex: isFront ? 10 : 5 - Math.abs(rel) }}
            animate={{
              x: rel * 22,
              y: rel === 0 ? 0 : 10,
              rotate: rel * 7,
              scale: rel === 0 ? 1 : 0.93,
              opacity: rel === 0 ? 1 : 0.85,
            }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            drag={isFront}
            dragSnapToOrigin
            dragElastic={0.2}
            whileDrag={{ scale: 1.03 }}
            onDragStart={() => onDragStateChange?.(true)}
            onDrag={(_, info) => onDragMove?.(info.offset)}
            onDragEnd={(_, info) => {
              onDragStateChange?.(false);
              const { x, y } = info.offset;
              if (y < -insertThreshold && Math.abs(x) < 130) {
                onInsert({ x, y });
                return;
              }
              if (x > 65) onSwitch((activeIndex + 1) % cards.length);
              else if (x < -65) onSwitch((activeIndex - 1 + cards.length) % cards.length);
            }}
          >
            <CardFace card={card} kind={kind} />
          </motion.div>
        );
      })}
    </div>
  );
}
