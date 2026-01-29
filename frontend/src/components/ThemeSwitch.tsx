import { useTranslation } from "react-i18next"
import { Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "@/context/ThemeContext"

const themes = [
  { value: "light", icon: Sun, labelKey: "settings.themes.light" },
  { value: "dark", icon: Moon, labelKey: "settings.themes.dark" },
  { value: "system", icon: Monitor, labelKey: "settings.themes.system" },
] as const

export function ThemeSwitch() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as "light" | "dark" | "system")
  }

  const CurrentIcon = themes.find((item) => item.value === theme)?.icon || Monitor

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <CurrentIcon className="h-4 w-4 text-muted-foreground" />
      <select
        value={theme}
        onChange={handleChange}
        className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {themes.map((item) => (
          <option key={item.value} value={item.value}>
            {t(item.labelKey)}
          </option>
        ))}
      </select>
    </div>
  )
}
