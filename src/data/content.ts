export type Lang = "es" | "en";

export interface Copy {
  langAria: string;
  hero: { greeting: string; tagline: string; portraitAlt: string };
  about: {
    title: string;
    body: string;
    moonAlt: string;
    objectAlt: string;
    legoAlt: string;
    groupAlt: string;
  };
  services: { title: string };
  projects: { title: string; live: string; shotAlt: string };
  footer: {
    title: string;
    waLabel: string;
    emailLabel: string;
    email: string;
    copyright: string;
  };
  buttons: { contact: string };
  waMessage: string;
}

export const content: Record<Lang, Copy> = {
  es: {
    langAria: "Cambiar el idioma del sitio a inglés",
    hero: {
      greeting: "Hola, soy Axel",
      tagline: "creo sitios web que se ven bien, cargan rápido y hacen crecer tu negocio",
      portraitAlt: "Retrato 3D de Axel Ostrovsky",
    },
    about: {
      title: "Sobre mí",
      body: "Más de 3 años construyendo webs de punta a punta, front-end y back-end. Me obsesiona que cada proyecto cargue rápido, se vea impecable en cualquier pantalla y le traiga clientes reales a quien lo contrata. Trabajo cerca del cliente, explico sin tecnicismos y no entrego hasta que quede exactamente como lo imaginaste. ¿Tenés una idea? Hagámosla realidad.",
      moonAlt: "Ícono 3D de una luna",
      objectAlt: "Objeto 3D decorativo",
      legoAlt: "Ícono 3D de un bloque de construcción",
      groupAlt: "Grupo de formas 3D decorativas",
    },
    services: { title: "Servicios" },
    projects: {
      title: "Proyectos",
      live: "Ver proyecto",
      shotAlt: "Captura del sitio {name}",
    },
    footer: {
      title: "Trabajemos juntos",
      waLabel: "Escribime por WhatsApp",
      emailLabel: "O mandame un mail",
      email: "axelostrovsky@gmail.com",
      copyright: "© 2026 Axel Ostrovsky",
    },
    buttons: { contact: "Contactame" },
    waMessage: "Hola Axel, vi tu portfolio y me gustaría hablar de un proyecto.",
  },

  en: {
    langAria: "Switch the site language to Spanish",
    hero: {
      greeting: "Hi, I'm Axel",
      tagline: "i build websites that look sharp, load fast and grow your business",
      portraitAlt: "3D portrait of Axel Ostrovsky",
    },
    about: {
      title: "About me",
      body: "Over 3 years building websites end to end, front-end and back-end. I'm obsessed with projects that load fast, look flawless on any screen and bring real customers to whoever hires me. I work close to the client, explain things without jargon, and don't ship until it looks exactly like you pictured it. Got an idea? Let's build it.",
      moonAlt: "3D moon icon",
      objectAlt: "Decorative 3D object",
      legoAlt: "3D building-block icon",
      groupAlt: "Group of decorative 3D shapes",
    },
    services: { title: "Services" },
    projects: {
      title: "Projects",
      live: "Live project",
      shotAlt: "Screenshot of the {name} website",
    },
    footer: {
      title: "Let's work together",
      waLabel: "Message me on WhatsApp",
      emailLabel: "Or send me an email",
      email: "axelostrovsky@gmail.com",
      copyright: "© 2026 Axel Ostrovsky",
    },
    buttons: { contact: "Contact me" },
    waMessage: "Hi Axel, I saw your portfolio and I'd like to talk about a project.",
  },
};
