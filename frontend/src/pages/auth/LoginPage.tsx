import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui"
import { LanguageSwitch } from "@/components/LanguageSwitch"

export function LoginPage() {
  const { t } = useTranslation()
  const { login, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loginSchema = z.object({
    email: z.string().email(t("validation.emailInvalid")),
    password: z.string().min(6, t("validation.passwordMin", { min: 6 })),
  })

  type LoginForm = z.infer<typeof loginSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError(null)

    try {
      await login(data)
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
