import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, t as translate } from "@/lib/i18n";
import { useProfile } from "@/hooks/use-profile";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "rw",
  setLang: () => {},
  t: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>("rw");
  const { profile } = useProfile();

  useEffect(() => {
    if (profile?.language) {
      setLang(profile.language as Language);
    }
  }, [profile?.language]);

  const tFn = (key: string, vars?: Record<string, string | number>) => translate(key, lang, vars);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: tFn }}>
      {children}
    </LanguageContext.Provider>
  );
};
