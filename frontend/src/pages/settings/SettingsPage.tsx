import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { usersApi } from "@/api"
import { useAuth } from "@/context/AuthContext"
import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { User, Lock, Check, AlertCircle } from "lucide-react"

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  defaultCurrency: z.string().min(3).max(3),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type ProfileForm = z.output<typeof profileSchema>
type PasswordForm = z.output<typeof passwordSchema>

export function SettingsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      defaultCurrency: user?.defaultCurrency || "VND",
    },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] })
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: usersApi.changePassword,
    onSuccess: () => {
      setPasswordSuccess(true)
      setPasswordError(null)
      passwordForm.reset()
      setTimeout(() => setPasswordSuccess(false), 3000)
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || t("settings.passwordChangeFailed")
      setPasswordError(message)
    },
  })

  const onProfileSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data)
  }

  const onPasswordSubmit = (data: PasswordForm) => {
    setPasswordError(null)
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    })
  }

  const currencies = [
    { value: "VND", label: t("currencies.VND") },
    { value: "JPY", label: t("currencies.JPY") },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("settings.title")}</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("settings.profile")}
            </CardTitle>
            <CardDescription>{t("settings.profileDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t("auth.fullName")}
                </label>
                <Input
                  {...profileForm.register("fullName")}
                  placeholder={t("auth.fullName")}
                />
                {profileForm.formState.errors.fullName && (
                  <p className="mt-1 text-sm text-destructive">
                    {profileForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t("auth.defaultCurrency")}
                </label>
                <select
                  {...profileForm.register("defaultCurrency")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {currencies.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>

              {profileSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {t("settings.profileUpdated")}
                </div>
              )}

              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? t("common.loading") : t("settings.updateProfile")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {t("settings.security")}
            </CardTitle>
            <CardDescription>{t("settings.securityDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t("settings.currentPassword")}
                </label>
                <Input
                  {...passwordForm.register("currentPassword")}
                  type="password"
                  placeholder={t("settings.currentPassword")}
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="mt-1 text-sm text-destructive">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t("settings.newPassword")}
                </label>
                <Input
                  {...passwordForm.register("newPassword")}
                  type="password"
                  placeholder={t("settings.newPassword")}
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="mt-1 text-sm text-destructive">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t("settings.confirmNewPassword")}
                </label>
                <Input
                  {...passwordForm.register("confirmPassword")}
                  type="password"
                  placeholder={t("settings.confirmNewPassword")}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-destructive">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {passwordError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {t("settings.passwordChanged")}
                </div>
              )}

              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? t("common.loading") : t("settings.changePassword")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
