"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { stack, type Tech } from "@/data/stack";

const row1 = stack.filter((t) => t.row === 1);
const row2 = stack.filter((t) => t.row === 2);

/** El export triplica cada fila para poder loopear con módulo. */
const triple = (arr: Tech[]) => [...arr, ...arr, ...arr];

const tiles1 = triple(row1);
const tiles2 = triple(row2);

function Tile({ tech }: { tech: Tech }) {
  return (
    <div
      style={{
        flex: "0 0 auto",
        width: 220,
        height: 130,
        borderRadius: 16,
        background: "rgba(215, 226, 234, 0.05)",
        border: "1px solid rgba(215, 226, 234, 0.12)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.85rem",
      }}
    >
      {tech.logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- SVG remoto del CDN de devicon
        <img
          src={tech.logo}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          style={{
            width: 48,
            height: 48,
            objectFit: "contain",
            filter: tech.invert ? "invert(1)" : "none",
          }}
        />
      ) : (
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#D7E2EA"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="16" y="16" width="6" height="6" rx="1" />
          <rect x="2" y="16" width="6" height="6" rx="1" />
          <rect x="9" y="2" width="6" height="6" rx="1" />
          <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
          <path d="M12 12V8" />
        </svg>
      )}
      <span
        style={{
          color: "#D7E2EA",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontSize: "0.875rem",
          fontWeight: 300,
          textAlign: "center",
        }}
      >
        {tech.name}
      </span>
    </div>
  );
}

export default function StackMarquee() {
  const sectionRef = useRef<HTMLElement>(null);
  const r1 = useRef<HTMLDivElement>(null);
  const r2 = useRef<HTMLDivElement>(null);
  const widths = useRef({ w1: 0, w2: 0 });

  const x1 = useMotionValue(0);
  const x2 = useMotionValue(0);

  const reduced = useReducedMotion();
  const { scrollY } = useScroll();

  /** Port de onScroll(): las filas se desplazan con el scroll, en sentidos opuestos. */
  const update = useCallback(() => {
    const sec = sectionRef.current;
    if (!sec || reduced) return;
    const vh = window.innerHeight;
    const top = sec.getBoundingClientRect().top + window.scrollY;
    const offset = (window.scrollY - top + vh) * 0.3 - 200;
    const { w1, w2 } = widths.current;
    if (w1) {
      let x = offset % w1;
      if (x > 0) x -= w1;
      x1.set(x);
    }
    if (w2) {
      let y = -offset % w2;
      if (y > 0) y -= w2;
      x2.set(y);
    }
  }, [reduced, x1, x2]);

  const measure = useCallback(() => {
    widths.current.w1 = r1.current ? r1.current.scrollWidth / 3 : 0;
    widths.current.w2 = r2.current ? r2.current.scrollWidth / 3 : 0;
  }, []);

  useMotionValueEvent(scrollY, "change", update);

  useEffect(() => {
    measure();
    update();

    const onResize = () => {
      measure();
      update();
    };
    window.addEventListener("resize", onResize, { passive: true });

    if (document.fonts?.ready) {
      document.fonts.ready.then(onResize);
    }
    const t = window.setTimeout(onResize, 1200);

    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(t);
    };
  }, [measure, update]);

  return (
    <section
      id="stack"
      ref={sectionRef}
      style={{
        background: "#0C0C0C",
        padding: "clamp(6rem, 12vw, 10rem) 0 2.5rem",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <motion.div
          ref={r1}
          style={{ display: "flex", gap: 12, width: "max-content", willChange: "transform", x: x1 }}
        >
          {tiles1.map((tech, i) => (
            <Tile key={`${tech.name}-${i}`} tech={tech} />
          ))}
        </motion.div>
        <motion.div
          ref={r2}
          style={{ display: "flex", gap: 12, width: "max-content", willChange: "transform", x: x2 }}
        >
          {tiles2.map((tech, i) => (
            <Tile key={`${tech.name}-${i}`} tech={tech} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
