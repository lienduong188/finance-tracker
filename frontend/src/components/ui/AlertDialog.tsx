import { useTranslation } from "react-i18next"
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

export interface AlertDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  buttonText?: string
  variant?: "error" | "success" | "warning" | "info"
}

const variantConfig = {
  error: {
    icon: AlertCircle,
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
  },
  success: {
    icon: CheckCircle,
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
    iconColor: "text-yellow-600 dark:text-yellow-400",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  buttonText,
  variant = "error",
}: AlertDialogProps) {
  const { t } = useTranslation()
  const config = variantConfig[variant]
  const Icon = config.icon

  if (!isOpen) return null

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

        {/* Action */}
        <div className="mt-6">
          <Button
            variant="default"
            className="w-full"
            onClick={onClose}
          >
            {buttonText || t("common.ok")}
          </Button>
        </div>
      </div>
    </div>
  )
}
