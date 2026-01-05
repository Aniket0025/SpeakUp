"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Copy, Users } from "lucide-react"
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

export default function GDWaitingPage() {
  const params = useParams<{ roomId?: string }>()
  const roomId = useMemo(() => String(params?.roomId || "").trim().toUpperCase(), [params?.roomId])
  const router = useRouter()
  const { token, user } = useAuth()

  const socketRef = useRef<Socket | null>(null)
  const [room, setRoom] = useState<GdRoom | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const isHost = room && user?.id ? String(room.hostUserId) === String(user.id) : false

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const connect = async () => {
    if (!token) {
      setError("Please log in to join this room")
      return
    }

    const socket = io(API_BASE_URL, { auth: { token } })
    socketRef.current = socket

    socket.on("connect_error", (e: any) => {
      setError(e?.message || "Connection failed")
    })

    socket.on("gd:room", (data: GdRoom) => {
      setRoom(data)
      if (data.status === "active") {
        router.replace(`/explore/gd/room/${data.roomId}/meet`)
      }
    })

    socket.on("gd:timer", (data: { remainingSeconds: number }) => {
      setRemainingSeconds(data.remainingSeconds)
    })

    socket.on("gd:started", (data: { roomId: string }) => {
      router.replace(`/explore/gd/room/${data.roomId}/meet`)
    })

    socket.emit("gd:join", { roomId }, (res: any) => {
      if (!res?.ok) {
        setError(res?.error || "Failed to join room")
        return
      }
      setRoom(res.room)
    })

    socket.emit("gd:get", { roomId }, (res: any) => {
      if (res?.ok) {
        setRoom(res.room)
        setRemainingSeconds(res.remainingSeconds ?? 0)
      }
    })
  }

  useEffect(() => {
    if (!roomId) return
    connect()
    return () => {
      try {
        socketRef.current?.emit("gd:leave", { roomId })
      } catch {}
      try {
        socketRef.current?.disconnect()
      } catch {}
      socketRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, token])

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId)
    } catch {}
  }

  const startRoom = () => {
    if (!socketRef.current) return
    socketRef.current.emit("gd:start", { roomId }, (res: any) => {
      if (!res?.ok) {
        setError(res?.error || "Failed to start")
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#f7f9fd]">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white border border-gray-100 shadow-lg rounded-3xl p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Waiting Room</h1>
              <p className="text-gray-500 text-sm mt-1">Room will start when host clicks Start</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Room Code</p>
              <div className="flex items-center justify-end gap-2">
                <p className="text-lg font-black tracking-wider text-violet-600">{roomId}</p>
                <button onClick={copyRoomId} className="p-2 rounded-lg hover:bg-gray-50">
                  <Copy className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {error && <div className="mt-4 text-sm text-red-600 font-medium">{error}</div>}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <div className="flex items-center gap-2 text-gray-700 font-semibold">
                <Users className="h-4 w-4" /> Participants
              </div>
              <div className="mt-3 space-y-2">
                {(room?.participants || []).map((p) => (
                  <div key={p.userId} className="flex items-center justify-between rounded-xl bg-white p-3 border border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                    {room?.hostUserId === p.userId && <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">Host</span>}
                  </div>
                ))}
                {!room?.participants?.length && <p className="text-sm text-gray-500">Connecting...</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-800">Topic</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{room?.topic || "—"}</p>
              <p className="text-sm text-gray-500 mt-4">Duration</p>
              <p className="text-2xl font-black text-gray-900">{formatTime(room?.durationSeconds || 0)}</p>
              {room?.status === "active" && (
                <p className="text-sm text-gray-500 mt-3">
                  Time remaining: <span className="font-bold text-gray-800">{formatTime(remainingSeconds)}</span>
                </p>
              )}

              <div className="mt-6">
                <Button
                  onClick={startRoom}
                  disabled={!isHost || !room || room.participants.length < 2}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600"
                >
                  Start GD
                </Button>
                {!isHost && <p className="text-xs text-gray-500 mt-2">Only host can start the room.</p>}
                {isHost && room && room.participants.length < 2 && (
                  <p className="text-xs text-gray-500 mt-2">Wait for at least 1 more participant to join.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
