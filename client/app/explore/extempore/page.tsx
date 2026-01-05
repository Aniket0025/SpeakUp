"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Clock, Mic, MicOff, Play, Square, TrendingUp, Video, VideoOff, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"

declare global {
  interface Window {
    webkitSpeechRecognition?: any
    SpeechRecognition?: any
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

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
  const { token } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState("")
  const [customTopic, setCustomTopic] = useState("")
  const [selectedTopic, setSelectedTopic] = useState("")
  const [timerMinutes, setTimerMinutes] = useState(2)
  const [isPracticing, setIsPracticing] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")

  const socketRef = useRef<Socket | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<any>(null)
  const recognitionRef = useRef<any>(null)

  const setVideoRef = (el: HTMLVideoElement | null) => {
    videoRef.current = el
    if (el && mediaStreamRef.current) {
      ;(el as any).srcObject = mediaStreamRef.current
      el.play().catch(() => {})
    }
  }

  const handleStartPractice = async () => {
    const topic = customTopic || selectedTopic
    if (!topic || !selectedCategory) {
      alert("Please select a category and topic")
      return
    }
    if (!token) {
      alert("Please log in to start an extempore session")
      router.push("/login")
      return
    }

    // Reset state for a fresh session
    setTranscript("")
    setInterimTranscript("")
    setSessionId(null)

    // Connect websocket
    try {
      const socket = io(API_BASE_URL, { auth: { token } })
      socketRef.current = socket

      await new Promise<void>((resolve, reject) => {
        socket.on("connect", () => resolve())
        socket.on("connect_error", (err) => reject(err))
      })

      socket.emit(
        "extempore:start",
        { topic, category: selectedCategory, durationSeconds: timerMinutes * 60 },
        (res: any) => {
          if (!res?.ok) {
            alert(res?.error || "Failed to start session")
            socket.disconnect()
            return
          }
          setSessionId(res.sessionId)
        },
      )

      // Listen for server updates (optional UI sync)
      socket.on("extempore:update", (data: { transcript: string }) => {
        setTranscript(data.transcript)
      })
      socket.on("extempore:completed", (data: { transcript: string }) => {
        setTranscript(data.transcript)
      })
    } catch (e) {
      console.error("Socket connection failed", e)
      alert("Could not connect to real-time service")
      return
    }

    setTimeRemaining(timerMinutes * 60)
    setIsPracticing(true)

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Start camera (always try when practice begins)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      mediaStreamRef.current = stream
      if (videoRef.current) {
        ;(videoRef.current as any).srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setCameraOn(true)
    } catch (err) {
      console.warn("Camera permission denied or unavailable", err)
      alert(
        "Camera could not be started. Please allow camera access for this site in your browser address bar and make sure no other app is using the camera.",
      )
      setCameraOn(false)
    }

    // Start speech recognition
    if (micOn) {
      startRecognition()
    }
  }

  const handleStopPractice = () => {
    const used = timerMinutes * 60 - timeRemaining
    const finalText = [transcript, interimTranscript].filter(Boolean).join(" ")

    if (socketRef.current && sessionId) {
      socketRef.current.emit(
        "extempore:stop",
        { sessionId, finalTranscript: finalText, durationSeconds: used },
        () => {},
      )
    }

    cleanupMedia()
    stopRecognition()
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    if (timerRef.current) clearInterval(timerRef.current)

    setIsPracticing(false)
    setTimeRemaining(0)
    setSessionId(null)
  }

  const startRecognition = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.")
      setMicOn(false)
      return
    }
    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: any) => {
      let interim = ""
      let finals: string[] = []
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        const text = res[0].transcript.trim()
        if (res.isFinal) {
          finals.push(text)
        } else {
          interim += text + " "
        }
      }
      if (interim !== undefined) setInterimTranscript(interim.trim())
      if (finals.length) {
        const finalChunk = finals.join(" ")
        setTranscript((prev) => [prev, finalChunk].filter(Boolean).join(" "))
        if (socketRef.current && sessionId) {
          socketRef.current.emit("extempore:chunk", { sessionId, text: finalChunk })
        }
      }
    }

    recognition.onerror = () => {}
    recognition.onend = () => {
      // Auto-restart while practicing and mic is on
      if (isPracticing && micOn) {
        try {
          recognition.start()
        } catch {}
      }
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
    } catch {}
  }

  const stopRecognition = () => {
    try {
      recognitionRef.current?.stop()
      recognitionRef.current = null
      setInterimTranscript("")
    } catch {}
  }

  const cleanupMedia = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop())
      mediaStreamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  // Toggle camera
  const toggleCamera = async () => {
    if (!isPracticing) return setCameraOn((v) => !v)
    if (cameraOn) {
      cleanupMedia()
      setCameraOn(false)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        mediaStreamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setCameraOn(true)
      } catch {
        setCameraOn(false)
      }
    }
  }

  // Toggle mic (speech recognition)
  const toggleMic = () => {
    if (!isPracticing) return setMicOn((v) => !v)
    if (micOn) {
      stopRecognition()
      setMicOn(false)
    } else {
      setMicOn(true)
      startRecognition()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMedia()
      stopRecognition()
      if (socketRef.current) socketRef.current.disconnect()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (isPracticing && cameraOn && mediaStreamRef.current && videoRef.current) {
      ;(videoRef.current as any).srcObject = mediaStreamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [isPracticing, cameraOn])

  // Auto stop when timer hits zero
  useEffect(() => {
    if (isPracticing && timeRemaining === 0) {
      handleStopPractice()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPracticing, timeRemaining])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (isPracticing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header: Topic/Category (perfect center) + Timer on right */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center mb-8">
              <div />
              <div className="flex flex-col items-center">
                <h1 className="text-3xl font-extrabold text-gray-900 text-center">{customTopic || selectedTopic}</h1>
                <p className="text-sm text-gray-600 mt-1 text-center">{selectedCategory}</p>
              </div>
              <div className="justify-self-end bg-white rounded-2xl px-6 py-4 shadow border border-gray-100 text-center">
                <div className="text-5xl font-black text-gray-900">{formatTime(timeRemaining)}</div>
                <p className="text-gray-500 text-xs">Time Remaining</p>
              </div>
            </div>

            {/* Body: Camera and Transcript side-by-side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-4 shadow border border-gray-100">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
                  <video ref={setVideoRef} className="w-full h-full object-cover" muted playsInline autoPlay />
                  {!cameraOn && (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold bg-black/60">
                      Camera Off
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2">Live Transcript</h3>
                <div className="min-h-56 max-h-96 overflow-y-auto text-sm text-gray-700 leading-6 whitespace-pre-wrap">
                  {transcript}
                  {interimTranscript && <span className="opacity-60"> {interimTranscript}</span>}
                </div>
                <p className="mt-3 text-[11px] text-gray-400">Only your transcript is saved. Camera preview is not recorded.</p>
              </div>
            </div>

            {/* Footer Controls */}
            <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-3">
              <Button onClick={toggleCamera} variant="secondary" className="rounded-xl font-bold">
                {cameraOn ? <Video className="h-4 w-4 mr-2" /> : <VideoOff className="h-4 w-4 mr-2" />} {cameraOn ? "Camera On" : "Camera Off"}
              </Button>
              <Button onClick={toggleMic} variant="secondary" className="rounded-xl font-bold">
                {micOn ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />} {micOn ? "Mic On" : "Mic Off"}
              </Button>
              <Button
                onClick={handleStopPractice}
                size="lg"
                className="h-12 px-10 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-base shadow-xl"
              >
                <Square className="h-5 w-5 mr-2" />
                Stop Practice
              </Button>
            </div>

            {timeRemaining === 0 && (
              <div className="mt-6 p-4 rounded-2xl bg-green-50 border-2 border-green-200 text-center">
                <p className="font-bold text-green-700">Time's up! Great job!</p>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f9fd]">
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
