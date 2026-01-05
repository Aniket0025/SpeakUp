"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { ModeCard } from "@/components/ui/mode-card"
import { CustomRoomModal } from "@/components/explore/custom-room-modal"
import { Globe, Settings, Trophy, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function GDModePage() {
  const [customRoomOpen, setCustomRoomOpen] = useState(false)
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/explore")}
          className="mb-6 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Explore
        </Button>

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Choose Your GD Mode</h1>
          <p className="text-gray-500 text-lg">Select how you want to practice Group Discussion today</p>
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <ModeCard
            icon={Globe}
            iconBgColor="bg-gradient-to-br from-violet-500 to-indigo-600"
            title="Global Matching"
            description="Join global discussions and compete with players worldwide"
            features={["Earn XP & Badges", "Global Leaderboard", "AI Feedback", "Instant Matching"]}
            featureColor="bg-blue-500"
            badgeText="Reward Mode"
            badgeColor="bg-gradient-to-r from-orange-500 to-red-500"
            buttonGradient="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700"
            onClick={() => router.push("/explore/global-matching")}
          />

          <ModeCard
            icon={Settings}
            iconBgColor="bg-gradient-to-br from-emerald-500 to-teal-500"
            title="Custom GD Room"
            description="Create private rooms with friends and custom settings"
            features={["Private Rooms", "Custom Topics", "Invite Friends", "Flexible Settings"]}
            featureColor="bg-emerald-500"
            badgeText="No Reward"
            badgeColor="bg-gray-500"
            buttonGradient="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            onClick={() => setCustomRoomOpen(true)}
          />

          <ModeCard
            icon={Trophy}
            iconBgColor="bg-gradient-to-br from-pink-500 to-rose-500"
            title="Tournament"
            description="Compete in organized tournaments with special prizes"
            features={["Special Prizes", "Certificates", "Recognition", "Leaderboard"]}
            featureColor="bg-pink-500"
            badgeText="Organization Rewards"
            badgeColor="bg-gradient-to-r from-pink-500 to-rose-500"
            buttonGradient="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
            onClick={() => router.push("/explore/tournaments")}
          />
        </div>
      </main>

      <CustomRoomModal open={customRoomOpen} onOpenChange={setCustomRoomOpen} />
    </div>
  )
}
