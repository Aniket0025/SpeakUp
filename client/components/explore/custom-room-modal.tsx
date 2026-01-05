"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, ArrowRight, Check, Copy, Plus, Search, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { type FormEvent, useState } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

interface CustomRoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type View = "menu" | "create" | "browse" | "join"

export function CustomRoomModal({ open, onOpenChange }: CustomRoomModalProps) {
  const [currentView, setCurrentView] = useState<View>("menu")
  const [roomCode, setRoomCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const router = useRouter()
  const { token } = useAuth()

  // <CHANGE> Reset view when modal closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setCurrentView("menu")
      setRoomCode("")
      setJoinCode("")
      setError(null)
      setBusy(false)
    }
    onOpenChange(isOpen)
  }

  // <CHANGE> Function to copy room code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // <CHANGE> Function to create room
  const handleCreateRoom = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (!token) {
      setError("Please login to create a room")
      return
    }
    if (busy) return
    setBusy(true)

    const formData = new FormData(e.currentTarget)
    const roomName = String(formData.get("roomName") || "Custom GD Room")
    const topic = String(formData.get("topic") || "")
    const maxParticipants = Number(formData.get("participants") || 5)

    try {
      const res = await fetch(`${API_BASE_URL}/api/gd/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomName, topic, maxParticipants, durationSeconds: 10 * 60 }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.message || "Failed to create room")
        return
      }
      const id = String(data?.roomId || "").toUpperCase()
      setRoomCode(id)
      handleOpenChange(false)
      router.push(`/explore/gd/room/${id}/waiting`)
    } catch (err: any) {
      setError(err?.message || "Failed to create room")
    } finally {
      setBusy(false)
    }
  }

  // <CHANGE> Sample room data for browse view
  const availableRooms = [
    { id: 1, name: "Tech Discussion", host: "John Doe", participants: "3/5", topic: "AI Ethics" },
    { id: 2, name: "Current Affairs", host: "Jane Smith", participants: "2/4", topic: "Climate Change" },
    { id: 3, name: "Business Talk", host: "Mike Johnson", participants: "4/6", topic: "Startup Culture" },
  ]

  const renderMenu = () => (
    <div className="space-y-3 mt-4">
      {[
        {
          icon: Plus,
          title: "Create Room",
          description: "Host a new room and invite friends",
          gradient: "from-cyan-500 to-blue-600",
          onClick: () => setCurrentView("create"),
        },
        {
          icon: Search,
          title: "Browse Rooms",
          description: "Find and join available rooms",
          gradient: "from-violet-500 to-indigo-600",
          onClick: () => setCurrentView("browse"),
        },
        {
          icon: ArrowRight,
          title: "Join with Code",
          description: "Enter a room code to join directly",
          gradient: "from-pink-500 to-rose-500",
          onClick: () => setCurrentView("join"),
        },
      ].map((option, index) => (
        <button
          key={index}
          onClick={option.onClick}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r ${option.gradient} text-white hover:scale-[1.02] transition-transform duration-200`}
        >
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
            <option.icon className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h4 className="font-semibold">{option.title}</h4>
            <p className="text-sm text-white/80">{option.description}</p>
          </div>
        </button>
      ))}
    </div>
  )

  const renderCreateRoom = () => (
    <div className="mt-4">
      {!roomCode ? (
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomName" className="text-sm font-bold text-gray-600">
              Room Name
            </Label>
            <Input
              id="roomName"
              name="roomName"
              placeholder="Enter room name"
              required
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic" className="text-sm font-bold text-gray-600">
              Discussion Topic
            </Label>
            <Input id="topic" name="topic" placeholder="Enter topic" required className="h-12 rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="participants" className="text-sm font-bold text-gray-600">
              Max Participants
            </Label>
            <Input
              id="participants"
              name="participants"
              type="number"
              min="2"
              max="10"
              defaultValue="5"
              required
              className="h-12 rounded-xl"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentView("menu")}
              className="flex-1 h-12 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button type="submit" className="flex-1 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600">
              Create Room
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6 text-center py-4">
          <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 items-center justify-center mb-4">
            <Check className="h-10 w-10 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Room Created Successfully!</h3>
            <p className="text-gray-500 mb-6">Share this code with your friends to join</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-6 border-2 border-dashed border-gray-200">
            <p className="text-sm font-medium text-gray-500 mb-2">Room Code</p>
            <p className="text-4xl font-black text-violet-600 tracking-wider mb-4">{roomCode}</p>
            <Button
              onClick={handleCopyCode}
              variant="outline"
              className="w-full h-12 rounded-xl font-bold"
              disabled={copied}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </>
              )}
            </Button>
          </div>
          <Button onClick={() => handleOpenChange(false)} className="w-full h-12 rounded-xl">
            Done
          </Button>
        </div>
      )}
    </div>
  )

  const renderBrowseRooms = () => (
    <div className="mt-4 space-y-4">
      <Button variant="outline" onClick={() => setCurrentView("menu")} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {availableRooms.map((room) => (
          <div
            key={room.id}
            className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-bold text-gray-900">{room.name}</h4>
                <p className="text-sm text-gray-500">Hosted by {room.host}</p>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                <Users className="h-3.5 w-3.5" />
                {room.participants}
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium">Topic:</span> {room.topic}
            </p>
            <Button className="w-full h-10 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600">
              Join Room
            </Button>
          </div>
        ))}
      </div>
    </div>
  )

  const renderJoinWithCode = () => (
    <div className="mt-4">
      <Button variant="outline" onClick={() => setCurrentView("menu")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code" className="text-sm font-bold text-gray-600">
            Room Code
          </Label>
          <Input
            id="code"
            placeholder="Enter 6-digit code"
            maxLength={6}
            className="h-14 rounded-xl text-center text-2xl font-bold tracking-wider uppercase"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          />
        </div>
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        <Button
          disabled={!joinCode.trim() || !token || busy}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500"
          onClick={async () => {
            setError(null)
            if (!token) {
              setError("Please login to join a room")
              return
            }
            if (busy) return
            const id = joinCode.trim().toUpperCase()
            setBusy(true)
            try {
              const res = await fetch(`${API_BASE_URL}/api/gd/rooms/${encodeURIComponent(id)}/join`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              })
              const data = await res.json().catch(() => null)
              if (!res.ok) {
                setError(data?.message || "Failed to join room")
                return
              }
              handleOpenChange(false)
              router.push(`/explore/gd/room/${id}/waiting`)
            } catch (err: any) {
              setError(err?.message || "Failed to join room")
            } finally {
              setBusy(false)
            }
          }}
        >
          Join Room
        </Button>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {currentView === "menu" && "Custom Room"}
            {currentView === "create" && "Create New Room"}
            {currentView === "browse" && "Browse Rooms"}
            {currentView === "join" && "Join with Code"}
          </DialogTitle>
        </DialogHeader>

        {currentView === "menu" && renderMenu()}
        {currentView === "create" && renderCreateRoom()}
        {currentView === "browse" && renderBrowseRooms()}
        {currentView === "join" && renderJoinWithCode()}
      </DialogContent>
    </Dialog>
  )
}
