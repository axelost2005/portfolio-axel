export interface Service {
  key: string;
  es: { name: string; desc: string };
  en: { name: string; desc: string };
}

export const services: Service[] = [
  {
    key: "web",
    es: {
      name: "Desarrollo Web",
      desc: "Sitios a medida desde cero, front-end y back-end. Diseño propio, código limpio y una web que carga rápido y funciona igual de bien en el celular que en la computadora.",
    },
    en: {
      name: "Web Development",
      desc: "Custom sites built from scratch, front-end and back-end. Original design, clean code, and a site that loads fast and works just as well on a phone as on a desktop.",
    },
  },
  {
    key: "ecommerce",
    es: {
      name: "E-commerce",
      desc: "Tiendas online listas para vender: catálogo por categorías, carrito, medios de pago, envíos y un panel donde vos mismo cargás y editás los productos sin depender de nadie.",
    },
    en: {
      name: "E-commerce",
      desc: "Online stores ready to sell: category catalog, cart, payment methods, shipping, and a panel where you load and edit products yourself without depending on anyone.",
    },
  },
  {
    key: "landing",
    es: {
      name: "Landing Pages",
      desc: "Páginas de una sola pantalla pensadas para convertir. Un mensaje claro, un camino directo al WhatsApp o al formulario, y nada que distraiga al visitante de contactarte.",
    },
    en: {
      name: "Landing Pages",
      desc: "Single-screen pages built to convert. A clear message, a direct path to WhatsApp or the form, and nothing distracting the visitor from reaching out.",
    },
  },
  {
    key: "maintenance",
    es: {
      name: "Mantenimiento",
      desc: "Tu web siempre al día: actualizaciones, backups, cambios de contenido, arreglo de errores y monitoreo. Vos te ocupás de tu negocio, yo me ocupo de que todo funcione.",
    },
    en: {
      name: "Maintenance",
      desc: "Your site always up to date: updates, backups, content changes, bug fixes and monitoring. You focus on your business, I make sure everything keeps running.",
    },
  },
  {
    key: "optimization",
    es: {
      name: "Optimización",
      desc: "¿Tenés una web lenta o que nadie encuentra en Google? La audito, mejoro los tiempos de carga, ordeno el SEO y dejo cada pantalla funcionando como corresponde.",
    },
    en: {
      name: "Optimization",
      desc: "Got a slow site, or one nobody finds on Google? I audit it, improve load times, sort out the SEO and get every screen working properly.",
    },
  },
];
