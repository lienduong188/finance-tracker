import { useState, useEffect } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { authApi } from "@/api"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from "@/components/ui"

export function VerifyEmailPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) {
      setStatus("error")
      setMessage(t("auth.invalidVerificationToken"))
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await authApi.verifyEmail(token)
        setStatus("success")
        setMessage(response.message || t("auth.verificationSuccess"))
      } catch (err: unknown) {
        setStatus("error")
        if (err && typeof err === "object" && "response" in err) {
          const axiosError = err as { response?: { data?: { message?: string } } }
          setMessage(axiosError.response?.data?.message || t("auth.verificationFailed"))
        } else {
          setMessage(t("auth.verificationFailed"))
        }
      }
    }

    verifyEmail()
  }, [searchParams, t])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 p-4 text-center md:p-6">
          {status === "loading" && (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}
          {status === "success" && (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {status === "error" && (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          <CardTitle className="text-xl md:text-2xl">{t("auth.emailVerification")}</CardTitle>
        </CardHeader>

        <CardContent className="p-4 pt-0 text-center md:p-6 md:pt-0">
          {status === "loading" && (
            <p className="text-muted-foreground">{t("common.loading")}</p>
          )}
          {status === "success" && (
            <p className="text-green-600">{message}</p>
          )}
          {status === "error" && (
            <p className="text-destructive">{message}</p>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0 md:p-6 md:pt-0">
          <Link to="/login" className="w-full">
            <Button className="w-full">
              {status === "success" ? t("auth.goToLogin") : t("auth.backToLogin")}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
