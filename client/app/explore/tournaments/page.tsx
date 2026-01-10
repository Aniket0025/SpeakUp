"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Building, Calendar, Check, Globe, Plus, Search, Trophy, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:5000` : "http://localhost:5000")

const featuredTournament = {
  title: "National Group Discussion Championship 2025",
  organizer: "GDHub",
  status: "Open for all participants",
  groupSize: 5,
  date: "Jan 15, 2025",
  visibility: "Public",
}

type TournamentListItem = {
  tournamentId: string
  name: string
  description: string
  organization: string
  visibility: "public" | "private"
  status: "registering" | "ongoing" | "completed"
  mode?: string
  groupSize: number
  startDate?: string
  registrationStartDate?: string
  registrationEndDate?: string
  maxParticipants?: number
  language?: string
  topicType?: string
  participantsCount: number
  isOrganizer?: boolean
  isRegistered?: boolean
}

export default function TournamentsPage() {
  const router = useRouter()
  const [registrationOpen, setRegistrationOpen] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<TournamentListItem | null>(null)
  const [registered, setRegistered] = useState(false)
  const [registeredJoinCode, setRegisteredJoinCode] = useState<string | null>(null)
  const { user, loading, token } = useAuth()

  const socketRef = useRef<Socket | null>(null)
  const [items, setItems] = useState<TournamentListItem[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const [searchId, setSearchId] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchResult, setSearchResult] = useState<TournamentListItem | null>(null)

  const [organizerPassword, setOrganizerPassword] = useState("")

  const fetchList = async () => {
    if (!token) return
    setListLoading(true)
    setListError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/tournaments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setListError(String(data?.message || "Failed to load tournaments"))
        setItems([])
      } else {
        setItems(Array.isArray(data?.tournaments) ? data.tournaments : [])
      }
    } catch (e: any) {
      setListError("Failed to load tournaments")
      setItems([])
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  useEffect(() => {
    if (!token) return
    fetchList()
    const socket = io(API_BASE_URL, { auth: { token }, transports: ["websocket"] })
    socketRef.current = socket
    socket.on("connect_error", () => {})
    socket.emit("tournaments:subscribe")
    socket.on("tournaments:update", () => {
      fetchList()
    })
    return () => {
      try {
        socket.disconnect()
      } catch {}
      socketRef.current = null
    }
  }, [token])

  if (!user) return null

  const handleRegister = (tournament: TournamentListItem | null) => {
    setSelectedTournament(tournament)
    setRegistered(false)
    setRegisteredJoinCode(null)
    setOrganizerPassword("")
    setRegistrationOpen(true)
  }

  const handleConfirmRegistration = async () => {
    if (!token || !selectedTournament) return
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/tournaments/${encodeURIComponent(selectedTournament.tournamentId)}/register`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ organizerPassword: organizerPassword.trim() ? organizerPassword : undefined }),
        },
      )
      const data = await res.json().catch(() => null)
      if (!res.ok) return
      const joinCode = String(data?.joinCode || "").trim()
      setRegistered(true)
      setRegisteredJoinCode(joinCode || null)
      try {
        if (joinCode && user?.id) {
          window.localStorage.setItem(`tournament:joinCode:${String(user.id)}:${selectedTournament.tournamentId}`, joinCode)
        }
      } catch {}
      fetchList()
    } catch {}
  }

  const handleSearch = async () => {
    if (!token) return
    const id = searchId.trim().toUpperCase()
    if (!id) return
    setSearchLoading(true)
    setSearchError(null)
    setSearchResult(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/tournaments/search?tournamentId=${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setSearchError(String(data?.message || "Tournament not found"))
        setSearchResult(null)
      } else {
        setSearchResult(data?.tournament || null)
      }
    } catch {
      setSearchError("Failed to search")
      setSearchResult(null)
    } finally {
      setSearchLoading(false)
    }
  }

  const renderTournamentActions = (tournament: TournamentListItem) => {
    if (tournament.isOrganizer) {
      return (
        <Button
          onClick={() => router.push(`/explore/tournaments/${tournament.tournamentId}/organise`)}
          className="w-full bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white rounded-xl"
        >
          Organise
        </Button>
      )
    }
    if (tournament.isRegistered) {
      return (
        <Button
          onClick={() => router.push(`/explore/tournaments/${tournament.tournamentId}`)}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl"
        >
          Join
        </Button>
      )
    }
    return (
      <Button
        onClick={() => handleRegister(tournament)}
        className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white rounded-xl"
      >
        Register Now
      </Button>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => router.push("/explore")}
          className="mb-6 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Explore
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 italic mb-3">Group Discussion Tournaments</h1>
          <p className="text-gray-500 text-lg">Compete in organized tournaments and win prizes</p>
        </div>

        {listError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{listError}</div>
        )}

        <div className="flex gap-3 mb-8">
          <Input
            placeholder="Search by Tournament ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1 h-12 rounded-xl border-gray-200"
          />
          <Button
            className="h-12 px-6 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600"
            onClick={handleSearch}
            disabled={searchLoading || !searchId.trim()}
          >
            <Search className="h-5 w-5 mr-2" />
            Search
          </Button>
          <Button className="h-12 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-red-500" onClick={() => router.push("/explore/tournaments/create")}>
            <Plus className="h-5 w-5 mr-2" />
            Create Tournament
          </Button>
        </div>

        {searchError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{searchError}</div>
        )}

        {searchResult && (
          <div className="mb-8 rounded-2xl border bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-gray-500">Search Result</div>
                <div className="mt-1 text-lg font-bold text-gray-900">{searchResult.name}</div>
                <div className="text-sm text-gray-500">{searchResult.description}</div>
                <div className="mt-2 text-xs text-gray-400">ID: {searchResult.tournamentId} • {searchResult.visibility}</div>
              </div>
              <div className="w-44">{renderTournamentActions(searchResult)}</div>
            </div>
          </div>
        )}

        <div className="rounded-3xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-yellow-200 text-yellow-800 text-xs font-semibold mb-2">
                  FEATURED
                </span>
                <h3 className="text-xl font-bold text-gray-900">{featuredTournament.title}</h3>
                <p className="text-gray-500">
                  Organized by {featuredTournament.organizer} • {featuredTournament.status}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" /> Groups of {featuredTournament.groupSize}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> {featuredTournament.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="h-4 w-4" /> {featuredTournament.visibility}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold px-6 py-5 rounded-xl shadow-lg" onClick={() => setSearchId("")}> 
                <Trophy className="h-5 w-5 mr-2" />
                Explore
              </Button>
              <p className="text-xs text-gray-400 mt-2">Sample registration card</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Public Tournaments</h2>
          <p className="text-sm text-gray-500 mb-4">Private tournaments are visible only via Tournament ID search.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listLoading && <div className="text-sm text-gray-500">Loading...</div>}
            {items.map((tournament) => (
              <div
                key={tournament.tournamentId}
                className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="h-24 bg-gradient-to-r from-violet-100 to-indigo-100 relative">
                  <div className="absolute top-4 left-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    {tournament.status}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1">{tournament.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{tournament.description}</p>

                  <div className="space-y-2 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      {tournament.organization}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Group Size: {tournament.groupSize}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : "TBD"}
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mb-3">ID: {tournament.tournamentId} • Participants: {tournament.participantsCount}</p>

                  {renderTournamentActions(tournament)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Dialog open={registrationOpen} onOpenChange={setRegistrationOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {registered ? "Registration Successful!" : "Confirm Registration"}
            </DialogTitle>
          </DialogHeader>

          {!registered ? (
            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100">
                <h4 className="font-bold text-gray-900 mb-2">{selectedTournament?.name || ""}</h4>
                <p className="text-sm text-gray-600">{selectedTournament?.organization || ""}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {selectedTournament?.groupSize || 0} participants
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {selectedTournament?.startDate ? new Date(selectedTournament.startDate).toLocaleDateString() : "TBD"}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                You're about to register for this tournament. Make sure you're available on the scheduled date.
              </p>

              {selectedTournament?.visibility === "private" && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-900">Organizer Password</p>
                  <Input
                    type="password"
                    value={organizerPassword}
                    onChange={(e) => setOrganizerPassword(e.target.value)}
                    placeholder="Enter organizer password"
                    className="h-10 rounded-xl"
                  />
                  <p className="text-xs text-gray-500">Needed to register for private tournaments.</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setRegistrationOpen(false)} className="flex-1 h-12 rounded-xl">
                  Cancel
                </Button>
                <Button onClick={handleConfirmRegistration} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600">
                  Confirm Registration
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-center py-4">
              <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 items-center justify-center mb-4">
                <Check className="h-10 w-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">You're Registered!</h3>
                <p className="text-gray-500 mb-2">Successfully registered for {selectedTournament?.name || ""}</p>
                {registeredJoinCode ? (
                  <p className="text-sm text-gray-600">Your Join Code: <span className="font-extrabold">{registeredJoinCode}</span></p>
                ) : (
                  <p className="text-sm text-gray-400">Join code issued.</p>
                )}
              </div>
              <Button onClick={() => setRegistrationOpen(false)} className="w-full h-12 rounded-xl">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
