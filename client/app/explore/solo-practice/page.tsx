"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bot, Eye, Lightbulb, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { MatchingModal } from "@/components/explore/matching-modal"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"

export default function SoloPracticePage() {
  const router = useRouter()
  const [matchingActive, setMatchingActive] = useState(false)
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#f7f9fd]">
      <Header />
      <MatchingModal isOpen={matchingActive} onClose={() => setMatchingActive(false)} mode="AI Practice Session" />

      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/explore")}
          className="mb-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Explore
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex h-24 w-24 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 items-center justify-center mb-6 shadow-xl">
              <Bot className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-5xl font-extrabold text-gray-900 mb-4">Practice with AI</h1>
            <p className="text-gray-500 text-xl">AI Coach with proctoring analysis and personalized tips</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-lg text-center">
              <Eye className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Proctoring</h3>
              <p className="text-sm text-gray-500">Monitor your practice</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-lg text-center">
              <Lightbulb className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Smart Tips</h3>
              <p className="text-sm text-gray-500">Personalized guidance</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-lg text-center">
              <BarChart3 className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Analysis</h3>
              <p className="text-sm text-gray-500">Detailed performance report</p>
            </div>
          </div>

          <div className="text-center">
            <Button
              onClick={() => setMatchingActive(true)}
              className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-600 hover:via-teal-600 hover:to-green-700 text-white px-12 py-6 text-lg font-semibold rounded-xl shadow-xl"
            >
              Start AI Practice
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
