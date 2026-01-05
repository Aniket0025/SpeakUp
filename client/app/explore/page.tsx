"use client"

import { Header } from "@/components/layout/header"
import { ActivityCard } from "@/components/ui/activity-card"
import { MessageSquare, Mic, Sparkles, Bot, Target, BookOpen } from "lucide-react"

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-foreground mb-4">Explore Learning Activities</h1>
          <p className="text-muted-foreground text-xl">Choose how you want to improve your communication skills</p>
        </div>

        {/* Activity Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* <CHANGE> Updated to use subtitle/href props instead of actionLabel/onClick */}
          <ActivityCard
            icon={MessageSquare}
            iconBgColor="bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600"
            title="GD"
            subtitle="Start GD"
            subtitleColor="text-violet-600"
            description="Group Discussion with peers"
            href="/explore/gd"
          />

          <ActivityCard
            icon={Mic}
            iconBgColor="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600"
            title="Extempore"
            subtitle="Start Expo"
            subtitleColor="text-orange-600"
            description="Extempore Speaking Practice"
            href="/explore/extempore"
          />

          <ActivityCard
            icon={Sparkles}
            iconBgColor="bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600"
            title="AI Interview"
            subtitle="Practice Interview"
            subtitleColor="text-cyan-600"
            description="Practice interviews with AI-powered feedback"
            href="/explore/ai-interview"
          />

          <ActivityCard
            icon={Bot}
            iconBgColor="bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600"
            title="Practice with AI"
            subtitle="AI Coach + Proctoring"
            subtitleColor="text-emerald-600"
            description="Practice with AI, get proctoring analysis, and personalized tips to improve"
            href="/explore/solo-practice"
          />

          <ActivityCard
            icon={Target}
            iconBgColor="bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600"
            title="Debate"
            subtitle="Start Debate"
            subtitleColor="text-rose-600"
            description="Engage in structured debates and sharpen your arguments"
            href="/explore/debate"
          />

          <ActivityCard
            icon={BookOpen}
            iconBgColor="bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600"
            title="Prep Guide"
            subtitle="Tech & Govt Exams"
            subtitleColor="text-indigo-600"
            description="Roadmaps for Software, UPSC, MPSC, Banking, and company-specific interview prep"
            href="/explore/prep-guide"
          />
        </div>
      </main>
    </div>
  )
}
