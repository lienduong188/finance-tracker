import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui"
import { LanguageSwitch } from "@/components/LanguageSwitch"

export function TermsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-muted px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader className="space-y-1 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl md:text-2xl">{t("legal.termsTitle")}</CardTitle>
              <LanguageSwitch />
            </div>
            <p className="text-sm text-muted-foreground">{t("legal.lastUpdated")}: 26/01/2026</p>
          </CardHeader>

          <CardContent className="prose prose-sm max-w-none p-4 pt-0 md:p-6 md:pt-0">
            <section className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">{t("legal.terms.acceptance.title")}</h2>
              <p className="text-muted-foreground">{t("legal.terms.acceptance.content")}</p>
            </section>

            <section className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">{t("legal.terms.service.title")}</h2>
              <p className="text-muted-foreground">{t("legal.terms.service.content")}</p>
            </section>

            <section className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">{t("legal.terms.account.title")}</h2>
              <p className="text-muted-foreground">{t("legal.terms.account.content")}</p>
            </section>

            <section className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">{t("legal.terms.usage.title")}</h2>
              <p className="text-muted-foreground">{t("legal.terms.usage.content")}</p>
            </section>

            <section className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">{t("legal.terms.data.title")}</h2>
              <p className="text-muted-foreground">{t("legal.terms.data.content")}</p>
            </section>

            <section className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">{t("legal.terms.liability.title")}</h2>
              <p className="text-muted-foreground">{t("legal.terms.liability.content")}</p>
            </section>

            <section className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">{t("legal.terms.changes.title")}</h2>
              <p className="text-muted-foreground">{t("legal.terms.changes.content")}</p>
            </section>

            <section className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">{t("legal.terms.contact.title")}</h2>
              <p className="text-muted-foreground">{t("legal.terms.contact.content")}</p>
            </section>

            <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/privacy" className="text-primary hover:underline">
                {t("legal.privacyTitle")}
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
