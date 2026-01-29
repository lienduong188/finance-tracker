import { useState, useRef, useEffect, type ReactNode } from "react"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  content: string
  children?: ReactNode
  position?: "top" | "bottom" | "left" | "right"
  className?: string
  iconClassName?: string
  showIcon?: boolean
}

export function Tooltip({
  content,
  children,
  position = "top",
  className,
  iconClassName,
  showIcon = true,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Close tooltip when clicking outside (for mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsVisible(false)
      }
    }

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("touchstart", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [isVisible])

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-foreground border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-foreground border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-foreground border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-foreground border-y-transparent border-l-transparent",
  }

  return (
    <div
      ref={tooltipRef}
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      {children}
      {showIcon && (
        <Info
          className={cn(
            "ml-1 h-3.5 w-3.5 cursor-help text-muted-foreground hover:text-foreground transition-colors",
            iconClassName
          )}
        />
      )}
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 w-max max-w-xs rounded-md bg-foreground px-3 py-2 text-xs text-background shadow-lg",
            positionClasses[position]
          )}
        >
          {content}
          <div
            className={cn(
              "absolute border-4",
              arrowClasses[position]
            )}
          />
        </div>
      )}
    </div>
  )
}
