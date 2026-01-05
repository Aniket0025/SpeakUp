"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Mic, Users, MessageSquare, Trophy, Sparkles, Shield, Rocket } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f7f9fd]">
      <Header />
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <section className="grid md:grid-cols-2 gap-10 items-center mb-20">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold mb-4">
              <Sparkles className="h-4 w-4" />
              Level up your communication
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight mb-6">
              Practice. Compete. Grow your speaking skills with
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent"> SpeakUp</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 font-medium">
              A gamified platform to master Group Discussions, Extempore, and AI Interviews with real-time feedback.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold h-12 px-6 shadow-lg shadow-violet-500/20">
                <Link href="/register">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-2xl h-12 px-6 font-bold">
                <Link href="/login">I already have an account</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-[40px] p-8 bg-white border border-gray-50 shadow-xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl p-6 bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg">
                  <Mic className="h-8 w-8 mb-3" />
                  <p className="font-bold">Extempore</p>
                  <p className="text-sm text-violet-100">Think fast. Speak faster.</p>
                </div>
                <div className="rounded-3xl p-6 bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-lg">
                  <Users className="h-8 w-8 mb-3" />
                  <p className="font-bold">Group Discussion</p>
                  <p className="text-sm text-orange-100">Collaborate & debate</p>
                </div>
                <div className="rounded-3xl p-6 bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
                  <MessageSquare className="h-8 w-8 mb-3" />
                  <p className="font-bold">AI Interview</p>
                  <p className="text-sm text-emerald-100">Practice for placements</p>
                </div>
                <div className="rounded-3xl p-6 bg-gradient-to-br from-pink-500 to-fuchsia-600 text-white shadow-lg">
                  <Trophy className="h-8 w-8 mb-3" />
                  <p className="font-bold">Tournaments</p>
                  <p className="text-sm text-pink-100">Compete & win</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-20">
          <h2 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Why SpeakUp?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-8 rounded-[32px] bg-white border border-gray-50 shadow-sm hover:shadow-md transition-all">
              <Rocket className="h-8 w-8 text-violet-600 mb-4" />
              <h3 className="font-bold text-lg mb-2">Gamified Progress</h3>
              <p className="text-gray-600">Levels, XP, and leaderboards to keep you motivated.</p>
            </div>
            <div className="p-8 rounded-[32px] bg-white border border-gray-50 shadow-sm hover:shadow-md transition-all">
              <Shield className="h-8 w-8 text-emerald-600 mb-4" />
              <h3 className="font-bold text-lg mb-2">Safe Environment</h3>
              <p className="text-gray-600">Practice confidently with peers and AI.</p>
            </div>
            <div className="p-8 rounded-[32px] bg-white border border-gray-50 shadow-sm hover:shadow-md transition-all">
              <Sparkles className="h-8 w-8 text-orange-600 mb-4" />
              <h3 className="font-bold text-lg mb-2">AI-Powered Feedback</h3>
              <p className="text-gray-600">Actionable insights to improve every session.</p>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[40px] bg-gradient-to-r from-violet-600 to-indigo-700 p-10 text-white shadow-2xl shadow-violet-500/30">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-white/20">
                <Sparkles className="h-5 w-5 text-yellow-300" />
              </div>
              <span className="text-yellow-300 font-black tracking-widest uppercase text-xs">Ready to start?</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-black mb-4 leading-tight">Create your account and join your first session</h3>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-black rounded-2xl px-8 h-14">
                <Link href="/register">Create free account</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-2xl px-8 h-14 border-white/40 text-white hover:bg-white/10">
                <Link href="/explore">Explore activities</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
