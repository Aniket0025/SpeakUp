"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Brain, Mic, Users, Heart, Code, Briefcase, Plus, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { MatchingModal } from "@/components/explore/matching-modal"
import { CustomRoomModal } from "@/components/explore/custom-room-modal"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"

export default function AIInterviewPage() {
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

  const interviewTypes = [
    { name: "HR Interview", icon: Heart, color: "text-rose-500", bgColor: "bg-rose-50" },
    { name: "Technical Interview", icon: Code, color: "text-blue-500", bgColor: "bg-blue-50" },
    { name: "Behavioral Interview", icon: Brain, color: "text-purple-500", bgColor: "bg-purple-50" },
    { name: "Case Study", icon: Briefcase, color: "text-emerald-500", bgColor: "bg-emerald-50" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MatchingModal isOpen={!!matchingMode} onClose={() => setMatchingMode(null)} mode={matchingMode || ""} />
      <CustomRoomModal open={customRoomOpen} onOpenChange={setCustomRoomOpen} />

      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/explore")}
          className="mb-6 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Explore
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-4">AI Interview Practice</h1>
            <p className="text-gray-500 text-xl">Practice interviews with AI-powered feedback</p>
          </div>

          {/* Main Modes - Updated to dual mode layout from image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* AI Mode */}
            <div className="relative group overflow-hidden rounded-[40px] bg-white border border-gray-100 shadow-xl p-10 flex flex-col items-center text-center transition-all hover:shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-400" />
              <div className="mb-6 h-28 w-28 rounded-3xl bg-emerald-100 flex items-center justify-center shadow-inner">
                <div className="h-20 w-20 rounded-2xl bg-emerald-500 flex items-center justify-center text-white">
                  <span className="text-4xl">🤖</span>
                </div>
              </div>
              <span className="px-4 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold tracking-widest uppercase mb-4">
                Voice AI
              </span>
              <h2 className="text-3xl font-black text-gray-900 mb-4">AI Mode</h2>
              <p className="text-gray-500 leading-relaxed mb-8 max-w-xs">
                Real-time voice interview with AI interviewer that asks follow-up questions
              </p>
              <Button
                onClick={() => setMatchingMode("AI Interview")}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl h-14 font-bold shadow-lg shadow-emerald-500/20 mb-6"
              >
                Start AI Session
              </Button>
              <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                <Mic className="h-4 w-4" />
                Voice-based conversation
              </div>
            </div>

            {/* Human Mode */}
            <div className="relative group overflow-hidden rounded-[40px] bg-white border border-gray-100 shadow-xl p-10 flex flex-col items-center text-center transition-all hover:shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500" />
              <div className="mb-6 h-28 w-28 rounded-3xl bg-gradient-to-br from-cyan-100 to-fuchsia-100 flex items-center justify-center shadow-inner">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-fuchsia-500 flex items-center justify-center text-white">
                  <Users className="h-10 w-10" />
                </div>
              </div>
              <span className="px-4 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-bold tracking-widest uppercase mb-4">
                Peer Practice
              </span>
              <h2 className="text-3xl font-black text-gray-900 mb-4">Human Mode</h2>
              <p className="text-gray-500 leading-relaxed mb-8 max-w-xs">
                Practice interviews with real people via video call
              </p>
              <div className="flex gap-4 w-full px-4">
                <Button
                  onClick={() => setCustomRoomOpen(true)}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded-2xl h-14 font-bold shadow-lg shadow-cyan-500/20"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create
                </Button>
                <Button
                  onClick={() => setCustomRoomOpen(true)}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white rounded-2xl h-14 font-bold shadow-lg shadow-pink-500/20"
                >
                  <UserPlus className="h-5 w-5 mr-2 rotate-90" />
                  Join
                </Button>
              </div>
            </div>
          </div>

          {/* Interview Types - Added interview types grid from image */}
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-8">Interview Types</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {interviewTypes.map((type) => (
                <button
                  key={type.name}
                  className="p-8 rounded-[32px] bg-white border border-gray-50 shadow-md hover:shadow-xl transition-all group flex flex-col items-center gap-4"
                >
                  <div
                    className={cn(
                      "h-16 w-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm",
                      type.bgColor,
                    )}
                  >
                    <type.icon className={cn("h-8 w-8", type.color)} />
                  </div>
                  <span className="font-bold text-gray-900 text-sm md:text-base">{type.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
