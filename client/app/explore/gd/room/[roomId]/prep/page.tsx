"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { SkipForward } from "lucide-react"
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
  prepStartedAt?: number | null
  prepSeconds?: number
  startedAt: number | null
  durationSeconds: number
  participants: Array<{ userId: string; name: string }>
}

export default function GDPrepPage() {
  const params = useParams<{ roomId?: string }>()
  const roomId = useMemo(() => String(params?.roomId || "").trim().toUpperCase(), [params?.roomId])
  const router = useRouter()
  const { token, user } = useAuth()

  const socketRef = useRef<Socket | null>(null)
  const manualNavRef = useRef(false)

  const [room, setRoom] = useState<GdRoom | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(60)
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  const notesDraftKey = useMemo(() => {
    const uid = user?.id ? String(user.id) : "anon"
    return `gd:notes:draft:${uid}:${roomId}`
  }, [roomId, user?.id])

  useEffect(() => {
    try {
      if (!roomId) return
      const saved = window.localStorage.getItem(notesDraftKey)
      if (saved !== null) setNotes(saved)
    } catch {}
  }, [notesDraftKey, roomId])

  useEffect(() => {
    try {
      if (!roomId) return
      window.localStorage.setItem(notesDraftKey, notes)
    } catch {}
  }, [notes, notesDraftKey, roomId])

  const goToMeet = () => {
    if (manualNavRef.current) return
    manualNavRef.current = true
    router.replace(`/explore/gd/room/${roomId}/meet`)
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

      if (data.status === "waiting") {
        router.replace(`/explore/gd/room/${roomId}/waiting`)
        return
      }

      if (data.status === "completed") {
        router.replace(`/explore/gd/room/${roomId}/analysis`)
        return
      }

      // If prep is already done, start meeting for everyone
      if (data.status === "active" && data.startedAt) {
        goToMeet()
        return
      }

      // Sync countdown from timestamps if available (useful immediately after join)
      const prepSeconds = Number((data as any)?.prepSeconds || 60)
      const prepStartedAt = (data as any)?.prepStartedAt ? Number((data as any).prepStartedAt) : null
      if (prepStartedAt) {
        const elapsed = Math.floor((Date.now() - prepStartedAt) / 1000)
        setRemainingSeconds(Math.max(0, prepSeconds - elapsed))
      } else {
        setRemainingSeconds(prepSeconds)
      }
    })

    socket.on("gd:prep", (data: { remainingSeconds: number }) => {
      setRemainingSeconds(Math.max(0, Number(data.remainingSeconds || 0)))
      if (Number(data.remainingSeconds || 0) <= 0) {
        goToMeet()
      }
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
    })

    socket.emit("gd:get", { roomId }, (res: any) => {
      if (res?.ok) {
        setRoom(res.room)
      }
    })

    return () => {
      try {
        socket.disconnect()
      } catch {}
      socketRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, token])

  const isHost = Boolean(user?.id && room?.hostUserId && String(user.id) === String(room.hostUserId))

  return (
    <div className="min-h-screen bg-[#f7f9fd]">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white border border-gray-100 shadow-lg rounded-3xl p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">1-Minute Preparation</h1>
              <p className="text-gray-500 text-sm mt-1">Use this time to quickly prepare your key points for the GD topic.</p>
            </div>

            <div className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 text-center">
              <p className="text-xs font-bold text-violet-700">Starting in</p>
              <p className="text-4xl font-black text-violet-700 leading-none">{remainingSeconds}s</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-800">GD Topic</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{room?.topic || "—"}</p>

              <p className="text-sm text-gray-500 mt-4">Room</p>
              <p className="text-sm font-semibold text-gray-800">{room?.roomName || "GD Room"}</p>

              <p className="text-xs text-gray-500 mt-4">Tip</p>
              <p className="text-sm text-gray-700">Plan: opening point, 2-3 strong arguments, and a short conclusion.</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-800">Your quick notes (optional)</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write bullet points you want to speak..."
                className="mt-3 w-full min-h-[160px] rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
              />
              <p className="text-xs text-gray-500 mt-2">Notes are only for you and are not shared.</p>
            </div>
          </div>

          {error && <div className="mt-4 text-sm text-red-600 font-medium">{error}</div>}

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
            {!isHost ? (
              <div className="text-sm text-gray-500 self-center">Waiting for host to start the meeting...</div>
            ) : (
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  if (!socketRef.current) return
                  socketRef.current.emit("gd:prep:skip", { roomId }, (res: any) => {
                    if (!res?.ok) {
                      setError(res?.error || "Failed to skip preparation")
                    }
                  })
                }}
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Skip Preparation & Start
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
