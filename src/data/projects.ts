import type { StaticImageData } from "next/image";

import apHero from "../../public/projects/ap-hero.webp";
import apPresupuesto from "../../public/projects/ap-presupuesto.webp";
import cmHero from "../../public/projects/cm-hero.webp";
import cmProblemas from "../../public/projects/cm-problemas.webp";
import cmTrabajos from "../../public/projects/cm-trabajos.webp";
import cpHome from "../../public/projects/cp-home.webp";
import cpProductos from "../../public/projects/cp-productos.webp";
import cpVet from "../../public/projects/cp-vet.webp";

export interface Project {
  key: string;
  name: string;
  year: string;
  url: string;
  stack: string[];
  es: { category: string; desc: string };
  en: { category: string; desc: string };
  /**
   * [col izq arriba, col izq abajo, col derecha]. Si el proyecto tiene video,
   * images[2] no se renderiza: se usa solo como póster.
   * Importadas, no strings: next/image saca ancho y alto del import y así las
   * capturas ocupan el mismo lugar que ocupaban con <img> (de eso depende el
   * cálculo de altura de las cards).
   */
  images: [StaticImageData, StaticImageData, StaticImageData];
  video: string | null;
}

export const projects: Project[] = [
  {
    key: "aberturas-pablo",
    name: "Aberturas Pablo Dierckx",
    year: "2025",
    url: "https://aberturaspablo-web.vercel.app/",
    stack: ["React", "TypeScript", "Tailwind CSS", "Vercel"],
    es: {
      category: "Cliente",
      desc: "Sitio institucional para una carpintería de Mar del Plata especializada en aberturas de aluminio y madera maciza. Catálogo de productos, galería de trabajos terminados y contacto directo para pedir presupuesto.",
    },
    en: {
      category: "Client",
      desc: "Company website for a carpentry workshop in Mar del Plata specializing in aluminum and solid-wood windows and doors. Product catalog, finished-work gallery and direct contact for quotes.",
    },
    images: [apHero, apPresupuesto, apHero],
    video: "/projects/ap-demo.mp4",
  },
  {
    key: "costamagna",
    name: "Costamagna Instalaciones",
    year: "2026",
    url: "https://costamagna-instalaciones.vercel.app/",
    stack: ["HTML5", "CSS3", "JavaScript", "SEO Local", "Vercel"],
    es: {
      category: "Cliente",
      desc: "Web para un electricista matriculado de Rosario, pensada 100% para generar contactos. Selector de problemas que abre WhatsApp con el mensaje ya escrito, páginas separadas por servicio optimizadas para SEO local, galería de trabajos, reseñas y preguntas frecuentes.",
    },
    en: {
      category: "Client",
      desc: "Website for a licensed electrician in Rosario, built entirely to generate leads. A problem picker that opens WhatsApp with the message pre-written, separate service pages optimized for local SEO, work gallery, reviews and FAQ.",
    },
    images: [cmHero, cmProblemas, cmTrabajos],
    video: null,
  },
  {
    key: "centro-pet",
    name: "Centro Pet",
    year: "2026",
    url: "https://centropet.com.ar/",
    stack: ["Tiendanube", "SCSS", "JavaScript", "SEO", "E-commerce"],
    es: {
      category: "Cliente",
      desc: "Rediseño y desarrollo del e-commerce de un pet shop con veterinaria propia en CABA. Tema a medida sobre Tiendanube: catálogo dividido por tipo de mascota, fichas con precio diferenciado por transferencia, landing de veterinaria y farmacia, y contenido optimizado para SEO local.",
    },
    en: {
      category: "Client",
      desc: "Redesign and development of the online store for a pet shop with its own veterinary clinic in Buenos Aires. Custom Tiendanube theme: catalog split by pet type, product cards with a discounted bank-transfer price, veterinary and pharmacy landing pages, and content optimized for local SEO.",
    },
    images: [cpHome, cpProductos, cpVet],
    video: null,
  },
];
