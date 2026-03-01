import { cn } from "@/lib/utils"
import { type RecitationStatus, statusLabels, statusColors } from "@/lib/mock-data"

export function StatusBadge({ status, className }: { status: RecitationStatus | string; className?: string }) {
  const label = statusLabels[status as RecitationStatus] || status
  const color = statusColors[status as RecitationStatus] || "bg-muted text-muted-foreground border-border"
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
        color,
        className
      )}
    >
      {label}
    </span>
  )
}
