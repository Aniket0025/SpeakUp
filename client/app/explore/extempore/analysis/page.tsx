"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

type ExtemporeConfig = {
  topic: string
  category: string
  durationSeconds: number
  thinkSeconds: number
  createdAt: number
}

type ExtemporeResult = {
  topic: string
  category: string
  thinkSeconds: number
  speakingDurationSeconds: number
  transcript: string
  endedAt: number
}

type HighlightToken = {
  text: string
  kind: "strong" | "filler" | "issue" | "neutral"
}

const FILLERS = [
  "um",
  "uh",
  "like",
  "you know",
  "actually",
  "basically",
  "literally",
  "so",
  "well",
]

const POSITIVE_WORDS = ["confident", "clear", "strong", "effective", "improve", "good", "great", "excellent", "structured"]
const NEGATIVE_WORDS = ["nervous", "confused", "sorry", "maybe", "i think", "i guess", "not sure", "problem"]

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

const countOccurrences = (haystack: string, needle: string) => {
  const h = haystack.toLowerCase()
  const n = needle.toLowerCase()
  if (!n) return 0
  let idx = 0
  let c = 0
  while (true) {
    const next = h.indexOf(n, idx)
    if (next === -1) break
    c += 1
    idx = next + n.length
  }
  return c
}

const splitSentences = (text: string) => {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

const tokenize = (text: string) => {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
}

const detectHighlights = (text: string): HighlightToken[] => {
  const tokens = tokenize(text)
  const lowered = tokens.map((t) => t.toLowerCase())

  return tokens.map((t, i) => {
    const w = lowered[i].replace(/[^a-z']/g, "")
    const isFiller = FILLERS.includes(w)
    if (isFiller) return { text: t, kind: "filler" }

    const isWeak = w === "thing" || w === "stuff" || w === "something"
    if (isWeak) return { text: t, kind: "issue" }

    const isStrong = ["however", "therefore", "because", "firstly", "secondly", "finally", "conclusion", "overall"].includes(w)
    if (isStrong) return { text: t, kind: "strong" }

    return { text: t, kind: "neutral" }
  })
}

const scoreToLevel = (score: number) => {
  if (score >= 80) return "Excellent"
  if (score >= 60) return "Good"
  return "Needs Improvement"
}

const confidenceLabel = (score: number) => {
  if (score >= 75) return "High"
  if (score >= 50) return "Medium"
  return "Low"
}

export default function ExtemporeAnalysisPage() {
  const router = useRouter()
  const [config, setConfig] = useState<ExtemporeConfig | null>(null)
  const [result, setResult] = useState<ExtemporeResult | null>(null)

  const endAndReturn = () => {
    try {
      sessionStorage.removeItem("speakup_extempore_result")
      sessionStorage.removeItem("speakup_extempore_config")
    } catch {}
    router.replace("/explore/extempore")
  }

  useEffect(() => {
    try {
      const rawConfig = sessionStorage.getItem("speakup_extempore_config")
      const rawResult = sessionStorage.getItem("speakup_extempore_result")
      const cfg = rawConfig ? (JSON.parse(rawConfig) as ExtemporeConfig) : null
      const res = rawResult ? (JSON.parse(rawResult) as ExtemporeResult) : null
      if (!cfg || !res) {
        router.replace("/explore/extempore")
        return
      }
      setConfig(cfg)
      setResult(res)
    } catch {
      router.replace("/explore/extempore")
    }
  }, [router])

  const analysis = useMemo(() => {
    const transcript = (result?.transcript || "").trim()
    const words = tokenize(transcript)
    const wc = words.length

    const speakingSeconds = Number(result?.speakingDurationSeconds || 0)
    const minutes = speakingSeconds > 0 ? speakingSeconds / 60 : 0
    const wpm = minutes > 0 ? Math.round(wc / minutes) : 0

    const fillerCount = FILLERS.reduce((acc, f) => acc + countOccurrences(transcript, f), 0)

    const sentences = splitSentences(transcript)
    const sentenceCount = sentences.length

    const avgSentenceLen = sentenceCount ? Math.round(wc / sentenceCount) : 0

    const unique = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z']/g, ""))).size
    const repetitionRatio = wc ? clamp(1 - unique / wc, 0, 1) : 0

    const pos = POSITIVE_WORDS.reduce((acc, w) => acc + countOccurrences(transcript, w), 0)
    const neg = NEGATIVE_WORDS.reduce((acc, w) => acc + countOccurrences(transcript, w), 0)

    const paceLabel = wpm === 0 ? "—" : wpm < 110 ? "Slow" : wpm <= 160 ? "Ideal" : "Fast"

    const pausesLevel = fillerCount > 14 ? "High" : fillerCount > 6 ? "Medium" : "Low"

    const fluencyScore = clamp(Math.round(100 - fillerCount * 3 - repetitionRatio * 35), 0, 100)
    const clarityScore = clamp(Math.round(100 - (avgSentenceLen > 22 ? (avgSentenceLen - 22) * 2 : 0) - fillerCount * 1.5), 0, 100)

    const structureScore = clamp(
      Math.round(
        60 +
          (countOccurrences(transcript, "first") || countOccurrences(transcript, "firstly") ? 8 : 0) +
          (countOccurrences(transcript, "second") || countOccurrences(transcript, "secondly") ? 8 : 0) +
          (countOccurrences(transcript, "finally") || countOccurrences(transcript, "conclusion") ? 8 : 0) -
          repetitionRatio * 25,
      ),
      0,
      100,
    )

    const sentiment = pos >= neg + 2 ? "Confident" : neg >= pos + 2 ? "Nervous" : "Neutral"

    const overall = clamp(Math.round((fluencyScore * 0.35 + clarityScore * 0.25 + structureScore * 0.4)), 0, 100)

    const confidence = confidenceLabel(overall)

    const xp = clamp(Math.round(overall / 2 + Math.min(30, wc / 20)), 10, 120)
    const levelProgress = clamp(Math.round((xp / 120) * 100), 0, 100)

    const strengths: string[] = []
    const weaknesses: string[] = []

    if (paceLabel === "Ideal") strengths.push("Good speaking pace")
    else weaknesses.push(`Speaking pace is ${paceLabel.toLowerCase()}`)

    if (fillerCount <= 6) strengths.push("Low filler words")
    else weaknesses.push("Too many filler words")

    if (structureScore >= 70) strengths.push("Clear structure (intro → points → conclusion)")
    else weaknesses.push("Improve structure and conclusion")

    if (repetitionRatio < 0.25) strengths.push("Low repetition")
    else weaknesses.push("Some repetition detected")

    const suggestions: string[] = []
    if (fillerCount > 6) suggestions.push("Practice pausing silently instead of using fillers (um/uh/like).")
    if (paceLabel === "Fast") suggestions.push("Slow down slightly and add short pauses after key points.")
    if (paceLabel === "Slow") suggestions.push("Increase pace by planning 2-3 key points before speaking.")
    if (structureScore < 70) suggestions.push("Use a simple structure: Intro → 2 points → example → conclusion.")
    if (suggestions.length === 0) suggestions.push("Keep practising and try a harder topic to level up.")

    const explainable = [
      `Your score is based on fluency (filler words & pauses), clarity (sentence length), and structure (signals like “first/second/finally/conclusion”).`,
      `You used ${fillerCount} filler words and spoke at about ${wpm || "—"} WPM (${paceLabel}).`,
      `Repetition level was ${Math.round(repetitionRatio * 100)}%.`,
    ]

    const highlights = detectHighlights(transcript)

    const confidenceTrend = [
      clamp(Math.round(overall - 10), 0, 100),
      clamp(Math.round(overall - 4), 0, 100),
      clamp(Math.round(overall + 2), 0, 100),
      clamp(Math.round(overall + 5), 0, 100),
    ]

    const badge = overall >= 85 ? "Extempore Ace" : overall >= 70 ? "Strong Speaker" : overall >= 55 ? "Consistency Builder" : "Getting Started"

    return {
      wc,
      wpm,
      fillerCount,
      pausesLevel,
      paceLabel,
      fluencyScore,
      clarityScore,
      structureScore,
      overall,
      level: scoreToLevel(overall),
      confidence,
      sentiment,
      xp,
      levelProgress,
      strengths,
      weaknesses,
      suggestions,
      explainable,
      highlights,
      confidenceTrend,
      badge,
    }
  }, [result])

  const dateLabel = useMemo(() => {
    const d = result?.endedAt ? new Date(result.endedAt) : null
    if (!d) return "—"
    return d.toLocaleString()
  }, [result?.endedAt])

  const progressWidth = useMemo(() => `${analysis.levelProgress}%`, [analysis.levelProgress])

  const Chip = ({ text }: { text: string }) => (
    <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-3 py-1 text-xs font-semibold border border-gray-200">
      {text}
    </span>
  )

  return (
    <div className="min-h-screen bg-[#f7f9fd]">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-white border border-gray-100 shadow-lg rounded-3xl p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold text-violet-600">EXTEMPORE ANALYSIS</p>
              <h1 className="text-3xl font-extrabold text-gray-900 mt-1">Your Performance Report</h1>
              <p className="text-sm text-gray-500 mt-1">A clear, explainable breakdown of your complete session</p>
            </div>
            <div className="flex gap-3">
              <Button className="rounded-xl bg-red-600 hover:bg-red-700 text-white" onClick={endAndReturn}>End</Button>
              <Button variant="outline" className="rounded-xl" onClick={() => router.replace("/explore/extempore")}>Practice Again</Button>
              <Button className="rounded-xl bg-violet-600 hover:bg-violet-700" onClick={() => router.replace("/explore/gd")}>Try GD Next</Button>
            </div>
          </div>

          {/* Overall Summary */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <p className="text-xs font-bold text-gray-500">Overall Score</p>
              <div className="mt-2 flex items-end gap-2">
                <p className="text-5xl font-black text-gray-900">{analysis.overall}</p>
                <p className="text-sm font-bold text-gray-500">/ 100</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip text={`Level: ${analysis.level}`} />
                <Chip text={`Confidence: ${analysis.confidence}`} />
                <Chip text={`Tone: ${analysis.sentiment}`} />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <p className="text-xs font-bold text-gray-500">XP Earned</p>
              <div className="mt-2 flex items-end gap-2">
                <p className="text-5xl font-black text-gray-900">+{analysis.xp}</p>
                <p className="text-sm font-bold text-gray-500">XP</p>
              </div>
              <p className="mt-3 text-xs font-bold text-gray-500">Level Progress</p>
              <div className="mt-2 h-3 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-600" style={{ width: progressWidth }} />
              </div>
              <p className="mt-2 text-xs text-gray-500">{analysis.levelProgress}% to next level</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <p className="text-xs font-bold text-gray-500">Badge</p>
              <p className="mt-2 text-2xl font-black text-gray-900">{analysis.badge}</p>
              <p className="mt-2 text-sm text-gray-600">Keep your streak alive — daily practice improves confidence fast.</p>
            </div>
          </div>

          {/* Topic & Session Details */}
          <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="text-lg font-extrabold text-gray-900">Topic & Session Details</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs font-bold text-gray-500">Topic</p>
                <p className="mt-1 font-bold text-gray-900">{result?.topic || config?.topic || "—"}</p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs font-bold text-gray-500">Think Time</p>
                <p className="mt-1 font-bold text-gray-900">{Math.round(Number(result?.thinkSeconds || config?.thinkSeconds || 0))} sec</p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs font-bold text-gray-500">Speaking Duration</p>
                <p className="mt-1 font-bold text-gray-900">{Math.round(Number(result?.speakingDurationSeconds || 0))} sec</p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs font-bold text-gray-500">Date</p>
                <p className="mt-1 font-bold text-gray-900">{dateLabel}</p>
              </div>
            </div>
          </div>

          {/* Analysis Tabs */}
          <div className="mt-8">
            <Tabs defaultValue="speech" className="w-full">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
                <TabsTrigger value="speech">Speech Quality</TabsTrigger>
                <TabsTrigger value="content">Content & Structure</TabsTrigger>
                <TabsTrigger value="confidence">Confidence</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
              </TabsList>

              <TabsContent value="speech" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                    <p className="text-xs font-bold text-gray-500">Fluency Score</p>
                    <p className="mt-2 text-4xl font-black text-gray-900">{analysis.fluencyScore}</p>
                    <p className="mt-2 text-sm text-gray-600">Based on filler words + repetition + flow.</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                    <p className="text-xs font-bold text-gray-500">Clarity & Pronunciation</p>
                    <p className="mt-2 text-4xl font-black text-gray-900">{analysis.clarityScore}</p>
                    <p className="mt-2 text-sm text-gray-600">Estimated using sentence length & readability.</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                    <p className="text-xs font-bold text-gray-500">Speaking Pace</p>
                    <p className="mt-2 text-2xl font-black text-gray-900">{analysis.paceLabel}</p>
                    <p className="mt-1 text-sm text-gray-600">~{analysis.wpm || "—"} words/min</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-gray-100 bg-white p-6">
                    <h3 className="font-extrabold text-gray-900">Pauses & Fillers</h3>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                        <p className="text-xs font-bold text-gray-500">Filler Words</p>
                        <p className="mt-1 text-3xl font-black text-gray-900">{analysis.fillerCount}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                        <p className="text-xs font-bold text-gray-500">Hesitation Level</p>
                        <p className="mt-1 text-2xl font-black text-gray-900">{analysis.pausesLevel}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-600">Tip: pause silently after a sentence instead of using “um/uh/like”.</p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-6">
                    <h3 className="font-extrabold text-gray-900">Strengths & Weaknesses</h3>
                    <div className="mt-4">
                      <p className="text-sm font-bold text-emerald-700">Strengths</p>
                      <div className="mt-2 space-y-2">
                        {(analysis.strengths.length ? analysis.strengths : ["Keep practising to identify stable strengths"]).map((s, i) => (
                          <div key={`s-${i}`} className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-2 text-sm text-emerald-800 font-semibold">
                            {s}
                          </div>
                        ))}
                      </div>

                      <p className="mt-4 text-sm font-bold text-rose-700">Weaknesses</p>
                      <div className="mt-2 space-y-2">
                        {(analysis.weaknesses.length ? analysis.weaknesses : ["No major weaknesses detected"]).map((w, i) => (
                          <div key={`w-${i}`} className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-2 text-sm text-rose-800 font-semibold">
                            {w}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="content" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                    <p className="text-xs font-bold text-gray-500">Logical Flow</p>
                    <p className="mt-2 text-4xl font-black text-gray-900">{analysis.structureScore}</p>
                    <p className="mt-2 text-sm text-gray-600">Intro → Body → Conclusion markers & repetition.</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                    <p className="text-xs font-bold text-gray-500">Repetition</p>
                    <p className="mt-2 text-2xl font-black text-gray-900">{analysis.wc ? "Detected" : "—"}</p>
                    <p className="mt-1 text-sm text-gray-600">Lower repetition improves impact.</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                    <p className="text-xs font-bold text-gray-500">Depth of Points</p>
                    <p className="mt-2 text-2xl font-black text-gray-900">{analysis.wc > 160 ? "Good" : analysis.wc > 90 ? "Medium" : "Low"}</p>
                    <p className="mt-1 text-sm text-gray-600">Estimated from length & structure.</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
                  <h3 className="font-extrabold text-gray-900">Explainable AI Feedback</h3>
                  <div className="mt-3 space-y-2 text-sm text-gray-700">
                    {analysis.explainable.map((t, i) => (
                      <p key={`e-${i}`} className="leading-6">{t}</p>
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
                  <h3 className="font-extrabold text-gray-900">Personalized Improvement Suggestions</h3>
                  <div className="mt-3 space-y-2">
                    {analysis.suggestions.map((s, i) => (
                      <div key={`p-${i}`} className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-2 text-sm text-violet-900 font-semibold">
                        {s}
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-gray-600">Recommended next module: <span className="font-bold">GD</span> (practice interacting under pressure).</p>
                </div>
              </TabsContent>

              <TabsContent value="confidence" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-gray-100 bg-white p-6">
                    <h3 className="font-extrabold text-gray-900">Sentiment & Confidence</h3>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                        <p className="text-xs font-bold text-gray-500">Emotional Tone</p>
                        <p className="mt-1 text-2xl font-black text-gray-900">{analysis.sentiment}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                        <p className="text-xs font-bold text-gray-500">Voice Stability</p>
                        <p className="mt-1 text-2xl font-black text-gray-900">{analysis.fillerCount > 10 ? "Unstable" : analysis.fillerCount > 6 ? "Medium" : "Stable"}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-600">Stress indicators are estimated from hesitation patterns (fillers & pace).</p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-6">
                    <h3 className="font-extrabold text-gray-900">Confidence Trend</h3>
                    <div className="mt-4 flex items-end gap-3 h-28">
                      {analysis.confidenceTrend.map((v, i) => (
                        <div key={`c-${i}`} className="flex-1">
                          <div className="rounded-lg bg-violet-600" style={{ height: `${clamp(v, 0, 100)}%` }} />
                          <p className="mt-2 text-[10px] text-gray-500 font-bold text-center">{i + 1}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-gray-600">Goal: trend upward by reducing fillers and using a stronger conclusion.</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
                  <h3 className="font-extrabold text-gray-900">Behavioral Insights</h3>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                      <p className="text-xs font-bold text-gray-500">Engagement Level</p>
                      <p className="mt-1 text-2xl font-black text-gray-900">{analysis.wc > 120 ? "High" : analysis.wc > 70 ? "Medium" : "Low"}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                      <p className="text-xs font-bold text-gray-500">Body Language</p>
                      <p className="mt-1 text-2xl font-black text-gray-900">Optional</p>
                      <p className="mt-1 text-xs text-gray-500">(Add video scoring later)</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                      <p className="text-xs font-bold text-gray-500">Eye Contact</p>
                      <p className="mt-1 text-2xl font-black text-gray-900">Optional</p>
                      <p className="mt-1 text-xs text-gray-500">(Simulated / future)</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
                  <h3 className="font-extrabold text-gray-900">Motivation</h3>
                  <p className="mt-2 text-sm text-gray-700">You’re improving. Practice daily to build speed, clarity, and confidence.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Chip text={`Streak: +1`} />
                    <Chip text={`Leaderboard: Updated`} />
                    <Chip text={`Badge: ${analysis.badge}`} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="transcript" className="mt-6">
                <div className="rounded-2xl border border-gray-100 bg-white p-6">
                  <h3 className="font-extrabold text-gray-900">Transcript with Highlights</h3>
                  <p className="mt-2 text-sm text-gray-600">Legend: <span className="font-bold text-emerald-700">Strong</span> • <span className="font-bold text-amber-700">Filler</span> • <span className="font-bold text-rose-700">Issue</span></p>
                  <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 max-h-[420px] overflow-y-auto text-sm leading-7">
                    {analysis.highlights.length ? (
                      <p className="whitespace-pre-wrap">
                        {analysis.highlights.map((t, i) => {
                          const cls =
                            t.kind === "strong"
                              ? "text-emerald-800 bg-emerald-100"
                              : t.kind === "filler"
                                ? "text-amber-900 bg-amber-100"
                                : t.kind === "issue"
                                  ? "text-rose-800 bg-rose-100"
                                  : "text-gray-800"
                          return (
                            <span key={`t-${i}`} className={`px-1 rounded ${cls}`}>{t.text} </span>
                          )
                        })}
                      </p>
                    ) : (
                      <p className="text-gray-600">No transcript captured. Please use Chrome and allow microphone permissions.</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
