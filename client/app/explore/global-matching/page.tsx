"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Clock, Globe, Sparkles, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

export default function GlobalMatchingPage() {
  const router = useRouter()
  const { user, loading, token } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  if (!user) return null
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Link */}
        <Link href="/explore" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Arena
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Global Matching</h1>
          <p className="text-gray-500 text-lg">Join a quick group discussion with students around the world.</p>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl bg-white border border-gray-100 shadow-lg p-8 mb-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Content */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <Globe className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Global Matching</h2>
                  <p className="text-gray-500 text-sm">Instantly join a group discussion with students worldwide</p>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  Auto-matched groups of up to 6 participants
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Balanced topics from real interview-style prompts
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-pink-500" />
                  Best for quick practice (10–15 min)
                </li>
              </ul>

              {/* Start Button */}
              {error && <p className="text-sm font-semibold text-red-600 mb-3">{error}</p>}
              <Button
                disabled={busy}
                onClick={async () => {
                  setError(null)
                  if (!token) {
                    router.push("/login")
                    return
                  }
                  if (busy) return
                  setBusy(true)
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/gd/global/join`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                    })
                    const data = await res.json().catch(() => null)
                    if (!res.ok) {
                      setError(data?.message || "Failed to start global match")
                      return
                    }
                    const roomId = String(data?.roomId || "").toUpperCase()
                    router.push(`/explore/gd/room/${roomId}/waiting`)
                  } catch (e: any) {
                    setError(e?.message || "Failed to start global match")
                  } finally {
                    setBusy(false)
                  }
                }}
                className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-semibold px-8 py-6 rounded-xl shadow-lg shadow-violet-500/25"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                {busy ? "Finding Match..." : "Start Now"}
              </Button>

              <p className="text-sm text-gray-400 mt-4">
                You'll first join a "Finding Participants" screen while we match you with others.
              </p>
            </div>

            {/* Right Info Panel */}
            <div className="lg:w-64 p-6 rounded-2xl bg-violet-50 border border-violet-100">
              <div className="mb-6">
                <div className="flex items-center gap-2 text-violet-600 text-sm font-medium mb-1">
                  <Users className="h-4 w-4" />
                  TEAM SIZE
                </div>
                <p className="text-2xl font-bold text-gray-900">6 participants</p>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 text-violet-600 text-sm font-medium mb-1">
                  <Clock className="h-4 w-4" />
                  DURATION
                </div>
                <p className="text-2xl font-bold text-gray-900">10–15 min</p>
              </div>

              <p className="text-sm text-gray-500">Matching usually takes 10–30 seconds depending on traffic.</p>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <Globe className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">How it works</h3>
              <p className="text-gray-500">
                Click <span className="font-semibold text-gray-900">Start Now</span> to enter the global queue. We'll
                match you with other participants and send you to the Lobby once a group is ready.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
