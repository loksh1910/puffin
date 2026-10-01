import { BankCard } from "@/lib/types";

export function CardFace({
  card,
  compact = false,
  kind = "Credit Card",
}: {
  card: BankCard;
  compact?: boolean;
  kind?: string;
}) {
  return (
    <div
      className={`relative w-full ${compact ? "h-[104px]" : "h-[120px]"} rounded-2xl p-4 shadow-xl overflow-hidden select-none`}
      style={{ background: card.gradient }}
    >
      <div className="absolute -right-6 -top-10 h-28 w-28 rounded-full bg-white/10" />
      <div className="absolute -left-4 -bottom-10 h-24 w-24 rounded-full bg-white/10" />

      <div className="relative flex items-start justify-between">
        {/* chip */}
        <svg width="26" height="20" viewBox="0 0 26 20" fill="none">
          <rect width="26" height="20" rx="4" fill="#FFD966" fillOpacity="0.9" />
          <path d="M0 7h26M0 13h26M9 0v20M17 0v20" stroke="#8a6b1f" strokeWidth="0.6" opacity="0.5" />
        </svg>
        {/* contactless */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M8 9a5.5 5.5 0 018 0M5.5 6.2a9 9 0 0113 0M10.6 12a2 2 0 013 0" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
        </svg>
      </div>

      <p className={`relative mt-3.5 font-semibold tracking-[0.18em] text-white/95 ${compact ? "text-[13px]" : "text-[14.5px]"}`}>
        •••• •••• •••• {card.last4}
      </p>

      <div className="relative mt-2.5 flex items-center justify-between">
        <span className="text-[11px] font-medium text-white/75">{kind}</span>
        <span className="text-[13px] font-bold text-white">{card.bank}</span>
      </div>
    </div>
  );
}
