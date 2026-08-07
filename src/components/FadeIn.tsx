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
  /**
   * Deja el elemento en su estado inicial sin animar. Lo usa el hero para no
   * arrancar la entrada hasta tener la geometria definitiva; si la animacion
   * empieza antes, el reajuste posterior se ve como un salto.
   */
  hold?: boolean;
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
  hold = false,
  children,
  ...rest
}: FadeInProps) {
  const reduced = useReducedMotion();
  const C = TAGS[as] as ElementType;

  // El export directamente no aplicaba fades con prefers-reduced-motion.
  //
  // Va `initial` con el estado FINAL, no sin props. useReducedMotion() devuelve
  // false en el render del server y en el primero del cliente, asi que para cuando
  // pasa a true el elemento ya tiene escrito opacity:0 inline. Si en esa segunda
  // pasada se renderiza sin initial ni animate, nadie lo borra y el elemento queda
  // invisible para siempre. Le pasa a todos los FadeIn de la pagina, no solo al hero.
  // Tiene que ser `animate`, no `initial`: initial solo corre al montar y aca el
  // elemento ya esta montado con el opacity:0 puesto. duration 0 = sin animacion.
  if (reduced) {
    return (
      <C
        initial={false}
        animate={{ opacity: toOpacity, x: 0, y: 0 }}
        transition={{ duration: 0 }}
        {...rest}
      >
        {children}
      </C>
    );
  }

  return (
    <C
      initial={{ opacity: 0, x, y }}
      whileInView={hold ? undefined : { opacity: toOpacity, x: 0, y: 0 }}
      viewport={{ once: true, margin: "50px", amount: 0 }}
      transition={{ duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </C>
  );
}
