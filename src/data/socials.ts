export interface Social {
  key: string;
  url: string;
  es: string;
  en: string;
}

export const whatsapp = {
  display: "+54 9 2984 86-8742",
  number: "5492984868742",
};

/** El link de WhatsApp depende del idioma, así que se arma en runtime. */
export function waHref(message: string) {
  return `https://wa.me/${whatsapp.number}?text=${encodeURIComponent(message)}`;
}

export const socials: Social[] = [
  // url vacía a propósito: el href real lo arma waHref() con el mensaje del idioma activo.
  { key: "whatsapp", url: "",                                                    es: "Escribime por WhatsApp",     en: "Message me on WhatsApp" },
  { key: "github",   url: "https://github.com/axelost2005",                      es: "GitHub de Axel Ostrovsky",   en: "Axel Ostrovsky on GitHub" },
  { key: "linkedin", url: "https://www.linkedin.com/in/axel-ostrovsky-a02a7728a/", es: "LinkedIn de Axel Ostrovsky", en: "Axel Ostrovsky on LinkedIn" },
  { key: "mail",     url: "mailto:axelostrovsky@gmail.com",                      es: "Escribime un mail",          en: "Send me an email" },
];
