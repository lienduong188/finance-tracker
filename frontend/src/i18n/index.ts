import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import vi from "./locales/vi.json"
import en from "./locales/en.json"
import ja from "./locales/ja.json"

const resources = {
  vi: { translation: vi },
  en: { translation: en },
  ja: { translation: ja },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "vi",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  })

export default i18n
