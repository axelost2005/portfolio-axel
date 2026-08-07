"use client";

import { useEffect, useRef } from "react";

/**
 * Port de setupMagnet(): el elemento sigue al cursor dividido por `strength`
 * mientras el mouse esté dentro de su caja + `padding`. Solo en punteros con
 * hover real y sin prefers-reduced-motion.
 */
export default function Magnet({
  strength = 3,
  padding = 150,
  children,
}: {
  strength?: number;
  padding?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover)").matches) return;

    const onMouseMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const inside =
        Math.abs(dx) < r.width / 2 + padding && Math.abs(dy) < r.height / 2 + padding;

      if (inside) {
        el.style.transition = "transform 0.3s ease-out";
        el.style.transform = `translate3d(${dx / strength}px,${dy / strength}px,0)`;
      } else if (el.style.transform && el.style.transform !== "translate3d(0px,0px,0)") {
        el.style.transition = "transform 0.6s ease-in-out";
        el.style.transform = "translate3d(0px,0px,0)";
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [strength, padding]);

  return (
    <div ref={ref} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
