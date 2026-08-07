"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ElementType, ImgHTMLAttributes, Ref } from "react";

/** Mismo easing que usaba setupFades() en el export. */
const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const TAGS = {
  div: motion.div,
  nav: motion.nav,
  section: motion.section,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  span: motion.span,
  a: motion.a,
  img: motion.img,
} as const;

type Tag = keyof typeof TAGS;

type FadeInProps = Omit<
  HTMLMotionProps<"a">,
  "initial" | "whileInView" | "viewport" | "transition" | "ref"
> &
  Partial<Pick<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "loading">> & {
  as?: Tag;
  ref?: Ref<HTMLElement>;
  /** segundos */
  delay?: number;
  /** desplazamiento inicial en px */
  y?: number;
  x?: number;
  /** segundos */
  duration?: number;
  /** opacidad final: el export conservaba la opacidad base del elemento (_fadeTo) */
  toOpacity?: number;
};

/**
 * Equivale al data-fade="delay,y,x,duration" del export:
 * IntersectionObserver con rootMargin 50px que revela una sola vez.
 */
export default function FadeIn({
  as = "div",
  delay = 0,
  y = 0,
  x = 0,
  duration = 0.7,
  toOpacity = 1,
  children,
  ...rest
}: FadeInProps) {
  const reduced = useReducedMotion();
  const C = TAGS[as] as ElementType;

  // El export directamente no aplicaba fades con prefers-reduced-motion.
  if (reduced) return <C {...rest}>{children}</C>;

  return (
    <C
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: toOpacity, x: 0, y: 0 }}
      viewport={{ once: true, margin: "50px", amount: 0 }}
      transition={{ duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </C>
  );
}
