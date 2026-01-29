import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { authApi } from "@/api"
import { Button, Input, Label, Select, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui"
import { LanguageSwitch } from "@/components/LanguageSwitch"
import { VALIDATION, PASSWORD_REGEX } from "@/lib/validation"
import { generateSecurePassword, copyToClipboard } from "@/lib/password-generator"

export function RegisterPage() {
  const { t, i18n } = useTranslation()
  const { register: registerUser, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState("")
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

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
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      defaultCurrency: "USD",
    },
  })

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleGeneratePassword = async () => {
    const newPassword = generateSecurePassword(16)
    setValue("password", newPassword)
    setValue("confirmPassword", newPassword)
    setShowPassword(true)

    const success = await copyToClipboard(newPassword)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
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
        locale: i18n.language,
      })
      setRegisteredEmail(data.email)
      setRegistrationSuccess(true)
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

  const handleResendVerification = async () => {
    setResendLoading(true)
    setResendMessage(null)
    try {
      await authApi.resendVerification(registeredEmail)
      setResendMessage(t("auth.verificationEmailSent"))
    } catch {
      setResendMessage(t("auth.registerFailed"))
    } finally {
      setResendLoading(false)
    }
  }

  if (registrationSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 p-4 text-center md:p-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-xl md:text-2xl">{t("auth.registrationSuccess")}</CardTitle>
            <CardDescription className="text-sm">
              {t("auth.checkEmailToVerify")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
            <p className="text-center text-sm text-muted-foreground">
              Email: <strong>{registeredEmail}</strong>
            </p>
            {resendMessage && (
              <div className="rounded-md bg-primary/10 p-3 text-center text-sm text-primary">
                {resendMessage}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 p-4 pt-0 md:gap-4 md:p-6 md:pt-0">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResendVerification}
              isLoading={resendLoading}
            >
              {t("auth.resendVerification")}
            </Button>
            <Link to="/login" className="w-full">
              <Button type="button" className="w-full">
                {t("auth.goToLogin")}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
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
                placeholder={t("auth.fullNamePlaceholder")}
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" required>{t("auth.password")}</Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                    title={t("auth.generatePassword")}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    {t("auth.generatePassword")}
                  </button>
                  {copied && (
                    <span className="text-xs text-green-600">{t("auth.copied")}</span>
                  )}
                </div>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  title={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{t("auth.passwordRequirements")}</p>
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
                <option value="USD">{t("currencies.USD")}</option>
                <option value="JPY">{t("currencies.JPY")}</option>
                <option value="VND">{t("currencies.VND")}</option>
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
