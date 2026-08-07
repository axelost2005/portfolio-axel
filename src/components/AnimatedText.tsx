"use client";

import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Port literal de fillAnimText() + el bloque de onScroll() del export.
 *
 * useScroll de Framer no puede expresar este rango: `end` depende del alto del
 * propio párrafo (vh*0.5 - height/2) y el avance por letra usa un factor 1.4 que
 * hace que la última letra llegue a opacidad 1 antes de que el párrafo salga de
 * pantalla. Se calcula a mano sobre getBoundingClientRect, igual que el export.
 */
const SPREAD = 1.4;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default function AnimatedText({
  text,
  className,
  style,
}: {
  text: string;
  className?: string;
  style?: CSSProperties;
}) {
  const pRef = useRef<HTMLParagraphElement>(null);
  const charsRef = useRef<HTMLSpanElement[]>([]);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const p = pRef.current;
    const chars = charsRef.current;
    if (!p || !chars.length) return;

    const update = () => {
      const vh = window.innerHeight;
      const r = p.getBoundingClientRect();
      const start = vh * 0.92;
      const end = vh * 0.5 - r.height * 0.5;
      const prog = clamp01((start - r.top) / Math.max(start - end, 1));
      const n = chars.length;
      for (let i = 0; i < n; i++) {
        const cp = clamp01(prog * n * SPREAD - i);
        chars[i].style.opacity = String(0.2 + 0.8 * cp);
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    if (document.fonts?.ready) document.fonts.ready.then(update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [reduced, text]);

  const words = text.split(" ");
  let cursor = 0;

  return (
    <p ref={pRef} data-animtext="" className={className} style={style}>
      {words.map((word, wi) => {
        const chars = Array.from(word).map((char) => ({ char, index: cursor++ }));
        return (
          <Fragment key={wi}>
            <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
              {chars.map(({ char, index }) => (
                <span
                  key={index}
                  ref={(el) => {
                    if (el) charsRef.current[index] = el;
                  }}
                  style={{
                    opacity: reduced ? 1 : 0.2,
                    transition: "opacity 0.25s linear",
                  }}
                >
                  {char}
                </span>
              ))}
            </span>
            {wi < words.length - 1 ? " " : null}
          </Fragment>
        );
      })}
    </p>
  );
}
