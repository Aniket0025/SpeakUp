"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { ArrowLeft, Medal, Trophy } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:5000` : "http://localhost:5000")

type GdRoom = {
  roomId: string
  roomName: string
  topic: string
  mode?: "custom" | "global" | "tournament"
  maxParticipants: number
  hostUserId: string | null
  status: "waiting" | "active" | "completed"
  createdAt: string | number
  startedAt?: string | number | null
  endedAt?: string | number | null
  durationSeconds: number
  participants: Array<{ userId: string; name: string }>
}

type TranscriptEntry = {
  userId: string
  name: string
  text: string
  createdAt: string
}

type ParticipantStats = {
  userId: string
  name: string
  words: number
  entries: number
  share: number
  speakingTimePct: number
  confidence: "High" | "Medium" | "Low"
  fluency: "Good" | "Avg" | "Poor"
  role: "Leader" | "Supporter" | "Contributor" | "Passive Participant" | "Dominator"
  overallScore: number
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

const fmtDateTime = (value: any) => {
  try {
    if (!value) return "—"
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return "—"
    return d.toLocaleString()
  } catch {
    return "—"
  }
}

const fmtDuration = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds || 0))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm}m ${ss}s`
}

const labelQuality = (avgWordsPerEntry: number) => {
  if (avgWordsPerEntry >= 10) return "Excellent"
  if (avgWordsPerEntry >= 6) return "Good"
  return "Needs Improvement"
}

const labelBalance = (maxShare: number) => {
  if (maxShare >= 0.4) return "Dominated"
  if (maxShare <= 0.28) return "Balanced"
  return "Fragmented"
}

const classifyStrength = (text: string) => {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  if (words >= 12) return "strong"
  if (words >= 6) return "neutral"
  return "weak"
}

export default function GDAnalysisPage() {
  const params = useParams<{ roomId?: string }>()
  const roomId = useMemo(() => String(params?.roomId || "").trim().toUpperCase(), [params?.roomId])
  const router = useRouter()
  const { token, user } = useAuth()

  const [room, setRoom] = useState<GdRoom | null>(null)
  const [entries, setEntries] = useState<TranscriptEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      router.replace("/login")
      return
    }
    if (!roomId) return

    let stopped = false

    const load = async () => {
      try {
        setLoading(true)

        const [roomRes, transcriptRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/gd/rooms/${encodeURIComponent(roomId)}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/gd/rooms/${encodeURIComponent(roomId)}/transcript`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        const roomData = await roomRes.json().catch(() => null)
        const transcriptData = await transcriptRes.json().catch(() => null)

        if (stopped) return

        if (roomRes.ok && roomData?.room) {
          const rawRoom = roomData.room
          setRoom({
            ...rawRoom,
            participants: Array.isArray(rawRoom.participants)
              ? rawRoom.participants.map((p: any) => ({ userId: String(p.user || p.userId || ""), name: String(p.name || "") }))
              : [],
          })
        }

        if (transcriptRes.ok && Array.isArray(transcriptData?.entries)) {
          setEntries(transcriptData.entries)
        } else {
          setEntries([])
        }
      } catch {
        if (!stopped) {
          setEntries([])
        }
      } finally {
        if (!stopped) setLoading(false)
      }
    }

    load()

    return () => {
      stopped = true
    }
  }, [roomId, router, token])

  const participantsStats = useMemo<ParticipantStats[]>(() => {
    const knownParticipants = room?.participants || []
    const nameByUserId = new Map<string, string>()
    for (const p of knownParticipants) nameByUserId.set(String(p.userId), p.name)

    const byUser = new Map<string, { userId: string; name: string; words: number; entries: number; firstAt: string | null }>()

    for (const e of entries) {
      const uid = String(e.userId)
      const name = String(nameByUserId.get(uid) || e.name || "User")
      const words = String(e.text || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length

      if (!byUser.has(uid)) {
        byUser.set(uid, { userId: uid, name, words: 0, entries: 0, firstAt: e.createdAt || null })
      }
      const cur = byUser.get(uid)!
      cur.words += words
      cur.entries += 1
      if (!cur.firstAt && e.createdAt) cur.firstAt = e.createdAt
    }

    for (const p of knownParticipants) {
      const uid = String(p.userId)
      if (!byUser.has(uid)) {
        byUser.set(uid, { userId: uid, name: p.name, words: 0, entries: 0, firstAt: null })
      }
    }

    const totalWords = Array.from(byUser.values()).reduce((acc, x) => acc + x.words, 0)
    const stats = Array.from(byUser.values()).map((u) => {
      const share = totalWords > 0 ? u.words / totalWords : 0
      const avgWordsPerEntry = u.entries > 0 ? u.words / u.entries : 0

      const confidence: ParticipantStats["confidence"] = share >= 0.25 ? "High" : share >= 0.12 ? "Medium" : "Low"
      const fluency: ParticipantStats["fluency"] = avgWordsPerEntry >= 7 ? "Good" : avgWordsPerEntry >= 4 ? "Avg" : "Poor"

      let role: ParticipantStats["role"] = "Contributor"
      if (share >= 0.36) role = "Dominator"
      else if (share <= 0.1) role = "Passive Participant"
      else if (share <= 0.2) role = "Supporter"

      const firstSpeaker = entries[0]?.userId ? String(entries[0].userId) : null
      if (firstSpeaker && String(u.userId) === firstSpeaker && share >= 0.2) {
        role = "Leader"
      }

      const confidencePoints = confidence === "High" ? 12 : confidence === "Medium" ? 6 : 0
      const fluencyPoints = fluency === "Good" ? 10 : fluency === "Avg" ? 5 : 0
      const score = clamp(Math.round(50 + share * 60 + fluencyPoints + confidencePoints), 0, 100)

      return {
        userId: u.userId,
        name: u.name,
        words: u.words,
        entries: u.entries,
        share,
        speakingTimePct: Math.round(share * 100),
        confidence,
        fluency,
        role,
        overallScore: score,
      }
    })

    stats.sort((a, b) => b.overallScore - a.overallScore)
    return stats
  }, [entries, room?.participants])

  const youId = user?.id ? String(user.id) : null
  const you = participantsStats.find((p) => youId && String(p.userId) === youId) || null

  const groupSummary = useMemo(() => {
    const totalEntries = entries.length
    const totalWords = entries.reduce((acc, e) => {
      const words = String(e.text || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
      return acc + words
    }, 0)
    const avgWordsPerEntry = totalEntries > 0 ? totalWords / totalEntries : 0

    const maxShare = participantsStats.length ? Math.max(...participantsStats.map((p) => p.share)) : 0

    const discussionQuality = labelQuality(avgWordsPerEntry)
    const balance = labelBalance(maxShare)

    const coveragePct = clamp(Math.round(30 + Math.min(70, totalEntries * 4)), 0, 100)
    const collaborationScore = clamp(Math.round(50 + (balance === "Balanced" ? 20 : balance === "Fragmented" ? 5 : -5)), 0, 100)

    return {
      discussionQuality,
      balance,
      coveragePct,
      collaborationScore,
    }
  }, [entries, participantsStats])

  const rank = you ? participantsStats.findIndex((p) => p.userId === you.userId) + 1 : null

  const xpEarned = useMemo(() => {
    const score = you?.overallScore || 0
    return clamp(Math.round(score * 1.2), 0, 150)
  }, [you?.overallScore])

  const badge = useMemo(() => {
    const score = you?.overallScore || 0
    if (score >= 85) return "Effective GD Leader"
    if (score >= 75) return "Strong GD Contributor"
    if (score >= 65) return "Active Participant"
    return "GD Starter"
  }, [you?.overallScore])

  const improvement = useMemo(() => {
    if (!you) {
      return {
        strengths: ["—"],
        areas: ["—"],
        suggestions: ["—"],
      }
    }

    const strengths: string[] = []
    const areas: string[] = []
    const suggestions: string[] = []

    if (you.role === "Leader") strengths.push("Clear opening and direction setting")
    if (you.confidence === "High") strengths.push("Strong confidence while speaking")
    if (you.fluency === "Good") strengths.push("Good fluency and clarity")
    if (you.speakingTimePct >= 20 && you.speakingTimePct <= 35) strengths.push("Balanced speaking time")

    if (you.speakingTimePct < 15) areas.push("Increase participation with 2-3 more meaningful turns")
    if (you.speakingTimePct > 38) areas.push("Give more space to others and encourage responses")
    if (you.fluency !== "Good") areas.push("Improve fluency by speaking in shorter, structured sentences")

    suggestions.push("Use the 1-minute prep to write a 3-point structure: opening, 2 arguments, conclusion")
    suggestions.push("Add 1 example or data point for each argument to make points stronger")
    if (you.role === "Supporter") suggestions.push("Try to initiate at least one new angle to move from Supporter → Leader")

    return {
      strengths: strengths.length ? strengths : ["Maintained participation in the discussion"],
      areas: areas.length ? areas : ["Make conclusions more crisp and summarise your stance"],
      suggestions,
    }
  }, [you])

  const aiInsights = useMemo(() => {
    const insights: string[] = []

    const first = entries[0]
    if (first) insights.push(`Who initiated discussion: ${first.name}`)

    if (participantsStats.length) {
      const top = participantsStats[0]
      insights.push(`Top overall contributor: ${top.name} (${top.overallScore})`)

      const dom = participantsStats.find((p) => p.role === "Dominator")
      if (dom) insights.push(`Who dominated: ${dom.name} (${dom.speakingTimePct}%)`)

      const passive = participantsStats.find((p) => p.role === "Passive Participant")
      if (passive) insights.push(`Who stayed silent too long: ${passive.name} (${passive.speakingTimePct}%)`)
    }

    return insights
  }, [entries, participantsStats])

  const yourOpeningIndex = useMemo(() => {
    if (!youId) return -1
    return entries.findIndex((e) => String(e.userId) === String(youId))
  }, [entries, youId])

  if (!token) return null

  return (
    <div className="min-h-screen bg-[#f7f9fd]">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.push("/explore/gd")} className="text-violet-600 hover:text-violet-700 hover:bg-violet-50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to GD
          </Button>

          <div className="text-right">
            <p className="text-xs text-gray-500">Room</p>
            <p className="text-sm font-bold text-gray-900">{roomId}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 shadow-lg rounded-3xl p-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">GD Analysis</h1>
            <p className="text-gray-500 text-sm mt-1">Session-level + participant-level breakdown</p>
          </div>

          {loading ? (
            <div className="mt-6 text-sm text-gray-500">Loading analysis...</div>
          ) : (
            <Tabs defaultValue="overview" className="mt-6">
              <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="improve">Improve</TabsTrigger>
                <TabsTrigger value="rewards">Rewards</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-8">
                <section className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <h2 className="text-lg font-extrabold text-gray-900">GD Session Overview</h2>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl bg-white border border-gray-100 p-4">
                      <p className="text-xs text-gray-500 font-semibold">GD Topic</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{room?.topic || "—"}</p>
                    </div>
                    <div className="rounded-xl bg-white border border-gray-100 p-4">
                      <p className="text-xs text-gray-500 font-semibold">Total Participants</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{room?.participants?.length || participantsStats.length || 0}</p>
                    </div>
                    <div className="rounded-xl bg-white border border-gray-100 p-4">
                      <p className="text-xs text-gray-500 font-semibold">Session Duration</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{fmtDuration(Number(room?.durationSeconds || 0))}</p>
                    </div>
                    <div className="rounded-xl bg-white border border-gray-100 p-4">
                      <p className="text-xs text-gray-500 font-semibold">Mode</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{String(room?.mode || "custom").toUpperCase()}</p>
                    </div>
                    <div className="rounded-xl bg-white border border-gray-100 p-4">
                      <p className="text-xs text-gray-500 font-semibold">Date & Time</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{fmtDateTime(room?.startedAt || room?.createdAt)}</p>
                    </div>
                    <div className="rounded-xl bg-white border border-gray-100 p-4">
                      <p className="text-xs text-gray-500 font-semibold">Transcript Lines</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{entries.length}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <h2 className="text-lg font-extrabold text-gray-900">Overall GD Summary</h2>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="rounded-xl bg-white border border-gray-100 p-4">
                      <p className="text-xs text-gray-500 font-semibold">Discussion Quality</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{groupSummary.discussionQuality}</p>
                    </div>
                    <div className="rounded-xl bg-white border border-gray-100 p-4">
                      <p className="text-xs text-gray-500 font-semibold">Balance of Participation</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{groupSummary.balance}</p>
                    </div>
                    <div className="rounded-xl bg-white border border-gray-100 p-4">
                      <p className="text-xs text-gray-500 font-semibold">Topic Coverage</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{groupSummary.coveragePct}%</p>
                    </div>
                    <div className="rounded-xl bg-white border border-gray-100 p-4">
                      <p className="text-xs text-gray-500 font-semibold">Collaboration Score</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{groupSummary.collaborationScore}/100</p>
                    </div>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="performance" className="mt-6 space-y-8">
                <section className="rounded-2xl border border-violet-200 bg-violet-50 p-6">
                  <h2 className="text-lg font-extrabold text-gray-900">Your Performance Summary</h2>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="rounded-xl bg-white border border-gray-100 p-4 md:col-span-2">
                      <p className="text-xs text-gray-500 font-semibold">Overall GD Score</p>
                      <p className="text-3xl font-black text-gray-900 mt-1">{you?.overallScore ?? "—"}</p>
                    </div>
                    <div className="rounded-xl bg-white border border-gray-100 p-4">
                      <p className="text-xs text-gray-500 font-semibold">Role Detected</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{you?.role ?? "—"}</p>
                    </div>
                    <div className="rounded-xl bg-white border border-gray-100 p-4">
                      <p className="text-xs text-gray-500 font-semibold">Speaking Time</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{you ? `${you.speakingTimePct}%` : "—"}</p>
                    </div>
                    <div className="rounded-xl bg-white border border-gray-100 p-4">
                      <p className="text-xs text-gray-500 font-semibold">Confidence</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{you?.confidence ?? "—"}</p>
                    </div>
                    <div className="rounded-xl bg-white border border-gray-100 p-4">
                      <p className="text-xs text-gray-500 font-semibold">Fluency</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{you?.fluency ?? "—"}</p>
                    </div>
                    <div className="rounded-xl bg-white border border-gray-100 p-4 md:col-span-2">
                      <p className="text-xs text-gray-500 font-semibold">XP Earned + Rank</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">
                        {you ? `+${xpEarned} XP` : "—"}
                        {rank ? ` • Rank #${rank}/${participantsStats.length}` : ""}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <h2 className="text-lg font-extrabold text-gray-900">Participant Comparison</h2>
                  <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100 bg-white">
                    <table className="min-w-[900px] w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3 font-bold text-gray-700">Participant</th>
                          <th className="text-left p-3 font-bold text-gray-700">Speaking Time</th>
                          <th className="text-left p-3 font-bold text-gray-700">Confidence</th>
                          <th className="text-left p-3 font-bold text-gray-700">Fluency</th>
                          <th className="text-left p-3 font-bold text-gray-700">Role</th>
                          <th className="text-left p-3 font-bold text-gray-700">Overall Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participantsStats.map((p) => {
                          const isYou = youId && String(p.userId) === String(youId)
                          return (
                            <tr key={p.userId} className={cn("border-t", isYou ? "bg-violet-50" : "bg-white")}>
                              <td className="p-3 font-semibold text-gray-900">{isYou ? "You" : p.name || "User"}</td>
                              <td className="p-3 text-gray-700">{p.speakingTimePct}%</td>
                              <td className="p-3 text-gray-700">{p.confidence}</td>
                              <td className="p-3 text-gray-700">{p.fluency}</td>
                              <td className="p-3 text-gray-700">{p.role}</td>
                              <td className="p-3 font-bold text-gray-900">{p.overallScore}</td>
                            </tr>
                          )
                        })}
                        {!participantsStats.length && (
                          <tr>
                            <td className="p-4 text-gray-500" colSpan={6}>
                              No participant stats available.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <h2 className="text-lg font-extrabold text-gray-900">Your Communication Analysis</h2>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-gray-100 bg-white p-4">
                      <p className="text-xs text-gray-500 font-semibold">Fluency & Clarity</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{you?.fluency ?? "—"}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white p-4">
                      <p className="text-xs text-gray-500 font-semibold">Thought Structure</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{you?.role === "Leader" ? "Strong" : "Good"}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white p-4">
                      <p className="text-xs text-gray-500 font-semibold">Relevance of Points</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{entries.length ? "Good" : "—"}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white p-4">
                      <p className="text-xs text-gray-500 font-semibold">Confidence & Emotional Tone</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{you?.confidence ?? "—"}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white p-4">
                      <p className="text-xs text-gray-500 font-semibold">Turn-Taking Behavior</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{groupSummary.balance === "Balanced" ? "Good" : "Needs improvement"}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white p-4">
                      <p className="text-xs text-gray-500 font-semibold">Interruption Control</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">—</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <h2 className="text-lg font-extrabold text-gray-900">Other Participants (Anonymous)</h2>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {participantsStats
                      .filter((p) => !(youId && String(p.userId) === String(youId)))
                      .map((p, idx) => {
                        const label = `User ${String.fromCharCode(65 + idx)}`
                        const style = p.role === "Dominator" ? "Aggressive" : p.role === "Passive Participant" ? "Passive" : "Balanced"
                        const strengths = p.fluency === "Good" ? "Clear examples" : "Consistent participation"
                        const weaknesses = p.role === "Dominator" ? "May interrupt / over-talk" : p.role === "Passive Participant" ? "Low participation" : "Could structure points better"

                        return (
                          <div key={p.userId} className="rounded-xl border border-gray-100 bg-white p-4">
                            <p className="text-sm font-bold text-gray-900">{label}</p>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                              <div>
                                <p className="text-xs text-gray-500 font-semibold">Style</p>
                                <p className="font-semibold text-gray-800">{style}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 font-semibold">Strengths</p>
                                <p className="font-semibold text-gray-800">{strengths}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 font-semibold">Weaknesses</p>
                                <p className="font-semibold text-gray-800">{weaknesses}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    {!participantsStats.length && <p className="text-sm text-gray-500">No participant data.</p>}
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="transcript" className="mt-6 space-y-8">
                <section className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <h2 className="text-lg font-extrabold text-gray-900">GD Transcript</h2>
                  <div className="mt-4 rounded-xl border border-gray-100 bg-white max-h-[420px] overflow-y-auto">
                    {!entries.length ? (
                      <div className="p-4 text-sm text-gray-500">No transcript captured for this GD.</div>
                    ) : (
                      <div className="p-4 space-y-2">
                        {entries.map((e, idx) => {
                          const kind = classifyStrength(e.text)
                          const isYou = youId && String(e.userId) === String(youId)
                          const isYourOpening = isYou && idx === yourOpeningIndex
                          const label = isYou ? "You" : e.name

                          const color =
                            kind === "strong" ? "border-l-emerald-500" : kind === "neutral" ? "border-l-amber-400" : "border-l-red-500"

                          return (
                            <div
                              key={`${e.createdAt}-${idx}`}
                              className={cn(
                                "rounded-lg border border-gray-100 bg-white px-3 py-2 border-l-4",
                                color,
                                isYourOpening ? "ring-2 ring-violet-200" : "",
                              )}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-bold text-gray-900 truncate">
                                  {label}
                                  {isYourOpening ? " (Opening)" : ""}
                                </p>
                                <p className="text-[11px] text-gray-400">{fmtDateTime(e.createdAt)}</p>
                              </div>
                              <p className="text-sm text-gray-700 mt-1 break-words">{e.text}</p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-gray-500">Color coding: 🟢 strong argument, 🟡 neutral/filler, 🔴 weak/off-topic (estimated)</div>
                </section>
              </TabsContent>

              <TabsContent value="insights" className="mt-6 space-y-8">
                <section className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <h2 className="text-lg font-extrabold text-gray-900">AI Insights</h2>
                  <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
                    <ul className="space-y-2 text-sm text-gray-700">
                      {aiInsights.map((t, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-violet-600 font-black">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                      {!aiInsights.length && <li className="text-gray-500">No insights available.</li>}
                    </ul>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="improve" className="mt-6 space-y-8">
                <section className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <h2 className="text-lg font-extrabold text-gray-900">Strengths & Areas to Improve</h2>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-gray-100 bg-white p-4">
                      <p className="text-sm font-bold text-gray-900">Your Strengths</p>
                      <ul className="mt-2 space-y-1 text-sm text-gray-700">
                        {improvement.strengths.map((s, i) => (
                          <li key={i}>- {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white p-4">
                      <p className="text-sm font-bold text-gray-900">Areas to Improve</p>
                      <ul className="mt-2 space-y-1 text-sm text-gray-700">
                        {improvement.areas.map((s, i) => (
                          <li key={i}>- {s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <h2 className="text-lg font-extrabold text-gray-900">Personalized Suggestions</h2>
                  <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
                    <ul className="space-y-2 text-sm text-gray-700">
                      {improvement.suggestions.map((s, i) => (
                        <li key={i}>- {s}</li>
                      ))}
                    </ul>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="rewards" className="mt-6 space-y-8">
                <section className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <h2 className="text-lg font-extrabold text-gray-900">Gamification</h2>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-gray-100 bg-white p-4">
                      <p className="text-xs text-gray-500 font-semibold">Badge earned</p>
                      <p className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-2">
                        <Medal className="h-4 w-4 text-violet-600" />
                        {badge}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white p-4">
                      <p className="text-xs text-gray-500 font-semibold">Leaderboard update</p>
                      <p className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        {rank ? `Rank #${rank}/${participantsStats.length}` : "—"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white p-4">
                      <p className="text-xs text-gray-500 font-semibold">Encouragement</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">Keep practicing — consistency wins GDs.</p>
                    </div>
                  </div>
                </section>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  )
}
