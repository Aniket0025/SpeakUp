"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Bell, User, Lock, Globe, Shield, CreditCard, Sun, Moon, Monitor } from "lucide-react"
// <CHANGE> Added useState import for tab state management
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "next-themes"
import { useRouter, useSearchParams } from "next/navigation"

// <CHANGE> Added type for tab names
type TabName = "profile" | "notifications" | "security" | "language" | "privacy" | "billing" | "appearance"

export default function SettingsPage() {
  // <CHANGE> Added state to track active tab
  const [activeTab, setActiveTab] = useState<TabName>("profile")
  const { user, updateUser } = useAuth()
  const { theme, setTheme, systemTheme } = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [bio, setBio] = useState("")

  useEffect(() => {
    const full = user?.fullName || ""
    const parts = full.split(" ")
    setFirstName(parts[0] || "")
    setLastName(parts.slice(1).join(" ") || "")
    setEmail(user?.email || "")
  }, [user])

  // Pick initial tab from query (?tab=...)
  useEffect(() => {
    const tabParam = (searchParams.get("tab") || "").toLowerCase()
    const validTabs: TabName[] = [
      "profile",
      "notifications",
      "security",
      "language",
      "privacy",
      "billing",
      "appearance",
    ]
    if (validTabs.includes(tabParam as TabName)) {
      setActiveTab(tabParam as TabName)
    }
  }, [searchParams])

  // <CHANGE> Sidebar tabs configuration
  const tabs = [
    { id: "profile" as TabName, icon: User, label: "Profile", color: "text-violet-600" },
    { id: "notifications" as TabName, icon: Bell, label: "Notifications", color: "text-muted-foreground" },
    { id: "security" as TabName, icon: Lock, label: "Security", color: "text-muted-foreground" },
    { id: "language" as TabName, icon: Globe, label: "Language", color: "text-muted-foreground" },
    { id: "privacy" as TabName, icon: Shield, label: "Privacy", color: "text-muted-foreground" },
    { id: "billing" as TabName, icon: CreditCard, label: "Billing", color: "text-muted-foreground" },
    { id: "appearance" as TabName, icon: Sun, label: "Appearance", color: "text-muted-foreground" },
  ]

  // <CHANGE> Function to render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <>
            <div className="bg-card rounded-[32px] p-8 shadow-sm border-2 border-border/60 hover:border-yellow-400/40 transition-colors">
              <h2 className="text-xl font-bold text-foreground mb-6">Profile Settings</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground ml-1">First Name</label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-12 rounded-xl bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground ml-1">Last Name</label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-12 rounded-xl bg-muted" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground ml-1">Email</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl bg-muted" />
                </div>
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-bold text-muted-foreground ml-1">Bio</label>
                  <textarea
                    className="w-full rounded-xl bg-muted border border-border p-3 h-24 text-sm focus:ring-1 focus:ring-violet-500 outline-none"
                    placeholder="Tell us about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => {
                    const fullName = `${firstName} ${lastName}`.trim()
                    updateUser({ fullName, email })
                  }}
                  className="w-full h-12 rounded-xl bg-violet-600 font-bold mt-4 shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5"
                >
                  Save Changes
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-[32px] p-8 shadow-sm border-2 border-border/60 hover:border-emerald-400/40 transition-colors">
              <h2 className="text-xl font-bold text-foreground mb-6">Preferences</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive alerts about your sessions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">Public Profile</p>
                    <p className="text-xs text-muted-foreground">Allow others to see your progress</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </>
        )

      case "notifications":
        return (
          <div className="bg-card rounded-[32px] p-8 shadow-sm border-2 border-border/60">
            <h2 className="text-xl font-bold text-foreground mb-6">Notification Preferences</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive email updates about your activity</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">Get push alerts on your device</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">Session Reminders</p>
                  <p className="text-xs text-muted-foreground">Remind me before scheduled sessions</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">Friend Requests</p>
                  <p className="text-xs text-muted-foreground">Notify when someone sends a friend request</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">Achievement Alerts</p>
                  <p className="text-xs text-muted-foreground">Get notified when you earn badges or level up</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">Tournament Updates</p>
                  <p className="text-xs text-muted-foreground">Receive updates about tournament registrations</p>
                </div>
                <Switch />
              </div>
              <Button className="w-full h-12 rounded-xl bg-violet-600 font-bold mt-4 shadow-lg shadow-violet-500/20">
                Save Preferences
              </Button>
            </div>
          </div>
        )

      case "appearance":
        return (
          <div className="bg-card rounded-[32px] p-8 shadow-sm border-2 border-border/60">
            <h2 className="text-xl font-bold text-foreground mb-6">Appearance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                className={`h-20 rounded-2xl font-bold flex items-center justify-center gap-2 ${theme === "light" ? "bg-violet-600 text-white" : ""}`}
                onClick={() => setTheme("light")}
              >
                <Sun className="h-5 w-5" /> Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                className={`h-20 rounded-2xl font-bold flex items-center justify-center gap-2 ${theme === "dark" ? "bg-violet-600 text-white" : ""}`}
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-5 w-5" /> Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                className={`h-20 rounded-2xl font-bold flex items-center justify-center gap-2 ${theme === "system" ? "bg-violet-600 text-white" : ""}`}
                onClick={() => setTheme("system")}
              >
                <Monitor className="h-5 w-5" /> System
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Current: {theme === "system" ? `System (${systemTheme || "light"})` : theme}</p>
          </div>
        )

      case "security":
        return (
          <div className="space-y-6">
            <div className="bg-card rounded-[32px] p-8 shadow-sm border-2 border-border/60">
              <h2 className="text-xl font-bold text-foreground mb-6">Change Password</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground ml-1">Current Password</label>
                  <Input type="password" placeholder="Enter current password" className="h-12 rounded-xl bg-muted" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground ml-1">New Password</label>
                  <Input type="password" placeholder="Enter new password" className="h-12 rounded-xl bg-muted" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground ml-1">Confirm New Password</label>
                  <Input type="password" placeholder="Confirm new password" className="h-12 rounded-xl bg-muted" />
                </div>
                <Button className="w-full h-12 rounded-xl bg-violet-600 font-bold mt-4 shadow-lg shadow-violet-500/20">
                  Update Password
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-[32px] p-8 shadow-sm border-2 border-border/60">
              <h2 className="text-xl font-bold text-foreground mb-6">Two-Factor Authentication</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">Enable 2FA</p>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Switch />
                </div>
                <Button variant="outline" className="w-full h-12 rounded-xl font-bold">
                  Configure 2FA
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-[32px] p-8 shadow-sm border-2 border-border/60">
              <h2 className="text-xl font-bold text-foreground mb-6">Active Sessions</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                  <div>
                    <p className="font-bold text-foreground">Windows - Chrome</p>
                    <p className="text-xs text-muted-foreground">Current session - Mumbai, India</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full">Active</span>
                </div>
                <Button variant="outline" className="w-full h-12 rounded-xl font-bold text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20">
                  Log Out All Other Sessions
                </Button>
              </div>
            </div>
          </div>
        )

      case "language":
        return (
          <div className="bg-card rounded-[32px] p-8 shadow-sm border-2 border-border/60">
            <h2 className="text-xl font-bold text-foreground mb-6">Language Settings</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">Display Language</label>
                <select className="w-full h-12 rounded-xl bg-muted border border-border px-4 font-medium focus:ring-1 focus:ring-violet-500 outline-none">
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>
              <div className="space-y-2 mt-6">
                <label className="text-sm font-bold text-muted-foreground ml-1">Time Zone</label>
                <select className="w-full h-12 rounded-xl bg-muted border border-border px-4 font-medium focus:ring-1 focus:ring-violet-500 outline-none">
                  <option value="ist">IST (Indian Standard Time)</option>
                  <option value="utc">UTC</option>
                  <option value="est">EST (Eastern Standard Time)</option>
                  <option value="pst">PST (Pacific Standard Time)</option>
                  <option value="cet">CET (Central European Time)</option>
                  <option value="jst">JST (Japan Standard Time)</option>
                </select>
              </div>
              <Button className="w-full h-12 rounded-xl bg-violet-600 font-bold mt-6 shadow-lg shadow-violet-500/20">
                Save Language Settings
              </Button>
            </div>
          </div>
        )

      case "privacy":
        return (
          <div className="space-y-6">
            <div className="bg-card rounded-[32px] p-8 shadow-sm border-2 border-border/60">
              <h2 className="text-xl font-bold text-foreground mb-6">Privacy Controls</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">Public Profile</p>
                    <p className="text-xs text-muted-foreground">Allow others to view your profile</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">Show Activity Status</p>
                    <p className="text-xs text-muted-foreground">Let others see when you are online</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">Show on Leaderboard</p>
                    <p className="text-xs text-muted-foreground">Display your rank on public leaderboards</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">Allow Friend Requests</p>
                    <p className="text-xs text-muted-foreground">Let others send you friend requests</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-[32px] p-8 shadow-sm border-2 border-border/60">
              <h2 className="text-xl font-bold text-foreground mb-6">Data & Analytics</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">Usage Analytics</p>
                    <p className="text-xs text-muted-foreground">Help us improve by sharing usage data</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">Performance Data</p>
                    <p className="text-xs text-muted-foreground">Share performance metrics for better insights</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button variant="outline" className="w-full h-12 rounded-xl font-bold mt-4">
                  Download My Data
                </Button>
                <Button variant="outline" className="w-full h-12 rounded-xl font-bold text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20">
                  Delete My Account
                </Button>
              </div>
            </div>
          </div>
        )

      case "billing":
        return (
          <div className="space-y-6">
            <div className="bg-card rounded-[32px] p-8 shadow-sm border-2 border-border/60">
              <h2 className="text-xl font-bold text-foreground mb-6">Current Plan</h2>
              <div className="p-6 bg-gradient-to-br from-yellow-500/10 to-emerald-500/10 rounded-2xl border-2 border-yellow-400/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-foreground">Free Plan</h3>
                    <p className="text-sm text-muted-foreground">Basic features for getting started</p>
                  </div>
                  <span className="text-3xl font-black text-yellow-500">$0</span>
                </div>
                <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold shadow-lg">
                  Upgrade to Pro
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-[32px] p-8 shadow-sm border-2 border-border/60">
              <h2 className="text-xl font-bold text-foreground mb-6">Payment Methods</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Visa ending in 4242</p>
                      <p className="text-xs text-muted-foreground">Expires 12/25</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-lg">
                    Remove
                  </Button>
                </div>
                <Button variant="outline" className="w-full h-12 rounded-xl font-bold">
                  Add Payment Method
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-[32px] p-8 shadow-sm border-2 border-border/60">
              <h2 className="text-xl font-bold text-foreground mb-6">Billing History</h2>
              <div className="space-y-3">
                {[
                  { date: "Jan 15, 2025", amount: "$0.00", status: "Free" },
                  { date: "Dec 15, 2024", amount: "$0.00", status: "Free" },
                  { date: "Nov 15, 2024", amount: "$0.00", status: "Free" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-xl">
                    <div>
                      <p className="font-bold text-foreground">{item.date}</p>
                      <p className="text-xs text-muted-foreground">{item.status} Plan</p>
                    </div>
                    <span className="font-bold text-foreground">{item.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-4xl font-black text-gray-900 mb-8">Settings</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* <CHANGE> Updated sidebar to be functional with click handlers */}
          <div className="space-y-2">
            {tabs.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  const params = new URLSearchParams(Array.from(searchParams.entries()))
                  params.set("tab", item.id)
                  router.push(`/settings?${params.toString()}`)
                }}
                className={`w-full flex items-center gap-3 px-5 py-4 rounded-[20px] font-bold transition-all ${
                  activeTab === item.id
                    ? "bg-white shadow-lg text-violet-600 border border-violet-100"
                    : "text-gray-500 hover:bg-white/60"
                }`}
              >
                <item.icon className={`h-5 w-5 ${activeTab === item.id ? "text-violet-600" : item.color}`} />
                <span className="text-base">{item.label}</span>
              </button>
            ))}
          </div>

          {/* <CHANGE> Content area now dynamically renders based on active tab */}
          <div className="md:col-span-2 space-y-6">{renderContent()}</div>
        </div>
      </main>
    </div>
  )
}
