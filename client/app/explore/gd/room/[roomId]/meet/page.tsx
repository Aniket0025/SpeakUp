"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { Circle, Expand, LogOut, MessageSquareText, Plus, Square } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:5000` : "http://localhost:5000")

type GdRoom = {
  roomId: string
  roomName: string
  topic: string
  maxParticipants: number
  hostUserId: string | null
  status: "waiting" | "active" | "completed"
  createdAt: number
  startedAt: number | null
  durationSeconds: number
  participants: Array<{ userId: string; name: string }>
}

type ZegoTokenRes = {
  token: string
  appID: number
  userID: string
  userName: string
}

type GdTranscriptEntry = {
  userId: string
  name: string
  text: string
  createdAt: string
}

type GdTranscriptPerUser = {
  userId: string
  name: string
  entries: Array<{ text: string; createdAt: string }>
}

export default function GDMeetPage() {
  const params = useParams<{ roomId?: string }>()
  const roomId = useMemo(() => String(params?.roomId || "").trim().toUpperCase(), [params?.roomId])
  const router = useRouter()
  const { token, user } = useAuth()

  const socketRef = useRef<Socket | null>(null)
  const screenRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const zegoRef = useRef<any>(null)
  const recognitionRef = useRef<any>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const hasBeenActiveRef = useRef(false)
  const manualExitRef = useRef(false)

  const recordingDisplayStreamRef = useRef<MediaStream | null>(null)
  const recordingMicStreamRef = useRef<MediaStream | null>(null)
  const recordingStreamRef = useRef<MediaStream | null>(null)
  const recordingAudioCtxRef = useRef<AudioContext | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<BlobPart[]>([])
  const recordingStopResolveRef = useRef<(() => void) | null>(null)
  const recordingStopPromiseRef = useRef<Promise<void> | null>(null)

  const [room, setRoom] = useState<GdRoom | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isTranscriptsOpen, setIsTranscriptsOpen] = useState(false)
  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [transcriptLoading, setTranscriptLoading] = useState(false)
  const [combinedTranscript, setCombinedTranscript] = useState<GdTranscriptEntry[]>([])
  const [perUserTranscript, setPerUserTranscript] = useState<GdTranscriptPerUser[]>([])
  const [transcriptCaptureOn, setTranscriptCaptureOn] = useState(true)
  const [transcriptCaptureError, setTranscriptCaptureError] = useState<string | null>(null)
  const [speechSupported, setSpeechSupported] = useState(true)

  const [isRecording, setIsRecording] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [isRecordingStopping, setIsRecordingStopping] = useState(false)

  const stopAllElementStreams = () => {
    try {
      const els = Array.from(document.querySelectorAll("video, audio")) as Array<HTMLVideoElement | HTMLAudioElement>
      for (const el of els) {
        const anyEl = el as any
        const src = anyEl?.srcObject
        if (src && typeof src.getTracks === "function") {
          try {
            src.getTracks().forEach((t: MediaStreamTrack) => t.stop())
          } catch {}
          try {
            anyEl.srcObject = null
          } catch {}
        }
      }
    } catch {}
  }

  const cleanupCall = () => {
    stopRecognition()
    cleanupMic()
    try {
      zegoRef.current?.leaveRoom?.()
    } catch {}
    try {
      zegoRef.current?.destroy?.()
    } catch {}
    zegoRef.current = null
    stopAllElementStreams()
  }

  const getBestRecorderMimeType = () => {
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ]
    try {
      // eslint-disable-next-line no-restricted-globals
      if (typeof MediaRecorder === "undefined") return null
      for (const t of candidates) {
        try {
          if (MediaRecorder.isTypeSupported(t)) return t
        } catch {}
      }
    } catch {}
    return null
  }

  const cleanupRecordingStreams = () => {
    try {
      recordingStreamRef.current?.getTracks?.().forEach((t) => t.stop())
    } catch {}
    try {
      recordingDisplayStreamRef.current?.getTracks?.().forEach((t) => t.stop())
    } catch {}
    try {
      recordingMicStreamRef.current?.getTracks?.().forEach((t) => t.stop())
    } catch {}

    recordingStreamRef.current = null
    recordingDisplayStreamRef.current = null
    recordingMicStreamRef.current = null

    try {
      recordingAudioCtxRef.current?.close?.()
    } catch {}
    recordingAudioCtxRef.current = null
  }

  const downloadRecording = (blob: Blob) => {
    try {
      const stamp = new Date()
      const safe = stamp.toISOString().replace(/[.:]/g, "-")
      const fileName = `gd-${roomId || "room"}-${safe}.webm`
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => {
        try {
          URL.revokeObjectURL(url)
        } catch {}
      }, 2000)

      try {
        window.localStorage.setItem(
          `gd:recording:last:${roomId}`,
          JSON.stringify({ fileName, createdAt: Date.now(), size: blob.size, type: blob.type || "video/webm" })
        )
      } catch {}
    } catch {}
  }

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return
    if (isRecordingStopping) return recordingStopPromiseRef.current || undefined

    const rec = mediaRecorderRef.current
    if (rec.state === "inactive") {
      cleanupRecordingStreams()
      mediaRecorderRef.current = null
      return
    }

    setIsRecordingStopping(true)

    if (!recordingStopPromiseRef.current) {
      recordingStopPromiseRef.current = new Promise<void>((resolve) => {
        recordingStopResolveRef.current = resolve
      })
    }

    try {
      rec.stop()
    } catch {
      try {
        recordingStopResolveRef.current?.()
      } catch {}
    }

    return recordingStopPromiseRef.current
  }

  const startRecording = async () => {
    try {
      if (isRecording || isRecordingStopping) return
      setRecordingError(null)

      // eslint-disable-next-line no-restricted-globals
      if (typeof MediaRecorder === "undefined") {
        setRecordingError("Recording is not supported in this browser.")
        return
      }

      if (!navigator.mediaDevices?.getDisplayMedia) {
        setRecordingError("Screen recording is not supported in this browser.")
        return
      }

      recordedChunksRef.current = []

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      })
      recordingDisplayStreamRef.current = displayStream

      const videoTrack = displayStream.getVideoTracks?.()[0]
      if (!videoTrack) {
        cleanupRecordingStreams()
        setRecordingError("No video track found for recording.")
        return
      }

      // Best-effort: also mix microphone audio so voices are captured clearly.
      let micStream: MediaStream | null = null
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        })
        recordingMicStreamRef.current = micStream
      } catch {
        // Mic might be denied or already in use. We still proceed with display audio.
        micStream = null
      }

      const audioCtx = new AudioContext()
      recordingAudioCtxRef.current = audioCtx
      const dest = audioCtx.createMediaStreamDestination()

      const displayAudioTrack = displayStream.getAudioTracks?.()[0]
      if (displayAudioTrack) {
        try {
          const src = audioCtx.createMediaStreamSource(new MediaStream([displayAudioTrack]))
          src.connect(dest)
        } catch {}
      }

      const micTrack = micStream?.getAudioTracks?.()[0]
      if (micTrack) {
        try {
          const src = audioCtx.createMediaStreamSource(new MediaStream([micTrack]))
          src.connect(dest)
        } catch {}
      }

      try {
        await audioCtx.resume()
      } catch {}

      const outAudioTracks = dest.stream.getAudioTracks?.() || []
      const finalStream = new MediaStream([videoTrack, ...outAudioTracks])
      recordingStreamRef.current = finalStream

      const mimeType = getBestRecorderMimeType()
      const recorder = mimeType ? new MediaRecorder(finalStream, { mimeType }) : new MediaRecorder(finalStream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        try {
          const chunks = recordedChunksRef.current
          recordedChunksRef.current = []
          const type = mimeType || "video/webm"
          const blob = new Blob(chunks, { type })
          if (blob.size > 0) {
            downloadRecording(blob)
          }
        } catch {}

        cleanupRecordingStreams()
        mediaRecorderRef.current = null

        setIsRecording(false)
        setIsRecordingStopping(false)

        try {
          recordingStopResolveRef.current?.()
        } catch {}
        recordingStopResolveRef.current = null
        recordingStopPromiseRef.current = null
      }

      videoTrack.addEventListener("ended", () => {
        // User stopped screen sharing from browser UI.
        const p = stopRecording()
        if (p) p.catch(() => {})
      })

      recorder.start(1000)
      setIsRecording(true)
    } catch (err: any) {
      cleanupRecordingStreams()
      mediaRecorderRef.current = null
      setIsRecording(false)
      setIsRecordingStopping(false)
      const name = String(err?.name || "")
      if (name === "NotAllowedError") setRecordingError("Recording permission denied.")
      else if (name === "NotFoundError") setRecordingError("No capture device found.")
      else setRecordingError(err?.message || "Failed to start recording.")
    }
  }

  const notesDraftKey = useMemo(() => {
    const uid = user?.id ? String(user.id) : "anon"
    return `gd:notes:draft:${uid}:${roomId}`
  }, [roomId, user?.id])

  const [notesText, setNotesText] = useState("")
  const [newNote, setNewNote] = useState("")

  useEffect(() => {
    try {
      if (!roomId) return
      const saved = window.localStorage.getItem(notesDraftKey)
      if (saved !== null) setNotesText(saved)
    } catch {}
  }, [notesDraftKey, roomId])

  useEffect(() => {
    try {
      if (!roomId) return
      window.localStorage.setItem(notesDraftKey, notesText)
    } catch {}
  }, [notesDraftKey, notesText, roomId])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const loadZego = async () => {
    if (!token) return
    if (!containerRef.current) return

    try {
      setError(null)

      const res = await fetch(`${API_BASE_URL}/api/zego/token?roomID=${encodeURIComponent(roomId)}&expired_ts=86400`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || "Failed to get ZEGO token")
      }

      const data = (await res.json()) as ZegoTokenRes

      const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt")
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(data.appID, data.token, roomId, data.userID, data.userName)

      const zp = ZegoUIKitPrebuilt.create(kitToken)
      zegoRef.current = zp

      zp.joinRoom({
        container: containerRef.current,
        sharedLinks: [
          {
            name: "Personal link",
            url: `${window.location.protocol}//${window.location.host}/explore/gd/room/${roomId}/meet`,
          },
        ],
        scenario: {
          mode: ZegoUIKitPrebuilt.GroupCall,
        },
        // Skip Zego's built-in pre-join name screen and enter the room directly
        showPreJoinView: false,
        onLeaveRoom: () => {
          // Zego can trigger onLeaveRoom unexpectedly (network/perms). Avoid redirect loops.
          if (manualExitRef.current || room?.status !== "active") {
            leaveMeeting()
          } else {
            setError("Call ended unexpectedly. Please check mic/camera permissions and network.")
          }
        },
      })
    } catch (e: any) {
      setError(e?.message || "Failed to start video call")
    }
  }

  const cleanupMic = () => {
    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop())
      } catch {}
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
      return true
    } catch (err: any) {
      const name = err?.name || "Error"
      if (name === "NotAllowedError") setTranscriptCaptureError("Microphone permission denied")
      else if (name === "NotFoundError") setTranscriptCaptureError("No microphone device found")
      else if (name === "NotReadableError") setTranscriptCaptureError("Microphone is in use by another app")
      else setTranscriptCaptureError("Unable to start microphone")
      return false
    }
  }

  const enterFullscreen = async () => {
    try {
      if (!screenRef.current) return
      if (document.fullscreenElement) return
      await screenRef.current.requestFullscreen()
    } catch {}
  }

  const leaveMeeting = async () => {
    manualExitRef.current = true
    try {
      await stopRecording()
    } catch {}
    cleanupCall()
    try {
      socketRef.current?.emit("gd:leave", { roomId }, () => {})
    } catch {}
    router.push("/explore/gd")
  }

  const endMeeting = async () => {
    if (!socketRef.current) return
    manualExitRef.current = true
    try {
      await stopRecording()
    } catch {}
    cleanupCall()
    socketRef.current.emit("gd:end", { roomId }, () => {
      router.push(`/explore/gd/room/${roomId}/analysis`)
    })
  }

  const startRecognition = async (): Promise<boolean> => {
    try {
      if (recognitionRef.current) return
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        setSpeechSupported(false)
        setTranscriptCaptureError("Live transcript is not supported in this browser (use Chrome).")
        return false
      }

      const micOk = await openMic()
      if (!micOk) return false

      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = "en-US"

      rec.onresult = (event: any) => {
        try {
          let finals: string[] = []
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i]
            const text = String(res?.[0]?.transcript || "").trim()
            if (!text) continue
            if (res.isFinal) finals.push(text)
          }
          if (!finals.length) return
          const chunk = finals.join(" ")
          socketRef.current?.emit("gd:transcript:chunk", { roomId, text: chunk })
        } catch {}
      }

      rec.onerror = (event: any) => {
        const err = String(event?.error || "").toLowerCase()
        if (err === "not-allowed" || err === "service-not-allowed") {
          setTranscriptCaptureError("Microphone permission is blocked. Allow mic access and click Enable Transcript again.")
          setTranscriptCaptureOn(false)
          stopRecognition()
          cleanupMic()
          return
        }
        if (err === "audio-capture") {
          setTranscriptCaptureError("No microphone found or microphone is unavailable.")
          return
        }
        if (err === "network") {
          setTranscriptCaptureError("Speech recognition network error. Check internet and try again.")
          return
        }
      }

      rec.onend = () => {
        // Auto-restart if we are still in active state
        try {
          if (room?.status === "active" && transcriptCaptureOn) {
            setTimeout(() => {
              try {
                rec.start()
              } catch {}
            }, 250)
          }
        } catch {}
      }

      recognitionRef.current = rec
      rec.start()
      setTranscriptCaptureError(null)
      setSpeechSupported(true)
      return true
    } catch {
      setTranscriptCaptureError("Click Enable Transcript to start live captions.")
      return false
    }
  }

  const stopRecognition = () => {
    try {
      recognitionRef.current?.stop?.()
    } catch {}
    recognitionRef.current = null
  }

  const enableTranscriptCapture = async () => {
    setTranscriptCaptureError(null)
    setTranscriptCaptureOn(true)
    const ok = await startRecognition()
    if (!ok) {
      setTranscriptCaptureOn(false)
    }
  }

  const disableTranscriptCapture = () => {
    setTranscriptCaptureOn(false)
    stopRecognition()
    cleanupMic()
  }

  useEffect(() => {
    if (!token) {
      router.replace("/login")
      return
    }
    if (!roomId) return

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })
    socketRef.current = socket

    socket.on("connect_error", (e: any) => {
      setError(`${e?.message || "Connection failed"} (server: ${API_BASE_URL})`)
    })

    socket.on("gd:room", (data: GdRoom) => {
      setRoom(data)
      if (data.status === "active") {
        hasBeenActiveRef.current = true
        setError(null)

        // During the 1-minute preparation phase, startedAt can be null.
        // Show full duration until the server starts the real timer broadcast.
        if (!data.startedAt && typeof data.durationSeconds === "number") {
          setRemainingSeconds(data.durationSeconds)
          router.replace(`/explore/gd/room/${roomId}/prep`)
          return
        }
      }
      if (data.status === "waiting" && !hasBeenActiveRef.current) {
        setError("Waiting for host to start...")
      } else if (data.status === "active" && !recognitionRef.current) {
        // Room became active while connected – start local speech recognition for this user
        try {
          startRecognition()
        } catch {}
      }

      if (data.status === "completed") {
        router.replace(`/explore/gd/room/${roomId}/analysis`)
      }
    })

    socket.on("gd:timer", (data: { remainingSeconds: number }) => {
      setRemainingSeconds(data.remainingSeconds)
    })

    socket.on(
      "gd:transcript:chunk",
      (payload: { roomId: string; userId: string; name: string; text: string; createdAt: string | Date }) => {
        try {
          if (!payload?.text) return
          if (String(payload.roomId || "").trim().toUpperCase() !== roomId) return

          const createdAt = new Date(payload.createdAt as any).toISOString()
          const entry: GdTranscriptEntry = {
            userId: String(payload.userId || ""),
            name: String(payload.name || ""),
            text: String(payload.text || ""),
            createdAt,
          }

          setCombinedTranscript((prev) => {
            const key = `${entry.userId}|${entry.createdAt}|${entry.text}`
            const exists = prev.some((e) => `${e.userId}|${e.createdAt}|${e.text}` === key)
            if (exists) return prev
            return [...prev, entry]
          })

          setPerUserTranscript((prev) => {
            const idx = prev.findIndex((u) => String(u.userId) === String(entry.userId))
            if (idx === -1) {
              return [...prev, { userId: entry.userId, name: entry.name, entries: [{ text: entry.text, createdAt }] }]
            }
            const clone = [...prev]
            const existingUser = clone[idx]
            const entryKey = `${createdAt}|${entry.text}`
            const already = existingUser.entries.some((e) => `${e.createdAt}|${e.text}` === entryKey)
            if (!already) {
              clone[idx] = { ...existingUser, entries: [...existingUser.entries, { text: entry.text, createdAt }] }
            }
            return clone
          })
        } catch {}
      },
    )

    socket.on("gd:ended", () => {
      cleanupCall()
      router.replace("/explore/gd")
    })

    socket.emit("gd:join", { roomId }, (res: any) => {
      if (!res?.ok) {
        setError(res?.error || "Failed to join room")
        setLoading(false)
        return
      }
      setRoom(res.room)
      setLoading(false)
      if (res.room?.status === "active" && transcriptCaptureOn && !recognitionRef.current) {
        startRecognition().then((ok) => {
          if (!ok) setTranscriptCaptureOn(false)
        })
      }
    })

    socket.emit("gd:get", { roomId }, (res: any) => {
      if (res?.ok) {
        setRoom(res.room)
        setRemainingSeconds(res.remainingSeconds ?? 0)
      }
    })

    return () => {
      try {
        socket.disconnect()
      } catch {}
      socketRef.current = null
      stopRecognition()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, token])

  // Fallback polling (helps when Socket.IO is blocked on some networks/devices)
  useEffect(() => {
    if (!token || !roomId) return
    let stopped = false

    const tick = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/gd/rooms/${encodeURIComponent(roomId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) return
        if (stopped) return

        const rawRoom = data?.room
        if (rawRoom) {
          setRoom((prev) => ({
            ...(prev || {}),
            ...rawRoom,
            participants: Array.isArray(rawRoom.participants)
              ? rawRoom.participants.map((p: any) => ({ userId: String(p.user || p.userId || ""), name: String(p.name || "") }))
              : [],
          }))
        }
        if (typeof data?.remainingSeconds === "number") {
          setRemainingSeconds(data.remainingSeconds)
        }

        const status = rawRoom?.status
        if (status === "active") {
          hasBeenActiveRef.current = true
          setError(null)
        }
        if (status === "completed") {
          router.replace(`/explore/gd/room/${roomId}/analysis`)
        }
        if (status === "waiting" && !hasBeenActiveRef.current) {
          setError("Waiting for host to start...")
        }
      } catch {}
    }

    tick()
    const interval = setInterval(tick, 2000)
    return () => {
      stopped = true
      clearInterval(interval)
    }
  }, [roomId, token, router])

  useEffect(() => {
    if (!loading && room?.status === "active" && room?.startedAt) {
      loadZego()
      if (transcriptCaptureOn && !recognitionRef.current) {
        startRecognition().then((ok) => {
          if (!ok) setTranscriptCaptureOn(false)
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, room?.status, room?.startedAt])

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener("fullscreenchange", onFsChange)
    return () => document.removeEventListener("fullscreenchange", onFsChange)
  }, [])

  useEffect(() => {
    return () => {
      try {
        const p = stopRecording()
        if (p) p.catch(() => {})
        cleanupCall()
      } catch {}
    }
  }, [])

  const loadTranscripts = async () => {
    if (!token || !roomId) return
    try {
      setTranscriptLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/gd/rooms/${encodeURIComponent(roomId)}/transcript`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        setTranscriptLoading(false)
        return
      }
      const data: {
        entries: GdTranscriptEntry[]
        perUser: GdTranscriptPerUser[]
      } = await res.json()
      setCombinedTranscript(data.entries || [])
      setPerUserTranscript(data.perUser || [])
      setTranscriptLoading(false)
    } catch {
      setTranscriptLoading(false)
    }
  }

  const isHost = Boolean(user && room && String(user.id) === String(room.hostUserId))

  return (
    <>
      <div ref={screenRef} className="fixed inset-0 bg-black">
        <div className="absolute inset-0">
          <div ref={containerRef} className="w-full h-full" />
        </div>

        <div className="absolute top-0 left-0 right-0 z-50 p-4">
          <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-lg px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-white font-extrabold truncate">{room?.roomName || "GD Room"}</p>
                <p className="text-white/70 text-xs truncate">
                  {roomId}
                  {room?.topic ? ` • ${room.topic}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-center">
                  <p className="text-white text-2xl font-black leading-none">{formatTime(remainingSeconds)}</p>
                  <p className="text-white/60 text-[10px] font-semibold mt-1">TIME LEFT</p>
                </div>

                <Button
                  variant="outline"
                  className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20"
                  onClick={enterFullscreen}
                  disabled={isFullscreen}
                >
                  <Expand className="h-4 w-4 mr-2" />
                  Fullscreen
                </Button>

                <Button
                  variant="outline"
                  className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20"
                  onClick={async () => {
                    setIsTranscriptsOpen(true)
                    await loadTranscripts()
                  }}
                  disabled={transcriptLoading}
                >
                  <MessageSquareText className="h-4 w-4 mr-2" />
                  Transcripts
                </Button>

                {!isRecording ? (
                  <Button
                    variant="outline"
                    className="rounded-xl border-red-500/40 bg-white/10 text-white hover:bg-white/20"
                    onClick={startRecording}
                    disabled={isRecordingStopping}
                  >
                    <Circle className="h-4 w-4 mr-2 fill-red-500 text-red-500" />
                    Record
                  </Button>
                ) : (
                  <Button className="rounded-xl bg-red-600 hover:bg-red-700" onClick={() => stopRecording()} disabled={isRecordingStopping}>
                    <Square className="h-4 w-4 mr-2 fill-white text-white" />
                    Stop
                  </Button>
                )}

                {transcriptCaptureOn ? (
                  <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={disableTranscriptCapture}>
                    Transcript On
                  </Button>
                ) : (
                  <Button className="rounded-xl bg-amber-500 hover:bg-amber-600" onClick={enableTranscriptCapture}>
                    Enable Transcript
                  </Button>
                )}

                {!isHost && (
                  <Button className="rounded-xl bg-red-600 hover:bg-red-700" onClick={leaveMeeting}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Leave
                  </Button>
                )}

                {isHost && (
                  <Button className="rounded-xl bg-red-700 hover:bg-red-800" onClick={endMeeting}>
                    End Meeting
                  </Button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">
              {error}
            </div>
          )}

          {(transcriptCaptureError || !speechSupported) && (
            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200">
              {speechSupported ? transcriptCaptureError : "Live transcript is not supported in this browser (use Chrome)."}
            </div>
          )}

          {recordingError && (
            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">
              {recordingError}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={isTranscriptsOpen}
        onOpenChange={(v) => {
          setIsTranscriptsOpen(v)
          if (v) loadTranscripts()
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>GD Transcripts</DialogTitle>
          </DialogHeader>
          {transcriptLoading ? (
            <p className="text-sm text-muted-foreground">Loading transcripts...</p>
          ) : !combinedTranscript.length ? (
            <p className="text-sm text-muted-foreground">No transcript captured yet for this room.</p>
          ) : (
            <Tabs defaultValue="combined" className="mt-4">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="combined">Combined conversation</TabsTrigger>
                <TabsTrigger value="per-user">By participant</TabsTrigger>
              </TabsList>

              <TabsContent value="combined" className="mt-4 max-h-80 overflow-y-auto rounded-lg border bg-muted/40 p-3 text-sm space-y-2">
                {combinedTranscript.map((entry, idx) => (
                  <div key={`${entry.createdAt}-${idx}`} className="flex gap-2">
                    <span className="font-semibold text-foreground min-w-[120px] truncate">{entry.name}:</span>
                    <span className="text-muted-foreground break-words">{entry.text}</span>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="per-user" className="mt-4 max-h-80 overflow-y-auto">
                {!perUserTranscript.length ? (
                  <p className="text-sm text-muted-foreground">No participant transcripts available.</p>
                ) : (
                  <div className="space-y-4">
                    {perUserTranscript.map((user) => (
                      <div key={user.userId} className="rounded-lg border bg-muted/40 p-3">
                        <p className="font-semibold text-foreground mb-2">{user.name}</p>
                        {user.entries.length ? (
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {user.entries.map((e, idx) => (
                              <li key={`${e.createdAt}-${idx}`} className="break-words">
                                {e.text}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No transcript for this participant.</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isNotesOpen}
        onOpenChange={(v) => {
          setIsNotesOpen(v)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Your Notes</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a quick note..."
                className="flex-1 h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
              />
              <Button
                className="h-9"
                onClick={() => {
                  const t = newNote.trim()
                  if (!t) return
                  const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  const entry = `• [${stamp}] ${t}`
                  setNotesText((prev) => (prev.trim() ? `${prev.trim()}\n${entry}\n` : `${entry}\n`))
                  setNewNote("")
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs font-semibold text-muted-foreground">Saved notes (only visible to you)</p>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Write points you want to remember during the GD..."
                className="mt-2 w-full min-h-64 rounded-md border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
              />
              <p className="mt-2 text-xs text-muted-foreground">Auto-saved on this device for this room.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
