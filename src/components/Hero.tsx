"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import FadeIn from "./FadeIn";
import Magnet from "./Magnet";
import ContactButton from "./ContactButton";
import { useLang } from "@/lib/i18n";
import { nav } from "@/data/nav";

import portrait from "../../public/portrait/axel-portrait.webp";

/** data-fit="270" del export: el h1 nunca pasa de 270px y se achica si no entra. */
const MAX_HEADING_PX = 270;

function scrollToSection(selector: string) {
  const el = document.querySelector(selector);
  if (!el) return;
  window.scrollTo({
    top: el.getBoundingClientRect().top + window.scrollY,
    behavior: "smooth",
  });
}

export default function Hero() {
  const { lang, copy, waHref, toggleLang } = useLang();

  const navRef = useRef<HTMLElement>(null);
  const gapRef = useRef<HTMLDivElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);

  const [sway, setSway] = useState(false);
  /** Hasta que no este, el hero se queda quieto en su estado inicial. */
  const [ready, setReady] = useState(false);

  /** Port de fitHeadings(). */
  const fitHeading = useCallback(() => {
    const el = h1Ref.current;
    if (!el) return;
    const avail = el.parentElement ? el.parentElement.clientWidth : 0;
    if (!avail) return;

    el.style.fontSize = `${MAX_HEADING_PX}px`;
    const textWidth = () => {
      const r = document.createRange();
      r.selectNodeContents(el);
      return r.getBoundingClientRect().width;
    };

    let size = MAX_HEADING_PX;
    for (let pass = 0; pass < 3; pass++) {
      const w = textWidth();
      if (!w) break;
      size = size * (avail / w);
      if (size > MAX_HEADING_PX) {
        size = MAX_HEADING_PX;
        el.style.fontSize = `${MAX_HEADING_PX}px`;
        break;
      }
      el.style.fontSize = `${size.toFixed(2)}px`;
    }
  }, []);

  /** Port del bloque de measure() que reparte el aire entre nav, h1 y retrato. */
  const measureGap = useCallback(() => {
    const gapEl = gapRef.current;
    const portrait = portraitRef.current;
    const navEl = navRef.current;
    const h1 = h1Ref.current;
    if (!gapEl || !portrait || !navEl || !h1) return;

    gapEl.style.height = "0px";
    // offsetTop/offsetHeight dan la caja de LAYOUT. getBoundingClientRect() da la
    // visual, que incluye el transform de la animacion de entrada: con el nav en
    // y=-20 la banda salia 20px de mas y el gap 7px de mas (0.35 del error). Ese
    // era el salto. Con offset* la medicion no depende del estado de la animacion.
    // El heroTop del port se cancelaba solo: offsetParent ya es la <section>.
    const band =
      portrait.offsetTop - (navEl.offsetTop + navEl.offsetHeight) - h1.offsetHeight;
    const factor = window.innerWidth < 700 ? 0.14 : 0.35;
    gapEl.style.height = `${Math.max(12, Math.round(band * factor))}px`;
  }, []);

  /** Port de updateSway(): el balanceo solo corre donde no hay magnet. */
  const updateSway = useCallback(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch =
      !window.matchMedia("(hover: hover)").matches || window.innerWidth < 700;
    setSway(touch && !reduced);
  }, []);

  useLayoutEffect(() => {
    fitHeading();
    measureGap();
  }, [fitHeading, measureGap, lang]);

  useEffect(() => {
    updateSway();

    const onResize = () => {
      updateSway();
      fitHeading();
      measureGap();
    };
    window.addEventListener("resize", onResize, { passive: true });

    // Con reduced motion no hay fades que esperar: el hero se muestra ya. Va aca y
    // no en el render justamente para no romper la hidratacion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReady(true);
    }

    // El hero se mide con la fuente ya cargada y recien ahi se sueltan los fades.
    // El export reajustaba a los 1200ms: con Kanit por CDN eso caia antes de que
    // el fade terminara, pero con next/font la fuente llega tan temprano que el
    // reajuste quedaba despues de la animacion y se veia como un salto.
    let alive = true;
    const remeasure = () => {
      if (!alive) return;
      fitHeading();
      measureGap();
      setReady(true);
    };

    // fonts.ready resuelve tambien si la fuente falla, asi que esta pasada corre
    // siempre: es la unica que deja la geometria definitiva.
    (document.fonts?.ready ?? Promise.resolve()).then(remeasure);

    // Techo, solo para soltar la entrada. Si la fuente tarda mas que esto el hero
    // aparece con la metrica de fallback y se corrige al llegar Kanit; preferible
    // a dejarlo invisible esperando.
    const t = window.setTimeout(remeasure, 1200);

    return () => {
      alive = false;
      window.removeEventListener("resize", onResize);
      window.clearTimeout(t);
    };
  }, [fitHeading, measureGap, updateSway]);

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        overflowX: "clip",
        // Todo lo visible del hero ya arranca en opacity 0, asi que esto no cambia
        // nada en pantalla. Sirve para el CLS: el reajuste de la metrica de la
        // fuente mueve el h1 mientras todavia no se ve, y la spec de layout
        // instability descarta lo que esta visibility:hidden pero no lo que esta
        // en opacity 0. Sin esto el salto invisible puntuaba igual.
        // Solo depende de `ready`, que arranca en false igual en el server y en el
        // cliente. Si la condicion mirara algo que solo existe en el cliente (como
        // matchMedia), el primer render no coincidiria con el SSR y React no repara
        // el style inline al hidratar: el visibility:hidden quedaba pegado para
        // siempre. El caso de reduced motion se resuelve en el efecto.
        visibility: ready ? undefined : "hidden",
      }}
    >
      <FadeIn
        as="nav"
        ref={navRef}
        y={-20}
        hold={!ready}
        style={{
          position: "relative",
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          gap: "clamp(1rem, 3vw, 3rem)",
          padding: "clamp(1.5rem, 2.2vw, 2rem) clamp(1.5rem, 3vw, 2.5rem) 0",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "clamp(0.5rem, 2vw, 2rem)",
          }}
        >
          {nav.map((item) => (
            <a
              key={item.key}
              className="dc-nav-link"
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(item.href);
              }}
              style={{
                fontSize: "clamp(0.7rem, 1.15vw, 1.4rem)",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#D7E2EA",
              }}
            >
              {item[lang]}
            </a>
          ))}
        </div>
        <button
          type="button"
          onClick={toggleLang}
          aria-label={copy.langAria}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4em",
            background: "none",
            border: 0,
            padding: 0,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "clamp(0.7rem, 1.15vw, 1.4rem)",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "#D7E2EA",
          }}
        >
          <span style={{ opacity: lang === "es" ? 1 : 0.4, transition: "opacity 200ms ease" }}>
            ES
          </span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span style={{ opacity: lang === "en" ? 1 : 0.4, transition: "opacity 200ms ease" }}>
            EN
          </span>
        </button>
      </FadeIn>

      <div
        ref={gapRef}
        data-hero-gap
        style={{ flex: "0 0 auto", height: "clamp(1rem, 4vh, 3.5rem)" }}
      />

      <div
        style={{
          overflow: "hidden",
          padding: "0 clamp(1.5rem, 3vw, 2.5rem)",
          position: "relative",
          zIndex: 5,
        }}
      >
        <div style={{ width: "100%" }}>
          <FadeIn
            as="h1"
            ref={h1Ref}
            delay={0.15}
            y={40}
            hold={!ready}
            className="hero-heading"
            style={{
              margin: 0,
              width: "100%",
              textAlign: "center",
              whiteSpace: "nowrap",
              fontSize: "11vw",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.03em",
              lineHeight: 0.86,
            }}
          >
            {copy.hero.greeting}
          </FadeIn>
        </div>
      </div>

      <div style={{ flex: "1 1 auto", minHeight: "clamp(3rem, 14vh, 12rem)" }} />

      <div
        style={{
          position: "relative",
          zIndex: 20,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "1.25rem 1.5rem",
          padding: "1.25rem clamp(1.5rem, 3vw, 2.5rem) clamp(1.75rem, 3vw, 2.5rem)",
        }}
      >
        <FadeIn
          as="p"
          delay={0.35}
          y={20}
          hold={!ready}
          style={{
            margin: 0,
            flex: "1 1 140px",
            maxWidth: "clamp(140px, 18vw, 260px)",
            fontSize: "clamp(0.7rem, 1.4vw, 1.5rem)",
            fontWeight: 300,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            lineHeight: 1.35,
            color: "#D7E2EA",
          }}
        >
          {copy.hero.tagline}
        </FadeIn>
        <FadeIn delay={0.5} y={20} hold={!ready} style={{ flex: "0 0 auto", marginLeft: "auto" }}>
          <ContactButton href={waHref} label={copy.buttons.contact} />
        </FadeIn>
      </div>

      <div
        ref={portraitRef}
        data-hero-portrait
        style={{
          position: "absolute",
          left: "50%",
          bottom: "max(0px, 265px - 32vw)",
          transform: "translateX(-50%)",
          zIndex: 10,
          width: "min(100vw, 640px, 58vh)",
          pointerEvents: "none",
        }}
      >
        <FadeIn delay={0.6} y={30} hold={!ready}>
          <div
            style={{
              transformOrigin: "50% 0%",
              animation: sway ? "axel-sway 7s ease-in-out infinite" : "none",
              willChange: "transform",
            }}
          >
            <Magnet strength={3}>
              <Image
                src={portrait}
                alt={copy.hero.portraitAlt}
                priority
                // unoptimized a propósito: la fuente ya es WebP near-lossless desde
                // el PNG original. Dejar que Next la reencodee a q90 costaba 3,1 dB
                // de PSNR en retina, y es la cara del portfolio. Al no optimizar,
                // sizes y quality no aplican: se sirve este archivo tal cual.
                unoptimized
                style={{ display: "block", width: "100%", height: "auto" }}
              />
            </Magnet>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
