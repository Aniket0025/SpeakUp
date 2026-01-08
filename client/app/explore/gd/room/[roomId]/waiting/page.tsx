"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Copy, Users } from "lucide-react"
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
  mode?: "custom" | "global"
  maxParticipants: number
  hostUserId: string | null
  status: "waiting" | "active" | "completed"
  createdAt: number
  startedAt: number | null
  durationSeconds: number
  countdownStartedAt?: number | null
  countdownSeconds?: number
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
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null)
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
      if (data.mode === "global" && data.status === "waiting" && data.countdownStartedAt) {
        const total = Number(data.countdownSeconds || 10)
        const elapsed = Math.floor((Date.now() - Number(data.countdownStartedAt)) / 1000)
        setCountdownRemaining(Math.max(0, total - elapsed))
      } else {
        setCountdownRemaining(null)
      }
      if (data.status === "active") {
        if (data.startedAt) {
          router.replace(`/explore/gd/room/${data.roomId}/meet`)
        } else {
          router.replace(`/explore/gd/room/${data.roomId}/prep`)
        }
      }
    })

    socket.on("gd:timer", (data: { remainingSeconds: number }) => {
      setRemainingSeconds(data.remainingSeconds)
    })

    socket.on("gd:started", (data: { roomId: string }) => {
      router.replace(`/explore/gd/room/${data.roomId}/prep`)
    })

    socket.on("gd:countdown", (data: { remainingSeconds: number }) => {
      setCountdownRemaining(data.remainingSeconds)
    })

    socket.on("gd:ended", () => {
      router.replace(`/explore/gd/room/${roomId}/analysis`)
    })

    socket.emit("gd:join", { roomId }, (res: any) => {
      if (!res?.ok) {
        setError(res?.error || "Failed to join room")
        return
      }
      setRoom(res.room)
      if (res?.room?.status === "active") {
        router.replace(`/explore/gd/room/${roomId}/prep`)
      }
    })

    socket.emit("gd:get", { roomId }, (res: any) => {
      if (res?.ok) {
        setRoom(res.room)
        setRemainingSeconds(res.remainingSeconds ?? 0)
        if (res?.room?.status === "active") {
          router.replace(`/explore/gd/room/${roomId}/prep`)
        }
      }
    })
  }

  useEffect(() => {
    if (!roomId) return
    connect()
    return () => {
      try {
        socketRef.current?.disconnect()
      } catch {}
      socketRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, token])

  // Single source of truth redirect: whenever room becomes active/completed, route accordingly.
  useEffect(() => {
    if (!room) return
    if (room.status === "active") {
      if (room.startedAt) {
        router.replace(`/explore/gd/room/${roomId}/meet`)
      } else {
        router.replace(`/explore/gd/room/${roomId}/prep`)
      }
    }
    if (room.status === "completed") {
      router.replace(`/explore/gd/room/${roomId}/analysis`)
    }
  }, [room, roomId, router])

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
        if (!res.ok) {
          const msg = data?.message || `Failed to fetch room (${res.status})`
          setError(`${msg} (server: ${API_BASE_URL})`)
          return
        }
        if (stopped) return

        const rawRoom = data?.room
        const nextRoom = rawRoom
          ? {
              ...rawRoom,
              // Normalize API response (Mongo) to match UI shape
              participants: Array.isArray(rawRoom.participants)
                ? rawRoom.participants.map((p: any) => ({ userId: String(p.user || p.userId || ""), name: String(p.name || "") }))
                : [],
            }
          : null
        if (nextRoom) {
          setRoom(nextRoom)
        }
      } catch {
        setError(`Cannot reach server (${API_BASE_URL}). Check WiFi/LAN IP and Windows firewall for port 5000.`)
      }
    }

    tick()
    const interval = setInterval(tick, 2000)
    return () => {
      stopped = true
      clearInterval(interval)
    }
  }, [roomId, token, router])

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

  const isGlobal = room?.mode === "global"
  const capacityText = room ? `${room.participants.length}/${room.maxParticipants}` : ""

  const leaveRoom = () => {
    try {
      socketRef.current?.emit("gd:leave", { roomId }, () => {})
    } catch {}
    router.push("/explore/gd")
  }

  const endRoom = () => {
    if (!isHost || !socketRef.current) return
    socketRef.current.emit("gd:end", { roomId }, (res: any) => {
      // Regardless of ack, route back; server will emit gd:ended to others
      router.push(`/explore/gd/room/${roomId}/analysis`)
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
              <p className="text-gray-500 text-sm mt-1">
                {isGlobal ? "Match will start automatically when room is full" : "Room will start when host clicks Start"}
              </p>
            </div>
            {!isGlobal && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Room Code</p>
                <div className="flex items-center justify-end gap-2">
                  <p className="text-lg font-black tracking-wider text-violet-600">{roomId}</p>
                  <button onClick={copyRoomId} className="p-2 rounded-lg hover:bg-gray-50">
                    <Copy className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
            )}
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

              {room && (
                <p className="text-sm text-gray-500 mt-4">
                  Capacity: <span className="font-bold text-gray-800">{capacityText}</span>
                </p>
              )}

              {isGlobal && countdownRemaining !== null && (
                <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3">
                  <p className="text-xs font-bold text-violet-700">Starting in</p>
                  <p className="text-3xl font-black text-violet-700">{countdownRemaining}s</p>
                </div>
              )}

              <p className="text-sm text-gray-500 mt-4">Duration</p>
              <p className="text-2xl font-black text-gray-900">{formatTime(room?.durationSeconds || 0)}</p>
              {room?.status === "active" && (
                <p className="text-sm text-gray-500 mt-3">
                  Time remaining: <span className="font-bold text-gray-800">{formatTime(remainingSeconds)}</span>
                </p>
              )}

              <div className="mt-6">
                {!isGlobal && (
                  <>
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
                  </>
                )}

                {isGlobal && (
                  <p className="text-xs text-gray-500 mt-2">
                    Waiting for participants. When the room reaches {room?.maxParticipants || 6}, a 10 second countdown starts.
                  </p>
                )}

                {/* Exit / End controls */}
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  {!isHost && (
                    <Button variant="outline" onClick={leaveRoom} className="rounded-xl w-full sm:w-auto">Exit Room</Button>
                  )}
                  {isHost && (
                    <Button onClick={endRoom} className="rounded-xl bg-red-600 hover:bg-red-700 w-full sm:w-auto">End Room</Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
