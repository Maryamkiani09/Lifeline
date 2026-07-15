import { createContext, useContext, useState, useEffect } from "react";
import { t as translate } from "../i18n/strings";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("lifeline_lang") || null);

  useEffect(() => {
    if (lang) {
      localStorage.setItem("lifeline_lang", lang);
      document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const t = (key) => translate(lang || "en", key);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL: lang === "ur" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
