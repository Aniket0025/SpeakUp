"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { ArrowLeft, Bell, Menu, MessageCircle, Send, Sparkles, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

const navItems = [
  { name: "Dashboard", href: "/" },
  { name: "Explore", href: "/explore" },
  { name: "Progress", href: "/progress" },
  { name: "Leaderboard", href: "/leaderboard" },
]

const friends = [
  {
    id: 1,
    name: "Chaitanya Uthale",
    email: "itcracker4@gmail.com",
    avatar: "/avatar-1.png",
    initial: "C",
    status: "online",
  },
  { id: 2, name: "Sunny", email: "sunny@gmail.com", avatar: "/avatar-2.png", initial: "S", status: "offline" },
  { id: 3, name: "Creator", email: "creator756@gmail.com", avatar: "/avatar-3.png", initial: "C", status: "online" },
]

const notifications = [
  { id: 1, title: "New Tournament!", description: "Join the National GD Championship.", time: "2m ago", unread: true },
  { id: 2, title: "XP Earned", description: "You earned 50 XP in Extempore.", time: "1h ago", unread: true },
  { id: 3, title: "Friend Request", description: "Sunny sent you a friend request.", time: "5h ago", unread: false },
]

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeChat, setActiveChat] = useState<(typeof friends)[0] | null>(null)
  const [message, setMessage] = useState("")
  const { user, logout, loading } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-pink-500">
            <span className="text-xl">🎙️</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            SpeakUp
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                pathname === item.href
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {!loading && !user ? (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" className="rounded-full font-bold text-gray-600">
                <Link href="/login">Log In</Link>
              </Button>
              <Button
                asChild
                className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 font-bold shadow-lg shadow-violet-500/20"
              >
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* XP Badge */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-black shadow-lg shadow-orange-500/30">
                <Sparkles className="h-4 w-4 fill-white" />
                <span>Level 1 • 0 XP</span>
              </div>

              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-gray-100 group">
                    <Bell className="h-5 w-5 text-gray-500 transition-colors group-hover:text-gray-900" />
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                      8
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0 rounded-3xl overflow-hidden shadow-2xl border-gray-100">
                  <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white">
                    <h3 className="font-bold text-gray-900">Notifications</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-indigo-600 font-bold hover:text-indigo-700 hover:bg-indigo-50"
                    >
                      Mark all read
                    </Button>
                  </div>
                  <ScrollArea className="h-80">
                    <div className="flex flex-col">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            "p-4 border-b border-gray-50 transition-colors hover:bg-gray-50 flex gap-3",
                            n.unread && "bg-indigo-50/30",
                          )}
                        >
                          <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Sparkles className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-sm font-bold text-gray-900 truncate">{n.title}</p>
                              <span className="text-[10px] text-gray-400 font-medium shrink-0">{n.time}</span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{n.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-3 text-center border-t border-gray-50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs font-bold text-gray-500 hover:text-indigo-600"
                    >
                      View all notifications
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Messages */}
              <Popover onOpenChange={(open) => !open && setActiveChat(null)}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-gray-100 group">
                    <MessageCircle className="h-5 w-5 text-gray-500 transition-colors group-hover:text-gray-900" />
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                      1
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0 rounded-3xl overflow-hidden shadow-2xl border-gray-100">
                  {!activeChat ? (
                    <>
                      <div className="p-4 border-b border-gray-50 bg-white">
                        <h3 className="font-bold text-gray-900">Messages</h3>
                      </div>
                      <ScrollArea className="h-80">
                        <div className="flex flex-col">
                          {friends.map((friend) => (
                            <button
                              key={friend.id}
                              onClick={() => setActiveChat(friend)}
                              className="p-4 border-b border-gray-50 transition-colors hover:bg-gray-50 flex gap-3 text-left w-full group"
                            >
                              <div className="relative">
                                <Avatar className="h-11 w-11 rounded-xl shadow-sm border border-gray-100">
                                  <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold">
                                    {friend.initial}
                                  </AvatarFallback>
                                </Avatar>
                                {friend.status === "online" && (
                                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                  {friend.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                  Hey, let's practice for the technical interview later!
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </>
                  ) : (
                    <div className="flex flex-col h-[400px]">
                      <div className="p-3 border-b border-gray-50 flex items-center gap-3 bg-white">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => setActiveChat(null)}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarFallback className="bg-indigo-50 text-indigo-600 text-xs font-bold">
                            {activeChat.initial}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{activeChat.name}</p>
                          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                            {activeChat.status}
                          </p>
                        </div>
                      </div>
                      <ScrollArea className="flex-1 p-4 bg-gray-50/30">
                        <div className="space-y-4">
                          <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm max-w-[85%]">
                            <p className="text-xs text-gray-600 leading-relaxed">
                              Hey Aniket! Are you free for a Mock Interview session today?
                            </p>
                            <span className="text-[9px] text-gray-400 mt-1 block">10:45 AM</span>
                          </div>
                          <div className="bg-indigo-600 p-3 rounded-2xl rounded-tr-none shadow-md shadow-indigo-600/20 max-w-[85%] ml-auto">
                            <p className="text-xs text-white leading-relaxed font-medium">
                              Yeah, sounds great! How about 4 PM?
                            </p>
                            <span className="text-[9px] text-indigo-100/70 mt-1 block text-right">10:47 AM</span>
                          </div>
                        </div>
                      </ScrollArea>
                      <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                        <input
                          className="flex-1 bg-gray-100 border-0 rounded-xl px-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                          placeholder="Type a message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                        />
                        <Button
                          size="icon"
                          className="h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10 border-2 border-violet-200">
                      <AvatarImage src="/diverse-avatars.png" />
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-500 text-white">
                        {user?.fullName?.[0] || "A"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-gray-100 shadow-xl">
                  <div className="px-2 py-2 mb-2">
                    <p className="text-sm font-bold text-gray-900">{user?.fullName || "Aniket Yadav"}</p>
                    <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuItem asChild className="rounded-xl font-medium cursor-pointer">
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl font-medium cursor-pointer">
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="rounded-xl font-bold text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-white p-4">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  pathname === item.href
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                    : "text-gray-600 hover:bg-gray-100",
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
