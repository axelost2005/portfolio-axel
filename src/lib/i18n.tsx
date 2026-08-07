"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { content, type Copy, type Lang } from "@/data/content";
import { waHref } from "@/data/socials";

export type { Lang };

export const LANG_STORAGE_KEY = "axel-lang";

/**
 * Script que corre en el <head> antes del primer paint: resuelve el idioma y deja
 * el <html lang> correcto, para que React no tenga que corregirlo después.
 * Se inyecta desde layout.tsx.
 */
export const LANG_INIT_SCRIPT = `(function(){try{
var k=${JSON.stringify(LANG_STORAGE_KEY)},s=localStorage.getItem(k),
l=(s==='es'||s==='en')?s:((navigator.language||'').toLowerCase().indexOf('es')===0?'es':'en');
document.documentElement.lang=l;window.__axelLang=l;
}catch(e){}})();`;

const isLang = (v: unknown): v is Lang => v === "es" || v === "en";

/** El script inline ya resolvió esto; acá solo se lee (con fallback por las dudas). */
function resolveLang(fallback: Lang): Lang {
  if (typeof window === "undefined") return fallback;
  const fromScript = (window as { __axelLang?: unknown }).__axelLang;
  if (isLang(fromScript)) return fromScript;
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    /* localStorage bloqueado */
  }
  return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
}

// En el server useLayoutEffect avisa por consola; el provider se renderiza en ambos.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface LanguageValue {
  lang: Lang;
  copy: Copy;
  /** wa.me con el mensaje prellenado del idioma activo. */
  waHref: string;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({
  children,
  defaultLang = "es",
}: {
  children: React.ReactNode;
  defaultLang?: Lang;
}) {
  // Arranca en el idioma del HTML prerenderizado para que la hidratación calce.
  const [lang, setLangState] = useState<Lang>(defaultLang);

  // Corre antes del primer paint del contenido hidratado: si el idioma guardado
  // es otro, el swap ocurre sin que se llegue a pintar el idioma equivocado.
  useIsomorphicLayoutEffect(() => {
    const resolved = resolveLang(defaultLang);
    if (resolved !== defaultLang) setLangState(resolved);
    document.documentElement.lang = resolved;
  }, [defaultLang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    document.documentElement.lang = next;
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      /* localStorage bloqueado: el idioma vale solo para esta sesión */
    }
  }, []);

  const toggleLang = useCallback(
    () => setLang(lang === "es" ? "en" : "es"),
    [lang, setLang],
  );

  const value = useMemo<LanguageValue>(
    () => ({
      lang,
      copy: content[lang],
      waHref: waHref(content[lang].waMessage),
      setLang,
      toggleLang,
    }),
    [lang, setLang, toggleLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang debe usarse dentro de <LanguageProvider>");
  return ctx;
}
