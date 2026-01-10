"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Building, Calendar, Check, Globe, Trophy, Users } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:5000` : "http://localhost:5000")

type Participant = { userId: string; name: string; registeredAt?: string | Date }

type Tournament = {
  tournamentId: string
  name: string
  description: string
  organization: string
  visibility: "public" | "private"
  status: "registering" | "ongoing" | "completed"
  mode?: string
  groupSize: number
  registrationStartDate?: string
  registrationEndDate?: string
  tournamentStartDate?: string
  numberOfRounds?: number
  roundDurationSeconds?: number
  eligibilityCriteria?: string
  maxParticipants?: number
  language?: string
  topicType?: string
  createdByUserId?: string
  isOrganizer?: boolean
  myJoinCode?: string | null
  participants: Participant[]
}

export default function TournamentDetailsPage() {
  const params = useParams<{ tournamentId?: string }>()
  const tournamentId = useMemo(() => String(params?.tournamentId || "").trim().toUpperCase(), [params?.tournamentId])
  const router = useRouter()
  const { user, loading, token } = useAuth()

  const socketRef = useRef<Socket | null>(null)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registering, setRegistering] = useState(false)
  const [organizerPassword, setOrganizerPassword] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const isRegistered = useMemo(() => {
    if (!user || !tournament) return false
    return (tournament.participants || []).some((p) => String(p.userId) === String(user.id))
  }, [tournament, user])

  const isOrganizer = useMemo(() => {
    if (!user || !tournament) return false
    if (tournament.isOrganizer) return true
    if (tournament.createdByUserId) return String(tournament.createdByUserId) === String(user.id)
    return false
  }, [tournament, user])

  const fetchDetails = async () => {
    if (!token || !tournamentId) return
    setLoadingDetails(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/tournaments/${encodeURIComponent(tournamentId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(String(data?.message || "Failed to load tournament"))
        setTournament(null)
      } else {
        setTournament(data?.tournament || null)
      }
    } catch (e: any) {
      setError("Failed to load tournament")
      setTournament(null)
    } finally {
      setLoadingDetails(false)
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  useEffect(() => {
    if (!token || !tournamentId) return
    fetchDetails()
    try {
      if (user?.id) {
        const saved = window.localStorage.getItem(`tournament:joinCode:${String(user.id)}:${tournamentId}`)
        if (saved) setJoinCode(saved)
      }
    } catch {}
    const socket = io(API_BASE_URL, { auth: { token }, transports: ["websocket"] })
    socketRef.current = socket
    socket.emit("tournament:subscribe", { tournamentId })
    socket.on("tournament:update", (payload: any) => {
      if (String(payload?.tournamentId || "").trim().toUpperCase() === tournamentId) {
        fetchDetails()
      }
    })
    return () => {
      try {
        socket.disconnect()
      } catch {}
      socketRef.current = null
    }
  }, [token, tournamentId])

  const handleRegister = async () => {
    if (!token || !tournamentId) return
    setRegistering(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/tournaments/${encodeURIComponent(tournamentId)}/register`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ organizerPassword: organizerPassword.trim() ? organizerPassword : undefined }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok) {
        const code = String(data?.joinCode || "").trim()
        if (code && user?.id) {
          try {
            window.localStorage.setItem(`tournament:joinCode:${String(user.id)}:${tournamentId}`, code)
          } catch {}
          setJoinCode(code)
        }
        fetchDetails()
      } else {
        setError(String(data?.message || "Failed to register"))
      }
    } catch {}
    setRegistering(false)
  }

  const handleJoin = async () => {
    if (!token || !tournamentId) return
    setJoining(true)
    setJoinError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/tournaments/${encodeURIComponent(tournamentId)}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode: joinCode.trim() }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setJoinError(String(data?.message || "Unable to join"))
      } else {
        router.push(`/explore/tournaments/${tournamentId}/live`)
      }
    } catch {
      setJoinError("Unable to join")
    } finally {
      setJoining(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => router.push("/explore/tournaments")}
          className="mb-6 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tournaments
        </Button>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {joinError && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{joinError}</div>
        )}

        {!tournament ? (
          <div className="rounded-2xl border bg-card p-6">Loading...</div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-3xl border-2 border-violet-300 bg-gradient-to-r from-violet-50 to-indigo-50 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">{tournament.name}</h1>
                    <p className="text-gray-500 mt-1">{tournament.description}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Building className="h-4 w-4" /> {tournament.organization}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" /> Group Size: {tournament.groupSize}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> {tournament.tournamentStartDate ? new Date(tournament.tournamentStartDate).toLocaleDateString() : "TBD"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="h-4 w-4" /> {tournament.visibility}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {isOrganizer ? (
                    <Button onClick={() => router.push(`/explore/tournaments/${tournamentId}/organise`)} className="rounded-xl">
                      Organise
                    </Button>
                  ) : isRegistered ? (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 text-emerald-700 px-4 py-2 text-sm font-semibold">
                        <Check className="h-4 w-4" /> Registered
                      </div>
                      <Button
                        onClick={handleJoin}
                        disabled={joining || !joinCode.trim() || tournament.status !== "ongoing"}
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      >
                        Join
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tournament.visibility === "private" && (
                        <Input
                          type="password"
                          value={organizerPassword}
                          onChange={(e) => setOrganizerPassword(e.target.value)}
                          placeholder="Organizer password"
                          className="h-9 rounded-xl bg-white"
                        />
                      )}
                      <Button onClick={handleRegister} disabled={registering} className="rounded-xl">
                        Register
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isRegistered && !isOrganizer && (
              <div className="rounded-2xl border bg-white p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Your Join Code</h2>
                    <p className="text-sm text-gray-500">Keep this safe. It is required to join when tournament is ongoing.</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold tracking-widest text-gray-900">{joinCode || tournament.myJoinCode || ""}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Paste join code here"
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>
            )}

            <div className="rounded-2xl border bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Participants</h2>
                <div className="text-sm text-gray-500">Total: {tournament.participants?.length || 0}</div>
              </div>
              {tournament.participants?.length ? (
                <ul className="divide-y">
                  {tournament.participants.map((p) => (
                    <li key={`${p.userId}`} className="py-3 flex items-center justify-between">
                      <span className="font-medium text-gray-900">{p.name}</span>
                      <span className="text-xs text-gray-500">
                        {p.registeredAt ? new Date(p.registeredAt).toLocaleString() : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500">No participants yet.</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
