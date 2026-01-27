import { useState, useEffect } from "react"
import { Link, Navigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui"
import { LanguageSwitch } from "@/components/LanguageSwitch"

const REMEMBERED_EMAIL_KEY = "rememberedEmail"

export function LoginPage() {
  const { t } = useTranslation()
  const { login, isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const loginSchema = z.object({
    email: z.string().email(t("validation.emailInvalid")),
    password: z.string().min(8, t("validation.passwordMin", { min: 8 })),
  })

  type LoginForm = z.infer<typeof loginSchema>

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (searchParams.get("expired") === "true") {
      setSessionExpired(true)
      searchParams.delete("expired")
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY)
    if (savedEmail) {
      setValue("email", savedEmail)
      setRememberMe(true)
    }
  }, [setValue])

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError(null)

    try {
      await login(data)
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, data.email)
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY)
      }
    } catch {
      setError(t("auth.loginFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 p-4 text-center md:p-6">
          <CardTitle className="text-xl md:text-2xl">{t("auth.loginTitle")}</CardTitle>
          <CardDescription className="text-sm">
            {t("auth.loginDescription")}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
            {sessionExpired && (
              <div className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-600">
                {t("auth.sessionExpired")}
              </div>
            )}

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" required>{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                error={errors.email?.message}
                {...register("email")}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" required>{t("auth.password")}</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password")}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer">
                {t("auth.rememberEmail")}
              </label>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 p-4 pt-0 md:gap-4 md:p-6 md:pt-0">
            <Button type="submit" className="w-full" isLoading={isLoading}>
              {t("auth.login")}
            </Button>

            <p className="text-center text-xs text-muted-foreground md:text-sm">
              {t("auth.noAccount")}{" "}
              <Link to="/register" className="text-primary hover:underline">
                {t("auth.register")}
              </Link>
            </p>

            <div className="w-full border-t pt-3 md:pt-4">
              <LanguageSwitch />
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
