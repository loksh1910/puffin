"use client";

import { useEffect, useState } from "react";

export function StatusBar({ dark = false }: { dark?: boolean }) {
  const [time, setTime] = useState("14:30");

  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  const tone = dark ? "text-white" : "text-foreground";

  return (
    <div
      className={`flex items-center justify-between px-6 pt-3 pb-1 text-[13px] font-semibold ${tone} shrink-0`}
    >
      <span>{time}</span>
      <div className="flex items-center gap-1.5">
        {/* signal bars */}
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <rect x="0" y="7" width="3" height="4" rx="0.75" fill="currentColor" />
          <rect x="4.5" y="5" width="3" height="6" rx="0.75" fill="currentColor" />
          <rect x="9" y="3" width="3" height="8" rx="0.75" fill="currentColor" />
          <rect x="13" y="0" width="3" height="11" rx="0.75" fill="currentColor" />
        </svg>
        {/* wifi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
          <path
            d="M7.5 9.5a1 1 0 100-2 1 1 0 000 2zM4.6 6.4a4.1 4.1 0 015.8 0M2.3 4a7.3 7.3 0 0110.4 0"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        {/* battery */}
        <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
          <rect
            x="0.75"
            y="0.75"
            width="19.5"
            height="10.5"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.6"
          />
          <rect x="2.5" y="2.5" width="15" height="7" rx="1.3" fill="currentColor" />
          <path
            d="M21.5 4v4c1 0 1.7-.9 1.7-2s-.7-2-1.7-2z"
            fill="currentColor"
            opacity="0.6"
          />
        </svg>
      </div>
    </div>
  );
}
