"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trophy, Search, Plus, Users, Calendar, Globe, Building, Check, ArrowLeft } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

const featuredTournament = {
  title: "National Group Discussion Championship 2025",
  organizer: "GDHub",
  status: "Open for all participants",
  groupSize: 5,
  date: "Jan 15, 2025",
  visibility: "Public",
}

const tournaments = [
  {
    id: "TNT4U9FY",
    name: "TechnoCrats",
    description: "Learn for fun",
    organization: "KIT",
    groupSize: 4,
    date: "30/11/2025",
    status: "registering",
  },
  {
    id: "ABC123XY",
    name: "Business Leaders Forum",
    description: "Professional GD competition",
    organization: "Corporate Hub",
    groupSize: 6,
    date: "15/12/2025",
    status: "registering",
  },
  {
    id: "DEF456ZW",
    name: "Youth Voice 2025",
    description: "Social issues discussion",
    organization: "Youth Council",
    groupSize: 5,
    date: "22/01/2026",
    status: "registering",
  },
]

export default function TournamentsPage() {
  const router = useRouter()
  const [registrationOpen, setRegistrationOpen] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<(typeof tournaments)[0] | null>(null)
  const [registered, setRegistered] = useState(false)
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  if (!user) return null

  const handleRegister = (tournament: (typeof tournaments)[0] | null) => {
    setSelectedTournament(tournament)
    setRegistered(false)
    setRegistrationOpen(true)
  }

  const handleConfirmRegistration = () => {
    setRegistered(true)
    console.log("[v0] Registered for tournament:", selectedTournament?.name)
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

        <div className="flex gap-3 mb-8">
          <Input placeholder="Search by Tournament ID..." className="flex-1 h-12 rounded-xl border-gray-200" />
          <Button className="h-12 px-6 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600">
            <Search className="h-5 w-5 mr-2" />
            Search
          </Button>
          <Button className="h-12 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-red-500">
            <Plus className="h-5 w-5 mr-2" />
            Create Tournament
          </Button>
        </div>

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
              <Button
                onClick={() => handleRegister(null)}
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold px-6 py-5 rounded-xl shadow-lg"
              >
                <Trophy className="h-5 w-5 mr-2" />
                Register Now
              </Button>
              <p className="text-xs text-gray-400 mt-2">Sample registration card</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Public Tournaments</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
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
                      {tournament.date}
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mb-3">ID: {tournament.id}</p>

                  <Button
                    onClick={() => handleRegister(tournament)}
                    className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white rounded-xl"
                  >
                    Register Now
                  </Button>
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
                <h4 className="font-bold text-gray-900 mb-2">{selectedTournament?.name || featuredTournament.title}</h4>
                <p className="text-sm text-gray-600">
                  {selectedTournament?.organization || featuredTournament.organizer}
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {selectedTournament?.groupSize || featuredTournament.groupSize} participants
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {selectedTournament?.date || featuredTournament.date}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                You're about to register for this tournament. Make sure you're available on the scheduled date.
              </p>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setRegistrationOpen(false)} className="flex-1 h-12 rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmRegistration}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600"
                >
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
                <p className="text-gray-500 mb-2">
                  Successfully registered for {selectedTournament?.name || featuredTournament.title}
                </p>
                <p className="text-sm text-gray-400">You'll receive an email with more details about the tournament.</p>
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
