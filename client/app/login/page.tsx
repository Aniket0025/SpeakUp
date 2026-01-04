"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login({ email, password })
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9fd] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 border border-gray-100">
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 mb-6 shadow-lg shadow-violet-500/20">
            <span className="text-3xl">🎙️</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-500 font-medium">Log in to continue your journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
            <Input
              type="email"
              placeholder="name@example.com"
              className="h-14 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              className="h-14 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          <Button
            type="submit"
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-lg font-bold shadow-xl shadow-violet-500/20 hover:shadow-violet-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Log In
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500">
            Don't have an account?{" "}
            <Link href="/register" className="text-violet-600 font-bold hover:underline">
              Register Now
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
