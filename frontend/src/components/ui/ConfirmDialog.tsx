import { useTranslation } from "react-i18next"
import { AlertTriangle, Info, Trash2, X } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
  isLoading?: boolean
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
    buttonVariant: "destructive" as const,
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    buttonVariant: "default" as const,
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    buttonVariant: "default" as const,
  },
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  const config = variantConfig[variant]
  const Icon = config.icon

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    // Don't close here - let parent handle closing after async operation completes
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative mx-4 w-full max-w-md animate-in fade-in zoom-in-95 rounded-lg bg-background p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center">
          <div className={cn("rounded-full p-3", config.iconBg)}>
            <Icon className={cn("h-6 w-6", config.iconColor)} />
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 text-center">
          {title && (
            <h3 className="text-lg font-semibold">{title}</h3>
          )}
          <p className={cn("text-muted-foreground", title ? "mt-2" : "mt-0")}>
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText || t("common.cancel")}
          </Button>
          <Button
            variant={config.buttonVariant}
            className="flex-1"
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            {confirmText || t("common.confirm")}
          </Button>
        </div>
      </div>
    </div>
  )
}
