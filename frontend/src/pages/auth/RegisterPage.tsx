import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { Button, Input, Label, Select, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui"
import { LanguageSwitch } from "@/components/LanguageSwitch"
import { VALIDATION, PASSWORD_REGEX } from "@/lib/validation"

export function RegisterPage() {
  const { t } = useTranslation()
  const { register: registerUser, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registerSchema = z.object({
    fullName: z.string()
      .min(VALIDATION.NAME_MIN, t("validation.nameMin", { min: VALIDATION.NAME_MIN }))
      .max(VALIDATION.NAME_MAX, t("errors.validation.maxLength", { field: t("auth.fullName"), max: VALIDATION.NAME_MAX })),
    email: z.string().email(t("validation.emailInvalid")),
    password: z.string()
      .min(VALIDATION.PASSWORD_MIN, t("validation.passwordMin", { min: VALIDATION.PASSWORD_MIN }))
      .regex(PASSWORD_REGEX, t("errors.validation.passwordWeak")),
    confirmPassword: z.string(),
    defaultCurrency: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("validation.passwordMismatch"),
    path: ["confirmPassword"],
  })

  type RegisterForm = z.output<typeof registerSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      defaultCurrency: "VND",
    },
  })

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    setError(null)

    try {
      await registerUser({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        defaultCurrency: data.defaultCurrency,
      })
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { data?: { message?: string } } }
        setError(axiosError.response?.data?.message || t("auth.registerFailed"))
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(t("auth.networkError"))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 p-4 text-center md:p-6">
          <CardTitle className="text-xl md:text-2xl">{t("auth.registerTitle")}</CardTitle>
          <CardDescription className="text-sm">
            {t("auth.registerDescription")}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-3 p-4 pt-0 md:space-y-4 md:p-6 md:pt-0">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" required>{t("auth.fullName")}</Label>
              <Input
                id="fullName"
                placeholder="Nguyen Van A"
                error={errors.fullName?.message}
                {...register("fullName")}
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" required>{t("auth.confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">{t("auth.defaultCurrency")}</Label>
              <Select id="defaultCurrency" {...register("defaultCurrency")}>
                <option value="VND">{t("currencies.VND")}</option>
                <option value="JPY">{t("currencies.JPY")}</option>
              </Select>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 p-4 pt-0 md:gap-4 md:p-6 md:pt-0">
            <p className="text-center text-xs text-muted-foreground">
              {t("legal.agreeToTerms")}{" "}
              <Link to="/terms" className="text-primary hover:underline">
                {t("legal.termsTitle")}
              </Link>{" "}
              {t("legal.and")}{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                {t("legal.privacyTitle")}
              </Link>
            </p>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              {t("auth.register")}
            </Button>

            <p className="text-center text-xs text-muted-foreground md:text-sm">
              {t("auth.hasAccount")}{" "}
              <Link to="/login" className="text-primary hover:underline">
                {t("auth.login")}
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
