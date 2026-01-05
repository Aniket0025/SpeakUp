"use client"

import { Header } from "@/components/layout/header"
import { Sparkles, Users, Target, Mic, MessageSquare, Shield } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fd]">
      <Header />
      <main className="max-w-5xl mx-auto px-6 md:px-12 py-12">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold mb-4">
            <Sparkles className="h-4 w-4" />
            About SpeakUp
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Our mission</h1>
          <p className="text-lg text-gray-600 font-medium">
            SpeakUp helps students and professionals become confident communicators through structured practice, friendly
            competition, and AI-powered feedback.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="p-8 rounded-[32px] bg-white border border-gray-50 shadow-sm">
            <Users className="h-7 w-7 text-violet-600 mb-3" />
            <h3 className="font-bold text-lg mb-2">Practice with peers</h3>
            <p className="text-gray-600">Collaborate in Group Discussions and tournaments. Learn by doing.</p>
          </div>
          <div className="p-8 rounded-[32px] bg-white border border-gray-50 shadow-sm">
            <Mic className="h-7 w-7 text-indigo-600 mb-3" />
            <h3 className="font-bold text-lg mb-2">Master extempore</h3>
            <p className="text-gray-600">Sharpen impromptu speaking skills with guided prompts and timers.</p>
          </div>
          <div className="p-8 rounded-[32px] bg-white border border-gray-50 shadow-sm">
            <MessageSquare className="h-7 w-7 text-emerald-600 mb-3" />
            <h3 className="font-bold text-lg mb-2">AI Interview</h3>
            <p className="text-gray-600">Prepare for placements with adaptive questions and feedback.</p>
          </div>
          <div className="p-8 rounded-[32px] bg-white border border-gray-50 shadow-sm">
            <Target className="h-7 w-7 text-orange-600 mb-3" />
            <h3 className="font-bold text-lg mb-2">Track progress</h3>
            <p className="text-gray-600">Earn XP, climb leaderboards, and measure improvement over time.</p>
          </div>
        </div>

        <div className="rounded-[32px] p-8 bg-gradient-to-r from-violet-600 to-indigo-700 text-white shadow-2xl shadow-violet-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-white" />
            <span className="text-sm font-bold text-white/90">Built for inclusive, safe learning</span>
          </div>
          <p className="text-white/90">
            We prioritize respectful communication and a supportive environment so you can focus on growth.
          </p>
        </div>
      </main>
    </div>
  )
}
