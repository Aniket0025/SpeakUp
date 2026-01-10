"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:5000` : "http://localhost:5000")

export default function CreateTournamentPage() {
  const router = useRouter()
  const { user, token } = useAuth()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [organization, setOrganization] = useState("")
  const [visibility, setVisibility] = useState<"public" | "private">("public")
  const [joinPassword, setJoinPassword] = useState("")

  const [topicDomain, setTopicDomain] = useState("Mixed")
  const [topicName, setTopicName] = useState("")

  const [registrationStartDate, setRegistrationStartDate] = useState("")
  const [registrationEndDate, setRegistrationEndDate] = useState("")
  const [tournamentStartDate, setTournamentStartDate] = useState("")
  const [tournamentEndDate, setTournamentEndDate] = useState("")
  const [roundDurationSeconds, setRoundDurationSeconds] = useState<number>(600)

  const [maxParticipants, setMaxParticipants] = useState<number>(0)
  const [groupSize, setGroupSize] = useState<number>(5)
  const [language, setLanguage] = useState("English")
  const [eligibilityCriteria, setEligibilityCriteria] = useState("")

  const [numberOfRounds, setNumberOfRounds] = useState<number>(1)
  const [roundFormat, setRoundFormat] = useState("Knockout")
  const [advancementCriteria, setAdvancementCriteria] = useState("Top 2")

  const [rewardsCertificatesParticipation, setRewardsCertificatesParticipation] = useState(true)
  const [rewardsCertificatesWinner, setRewardsCertificatesWinner] = useState(true)
  const [rewardsBadgesXp, setRewardsBadgesXp] = useState(true)
  const [rewardsLeaderboardRanking, setRewardsLeaderboardRanking] = useState(true)
  const [rewardsPrizes, setRewardsPrizes] = useState("")

  const [speakingRules, setSpeakingRules] = useState("")
  const [timeLimits, setTimeLimits] = useState("")
  const [codeOfConduct, setCodeOfConduct] = useState("")
  const [disqualificationConditions, setDisqualificationConditions] = useState("")

  const [privacyAnonymizedEvaluation, setPrivacyAnonymizedEvaluation] = useState(false)
  const [privacyRecordingPermission, setPrivacyRecordingPermission] = useState(false)
  const [privacyAiExplainabilityEnabled, setPrivacyAiExplainabilityEnabled] = useState(true)

  const canCreate = useMemo(() => {
    if (!name.trim()) return false
    if (visibility === "private" && !joinPassword.trim()) return false
    return true
  }, [name, joinPassword, visibility])

  const handleCreate = async () => {
    if (!token || !canCreate) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/tournaments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          organization,
          visibility,
          joinPassword: visibility === "private" ? joinPassword : "",

          topicType: topicDomain,
          topicName,

          registrationStartDate: registrationStartDate || undefined,
          registrationEndDate: registrationEndDate || undefined,
          tournamentStartDate: tournamentStartDate || undefined,
          tournamentEndDate: tournamentEndDate || undefined,

          roundDurationSeconds,
          maxParticipants,
          groupSize,
          language,
          eligibilityCriteria,

          numberOfRounds,
          roundFormat,
          advancementCriteria,

          rewards: {
            certificatesParticipation: rewardsCertificatesParticipation,
            certificatesWinner: rewardsCertificatesWinner,
            badgesXp: rewardsBadgesXp,
            leaderboardRanking: rewardsLeaderboardRanking,
            prizes: rewardsPrizes,
          },

          rules: {
            speakingRules,
            timeLimits,
            codeOfConduct,
            disqualificationConditions,
          },

          privacy: {
            anonymizedEvaluation: privacyAnonymizedEvaluation,
            recordingPermission: privacyRecordingPermission,
            aiExplainabilityEnabled: privacyAiExplainabilityEnabled,
          },
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(String(data?.message || "Failed to create tournament"))
        return
      }

      const tournamentId = String(data?.tournamentId || "").trim()
      if (tournamentId) {
        router.push(`/explore/tournaments/${tournamentId}/organise`)
      } else {
        router.push("/explore/tournaments")
      }
    } catch {
      setError("Failed to create tournament")
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => router.push("/explore/tournaments")} className="mb-6 text-violet-600 hover:text-violet-700 hover:bg-violet-50">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <div className="rounded-3xl border bg-white overflow-hidden">
          <div className="px-6 py-5 border-b">
            <h1 className="text-2xl font-extrabold text-gray-900">Create Tournament</h1>
            <p className="text-sm text-gray-500 mt-1">Organizer setup form</p>
          </div>

          {error && <div className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div className="p-6 space-y-4">
            <section className="rounded-2xl border p-5 space-y-3">
              <h2 className="text-sm font-extrabold text-gray-900">Basic Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Tournament Name *" value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-xl" />
                <Input placeholder="Organizer (College / Company / Platform)" value={organization} onChange={(e) => setOrganization(e.target.value)} className="h-10 rounded-xl" />
                <div className="md:col-span-2">
                  <Textarea placeholder="Short Description / Purpose" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-24 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant={visibility === "public" ? "default" : "outline"} className="h-10 rounded-xl" onClick={() => setVisibility("public")}>Public</Button>
                  <Button variant={visibility === "private" ? "default" : "outline"} className="h-10 rounded-xl" onClick={() => setVisibility("private")}>Private</Button>
                </div>
                <Select value={topicDomain} onValueChange={setTopicDomain}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Topic Domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Current Affairs">Current Affairs</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Topic Name (optional)" value={topicName} onChange={(e) => setTopicName(e.target.value)} className="h-10 rounded-xl" />
                {visibility === "private" && (
                  <Input type="password" placeholder="Organizer Password *" value={joinPassword} onChange={(e) => setJoinPassword(e.target.value)} className="h-10 rounded-xl" />
                )}
              </div>
            </section>

            <section className="rounded-2xl border p-5 space-y-3">
              <h2 className="text-sm font-extrabold text-gray-900">Schedule</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-600">Registration Start Date</div>
                  <Input type="date" value={registrationStartDate} onChange={(e) => setRegistrationStartDate(e.target.value)} className="h-10 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-600">Registration End Date</div>
                  <Input type="date" value={registrationEndDate} onChange={(e) => setRegistrationEndDate(e.target.value)} className="h-10 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-600">Tournament Start Date</div>
                  <Input type="date" value={tournamentStartDate} onChange={(e) => setTournamentStartDate(e.target.value)} className="h-10 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-600">Tournament End Date</div>
                  <Input type="date" value={tournamentEndDate} onChange={(e) => setTournamentEndDate(e.target.value)} className="h-10 rounded-xl" />
                </div>
                <Input
                  type="number"
                  min={60}
                  value={roundDurationSeconds}
                  onChange={(e) => setRoundDurationSeconds(Math.max(60, Number(e.target.value || 600)))}
                  className="h-10 rounded-xl"
                  placeholder="GD Duration per round (seconds)"
                />
              </div>
            </section>

            <section className="rounded-2xl border p-5 space-y-3">
              <h2 className="text-sm font-extrabold text-gray-900">Participants Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input type="number" min={0} value={maxParticipants} onChange={(e) => setMaxParticipants(Math.max(0, Number(e.target.value || 0)))} className="h-10 rounded-xl" placeholder="Maximum Participants" />
                <Input type="number" min={2} max={10} value={groupSize} onChange={(e) => setGroupSize(Math.max(2, Math.min(10, Number(e.target.value || 5))))} className="h-10 rounded-xl" placeholder="Group Size (participants per GD)" />
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Language of Discussion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder="Eligibility (optional)" value={eligibilityCriteria} onChange={(e) => setEligibilityCriteria(e.target.value)} className="min-h-20 rounded-xl" />
              </div>
            </section>

            <section className="rounded-2xl border p-5 space-y-3">
              <h2 className="text-sm font-extrabold text-gray-900">Tournament Structure</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input type="number" min={1} value={numberOfRounds} onChange={(e) => setNumberOfRounds(Math.max(1, Number(e.target.value || 1)))} className="h-10 rounded-xl" placeholder="Number of Rounds" />
                <Input placeholder="Round Type (Knockout / Multiple Rounds)" value={roundFormat} onChange={(e) => setRoundFormat(e.target.value)} className="h-10 rounded-xl" />
                <div className="md:col-span-2">
                  <Input placeholder="Qualification Criteria (Top X per group)" value={advancementCriteria} onChange={(e) => setAdvancementCriteria(e.target.value)} className="h-10 rounded-xl" />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border p-5 space-y-3">
              <h2 className="text-sm font-extrabold text-gray-900">Rewards & Recognition</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={rewardsCertificatesParticipation} onCheckedChange={(v) => setRewardsCertificatesParticipation(Boolean(v))} />
                    <span className="text-sm text-gray-900">Certificates (Participation)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={rewardsCertificatesWinner} onCheckedChange={(v) => setRewardsCertificatesWinner(Boolean(v))} />
                    <span className="text-sm text-gray-900">Certificates (Winner)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={rewardsBadgesXp} onCheckedChange={(v) => setRewardsBadgesXp(Boolean(v))} />
                    <span className="text-sm text-gray-900">XP / Badges</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={rewardsLeaderboardRanking} onCheckedChange={(v) => setRewardsLeaderboardRanking(Boolean(v))} />
                    <span className="text-sm text-gray-900">Leaderboard Ranking</span>
                  </div>
                </div>
                <Textarea placeholder="Prizes (optional) e.g. Rank wise prizes" value={rewardsPrizes} onChange={(e) => setRewardsPrizes(e.target.value)} className="min-h-20 rounded-xl" />
              </div>
            </section>

            <section className="rounded-2xl border p-5 space-y-3">
              <h2 className="text-sm font-extrabold text-gray-900">Rules & Guidelines</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Textarea placeholder="Speaking Rules" value={speakingRules} onChange={(e) => setSpeakingRules(e.target.value)} className="min-h-20 rounded-xl" />
                <Textarea placeholder="Time Limits" value={timeLimits} onChange={(e) => setTimeLimits(e.target.value)} className="min-h-20 rounded-xl" />
                <Textarea placeholder="Code of Conduct" value={codeOfConduct} onChange={(e) => setCodeOfConduct(e.target.value)} className="min-h-20 rounded-xl" />
                <Textarea placeholder="Disqualification Conditions" value={disqualificationConditions} onChange={(e) => setDisqualificationConditions(e.target.value)} className="min-h-20 rounded-xl" />
              </div>
            </section>

            <section className="rounded-2xl border p-5 space-y-3">
              <h2 className="text-sm font-extrabold text-gray-900">Privacy & Fairness Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center justify-between rounded-xl border px-4 py-3">
                  <span className="text-sm text-gray-900">Anonymous Evaluation</span>
                  <Switch checked={privacyAnonymizedEvaluation} onCheckedChange={setPrivacyAnonymizedEvaluation} />
                </div>
                <div className="flex items-center justify-between rounded-xl border px-4 py-3">
                  <span className="text-sm text-gray-900">Session Recording Permission</span>
                  <Switch checked={privacyRecordingPermission} onCheckedChange={setPrivacyRecordingPermission} />
                </div>
                <div className="flex items-center justify-between rounded-xl border px-4 py-3 md:col-span-2">
                  <span className="text-sm text-gray-900">AI Explainability Enabled</span>
                  <Switch checked={privacyAiExplainabilityEnabled} onCheckedChange={setPrivacyAiExplainabilityEnabled} />
                </div>
              </div>
            </section>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => router.push("/explore/tournaments")} className="flex-1 h-12 rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!canCreate || submitting} className="flex-1 h-12 rounded-xl">
                {submitting ? "Creating..." : "Create Tournament"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
