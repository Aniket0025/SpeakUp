"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Mic, MicOff, Square, Video, VideoOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

type ExtemporeConfig = {
  topic: string
  category: string
  durationSeconds: number
  thinkSeconds: number
  createdAt: number
}

type ExtemporeResult = {
  topic: string
  category: string
  thinkSeconds: number
  speakingDurationSeconds: number
  transcript: string
  endedAt: number
}

export default function ExtemporePracticePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [config, setConfig] = useState<ExtemporeConfig | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [secureContext, setSecureContext] = useState(true)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<any>(null)
  const recognitionRef = useRef<any>(null)
  const isPracticingRef = useRef(false)
  const micOnRef = useRef(false)

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el
    if (el && mediaStreamRef.current) {
      const stream = mediaStreamRef.current
      if ((el as any).srcObject !== stream) {
        ;(el as any).srcObject = stream
      }
      const playSafe = () => el.play().catch(() => {})
      if (el.readyState >= 1) playSafe()
      else el.onloadedmetadata = playSafe
    }
  }, [])

  const refreshCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cams = devices.filter((d) => d.kind === "videoinput")
      setAvailableCameras(cams)
      if (!selectedCameraId && cams[0]) setSelectedCameraId(cams[0].deviceId)
    } catch {}
  }

  const openCamera = async (deviceId?: string): Promise<boolean> => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop())
        mediaStreamRef.current = null
      }

      let stream: MediaStream | null = null
      try {
        if (deviceId) {
          stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } }, audio: false })
        } else {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
        }
      } catch (firstErr: any) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const cameras = devices.filter((d) => d.kind === "videoinput")
          setAvailableCameras(cameras)
          if (!selectedCameraId && cameras[0]) setSelectedCameraId(cameras[0].deviceId)
          if (cameras.length) {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: selectedCameraId || cameras[0].deviceId } },
              audio: false,
            })
          } else {
            throw firstErr
          }
        } catch {
          throw firstErr
        }
      }

      mediaStreamRef.current = stream
      if (videoRef.current) {
        const el = videoRef.current
        if ((el as any).srcObject !== stream) {
          ;(el as any).srcObject = stream
        }
        await el.play().catch(() => {})
      }

      setCameraOn(true)
      setCameraError(null)
      return true
    } catch (err: any) {
      const name = err?.name || "Error"
      if (name === "NotAllowedError") setCameraError("Camera permission denied")
      else if (name === "NotFoundError") setCameraError("No camera device found")
      else if (name === "NotReadableError") setCameraError("Camera is in use by another app")
      else setCameraError("Unable to start camera")
      setCameraOn(false)
      return false
    }
  }

  const cleanupMedia = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop())
      mediaStreamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const cleanupMic = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop())
      audioStreamRef.current = null
    }
  }

  const openMic = async (): Promise<boolean> => {
    try {
      cleanupMic()
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })
      audioStreamRef.current = stream
      setMicError(null)
      return true
    } catch (err: any) {
      const name = err?.name || "Error"
      if (name === "NotAllowedError") setMicError("Microphone permission denied")
      else if (name === "NotFoundError") setMicError("No microphone device found")
      else if (name === "NotReadableError") setMicError("Microphone is in use by another app")
      else setMicError("Unable to start microphone")
      return false
    }
  }

  const startRecognition = async (): Promise<boolean> => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setSpeechSupported(false)
      setMicOn(false)
      micOnRef.current = false
      setMicError("Live transcript is not supported in this browser")
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
      }
    }

    recognition.onerror = (event: any) => {
      const err = String(event?.error || "").toLowerCase()
      if (err === "not-allowed" || err === "service-not-allowed") {
        setMicError("Microphone permission is blocked. Allow mic access in your browser and try again.")
        setMicOn(false)
        micOnRef.current = false
        stopRecognition()
        cleanupMic()
        return
      }
      if (err === "audio-capture") {
        setMicError("No microphone found or microphone is unavailable.")
        return
      }
      if (err === "network") {
        setMicError("Speech recognition network error. Check internet and try again.")
        return
      }
    }
    recognition.onend = () => {
      if (isPracticingRef.current && micOnRef.current) {
        try {
          setTimeout(() => {
            try {
              recognition.start()
            } catch {}
          }, 250)
        } catch {}
      }
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      return true
    } catch (err: any) {
      // Most common reason is: must be triggered by a user gesture.
      setMicError("Click the Mic button to enable microphone + live transcript.")
      return false
    }
  }

  const stopRecognition = () => {
    try {
      recognitionRef.current?.stop()
      recognitionRef.current = null
      setInterimTranscript("")
    } catch {}
  }

  const toggleCamera = async () => {
    if (cameraOn) {
      cleanupMedia()
      setCameraOn(false)
    } else {
      await refreshCameras()
      await openCamera(selectedCameraId || undefined)
    }
  }

  const enableMicAndTranscript = async (autoStart: boolean) => {
    setMicError(null)
    setSpeechSupported(true)
    if (typeof window !== "undefined") {
      setSecureContext(Boolean((window as any).isSecureContext))
    }

    const micOk = await openMic()
    if (!micOk) {
      setMicOn(false)
      micOnRef.current = false
      return
    }

    const srOk = await startRecognition()
    if (!srOk && autoStart) {
      setMicOn(false)
      micOnRef.current = false
    }
  }

  const toggleMic = async () => {
    if (micOn) {
      stopRecognition()
      cleanupMic()
      setMicOn(false)
      micOnRef.current = false
    } else {
      setMicOn(true)
      micOnRef.current = true
      await enableMicAndTranscript(false)
    }
  }

  const stopAndAnalyze = () => {
    if (!config) {
      router.replace("/explore/extempore")
      return
    }

    const used = Math.max(0, Number(config.durationSeconds || 0) - timeRemaining)
    const finalText = [transcript, interimTranscript].filter(Boolean).join(" ").trim()

    const result: ExtemporeResult = {
      topic: config.topic,
      category: config.category,
      thinkSeconds: Number(config.thinkSeconds || 30),
      speakingDurationSeconds: used,
      transcript: finalText,
      endedAt: Date.now(),
    }

    try {
      sessionStorage.setItem("speakup_extempore_result", JSON.stringify(result))
    } catch {}

    isPracticingRef.current = false
    cleanupMedia()
    cleanupMic()
    stopRecognition()
    if (timerRef.current) clearInterval(timerRef.current)

    router.replace("/explore/extempore/analysis")
  }

  useEffect(() => {
    isPracticingRef.current = true
    return () => {
      isPracticingRef.current = false
    }
  }, [])

  useEffect(() => {
    micOnRef.current = micOn
  }, [micOn])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("speakup_extempore_config")
      const parsed = raw ? (JSON.parse(raw) as ExtemporeConfig) : null
      if (!parsed?.topic || !parsed?.category || !parsed?.durationSeconds) {
        router.replace("/explore/extempore")
        return
      }
      setConfig(parsed)
      setTimeRemaining(Number(parsed.durationSeconds || 0))
      setTranscript("")
      setInterimTranscript("")
      if (typeof window !== "undefined") {
        setSecureContext(Boolean((window as any).isSecureContext))
      }
      setMicError(null)

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

      // Start camera + mic
      refreshCameras().then(() => {
        openCamera(selectedCameraId || undefined).catch(() => {})
      })
      // Attempt auto-start; if blocked by browser gesture rules, user can enable via Mic button.
      setMicOn(true)
      micOnRef.current = true
      enableMicAndTranscript(true).catch(() => {
        setMicOn(false)
        micOnRef.current = false
      })
    } catch {
      router.replace("/explore/extempore")
    }

    return () => {
      cleanupMedia()
      cleanupMic()
      stopRecognition()
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  useEffect(() => {
    if (timeRemaining === 0 && config) {
      stopAndAnalyze()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining])

  useEffect(() => {
    const handler = () => refreshCameras()
    try {
      navigator.mediaDevices?.addEventListener("devicechange", handler)
    } catch {}
    return () => {
      try {
        navigator.mediaDevices?.removeEventListener("devicechange", handler)
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (cameraOn && mediaStreamRef.current && videoRef.current) {
      const el = videoRef.current
      const stream = mediaStreamRef.current
      if ((el as any).srcObject !== stream) {
        ;(el as any).srcObject = stream
      }
      const playSafe = () => el.play().catch(() => {})
      if (el.readyState >= 1) playSafe()
      else el.onloadedmetadata = playSafe
    }
  }, [cameraOn])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const title = config?.topic || "Extempore"
  const subtitle = config?.category || ""

  const hasTranscript = Boolean(transcript || interimTranscript)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center mb-8">
            <div />
            <div className="flex flex-col items-center">
              <h1 className="text-3xl font-extrabold text-gray-900 text-center">{title}</h1>
              <p className="text-sm text-gray-600 mt-1 text-center">{subtitle}</p>
            </div>
            <div className="justify-self-end bg-white rounded-2xl px-6 py-4 shadow border border-gray-100 text-center">
              <div className="text-5xl font-black text-gray-900">{formatTime(timeRemaining)}</div>
              <p className="text-gray-500 text-xs">Time Remaining</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-4 shadow border border-gray-100">
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
                <video
                  ref={setVideoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  autoPlay
                  onLoadedMetadata={(e) => (e.currentTarget as HTMLVideoElement).play().catch(() => {})}
                  style={{ backfaceVisibility: "hidden", transform: "translateZ(0)", willChange: "transform" }}
                />
                {!cameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white text-xs font-bold bg-black/60 p-3 text-center">
                    <span>{`Camera Off${cameraError ? ` - ${cameraError}` : ""}`}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openCamera(selectedCameraId || undefined)}
                        className="px-2 py-1 bg-white/80 text-black rounded shadow"
                      >
                        Retry
                      </button>
                      <button onClick={refreshCameras} className="px-2 py-1 bg-white/60 text-black rounded shadow">
                        Refresh devices
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">Live Transcript</h3>
              <div className="min-h-56 max-h-96 overflow-y-auto text-sm text-gray-700 leading-6 whitespace-pre-wrap">
                {transcript}
                {interimTranscript && <span className="opacity-60"> {interimTranscript}</span>}
                {!hasTranscript && (
                  <span className="text-gray-400">
                    {micOn
                      ? "Listening..."
                      : "Mic is off. Turn on Mic to start live transcript."}
                  </span>
                )}
              </div>
              {(!secureContext || !speechSupported || micError) && (
                <div className="mt-3 text-[11px] text-rose-600 font-semibold space-y-1">
                  {!secureContext && <div>Microphone/transcript may not work on insecure (non-HTTPS) sites.</div>}
                  {!speechSupported && <div>Live transcript is not supported in this browser (use Chrome).</div>}
                  {micError && <div>{micError}</div>}
                </div>
              )}
              <p className="mt-3 text-[11px] text-gray-400">Transcript is generated locally in your browser.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-3">
            <Button onClick={toggleCamera} variant="secondary" className="rounded-xl font-bold">
              {cameraOn ? <Video className="h-4 w-4 mr-2" /> : <VideoOff className="h-4 w-4 mr-2" />} {cameraOn ? "Camera On" : "Camera Off"}
            </Button>
            <Button onClick={toggleMic} variant="secondary" className="rounded-xl font-bold">
              {micOn ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />} {micOn ? "Mic On" : "Mic Off"}
            </Button>
            <Button
              onClick={stopAndAnalyze}
              size="lg"
              className="h-12 px-10 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-base shadow-xl"
            >
              <Square className="h-5 w-5 mr-2" />
              Stop Practice
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
