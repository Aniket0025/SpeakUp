"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Expand, LogOut } from "lucide-react"
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

export default function GDMeetPage() {
  const params = useParams<{ roomId?: string }>()
  const roomId = useMemo(() => String(params?.roomId || "").trim().toUpperCase(), [params?.roomId])
  const router = useRouter()
  const { token } = useAuth()

  const socketRef = useRef<Socket | null>(null)
  const screenRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const zegoRef = useRef<any>(null)

  const [room, setRoom] = useState<GdRoom | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

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
            url: `${window.location.protocol}//${window.location.host}/explore/gd/room/${roomId}/waiting`,
          },
        ],
        scenario: {
          mode: ZegoUIKitPrebuilt.GroupCall,
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
      }
    })

    socket.on("gd:timer", (data: { remainingSeconds: number }) => {
      setRemainingSeconds(data.remainingSeconds)
    })

    socket.on("gd:ended", () => {
      setError("GD ended")
    })

    socket.emit("gd:join", { roomId }, (res: any) => {
      if (!res?.ok) {
        setError(res?.error || "Failed to join room")
        setLoading(false)
        return
      }
      setRoom(res.room)
      setLoading(false)
    })

    socket.emit("gd:get", { roomId }, (res: any) => {
      if (res?.ok) {
        setRoom(res.room)
        setRemainingSeconds(res.remainingSeconds ?? 0)
      }
    })

    return () => {
      try {
        socket.emit("gd:leave", { roomId })
      } catch {}
      try {
        socket.disconnect()
      } catch {}
      socketRef.current = null
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
    }
  }, [])

  return (
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
  )
}
