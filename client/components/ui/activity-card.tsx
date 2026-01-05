"use client"

import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

interface ActivityCardProps {
  icon: LucideIcon
  iconBgColor: string
  title: string
  subtitle: string
  description: string
  href: string
  subtitleColor?: string
}

// <CHANGE> Ensuring named export is explicit and using Link for better navigation
export function ActivityCard({
  icon: Icon,
  iconBgColor,
  title,
  subtitle,
  description,
  href,
  subtitleColor = "text-violet-600",
}: ActivityCardProps) {
  const { user } = useAuth()
  const router = useRouter()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user) {
      e.preventDefault()
      router.push("/login")
    }
  }
  return (
    <Link
      href={href}
      onClick={handleClick}
      className="group relative flex flex-col items-start p-8 rounded-[2.5rem] bg-card border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 text-left w-full"
    >
      {/* Icon Container */}
      <div
        className={cn(
          "h-20 w-20 rounded-3xl flex items-center justify-center mb-8 shadow-lg transition-transform duration-500 group-hover:scale-110",
          iconBgColor,
        )}
      >
        <Icon className="h-10 w-10 text-white" />
      </div>

      {/* Content */}
      <h3 className="text-3xl font-extrabold text-foreground mb-3 tracking-tight">{title}</h3>
      <span className={cn("text-lg font-bold mb-4 block", subtitleColor)}>{subtitle}</span>
      <p className="text-muted-foreground text-base leading-relaxed font-medium">{description}</p>

      {/* Hover Arrow Indicator */}
      <div className="absolute top-10 right-10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border border-border">
          <svg
            className="h-5 w-5 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
