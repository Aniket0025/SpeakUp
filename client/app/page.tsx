"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { LevelCard } from "@/components/ui/level-card"
import { StatCard } from "@/components/ui/stat-card"
import { useAuth } from "@/hooks/use-auth"
import {
    ArrowRight,
    Calendar,
    MessageSquare,
    Mic,
    Sparkles,
    Target,
    TrendingUp,
    Trophy,
    Users,
    Zap,
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user } = useAuth()
  const firstName = user?.fullName?.split(" ")[0] || "User"
  const quickActions = [
    {
      icon: Users,
      title: "Group Discussion",
      description: "Join a live GD session",
      gradient: "from-violet-500 to-indigo-600",
      href: "/explore",
    },
    {
      icon: Mic,
      title: "Extempore",
      description: "Practice impromptu speaking",
      gradient: "from-orange-500 to-red-500",
      href: "/explore",
    },
    {
      icon: MessageSquare,
      title: "AI Interview",
      description: "Practice with AI interviewer",
      gradient: "from-emerald-500 to-teal-500",
      href: "/explore",
    },
    {
      icon: Trophy,
      title: "Tournament",
      description: "Compete for prizes",
      gradient: "from-pink-500 to-rose-500",
      href: "/explore/tournaments",
    },
  ]

  return (
    <div className="min-h-screen bg-[#f7f9fd]">
      <Header />

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              {firstName}!
            </span>{" "}
            👋
          </h1>
          <p className="text-gray-500 text-lg font-medium">Ready to level up your communication skills today?</p>
        </div>

        {/* Level Card */}
        <div className="mb-14">
          <LevelCard level={1} currentXP={0} nextLevelXP={100} streak={0} />
        </div>

        {/* Quick Actions */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Quick Actions</h2>
            <Link
              href="/explore"
              className="text-violet-600 hover:text-violet-700 text-sm font-bold flex items-center gap-1 group"
            >
              View All <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="group relative overflow-hidden rounded-[32px] p-8 bg-white border border-gray-50 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1 text-lg">{action.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{action.description}</p>
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform scale-50 group-hover:scale-100 duration-300">
                  <div className="h-8 w-8 rounded-full bg-violet-50 flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-violet-600" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-14">
          <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Your Stats</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={MessageSquare}
              iconColor="text-cyan-600"
              iconBgColor="bg-cyan-100"
              label="GD Sessions"
              value={0}
            />
            <StatCard icon={Mic} iconColor="text-violet-600" iconBgColor="bg-violet-100" label="Extempore" value={0} />
            <StatCard
              icon={Users}
              iconColor="text-emerald-600"
              iconBgColor="bg-emerald-100"
              label="Interviews"
              value={1}
            />
            <StatCard
              icon={Target}
              iconColor="text-orange-600"
              iconBgColor="bg-orange-100"
              label="Avg Score"
              value="0%"
            />
          </div>
        </div>

        {/* Activity Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-14">
          <div className="flex items-center gap-6 p-8 rounded-[32px] bg-white border border-gray-50 shadow-sm transition-all hover:shadow-md">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">This Week</p>
              <p className="text-3xl font-black text-gray-900">0 Sessions</p>
            </div>
          </div>

          <div className="flex items-center gap-6 p-8 rounded-[32px] bg-white border border-gray-50 shadow-sm transition-all hover:shadow-md">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">This Month</p>
              <p className="text-3xl font-black text-gray-900">0 Sessions</p>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-r from-violet-600 to-indigo-700 p-12 text-white shadow-2xl shadow-violet-500/30">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-white/20">
                <Sparkles className="h-5 w-5 text-yellow-300" />
              </div>
              <span className="text-yellow-300 font-black tracking-widest uppercase text-xs">Start Your Journey</span>
            </div>
            <h3 className="text-4xl font-black mb-4 max-w-lg leading-tight">Join Your First Session!</h3>
            <p className="text-violet-100 mb-8 max-w-md text-lg leading-relaxed font-medium">
              Practice with peers globally, get AI-powered feedback, and track your progress.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-white text-violet-600 hover:bg-violet-50 font-black rounded-2xl px-10 h-16 text-lg shadow-xl transition-all hover:scale-105 active:scale-95 border-0"
            >
              <Link href="/explore">
                <Zap className="h-5 w-5 mr-2 fill-current" />
                Start Now
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
