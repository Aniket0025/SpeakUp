"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Users } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:5000` : "http://localhost:5000")

type LeaderboardRow = { userId: string; name: string; total: number }

type Group = {
  groupId: string
  roundNumber: number
  topic: string
  judgeUserId: string | null
  participants: Array<{ userId: string; name: string; score: any }>
}

export default function TournamentLivePage() {
  const params = useParams<{ tournamentId?: string }>()
  const tournamentId = useMemo(() => String(params?.tournamentId || "").trim().toUpperCase(), [params?.tournamentId])
  const router = useRouter()
  const { user, loading, token } = useAuth()

  const socketRef = useRef<Socket | null>(null)

  const [groups, setGroups] = useState<Group[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAll = async () => {
    if (!token || !tournamentId) return
    setRefreshing(true)
    setError(null)
    try {
      const [gRes, lRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tournaments/${encodeURIComponent(tournamentId)}/my-group`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/tournaments/${encodeURIComponent(tournamentId)}/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const gData = await gRes.json().catch(() => null)
      const lData = await lRes.json().catch(() => null)

      if (!gRes.ok) {
        setError(String(gData?.message || "Failed to load your group"))
        setGroups([])
      } else {
        setGroups(Array.isArray(gData?.groups) ? gData.groups : [])
      }

      if (!lRes.ok) {
        setLeaderboard([])
      } else {
        setLeaderboard(Array.isArray(lData?.leaderboard) ? lData.leaderboard : [])
      }
    } catch {
      setError("Failed to load tournament")
      setGroups([])
      setLeaderboard([])
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [loading, user, router])

  useEffect(() => {
    if (!token || !tournamentId) return
    fetchAll()

    const socket = io(API_BASE_URL, { auth: { token }, transports: ["websocket"] })
    socketRef.current = socket
    socket.emit("tournament:subscribe", { tournamentId })
    socket.on("tournament:update", (payload: any) => {
      if (String(payload?.tournamentId || "").trim().toUpperCase() !== tournamentId) return
      fetchAll()
    })

    return () => {
      try {
        socket.disconnect()
      } catch {}
      socketRef.current = null
    }
  }, [token, tournamentId])

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Button variant="ghost" onClick={() => router.push(`/explore/tournaments/${tournamentId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button variant="outline" onClick={fetchAll} disabled={refreshing}>
            Refresh
          </Button>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="rounded-2xl border bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-extrabold text-gray-900">Your Group</h1>
            <div className="text-xs text-gray-500">Tournament: {tournamentId}</div>
          </div>

          {groups.length === 0 ? (
            <div className="text-sm text-gray-500">You are not assigned to any group yet. Wait for organiser to create groups.</div>
          ) : (
            <div className="space-y-4">
              {groups.map((g) => (
                <div key={g.groupId} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-gray-900">Round {g.roundNumber}</div>
                      <div className="text-sm text-gray-600">Topic: {g.topic || "(not assigned yet)"}</div>
                    </div>
                    <div className="text-xs text-gray-500">{g.groupId}</div>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" /> Participants
                    </div>
                    <ul className="divide-y">
                      {g.participants.map((p) => (
                        <li key={p.userId} className="py-2 flex items-center justify-between">
                          <span className="text-sm text-gray-900">{p.name}</span>
                          <span className="text-xs text-gray-500">Score: {Number(p?.score?.total || 0)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Leaderboard</h2>
            <div className="text-xs text-gray-500">Live updates</div>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-sm text-gray-500">No scores yet.</div>
          ) : (
            <ul className="divide-y">
              {leaderboard.slice(0, 20).map((r, idx) => (
                <li key={r.userId} className="py-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">#{idx + 1} {r.name}</span>
                  <span className="text-sm text-gray-700">{r.total}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
