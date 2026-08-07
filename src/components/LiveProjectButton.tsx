"use client";

export default function LiveProjectButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      className="dc-btn-outline"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        flex: "0 0 auto",
        borderRadius: 999,
        border: "2px solid #D7E2EA",
        color: "#D7E2EA",
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        padding: "clamp(0.7rem, 1vw, 0.85rem) clamp(1.75rem, 2.6vw, 2.5rem)",
        fontSize: "clamp(0.8rem, 1vw, 1rem)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </a>
  );
}
