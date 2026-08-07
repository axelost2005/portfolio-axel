"use client";

import {
  createRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import FadeIn from "./FadeIn";
import LiveProjectButton from "./LiveProjectButton";
import { useLang } from "@/lib/i18n";
import { projects, type Project } from "@/data/projects";

/** props.scaleStep del export. */
const SCALE_STEP = 0.03;
/** Separación vertical entre los tops sticky de una tarjeta y la siguiente. */
const STACK_OFFSET = 28;

/**
 * El grid es 40fr / 60fr dentro de un contenedor de 1500px máximo, o sea ~580 y
 * ~880 css. Declaro el doble a propósito: el export manda el PNG de 1903px a un
 * slot de 513, y ese sobremuestreo es buena parte de por qué se ve más nítido.
 */
const COL1_SIZES = "(min-width: 1600px) 1160px, 80vw";
const COL2_SIZES = "(min-width: 1600px) 1760px, 120vw";

interface Geom {
  tops: number[];
  heights: number[];
  cardHeight: number;
  spacer: number;
}

function ProjectVideo({
  src,
  poster,
  label,
}: {
  src: string;
  poster: string;
  label: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          const video = en.target as HTMLVideoElement;
          if (en.isIntersecting && !reduced) video.play().catch(() => {});
          else video.pause();
        });
      },
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "top",
        borderRadius: "clamp(40px, 5vw, 60px)",
        background: "rgba(215, 226, 234, 0.06)",
      }}
    />
  );
}

