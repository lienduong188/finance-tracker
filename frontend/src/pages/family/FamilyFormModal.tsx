import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { familiesApi } from "@/api"
import type { Family, GroupType } from "@/types"
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui"

const createFamilySchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t("family.validation.nameRequired")).max(100),
  type: z.enum(["FAMILY", "FRIENDS", "WORK", "OTHER"]),
  description: z.string().optional(),
  currency: z.string().length(3, t("family.validation.currencyLength")).optional(),
})

type FamilyForm = z.infer<ReturnType<typeof createFamilySchema>>

const groupTypeKeys: GroupType[] = ["FAMILY", "FRIENDS", "WORK", "OTHER"]

interface FamilyFormModalProps {
  isOpen: boolean
  onClose: () => void
  family: Family | null
}

export default function FamilyFormModal({ isOpen, onClose, family }: FamilyFormModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isEditing = !!family

  const familySchema = createFamilySchema(t)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FamilyForm>({
    resolver: zodResolver(familySchema),
    defaultValues: {
      name: "",
      type: "FAMILY",
      description: "",
      currency: "VND",
    },
  })

  useEffect(() => {
    if (family) {
      reset({
        name: family.name,
        type: family.type || "FAMILY",
        description: family.description || "",
        currency: family.currency,
      })
    } else {
      reset({
        name: "",
        type: "FAMILY",
        description: "",
        currency: "VND",
      })
    }
  }, [family, reset])

  const createMutation = useMutation({
    mutationFn: familiesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FamilyForm) => familiesApi.update(family!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] })
      onClose()
    },
  })

  const onSubmit = (data: FamilyForm) => {
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? t("family.editGroup") : t("family.newGroup")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("family.groupName")} *</label>
            <Input {...register("name")} placeholder={t("family.groupNamePlaceholder")} />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("family.groupType")} *</label>
            <select {...register("type")} className="w-full border rounded-md p-2">
              {groupTypeKeys.map((type) => (
                <option key={type} value={type}>
                  {t(`family.types.${type}`)}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("family.groupDescription")}</label>
            <Input {...register("description")} placeholder={t("family.groupDescriptionPlaceholder")} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("family.defaultCurrency")}</label>
            <select {...register("currency")} className="w-full border rounded-md p-2">
              <option value="VND">{t("currencies.VND")}</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="JPY">{t("currencies.JPY")}</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t("common.loading") : isEditing ? t("common.update") : t("common.add")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
