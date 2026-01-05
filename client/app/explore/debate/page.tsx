"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, Globe, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { MatchingModal } from "@/components/explore/matching-modal"
import { CustomRoomModal } from "@/components/explore/custom-room-modal"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"

export default function DebatePage() {
  const router = useRouter()
  const [matchingMode, setMatchingMode] = useState<string | null>(null)
  const [customRoomOpen, setCustomRoomOpen] = useState(false)
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  if (!user) return null

  const debateModes = [
    {
      title: "Global Matching",
      description: "Join a quick debate with students around the world",
      icon: Globe,
      color: "from-blue-500 to-cyan-400",
      bgColor: "bg-blue-50",
      badge: "Reward Mode",
      badgeColor: "bg-amber-100 text-amber-700",
      features: ["Earn XP & Badges", "Global Leaderboard", "AI Scoring", "Instant Matching"],
      action: () => setMatchingMode("Global Debate"),
    },
    {
      title: "Custom Debate Room",
      description: "Create private rooms with friends and custom topics",
      icon: Plus,
      color: "from-emerald-500 to-teal-400",
      bgColor: "bg-emerald-50",
      badge: "No Reward",
      badgeColor: "bg-gray-100 text-gray-600",
      features: ["Private Rooms", "Custom Topics", "Invite Friends", "Flexible Rules"],
      id: "custom",
      action: () => setCustomRoomOpen(true),
    },
    {
      title: "Tournament",
      description: "Compete in organized tournaments with special prizes",
      icon: Trophy,
      color: "from-rose-500 to-pink-500",
      bgColor: "bg-rose-50",
      badge: "Big Prizes",
      badgeColor: "bg-rose-100 text-rose-700",
      features: ["Win Certificates", "Special Prizes", "Official Rankings", "Live Audience"],
      id: "tournament",
      action: () => router.push("/explore/tournaments"),
    },
  ]

  return (
    <div className="min-h-screen bg-[#f7f9fd]">
      <Header />
      <MatchingModal isOpen={!!matchingMode} onClose={() => setMatchingMode(null)} mode={matchingMode || ""} />
      <CustomRoomModal open={customRoomOpen} onOpenChange={setCustomRoomOpen} />

      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/explore")}
          className="mb-6 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Explore
        </Button>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-4">Choose Your Debate Mode</h1>
            <p className="text-gray-500 text-xl">Select how you want to argue today</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {debateModes.map((mode) => (
              <div
                key={mode.title}
                className="relative group overflow-hidden rounded-[40px] bg-white border border-gray-100 shadow-xl p-8 flex flex-col h-full transition-all hover:shadow-2xl hover:-translate-y-1"
              >
                <div
                  className={cn(
                    "absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                    mode.badgeColor,
                  )}
                >
                  {mode.badge}
                </div>

                <div
                  className={cn(
                    "h-24 w-24 rounded-3xl mb-8 flex items-center justify-center shadow-inner",
                    mode.bgColor,
                  )}
                >
                  <div
                    className={cn(
                      "h-20 w-20 rounded-2xl flex items-center justify-center text-white shadow-lg",
                      "bg-gradient-to-br",
                      mode.color,
                    )}
                  >
                    <mode.icon className="h-10 w-10" />
                  </div>
                </div>

                <h2 className="text-3xl font-black text-gray-900 mb-4 leading-tight">{mode.title}</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">{mode.description}</p>

                <div className="flex-1 space-y-3 mb-10">
                  {mode.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      <span className="text-sm font-medium text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={mode.action}
                  className={cn(
                    "w-full h-14 rounded-2xl text-lg font-bold shadow-xl transition-all active:scale-95",
                    "bg-gradient-to-r text-white border-0",
                    mode.color,
                  )}
                >
                  Start Now
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
