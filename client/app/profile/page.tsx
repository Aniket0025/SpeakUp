"use client"

import { Header } from "@/components/layout/header"
import { StatCard } from "@/components/ui/stat-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Mail,
  Crown,
  LogOut,
  Pencil,
  TrendingUp,
  Users,
  Award,
  Flame,
  Search,
  UserMinus,
  MessageSquare,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

const user = {
  name: "Aniket Yadav",
  email: "aniketyadav25012005@gmail.com",
  role: "Admin",
  level: 1,
  xp: 0,
  nextLevelXp: 100,
  streak: 0,
  gdSessions: 0,
  extempore: 0,
  avgRating: "N/A",
}

const friends = [
  { id: 1, name: "Chaitanya Uthale", email: "itcracker4@gmail.com", initial: "C" },
  { id: 2, name: "Sunny", email: "sunny@gmail.com", initial: "S" },
  { id: 3, name: "Creator", email: "creator756@gmail.com", initial: "C" },
  { id: 4, name: "JustBoy", email: "justuse00@gmail.com", initial: "J" },
]

const recentActivities = [
  {
    id: 1,
    title: "The impact of artificial intelligence on employment",
    category: "Extempore Practice",
    date: "22/12/2025",
  },
  {
    id: 2,
    title: "The impact of artificial intelligence on employment",
    category: "Extempore Practice",
    date: "04/12/2025",
  },
  {
    id: 3,
    title: "The impact of artificial intelligence on employment",
    category: "Extempore Practice",
    date: "04/12/2025",
  },
]

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#f7f9fd]">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Card */}
        <div className="rounded-[40px] bg-white border border-gray-100 shadow-xl p-10 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50" />
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative">
            {/* Avatar */}
            <div className="relative group">
              <div className="absolute -inset-1 rounded-[40px] bg-gradient-to-r from-violet-500 to-indigo-600 opacity-20 blur-sm group-hover:opacity-40 transition-opacity" />
              <Avatar className="h-32 w-32 rounded-[40px] border-4 border-white shadow-2xl relative">
                <AvatarImage src="/male-avatar-v2.png" />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-4xl font-black">
                  A
                </AvatarFallback>
              </Avatar>
              <button className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Pencil className="h-5 w-5 text-indigo-500" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black text-gray-900 leading-tight">Aniket</h1>
                <button className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 hover:bg-indigo-100 transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-gray-500 mb-4 font-medium">
                <Mail className="h-4 w-4" />
                <span>aniketyadav25012005@gmail.com</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-400 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-400/20">
                  <Crown className="h-4 w-4 fill-white" />
                  Level 1 • 0 XP
                </span>
              </div>

              <div className="w-full max-w-md h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 w-[5%] rounded-full shadow-lg" />
              </div>
            </div>

            <Button
              variant="destructive"
              className="rounded-2xl h-14 px-8 font-black text-lg shadow-xl shadow-red-500/20 active:scale-95 transition-transform"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Flame}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
            label="Streak"
            value={user.streak}
          />
          <StatCard
            icon={Users}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
            label="GD Sessions"
            value={user.gdSessions}
          />
          <StatCard
            icon={Award}
            iconColor="text-amber-600"
            iconBgColor="bg-amber-100"
            label="Extempore"
            value={user.extempore}
          />
          <StatCard
            icon={TrendingUp}
            iconColor="text-emerald-600"
            iconBgColor="bg-emerald-100"
            label="Avg Rating"
            value={user.avgRating}
          />
        </div>

        {/* Friends Management */}
        <div className="rounded-[40px] bg-white border border-gray-100 shadow-xl p-10 mb-8">
          <h2 className="text-2xl font-black text-gray-900 mb-8">Friends Management</h2>

          <Tabs defaultValue="friends" className="w-full">
            <div className="flex items-center justify-between mb-8">
              <TabsList className="bg-gray-100 p-1.5 rounded-2xl h-auto">
                <TabsTrigger
                  value="friends"
                  className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                >
                  Friends
                </TabsTrigger>
                <TabsTrigger value="invitations" className="rounded-xl px-6 py-2.5 font-bold">
                  Invitations
                </TabsTrigger>
                <TabsTrigger value="sent" className="rounded-xl px-6 py-2.5 font-bold">
                  Sent
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="friends">
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by name or email"
                  className="pl-12 h-14 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all text-base font-medium"
                />
                <Button className="absolute right-2 top-2 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-6">
                  Search
                </Button>
              </div>

              <h3 className="font-black text-gray-900 mb-4 ml-2">Your Friends</h3>
              <div className="space-y-4">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="p-5 rounded-3xl bg-white border border-gray-50 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner group-hover:scale-105 transition-transform">
                        <MessageSquare className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-lg leading-tight">{friend.name}</p>
                        <p className="text-sm text-gray-400 font-medium">{friend.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="rounded-xl h-12 px-6 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-black transition-colors"
                    >
                      <UserMinus className="h-5 w-5 mr-2" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="invitations" className="py-12 text-center text-gray-400 font-medium">
              No pending invitations
            </TabsContent>

            <TabsContent value="sent" className="py-12 text-center text-gray-400 font-medium">
              No sent requests
            </TabsContent>
          </Tabs>
        </div>

        {/* Recent Activity */}
        <div className="rounded-[40px] bg-white border border-gray-100 shadow-xl p-10">
          <h2 className="text-2xl font-black text-gray-900 mb-8">Recent Activity</h2>

          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-6 rounded-3xl hover:bg-gray-50 transition-colors group"
              >
                <div className="flex flex-col gap-1">
                  <h4 className="font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">
                    {activity.title}
                  </h4>
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wider text-[10px]">
                    {activity.category}
                  </p>
                </div>
                <span className="text-xs text-gray-400 font-bold tabular-nums shrink-0">{activity.date}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
