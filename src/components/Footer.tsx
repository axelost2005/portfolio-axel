"use client";

import FadeIn from "./FadeIn";
import { useLang } from "@/lib/i18n";
import { socials } from "@/data/socials";

const ICONS: Record<string, React.ReactNode> = {
  github: (
    <>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </>
  ),
  linkedin: (
    <>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </>
  ),
  mail: (
    <>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </>
  ),
};

export default function Footer() {
  const { lang, copy, waHref } = useLang();

  // Sin ícono, sin url o con url "#" no se renderiza: nada de íconos muertos.
  const links = socials.filter((s) => ICONS[s.key] && s.url && s.url !== "#");

  return (
    <footer
      id="contact"
      style={{
        background: "#0C0C0C",
        borderTop: "1px solid rgba(215, 226, 234, 0.12)",
        padding:
          "clamp(2rem, 4vw, 3.5rem) clamp(1.25rem, 3vw, 2.5rem) clamp(4rem, 8vw, 6rem)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "clamp(1.5rem, 3vw, 2.5rem)",
        textAlign: "center",
      }}
    >
      <FadeIn
        as="h2"
        y={40}
        className="hero-heading"
        style={{
          margin: 0,
          fontSize: "clamp(2.5rem, 9vw, 120px)",
          fontWeight: 900,
          textTransform: "uppercase",
          lineHeight: 0.9,
          letterSpacing: "-0.03em",
        }}
      >
        {copy.footer.title}
      </FadeIn>

      <FadeIn
        as="a"
        delay={0.1}
        y={20}
        className="dc-btn-outline-filled"
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.7em",
          borderRadius: 999,
          border: "2px solid #D7E2EA",
          color: "#D7E2EA",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          textDecoration: "none",
          padding: "clamp(0.8rem, 1.2vw, 1.05rem) clamp(1.75rem, 3vw, 2.75rem)",
          fontSize: "clamp(0.8rem, 1vw, 1rem)",
        }}
      >
        <svg
          width="1.25em"
          height="1.25em"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
        <span>{copy.footer.waLabel}</span>
      </FadeIn>

      <FadeIn
        delay={0.15}
        y={20}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.35rem",
        }}
      >
        <span
          style={{
            color: "#D7E2EA",
            opacity: 0.45,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            fontSize: "clamp(0.65rem, 1vw, 0.8rem)",
            fontWeight: 400,
          }}
        >
          {copy.footer.emailLabel}
        </span>
        <a
          className="dc-mail-link"
          href={`mailto:${copy.footer.email}`}
          style={{
            color: "#D7E2EA",
            fontWeight: 300,
            fontSize: "clamp(1rem, 2.2vw, 1.5rem)",
          }}
        >
          {copy.footer.email}
        </a>
      </FadeIn>

      <FadeIn
        delay={0.2}
        y={20}
        style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}
      >
        {links.map((s) => (
          <a
            key={s.key}
            className="dc-social-link"
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s[lang]}
            style={{ display: "flex", color: "#D7E2EA" }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {ICONS[s.key]}
            </svg>
          </a>
        ))}
      </FadeIn>

      <p
        style={{
          margin: 0,
          color: "#D7E2EA",
          opacity: 0.4,
          fontSize: "clamp(0.75rem, 1vw, 0.875rem)",
        }}
      >
        {copy.footer.copyright}
      </p>
    </footer>
  );
}
