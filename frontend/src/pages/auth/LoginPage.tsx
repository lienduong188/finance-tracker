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
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("auth.loginTitle")}</CardTitle>
          <CardDescription>
            {t("auth.loginDescription")}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
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
              <Label htmlFor="password" required>{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password")}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" isLoading={isLoading}>
              {t("auth.login")}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Link to="/register" className="text-primary hover:underline">
                {t("auth.register")}
              </Link>
            </p>

            <div className="w-full border-t pt-4">
              <LanguageSwitch />
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
