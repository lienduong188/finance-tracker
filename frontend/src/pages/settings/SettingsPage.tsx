import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { usersApi, categoriesApi } from "@/api"
import { useAuth } from "@/context/AuthContext"
import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { User, Lock, Check, AlertCircle, Tags, Plus, Pencil, Trash2 } from "lucide-react"
import type { Category, CategoryType, CategoryRequest } from "@/types"

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

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().optional(),
  color: z.string().optional(),
})

type ProfileForm = z.output<typeof profileSchema>
type PasswordForm = z.output<typeof passwordSchema>
type CategoryForm = z.output<typeof categorySchema>

export function SettingsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Category state
  const [categoryTab, setCategoryTab] = useState<CategoryType>("EXPENSE")
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categorySuccess, setCategorySuccess] = useState<string | null>(null)

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

  const categoryForm = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: "EXPENSE",
      icon: "",
      color: "#3b82f6",
    },
  })

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getAll,
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

  const createCategoryMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      setShowCategoryModal(false)
      categoryForm.reset()
      setCategorySuccess(t("settings.categoryCreated"))
      setTimeout(() => setCategorySuccess(null), 3000)
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryRequest }) => categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      setShowCategoryModal(false)
      setEditingCategory(null)
      categoryForm.reset()
      setCategorySuccess(t("settings.categoryUpdated"))
      setTimeout(() => setCategorySuccess(null), 3000)
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      setCategorySuccess(t("settings.categoryDeleted"))
      setTimeout(() => setCategorySuccess(null), 3000)
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

  const onCategorySubmit = (data: CategoryForm) => {
    const categoryData: CategoryRequest = {
      name: data.name,
      type: data.type,
      icon: data.icon || undefined,
      color: data.color || undefined,
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryData })
    } else {
      createCategoryMutation.mutate(categoryData)
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    categoryForm.reset({
      name: category.name,
      type: category.type,
      icon: category.icon || "",
      color: category.color || "#3b82f6",
    })
    setShowCategoryModal(true)
  }

  const handleDeleteCategory = (category: Category) => {
    if (category.isSystem) {
      alert(t("settings.cannotDeleteSystem"))
      return
    }
    if (confirm(t("settings.confirmDeleteCategory"))) {
      deleteCategoryMutation.mutate(category.id)
    }
  }

  const handleAddCategory = () => {
    setEditingCategory(null)
    categoryForm.reset({
      name: "",
      type: categoryTab,
      icon: "",
      color: "#3b82f6",
    })
    setShowCategoryModal(true)
  }

  const currencies = [
    { value: "VND", label: t("currencies.VND") },
    { value: "JPY", label: t("currencies.JPY") },
  ]

  // Filter categories by type (only root categories, not children)
  const filteredCategories = categories.filter(
    (c) => c.type === categoryTab && !c.parentId
  )

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

      {/* Categories Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                {t("settings.categoriesSection")}
              </CardTitle>
              <CardDescription>{t("settings.categoriesDescription")}</CardDescription>
            </div>
            <Button onClick={handleAddCategory} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t("settings.addCategory")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {categorySuccess && (
            <div className="mb-4 flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              {categorySuccess}
            </div>
          )}

          {/* Tabs */}
          <div className="mb-4 flex gap-2 border-b">
            <button
              onClick={() => setCategoryTab("EXPENSE")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                categoryTab === "EXPENSE"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("settings.expenseCategories")}
            </button>
            <button
              onClick={() => setCategoryTab("INCOME")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                categoryTab === "INCOME"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("settings.incomeCategories")}
            </button>
          </div>

          {/* Categories List */}
          <div className="space-y-2">
            {filteredCategories.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">{t("common.noData")}</p>
            ) : (
              filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-lg"
                      style={{ backgroundColor: category.color || "#e5e7eb" }}
                    >
                      {category.icon || "📁"}
                    </span>
                    <div>
                      <p className="font-medium">
                        {category.isSystem ? t(`categories.${category.name}`, category.name) : category.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {category.isSystem ? t("settings.systemCategory") : t("settings.customCategory")}
                      </p>
                    </div>
                  </div>
                  {!category.isSystem && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">
              {editingCategory ? t("settings.editCategory") : t("settings.addCategory")}
            </h2>
            <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t("settings.categoryName")}
                </label>
                <Input
                  {...categoryForm.register("name")}
                  placeholder={t("settings.categoryName")}
                />
                {categoryForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-destructive">
                    {categoryForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t("settings.categoryType")}
                </label>
                <select
                  {...categoryForm.register("type")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="EXPENSE">{t("transactions.types.EXPENSE")}</option>
                  <option value="INCOME">{t("transactions.types.INCOME")}</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t("settings.categoryIcon")}
                </label>
                <Input
                  {...categoryForm.register("icon")}
                  placeholder="🍔"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t("settings.categoryColor")}
                </label>
                <Input
                  {...categoryForm.register("color")}
                  type="color"
                  className="h-10 w-full cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCategoryModal(false)
                    setEditingCategory(null)
                    categoryForm.reset()
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                >
                  {createCategoryMutation.isPending || updateCategoryMutation.isPending
                    ? t("common.loading")
                    : editingCategory
                    ? t("common.update")
                    : t("common.add")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
