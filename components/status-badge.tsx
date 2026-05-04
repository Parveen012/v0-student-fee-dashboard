import { cn } from "@/lib/utils"
import type { FeeStatus } from "@/lib/types"

interface StatusBadgeProps {
  status: FeeStatus | "completed" | "pending" | "failed" | "refunded"
  className?: string
}

const statusConfig = {
  paid: {
    label: "Paid",
    className: "bg-success/10 text-success border-success/20",
  },
  partial: {
    label: "Partial",
    className: "bg-warning/10 text-warning-foreground border-warning/20",
  },
  unpaid: {
    label: "Unpaid",
    className: "bg-muted text-muted-foreground border-muted",
  },
  overpaid: {
    label: "Overpaid",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  completed: {
    label: "Completed",
    className: "bg-success/10 text-success border-success/20",
  },
  pending: {
    label: "Pending",
    className: "bg-warning/10 text-warning-foreground border-warning/20",
  },
  overdue: {
    label: "Overdue",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  failed: {
    label: "Failed",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  refunded: {
    label: "Refunded",
    className: "bg-muted text-muted-foreground border-muted",
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
