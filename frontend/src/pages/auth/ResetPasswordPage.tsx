import { useState } from "react"
import { Link, useSearchParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { LanguageSwitch } from "@/components/LanguageSwitch"
import { apiClient } from "@/api"
import { Lock, ArrowLeft, Check, AlertCircle } from "lucide-react"

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type ResetPasswordForm = z.output<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      setError(t("auth.invalidResetToken"))
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      await apiClient.post("/auth/reset-password", {
        token,
        newPassword: data.newPassword,
      })
      setSuccess(true)
      setTimeout(() => navigate("/login"), 3000)
    } catch (err) {
      setError(t("auth.resetPasswordFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-lg font-medium">{t("auth.invalidResetToken")}</p>
              <Link to="/forgot-password">
                <Button>{t("auth.requestNewToken")}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitch />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {t("auth.resetPasswordTitle")}
          </CardTitle>
          <CardDescription>
            {t("auth.resetPasswordDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span>{t("auth.passwordResetSuccess")}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("auth.redirectingToLogin")}
              </p>
              <Link to="/login">
                <Button className="w-full">{t("auth.goToLogin")}</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("settings.newPassword")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register("newPassword")}
                    type="password"
                    placeholder={t("settings.newPassword")}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-destructive">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("settings.confirmNewPassword")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register("confirmPassword")}
                    type="password"
                    placeholder={t("settings.confirmNewPassword")}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("common.loading") : t("auth.resetPassword")}
              </Button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("auth.backToLogin")}
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
