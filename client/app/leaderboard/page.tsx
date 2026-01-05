"use client"

import { Header } from "@/components/layout/header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Sparkles, Flame, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

const topThree = [
  {
    rank: 2,
    name: "omkarmalakga...",
    avatar: "😠",
    level: 1,
    xp: 78,
    color: "from-gray-300 to-gray-400",
    height: "h-32",
  },
  {
    rank: 1,
    name: "Dudh Dairy Offi...",
    avatar: "D",
    level: 1,
    xp: 344,
    color: "from-yellow-400 to-orange-500",
    height: "h-40",
    crown: true,
  },
  {
    rank: 3,
    name: "Facelesss",
    avatar: "F",
    level: 1,
    xp: 0,
    color: "from-orange-400 to-red-500",
    height: "h-24",
  },
]

const rankings = [
  { rank: 1, name: "Dudh Dairy Office", avatar: "D", level: 1, streak: 0, xp: 344 },
  { rank: 2, name: "omkarmalakgade123", avatar: "😠", level: 1, streak: 0, xp: 78 },
  { rank: 3, name: "Facelesss", avatar: "F", level: 1, streak: 0, xp: 0 },
  { rank: 4, name: "gadesujit10", avatar: "g", level: 1, streak: 0, xp: 0 },
  { rank: 5, name: "justuse8432", avatar: "j", level: 1, streak: 0, xp: 0 },
  { rank: 6, name: "omp760665", avatar: "o", level: 1, streak: 0, xp: 0 },
  { rank: 7, name: "OM M. PATIL", avatar: "O", level: 1, streak: 0, xp: 0 },
  { rank: 8, name: "Chaitanya Uthale", avatar: "C", level: 1, streak: 0, xp: 0 },
  { rank: 9, name: "Sunny Yadav", avatar: "🤠", level: 1, streak: 0, xp: 0 },
  { rank: 10, name: "gondapatil756", avatar: "g", level: 1, streak: 0, xp: 0 },
  { rank: 11, name: "Aniket Yadav", avatar: "A", level: 1, streak: 0, xp: 0 },
  { rank: 12, name: "aniketyadavzare", avatar: "a", level: 1, streak: 0, xp: 0 },
]

export default function LeaderboardPage() {
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center border-4 border-white shadow-lg">
              <Trophy className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-foreground mb-3">Leaderboard</h1>
          <p className="text-muted-foreground text-lg">See how you rank against others</p>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-4 mb-12">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-2xl border-4 border-white shadow-lg">
                {topThree[0].avatar}
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold">
                2
              </div>
            </div>
            <div
              className={cn(
                "w-24 rounded-t-2xl bg-gradient-to-t flex flex-col items-center justify-end p-3",
                topThree[0].color,
                topThree[0].height,
              )}
            >
              <p className="text-xs text-white/80 truncate w-full text-center">{topThree[0].name}</p>
              <p className="text-xs text-white/60 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Lvl {topThree[0].level}
              </p>
              <p className="text-2xl font-bold text-white mt-2">{topThree[0].xp}</p>
              <p className="text-xs text-white/80">XP</p>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              {topThree[1].crown && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl">👑</div>}
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-3xl font-bold border-4 border-yellow-400 shadow-lg text-gray-700">
                {topThree[1].avatar}
              </div>
              <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-yellow-400 flex items-center justify-center text-white text-sm font-bold">
                1
              </div>
            </div>
            <div
              className={cn(
                "w-28 rounded-t-2xl bg-gradient-to-t flex flex-col items-center justify-end p-3",
                topThree[1].color,
                topThree[1].height,
              )}
            >
              <p className="text-sm text-white truncate w-full text-center font-medium">{topThree[1].name}</p>
              <p className="text-xs text-white/80 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Lvl {topThree[1].level}
              </p>
              <p className="text-3xl font-bold text-white mt-2">{topThree[1].xp}</p>
              <p className="text-sm text-white/80">XP</p>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center text-2xl font-bold text-white border-4 border-white shadow-lg">
                {topThree[2].avatar}
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-orange-400 flex items-center justify-center text-white text-xs font-bold">
                3
              </div>
            </div>
            <div
              className={cn(
                "w-24 rounded-t-2xl bg-gradient-to-t flex flex-col items-center justify-end p-3",
                topThree[2].color,
                topThree[2].height,
              )}
            >
              <p className="text-xs text-white/80 truncate w-full text-center">{topThree[2].name}</p>
              <p className="text-xs text-white/60 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Lvl {topThree[2].level}
              </p>
              <p className="text-2xl font-bold text-white mt-2">{topThree[2].xp}</p>
              <p className="text-xs text-white/80">XP</p>
            </div>
          </div>
        </div>

        {/* Rankings List */}
        <div className="rounded-3xl bg-card border border-border shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h2 className="text-xl font-bold text-foreground">All Rankings</h2>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {rankings.length} players
            </div>
          </div>

          <div className="space-y-2">
            {rankings.map((player) => (
              <div
                key={player.rank}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-xl transition-all duration-200",
                  player.rank <= 3
                    ? "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-900/40"
                    : "hover:bg-muted",
                )}
              >
                {/* Rank */}
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold",
                    player.rank === 1 && "bg-yellow-400 text-white",
                    player.rank === 2 && "bg-gray-400 text-white",
                    player.rank === 3 && "bg-orange-400 text-white",
                    player.rank > 3 && "bg-muted text-muted-foreground",
                  )}
                >
                  {player.rank}
                </div>

                {/* Avatar */}
                <Avatar className="h-10 w-10 border-2 border-border">
                  <AvatarFallback
                    className={cn(
                      "text-sm font-semibold",
                      player.avatar.length === 1
                        ? "bg-gradient-to-br from-violet-500 to-indigo-500 text-white"
                        : "bg-yellow-100",
                    )}
                  >
                    {player.avatar}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{player.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-violet-500" /> Lvl {player.level}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3 text-orange-500" /> {player.streak} streak
                    </span>
                  </div>
                </div>

                {/* XP */}
                <div className="text-right">
                  <p className="font-bold text-foreground">{player.xp}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
