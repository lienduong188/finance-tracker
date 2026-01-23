import { useTranslation } from "react-i18next"
import { Globe } from "lucide-react"

const languages = [
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
]

export function LanguageSwitch() {
  const { i18n } = useTranslation()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value)
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <select
        value={i18n.language}
        onChange={handleChange}
        className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  )
}
