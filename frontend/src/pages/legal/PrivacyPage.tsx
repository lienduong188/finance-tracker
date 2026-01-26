import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui"
import { LanguageSwitch } from "@/components/LanguageSwitch"

export function PrivacyPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-muted px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader className="space-y-1 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl md:text-2xl">{t("legal.privacyTitle")}</CardTitle>
              <LanguageSwitch />
            </div>
            <p className="text-sm text-muted-foreground">{t("legal.lastUpdated")}: 26/01/2026</p>
          </CardHeader>

          <CardContent className="prose prose-sm max-w-none p-4 pt-0 md:p-6 md:pt-0">
            <section className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">{t("legal.privacy.intro.title")}</h2>
              <p className="text-muted-foreground">{t("legal.privacy.intro.content")}</p>
            </section>

            <section className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">{t("legal.privacy.collect.title")}</h2>
              <p className="text-muted-foreground">{t("legal.privacy.collect.content")}</p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
                <li>{t("legal.privacy.collect.item1")}</li>
                <li>{t("legal.privacy.collect.item2")}</li>
                <li>{t("legal.privacy.collect.item3")}</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">{t("legal.privacy.use.title")}</h2>
              <p className="text-muted-foreground">{t("legal.privacy.use.content")}</p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
                <li>{t("legal.privacy.use.item1")}</li>
                <li>{t("legal.privacy.use.item2")}</li>
                <li>{t("legal.privacy.use.item3")}</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">{t("legal.privacy.security.title")}</h2>
              <p className="text-muted-foreground">{t("legal.privacy.security.content")}</p>
            </section>

            <section className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">{t("legal.privacy.sharing.title")}</h2>
              <p className="text-muted-foreground">{t("legal.privacy.sharing.content")}</p>
            </section>

            <section className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">{t("legal.privacy.cookies.title")}</h2>
              <p className="text-muted-foreground">{t("legal.privacy.cookies.content")}</p>
            </section>

            <section className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">{t("legal.privacy.rights.title")}</h2>
              <p className="text-muted-foreground">{t("legal.privacy.rights.content")}</p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
                <li>{t("legal.privacy.rights.item1")}</li>
                <li>{t("legal.privacy.rights.item2")}</li>
                <li>{t("legal.privacy.rights.item3")}</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">{t("legal.privacy.contact.title")}</h2>
              <p className="text-muted-foreground">{t("legal.privacy.contact.content")}</p>
            </section>

            <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/terms" className="text-primary hover:underline">
                {t("legal.termsTitle")}
              </Link>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("legal.goBack")}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
