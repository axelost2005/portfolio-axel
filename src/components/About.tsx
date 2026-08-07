"use client";

import Image, { type StaticImageData } from "next/image";
import type { CSSProperties } from "react";
import FadeIn from "./FadeIn";
import AnimatedText from "./AnimatedText";
import ContactButton from "./ContactButton";
import { useLang } from "@/lib/i18n";

import moon from "../../public/decor/moon.webp";
import object from "../../public/decor/object.webp";
import lego from "../../public/decor/lego.webp";
import group from "../../public/decor/group.webp";

const decorBase: CSSProperties = { position: "absolute", pointerEvents: "none" };

/** El export las tenía absolutas en el <img>; acá van en el wrapper y la imagen lo llena. */
function Decor({
  src,
  alt,
  delay,
  x,
  style,
}: {
  src: StaticImageData;
  alt: string;
  delay: number;
  x: number;
  style: CSSProperties;
}) {
  return (
    <FadeIn delay={delay} x={x} duration={0.9} style={{ ...decorBase, ...style }}>
      <Image
        src={src}
        alt={alt}
        loading="lazy"
        quality={90}
        sizes="(min-width: 1500px) 220px, 15vw"
        style={{ display: "block", width: "100%", height: "auto" }}
      />
    </FadeIn>
  );
}

export default function About() {
  const { lang, copy, waHref } = useLang();

  return (
    <section
      id="about"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "5rem clamp(1.25rem, 3vw, 2.5rem)",
        overflow: "hidden",
      }}
    >
      <Decor
        src={moon}
        alt={copy.about.moonAlt}
        delay={0.1}
        x={-80}
        style={{ top: "4%", left: "clamp(1%, 3vw, 4%)", width: "clamp(72px, 14vw, 210px)" }}
      />
      <Decor
        src={object}
        alt={copy.about.objectAlt}
        delay={0.25}
        x={-80}
        style={{ bottom: "8%", left: "clamp(3%, 7vw, 10%)", width: "clamp(64px, 12vw, 180px)" }}
      />
      <Decor
        src={lego}
        alt={copy.about.legoAlt}
        delay={0.15}
        x={80}
        style={{ top: "4%", right: "clamp(1%, 3vw, 4%)", width: "clamp(72px, 14vw, 210px)" }}
      />
      <Decor
        src={group}
        alt={copy.about.groupAlt}
        delay={0.3}
        x={80}
        style={{ bottom: "8%", right: "clamp(3%, 7vw, 10%)", width: "clamp(78px, 15vw, 220px)" }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(2.5rem, 5vw, 4rem)",
        }}
      >
        <FadeIn
          as="h2"
          y={40}
          className="hero-heading"
          style={{
            margin: 0,
            fontSize: "clamp(3rem, 12vw, 160px)",
            fontWeight: 900,
            textTransform: "uppercase",
            lineHeight: 0.9,
            letterSpacing: "-0.03em",
          }}
        >
          {copy.about.title}
        </FadeIn>

        <AnimatedText
          key={lang}
          text={copy.about.body}
          style={{
            margin: 0,
            maxWidth: 560,
            color: "#D7E2EA",
            fontWeight: 500,
            textAlign: "center",
            lineHeight: 1.7,
            fontSize: "clamp(1rem, 2vw, 1.35rem)",
          }}
        />

        <FadeIn delay={0.1} y={20} style={{ marginTop: "clamp(1rem, 3vw, 2.5rem)" }}>
          <ContactButton href={waHref} label={copy.buttons.contact} />
        </FadeIn>
      </div>
    </section>
  );
}
