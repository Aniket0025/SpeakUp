"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, GraduationCap, Building2, Code } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"

export default function PrepGuidePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#f7f9fd]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/explore")}
          className="mb-6 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Explore
        </Button>

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex h-24 w-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 items-center justify-center mb-6 shadow-xl">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-5xl font-extrabold text-gray-900 mb-4">Prep Guide</h1>
            <p className="text-gray-500 text-xl">
              Comprehensive roadmaps for Software, UPSC, MPSC, Banking, and company-specific interview prep
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <Code className="h-10 w-10 text-indigo-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Software Engineering</h3>
              <p className="text-sm text-gray-500 mb-4">
                Complete roadmap for tech interviews, coding rounds, and system design
              </p>
              <Button variant="outline" className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 bg-transparent">
                View Roadmap
              </Button>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <GraduationCap className="h-10 w-10 text-indigo-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Government Exams</h3>
              <p className="text-sm text-gray-500 mb-4">Preparation guide for UPSC, MPSC, SSC, and other exams</p>
              <Button variant="outline" className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 bg-transparent">
                View Roadmap
              </Button>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <Building2 className="h-10 w-10 text-indigo-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Banking & Finance</h3>
              <p className="text-sm text-gray-500 mb-4">
                Complete guide for banking exams and finance sector interviews
              </p>
              <Button variant="outline" className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 bg-transparent">
                View Roadmap
              </Button>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <BookOpen className="h-10 w-10 text-indigo-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Company-Specific Prep</h3>
              <p className="text-sm text-gray-500 mb-4">
                Tailored guides for top companies and their interview process
              </p>
              <Button variant="outline" className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 bg-transparent">
                View Roadmap
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
