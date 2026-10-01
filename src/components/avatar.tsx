import type { Person } from "@/lib/split-types";

export function Avatar({
  person,
  size = 44,
  status,
  className = "",
}: {
  person: Person;
  size?: number;
  status?: "paid" | "pending";
  className?: string;
}) {
  const ring =
    status === "paid"
      ? "ring-[2.5px] ring-success ring-offset-2 ring-offset-card"
      : status === "pending"
        ? "outline-2 outline-dashed outline-offset-2 outline-muted-foreground/45 opacity-75"
        : "";

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${ring} ${className}`}
      style={{ width: size, height: size, background: person.gradient, fontSize: Math.round(size * 0.32) }}
    >
      {person.id === "me" ? (
        <svg width={size * 0.46} height={size * 0.46} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" fill="currentColor" />
          <path d="M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        person.initials
      )}
      {status === "paid" && (
        <span className="absolute -bottom-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-card bg-success">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </span>
  );
}
