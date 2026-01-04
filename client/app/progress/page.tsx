"use client"

import { Header } from "@/components/layout/header"
import { StatCard } from "@/components/ui/stat-card"
import { LevelCard } from "@/components/ui/level-card"
import { MessageSquare, Mic, Users, Target, Calendar, TrendingUp, BarChart3 } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

const weeklyData = [
  { day: "Mon", score: 0 },
  { day: "Tue", score: 0 },
  { day: "Wed", score: 0 },
  { day: "Thu", score: 0 },
  { day: "Fri", score: 0 },
  { day: "Sat", score: 0 },
  { day: "Sun", score: 0 },
]

const skillData = [
  { skill: "Content", value: 0 },
  { skill: "Delivery", value: 0 },
  { skill: "Logic", value: 0 },
  { skill: "Engagement", value: 0 },
  { skill: "Clarity", value: 0 },
]

export default function ProgressPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fd]">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">My Progress</h1>
          <p className="text-gray-500 text-lg">Track your improvement journey</p>
        </div>

        {/* Level Card */}
        <div className="mb-8">
          <LevelCard level={1} currentXP={0} nextLevelXP={100} streak={0} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={MessageSquare}
            iconColor="text-cyan-600"
            iconBgColor="bg-cyan-100"
            label="GD Sessions"
            value={0}
          />
          <StatCard icon={Mic} iconColor="text-violet-600" iconBgColor="bg-violet-100" label="Extempore" value={0} />
          <StatCard
            icon={Users}
            iconColor="text-emerald-600"
            iconBgColor="bg-emerald-100"
            label="Interviews"
            value={1}
          />
          <StatCard
            icon={Target}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
            label="Avg Score"
            value="0%"
          />
        </div>

        {/* Activity Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="flex items-center gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="h-14 w-14 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Week</p>
              <p className="text-2xl font-bold text-gray-900">0 Sessions</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="h-14 w-14 rounded-xl bg-violet-500 flex items-center justify-center">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-900">0 Sessions</p>
            </div>
          </div>
        </div>

        {/* Performance Analytics */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Performance Analytics</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Performance Chart */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Weekly Performance Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#8b5cf6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Skill Distribution Chart */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Skill Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="skill" stroke="#64748b" fontSize={12} />
                  <PolarRadiusAxis stroke="#94a3b8" fontSize={10} />
                  <Radar
                    name="Skills"
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
