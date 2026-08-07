/**
 * TODO: reemplazar por el dominio propio cuando esté. Por ahora es el de Vercel.
 * Lo consumen layout.tsx (metadataBase, Open Graph, JSON-LD), sitemap.ts y robots.ts.
 */
export const SITE_URL = "https://portfolio-axel-theta.vercel.app";

export const site = {
  url: SITE_URL,
  name: "Axel Ostrovsky",
  jobTitle: "Desarrollador Web",
  title: "Axel Ostrovsky — Desarrollador Web",
  description:
    "Desarrollo webs a medida, e-commerce y landing pages. Front-end y back-end, con foco en velocidad de carga y resultados para tu negocio.",
  email: "axelostrovsky@gmail.com",
  github: "https://github.com/axelost2005",
  linkedin: "https://www.linkedin.com/in/axel-ostrovsky-a02a7728a/",
  ogImage: "/og.jpg",
  ogImageAlt: "Axel Ostrovsky, desarrollador web",
} as const;
