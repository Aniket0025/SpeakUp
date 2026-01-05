import { Flame, Sparkles } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface LevelCardProps {
  level: number
  currentXP: number
  nextLevelXP: number
  streak: number
}

export function LevelCard({ level, currentXP, nextLevelXP, streak }: LevelCardProps) {
  const progress = (currentXP / nextLevelXP) * 100

  return (
    <div className="relative overflow-hidden rounded-3xl bg-card border border-border p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Level Circle */}
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-3xl font-bold text-white">{level}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-card border border-border flex items-center justify-center shadow-md">
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-foreground">Level {level}</h3>
            <p className="text-muted-foreground">{currentXP} XP earned</p>
            <div className="flex items-center gap-1 mt-1 text-orange-500">
              <Flame className="h-4 w-4" />
              <span className="font-semibold">{streak} Day Streak</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm text-muted-foreground">Next level at</p>
          <p className="text-2xl font-bold text-violet-600">{nextLevelXP} XP</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <Progress value={progress} className="h-2 bg-muted" />
      </div>
    </div>
  )
}
