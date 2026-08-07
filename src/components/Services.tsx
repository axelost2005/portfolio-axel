"use client";

import { motion, useReducedMotion } from "framer-motion";
import FadeIn from "./FadeIn";
import { useLang } from "@/lib/i18n";
import { services } from "@/data/services";

export default function Services() {
  const { lang, copy } = useLang();
  const reduced = useReducedMotion();

  return (
    <section
      id="services"
      style={{
        position: "relative",
        background: "#FFFFFF",
        borderTopLeftRadius: "clamp(40px, 5vw, 60px)",
        borderTopRightRadius: "clamp(40px, 5vw, 60px)",
        padding:
          "clamp(5rem, 9vw, 8rem) clamp(1.25rem, 3vw, 2.5rem) clamp(7rem, 12vw, 11rem)",
      }}
    >
      <FadeIn
        as="h2"
        y={40}
        style={{
          margin: "0 0 clamp(4rem, 8vw, 7rem)",
          textAlign: "center",
          color: "#0C0C0C",
          fontSize: "clamp(3rem, 12vw, 160px)",
          fontWeight: 900,
          textTransform: "uppercase",
          lineHeight: 0.9,
          letterSpacing: "-0.03em",
        }}
      >
        {copy.services.title}
      </FadeIn>

      <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
        {services.map((s, i) => {
          const delay = i * 0.1;
          return (
            <div
              key={s.key}
              data-svc-row=""
              className="dc-svc-row"
              style={{
                position: "relative",
                display: "flex",
                alignItems: "flex-start",
                gap: "clamp(1rem, 3vw, 2.5rem)",
                // padding-left lo maneja .dc-svc-row: si estuviera acá inline,
                // el :hover de la clase no podría sobreescribirlo.
                paddingTop: "clamp(2rem, 3vw, 3rem)",
                paddingBottom: "clamp(2rem, 3vw, 3rem)",
                borderTop: "1px solid rgba(12, 12, 12, 0.15)",
              }}
            >
              <motion.span
                aria-hidden="true"
                initial={reduced ? false : { scaleX: 0 }}
                whileInView={reduced ? undefined : { scaleX: 1 }}
                viewport={{ once: true, margin: "50px", amount: 0 }}
                transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: "absolute",
                  top: -1,
                  left: 0,
                  height: 1,
                  width: "100%",
                  background: "#0C0C0C",
                  transformOrigin: "left center",
                }}
              />
              <FadeIn
                as="span"
                delay={delay + 0.08}
                x={-40}
                duration={0.8}
                style={{
                  flex: "0 0 auto",
                  color: "#0C0C0C",
                  fontWeight: 900,
                  fontSize: "clamp(3rem, 10vw, 140px)",
                  lineHeight: 0.8,
                  letterSpacing: "-0.04em",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </FadeIn>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "clamp(0.5rem, 1vw, 0.9rem)",
                  paddingTop: "0.2em",
                }}
              >
                <FadeIn
                  as="h3"
                  delay={delay + 0.16}
                  y={22}
                  duration={0.8}
                  style={{
                    margin: 0,
                    color: "#0C0C0C",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.01em",
                    lineHeight: 1.1,
                    fontSize: "clamp(1rem, 2.2vw, 2.1rem)",
                  }}
                >
                  {s[lang].name}
                </FadeIn>
                <FadeIn
                  as="p"
                  delay={delay + 0.24}
                  y={22}
                  duration={0.8}
                  toOpacity={0.6}
                  style={{
                    margin: 0,
                    color: "#0C0C0C",
                    opacity: 0.6,
                    fontWeight: 300,
                    lineHeight: 1.6,
                    maxWidth: "42rem",
                    fontSize: "clamp(0.85rem, 1.6vw, 1.25rem)",
                    textWrap: "pretty",
                  }}
                >
                  {s[lang].desc}
                </FadeIn>
              </div>
            </div>
          );
        })}
        <div style={{ borderTop: "1px solid rgba(12, 12, 12, 0.15)" }} />
      </div>
    </section>
  );
}