function ProjectCard({
  project,
  index,
  total,
  geom,
  cardRef,
  gridRef,
  nextRef,
}: {
  project: Project;
  index: number;
  total: number;
  geom: Geom | null;
  cardRef: RefObject<HTMLDivElement | null>;
  gridRef: RefObject<HTMLDivElement | null>;
  nextRef?: RefObject<HTMLDivElement | null>;
}) {
  const { lang, copy } = useLang();

  const top = geom ? geom.tops[index] : 0;
  const cardHeight = geom ? geom.cardHeight : 0;
  const targetScale = 1 - (total - 1 - index) * SCALE_STEP;

  // p = cuánto tapó la tarjeta siguiente a esta, igual que en onScroll().
  const { scrollYProgress } = useScroll({
    target: nextRef,
    offset: [
      `start ${cardHeight ? top + cardHeight : 1}px`,
      `start ${cardHeight ? top : 0}px`,
    ],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale]);

  const alt = copy.projects.shotAlt.replace("{name}", project.name);

  return (
    <motion.div
      ref={cardRef}
      data-project-card=""
      style={{
        position: "sticky",
        top,
        scale,
        width: "100%",
        // En el export measure() hace `c.style.marginBottom = i === last ? '0px' : ''`.
        // Ese '' borra la declaración inline y no hay regla CSS que la reponga, así que
        // en runtime TODAS las cards quedan en 0 y se apilan pegadas. El min(42vh, 420px)
        // solo sobrevive hasta la primera medición (y en el HTML sin JS).
        marginBottom: geom ? 0 : "min(42vh, 420px)",
        transformOrigin: "top center",
        borderRadius: "clamp(40px, 5vw, 60px)",
        border: "2px solid #D7E2EA",
        background: "#0C0C0C",
        padding: "clamp(1rem, 2vw, 2rem)",
        display: "flex",
        flexDirection: "column",
        gap: "clamp(1rem, 2vw, 1.75rem)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "clamp(1rem, 3vw, 2.5rem)",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "clamp(0.75rem, 2vw, 1.75rem)",
            flex: "1 1 20rem",
          }}
        >
          <span
            style={{
              flex: "0 0 auto",
              color: "#D7E2EA",
              fontWeight: 900,
              fontSize: "clamp(2.5rem, 7vw, 110px)",
              lineHeight: 0.78,
              letterSpacing: "-0.04em",
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "clamp(0.5rem, 1vw, 0.85rem)",
              paddingTop: "0.15em",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.7rem",
                color: "#D7E2EA",
                opacity: 0.55,
                fontSize: "clamp(0.65rem, 1vw, 0.8rem)",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                fontWeight: 400,
              }}
            >
              <span>{project[lang].category}</span>
              <span>—</span>
              <span>{project.year}</span>
            </div>
            <h3
              style={{
                margin: 0,
                color: "#D7E2EA",
                fontWeight: 600,
                textTransform: "uppercase",
                lineHeight: 1,
                letterSpacing: "-0.01em",
                fontSize: "clamp(1.1rem, 2.6vw, 2.4rem)",
              }}
            >
              {project.name}
            </h3>
            <p
              style={{
                margin: 0,
                color: "#D7E2EA",
                opacity: 0.65,
                fontWeight: 300,
                lineHeight: 1.6,
                maxWidth: "42rem",
                fontSize: "clamp(0.85rem, 1.5vw, 1.1rem)",
                textWrap: "pretty",
              }}
            >
              {project[lang].desc}
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.45rem",
                marginTop: "0.25rem",
              }}
            >
              {project.stack.map((t) => (
                <span
                  key={t}
                  style={{
                    borderRadius: 999,
                    border: "1px solid rgba(215, 226, 234, 0.25)",
                    padding: "0.25rem 0.75rem",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#D7E2EA",
                    fontWeight: 300,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        <LiveProjectButton href={project.url} label={copy.projects.live} />
      </div>

      <div
        ref={gridRef}
        data-shots=""
        style={{
          display: "grid",
          gridTemplateColumns: "40fr 60fr",
          gridTemplateRows: "minmax(0, 1fr)",
          gap: "clamp(0.6rem, 1.2vw, 1rem)",
          height: geom ? geom.heights[index] : "min(40vh, 460px)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(0.6rem, 1.2vw, 1rem)",
            minHeight: 0,
          }}
        >
          <Image
            src={project.images[0]}
            alt={alt}
            loading="lazy"
            quality={90}
            sizes={COL1_SIZES}
            style={{
              display: "block",
              width: "100%",
              flex: "4 1 0",
              minHeight: 0,
              objectFit: "cover",
              objectPosition: "top",
              borderRadius: "clamp(40px, 5vw, 60px)",
              background: "rgba(215, 226, 234, 0.06)",
            }}
          />
          <Image
            src={project.images[1]}
            alt={alt}
            loading="lazy"
            quality={90}
            sizes={COL1_SIZES}
            style={{
              display: "block",
              width: "100%",
              flex: "6 1 0",
              minHeight: 0,
              objectFit: "cover",
              objectPosition: "top",
              borderRadius: "clamp(40px, 5vw, 60px)",
              background: "rgba(215, 226, 234, 0.06)",
            }}
          />
        </div>
        {project.video ? (
          <ProjectVideo src={project.video} poster={project.images[2].src} label={alt} />
        ) : (
          <Image
            src={project.images[2]}
            alt={alt}
            loading="lazy"
            quality={90}
            sizes={COL2_SIZES}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
              borderRadius: "clamp(40px, 5vw, 60px)",
              background: "rgba(215, 226, 234, 0.06)",
            }}
          />
        )}
      </div>
    </motion.div>
  );
}

export default function Projects() {
  const { lang, copy } = useLang();

  const cardRefs = useRef(projects.map(() => createRef<HTMLDivElement>()));
  const gridRefs = useRef(projects.map(() => createRef<HTMLDivElement>()));
  const [geom, setGeom] = useState<Geom | null>(null);

  /**
   * Port del bloque de tarjetas de measure(): todas terminan con la misma altura
   * total para que cada una tape por completo a la de abajo.
   */
  const measure = useCallback(() => {
    const cards = cardRefs.current.map((r) => r.current);
    const grids = gridRefs.current.map((r) => r.current);
    if (cards.some((c) => !c) || grids.some((g) => !g)) return;

    const n = cards.length;
    const vh = window.innerHeight;
    const base = Math.min(Math.max(48, vh * 0.07), 112);
    const tops = cards.map((_, i) => Math.round(base + i * STACK_OFFSET));

    let cssH = 0;
    const rests = cards.map((card, i) => {
      const grid = grids[i]!;
      grid.style.height = "auto";
      const gH = grid.getBoundingClientRect().height;
      cssH = Math.max(cssH, gH);
      return card!.getBoundingClientRect().height - gH;
    });

    const maxTop = base + (n - 1) * STACK_OFFSET;
    const maxRest = Math.max(...rests);
    const cardHeight = Math.max(
      maxRest + 120,
      Math.min(vh - 16 - maxTop, maxRest + cssH),
    );
    const heights = rests.map((rest) => Math.max(120, Math.round(cardHeight - rest)));
    heights.forEach((h, i) => {
      grids[i]!.style.height = `${h}px`;
    });

    const bottoms = cards.map((card, i) => tops[i] + card!.getBoundingClientRect().height);
    const spacer = Math.round(Math.max(24, Math.max(...bottoms) - Math.min(...bottoms)));

    setGeom({ tops, heights, cardHeight, spacer });
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure, lang]);

  useEffect(() => {
    window.addEventListener("resize", measure, { passive: true });
    if (document.fonts?.ready) document.fonts.ready.then(() => measure());
    const t = window.setTimeout(measure, 1200);
    return () => {
      window.removeEventListener("resize", measure);
      window.clearTimeout(t);
    };
  }, [measure]);

  return (
    <section
      id="projects"
      style={{
        position: "relative",
        zIndex: 10,
        background: "#0C0C0C",
        borderTopLeftRadius: "clamp(40px, 5vw, 60px)",
        borderTopRightRadius: "clamp(40px, 5vw, 60px)",
        marginTop: "clamp(-3.5rem, -4vw, -2.5rem)",
        padding: "clamp(5rem, 9vw, 8rem) clamp(1.25rem, 3vw, 2.5rem) 0",
      }}
    >
      <FadeIn
        as="h2"
        y={40}
        className="hero-heading"
        style={{
          margin: "0 0 clamp(3rem, 6vw, 5rem)",
          textAlign: "center",
          fontSize: "clamp(3rem, 12vw, 160px)",
          fontWeight: 900,
          textTransform: "uppercase",
          lineHeight: 0.9,
          letterSpacing: "-0.03em",
        }}
      >
        {copy.projects.title}
      </FadeIn>

      <div style={{ maxWidth: 1500, margin: "0 auto", display: "flow-root" }}>
        {projects.map((project, i) => (
          <ProjectCard
            key={project.key}
            project={project}
            index={i}
            total={projects.length}
            geom={geom}
            cardRef={cardRefs.current[i]}
            gridRef={gridRefs.current[i]}
            nextRef={cardRefs.current[i + 1]}
          />
        ))}
        <div
          data-project-spacer=""
          aria-hidden="true"
          style={{ height: geom ? geom.spacer : "min(20vh, 190px)" }}
        />
      </div>
    </section>
  );
}
