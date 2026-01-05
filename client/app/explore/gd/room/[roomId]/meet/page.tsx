"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { Expand, LogOut, MessageSquareText } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

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

  const [room, setRoom] = useState<GdRoom | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isTranscriptsOpen, setIsTranscriptsOpen] = useState(false)
  const [transcriptLoading, setTranscriptLoading] = useState(false)
  const [combinedTranscript, setCombinedTranscript] = useState<GdTranscriptEntry[]>([])
  const [perUserTranscript, setPerUserTranscript] = useState<GdTranscriptPerUser[]>([])

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
          router.push("/")
        },
      })
    } catch (e: any) {
      setError(e?.message || "Failed to start video call")
    }
  }

  const enterFullscreen = async () => {
    try {
      if (!screenRef.current) return
      if (document.fullscreenElement) return
      await screenRef.current.requestFullscreen()
    } catch {}
  }

  const leaveMeeting = () => {
    router.push(`/explore/gd/room/${roomId}/waiting`)
  }

  useEffect(() => {
    if (!token) {
      router.replace("/login")
      return
    }
    if (!roomId) return

    const socket = io(API_BASE_URL, { auth: { token } })
    socketRef.current = socket

    socket.on("connect_error", (e: any) => {
      setError(e?.message || "Connection failed")
    })

    socket.on("gd:room", (data: GdRoom) => {
      setRoom(data)
      if (data.status === "waiting") {
        router.replace(`/explore/gd/room/${data.roomId}/waiting`)
      } else if (data.status === "active" && !recognitionRef.current) {
        // Room became active while connected – start local speech recognition for this user
        try {
          startRecognition()
        } catch {}
      }
    })

    socket.on("gd:timer", (data: { remainingSeconds: number }) => {
      setRemainingSeconds(data.remainingSeconds)
    })

    socket.on("gd:ended", () => {
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
      if (res.room?.status === "active" && !recognitionRef.current) {
        try {
          startRecognition()
        } catch {}
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

  useEffect(() => {
    if (!loading && room?.status === "active") {
      loadZego()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, room?.status])

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
        zegoRef.current?.destroy?.()
      } catch {}
      zegoRef.current = null
      stopRecognition()
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
                className="rounded-xl bg-red-600 hover:bg-red-700"
                onClick={leaveMeeting}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Leave
              </Button>
            </div>
          </div>

            {error && (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isTranscriptsOpen} onOpenChange={setIsTranscriptsOpen}>
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
    </>
  )
}
