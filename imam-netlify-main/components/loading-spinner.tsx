import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  text?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingSpinner({ text = "جاري التحميل...", size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary mb-4`} />
      {text && (
        <p className="text-text-muted text-sm">
          {text}
        </p>
      )}
    </div>
  )
}
