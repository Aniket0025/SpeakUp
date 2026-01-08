"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Clock, Mic, Play, TrendingUp, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const categories = [
  "Technology",
  "Current Affairs",
  "Social Issues",
  "Business",
  "Education",
  "Environment",
  "Health",
  "Sports",
]

const suggestedTopics = {
  Technology: ["Artificial Intelligence", "Social Media Impact", "Future of Work", "Cybersecurity"],
  "Current Affairs": ["Climate Change", "Global Economy", "Political Trends", "International Relations"],
  "Social Issues": ["Gender Equality", "Mental Health", "Education Access", "Digital Divide"],
  Business: ["Startup Culture", "E-commerce", "Leadership", "Innovation"],
  Education: ["Online Learning", "Skill Development", "Higher Education", "EdTech"],
  Environment: ["Renewable Energy", "Waste Management", "Conservation", "Sustainable Living"],
  Health: ["Public Health", "Fitness Trends", "Medical Technology", "Nutrition"],
  Sports: ["Sportsmanship", "Professional Athletes", "Fitness", "Team Spirit"],
}

export default function ExtemporePage() {
  const router = useRouter()
  const { user, loading, token } = useAuth()
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  if (!user) return null
  const [selectedCategory, setSelectedCategory] = useState("")
  const [customTopic, setCustomTopic] = useState("")
  const [selectedTopic, setSelectedTopic] = useState("")
  const [timerMinutes, setTimerMinutes] = useState(2)
  const handleStartPractice = async () => {
    const topic = customTopic || selectedTopic
    if (!topic || !selectedCategory) {
      alert("Please select a category and topic")
      return
    }
    try {
      sessionStorage.setItem(
        "speakup_extempore_config",
        JSON.stringify({
          topic,
          category: selectedCategory,
          durationSeconds: timerMinutes * 60,
          thinkSeconds: 30,
          createdAt: Date.now(),
        }),
      )
      sessionStorage.removeItem("speakup_extempore_result")
    } catch {}
    router.push("/explore/extempore/prepare")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/explore")}
          className="mb-6 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Explore
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex h-24 w-24 rounded-3xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 items-center justify-center mb-6 shadow-xl">
              <Mic className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-5xl font-extrabold text-gray-900 mb-4">Extempore Speaking</h1>
            <p className="text-gray-500 text-xl">Practice impromptu speaking on random topics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-lg text-center">
              <Clock className="h-8 w-8 text-orange-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Flexible Duration</h3>
              <p className="text-sm text-gray-500">Set your own time limit</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-lg text-center">
              <TrendingUp className="h-8 w-8 text-orange-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Earn XP</h3>
              <p className="text-sm text-gray-500">Track your progress</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-lg text-center">
              <Zap className="h-8 w-8 text-orange-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">AI Feedback</h3>
              <p className="text-sm text-gray-500">Instant analysis</p>
            </div>
          </div>

          <div className="bg-white rounded-[40px] p-8 shadow-xl border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Configure Your Practice</h2>

            <div className="space-y-6">
              {/* Category Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-600">Select Category</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category)
                        setSelectedTopic("")
                        setCustomTopic("")
                      }}
                      className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                        selectedCategory === category
                          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Selection */}
              {selectedCategory && (
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-gray-600">Choose a Topic</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggestedTopics[selectedCategory as keyof typeof suggestedTopics]?.map((topic) => (
                      <button
                        key={topic}
                        onClick={() => {
                          setSelectedTopic(topic)
                          setCustomTopic("")
                        }}
                        className={`px-4 py-3 rounded-xl font-medium text-sm text-left transition-all ${
                          selectedTopic === topic
                            ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <Label htmlFor="customTopic" className="text-sm font-bold text-gray-600 mb-2 block">
                      Or Write Your Own Topic
                    </Label>
                    <Input
                      id="customTopic"
                      value={customTopic}
                      onChange={(e) => {
                        setCustomTopic(e.target.value)
                        setSelectedTopic("")
                      }}
                      placeholder="Enter a custom topic..."
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Timer Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-600">Set Timer (minutes)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(Number(e.target.value))}
                    className="h-12 rounded-xl w-24 text-center font-bold text-lg"
                  />
                  <div className="flex gap-2">
                    {[1, 2, 3, 5].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => setTimerMinutes(mins)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                          timerMinutes === mins
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button
              onClick={handleStartPractice}
              disabled={!selectedCategory || (!selectedTopic && !customTopic)}
              className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 hover:from-orange-600 hover:via-red-600 hover:to-pink-700 text-white px-12 py-6 text-lg font-semibold rounded-2xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Extempore Practice
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
