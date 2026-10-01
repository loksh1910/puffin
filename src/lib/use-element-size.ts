"use client";

import { useEffect, useRef, useState } from "react";

// offset* sizes are layout sizes, so CSS scale transforms (machine zoom, phone frame) don't skew them
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ width: el.offsetWidth, height: el.offsetHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, size] as const;
}
