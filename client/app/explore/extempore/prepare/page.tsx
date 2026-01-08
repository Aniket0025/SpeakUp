"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

type ExtemporeConfig = {
  topic: string
  category: string
  durationSeconds: number
  thinkSeconds: number
  createdAt: number
}

export default function ExtemporePreparePage() {
  const router = useRouter()
  const [config, setConfig] = useState<ExtemporeConfig | null>(null)
  const [remaining, setRemaining] = useState(30)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("speakup_extempore_config")
      const parsed = raw ? (JSON.parse(raw) as ExtemporeConfig) : null
      if (!parsed?.topic || !parsed?.category) {
        router.replace("/explore/extempore")
        return
      }
      setConfig(parsed)
      setRemaining(Number(parsed.thinkSeconds || 30))
    } catch {
      router.replace("/explore/extempore")
    }
  }, [router])

  const progress = useMemo(() => {
    const total = Number(config?.thinkSeconds || 30)
    if (!total) return 0
    return Math.min(100, Math.max(0, ((total - remaining) / total) * 100))
  }, [config?.thinkSeconds, remaining])

  useEffect(() => {
    if (!config) return
    if (remaining <= 0) {
      try {
        sessionStorage.setItem(
          "speakup_extempore_prepare",
          JSON.stringify({ startedThinkingAt: Date.now(), thinkSeconds: config.thinkSeconds })
        )
      } catch {}
      router.replace("/explore/extempore/practice")
      return
    }

    const t = setTimeout(() => setRemaining((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [config, remaining, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-[40px] p-8 shadow-xl border border-gray-100">
            <div className="text-center">
              <p className="text-xs font-bold text-orange-600">PREPARATION</p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2">Get ready to speak</h1>
              <p className="text-gray-500 mt-2">Use this time to structure your thoughts: Intro → 2-3 points → Conclusion</p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-3xl border border-gray-100 bg-gray-50 p-6">
                <p className="text-xs font-bold text-gray-500">TOPIC</p>
                <p className="text-xl font-black text-gray-900 mt-2">{config?.topic || "—"}</p>
                <p className="text-sm text-gray-600 mt-2">Category: <span className="font-bold">{config?.category || "—"}</span></p>
                <p className="text-sm text-gray-600 mt-1">Speaking Duration: <span className="font-bold">{Math.round((config?.durationSeconds || 0) / 60)} min</span></p>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-gray-50 p-6 flex flex-col items-center justify-center">
                <div className="relative h-44 w-44 rounded-full bg-white border border-gray-100 shadow-inner flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(#f97316 ${progress}%, #f3f4f6 ${progress}% 100%)`,
                    }}
                  />
                  <div className="relative h-36 w-36 rounded-full bg-white flex flex-col items-center justify-center">
                    <p className="text-5xl font-black text-gray-900">{remaining}</p>
                    <p className="text-xs font-bold text-gray-500">seconds</p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-gray-600 text-center">Think quietly. The session will start automatically.</p>

                <div className="mt-4 w-full">
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl"
                    onClick={() => router.replace("/explore/extempore/practice")}
                  >
                    Skip & Start Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
