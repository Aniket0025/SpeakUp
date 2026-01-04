"use client"

import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ModeCardProps {
  icon: LucideIcon
  iconBgColor: string
  title: string
  description: string
  features: string[]
  featureColor?: string
  badgeText?: string
  badgeColor?: string
  buttonGradient: string
  onClick?: () => void
}

export function ModeCard({
  icon: Icon,
  iconBgColor,
  title,
  description,
  features,
  featureColor = "bg-blue-500",
  badgeText,
  badgeColor = "bg-orange-500",
  buttonGradient,
  onClick,
}: ModeCardProps) {
  return (
    <div className="relative flex flex-col p-6 rounded-3xl bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Badge */}
      {badgeText && (
        <div className="absolute -top-3 right-6">
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1",
              badgeColor,
            )}
          >
            <span>✨</span> {badgeText}
          </span>
        </div>
      )}

      {/* Icon */}
      <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center mb-4", iconBgColor)}>
        <Icon className="h-8 w-8 text-white" />
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm mb-4">{description}</p>

      {/* Features */}
      <ul className="space-y-2 mb-6 flex-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
            <span className={cn("h-2 w-2 rounded-full", featureColor)} />
            {feature}
          </li>
        ))}
      </ul>

      {/* Button */}
      <Button
        onClick={onClick}
        className={cn(
          "w-full py-6 rounded-xl text-white font-semibold text-base shadow-lg transition-all duration-300 hover:scale-[1.02]",
          buttonGradient,
        )}
      >
        Start Now
      </Button>
    </div>
  )
}
