"use client";

import { AnimatePresence, motion } from "framer-motion";

// Bottom sheet scoped to the phone screen (its parent must be `relative`).
export function Sheet({
  open,
  onClose,
  children,
  full = false,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  // take (almost) the whole screen instead of sizing to content
  full?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-40 bg-[#201432]/35"
          />
          <motion.div
            key="panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 330, damping: 34 }}
            className={`absolute inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[28px] bg-card shadow-[0_-12px_40px_rgba(60,20,90,0.18)] ${
              full ? "top-10" : "max-h-[92%]"
            }`}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-muted" />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
