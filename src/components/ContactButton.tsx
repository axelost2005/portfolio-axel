"use client";

export default function ContactButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      className="dc-btn-grad"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.7em",
        cursor: "pointer",
        border: 0,
        borderRadius: 999,
        fontFamily: "inherit",
        color: "#FFFFFF",
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        whiteSpace: "nowrap",
        padding: "clamp(0.7rem, 1.1vw, 1rem) clamp(1.4rem, 3.2vw, 3rem)",
        fontSize: "clamp(0.7rem, 1vw, 1rem)",
        background:
          "linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)",
        boxShadow:
          "0px 4px 4px rgba(181, 1, 167, 0.25), 4px 4px 12px #7721B1 inset",
        outline: "2px solid #FFFFFF",
        outlineOffset: -3,
      }}
    >
      <svg
        width="1.15em"
        height="1.15em"
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
      <span>{label}</span>
    </a>
  );
}
