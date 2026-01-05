import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  icon: LucideIcon
  iconColor?: string
  iconBgColor?: string
  label: string
  value: string | number
  className?: string
}

export function StatCard({
  icon: Icon,
  iconColor = "text-violet-600",
  iconBgColor = "bg-violet-100",
  label,
  value,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300",
        className,
      )}
    >
      <div className={cn("p-3 rounded-xl mb-3", iconBgColor, "dark:ring-1 dark:ring-border") }>
        <Icon className={cn("h-6 w-6", iconColor)} />
      </div>
      <span className="text-2xl font-bold text-foreground">{value}</span>
      <span className="text-sm text-muted-foreground mt-1">{label}</span>
    </div>
  )
}
