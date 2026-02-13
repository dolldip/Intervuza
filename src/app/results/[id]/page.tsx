"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Trophy, 
  BarChart3, 
  MessageSquare, 
  UserCircle, 
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Download,
  Share2,
  PlayCircle
} from "lucide-react"
import Link from "next/link"
import { comprehensiveInterviewFeedbackReport, ComprehensiveInterviewFeedbackReportOutput } from "@/ai/flows/comprehensive-interview-feedback-report"

export default function ResultsPage() {
  const [report, setReport] = useState<ComprehensiveInterviewFeedbackReportOutput | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const result = await comprehensiveInterviewFeedbackReport({
        jobRole: "Senior Product Manager",
        experienceLevel: "Senior",
        interviewSummary: "The user answered 5 questions about strategy, roadmap, and user research. Performance was consistent with some fillers.",
        overallTextAnalysisFeedback: "Good structure, slightly long-winded in the first question.",
        overallVoiceAnalysisFeedback: "Tone was professional and confident. Some pace variation needed.",
        overallCameraAnalysisFeedback: "Excellent eye contact. Calm posture.",
        confidenceConsistencyScore: 88
      })
      setReport(result)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-2xl font-headline font-bold">Synthesizing Your Report</h2>
        <p className="text-muted-foreground mt-2">AI is analyzing your video, voice, and text performance...</p>
      </div>
    )
  }

  return (
    <div className="container py-12 px-4 max-w-6xl animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <Badge className="mb-2 bg-primary/10 text-primary border-primary/20">Session ID: #AI-9921</Badge>
          <h1 className="text-4xl font-headline font-bold">Interview Analysis Report</h1>
          <p className="text-muted-foreground text-lg">Senior Product Manager • May 24, 2024</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline"><Share2 className="mr-2 w-4 h-4" /> Share</Button>
          <Button variant="outline"><Download className="mr-2 w-4 h-4" /> PDF</Button>
          <Button asChild><Link href="/dashboard">Back to Dashboard</Link></Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Overall Score", value: report?.overallScore, icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-100" },
          { label: "Confidence", value: report?.confidenceScore, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Communication", value: report?.communicationScore, icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-100" },
          { label: "Role Fit", value: report?.technicalRoleFitScore, icon: UserCircle, color: "text-green-600", bg: "bg-green-100" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-2">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-2xl font-black">{stat.value}%</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-white p-1 border shadow-sm">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="qa">Questions & Answers</TabsTrigger>
          <TabsTrigger value="body">Body Language</TabsTrigger>
          <TabsTrigger value="coach">AI Coaching Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="text-green-500 w-5 h-5" />
                  Key Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {report?.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span className="text-sm font-medium text-green-800">{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="text-amber-500 w-5 h-5" />
                  Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {report?.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                      <span className="text-sm font-medium text-amber-800">{w}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-blue max-w-none text-muted-foreground leading-relaxed">
                <p>{report?.improvementPlan}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qa" className="space-y-6">
          {report?.sampleAnswerImprovements.map((qa, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg leading-tight">Q: {qa.question}</CardTitle>
                  <Button variant="ghost" size="sm" className="text-primary"><PlayCircle className="mr-2 w-4 h-4" /> Watch Playback</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Your Answer Summary</h4>
                  <p className="text-sm italic text-muted-foreground">{qa.originalAnswerSummary}</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 border-l-4 border-l-primary">
                  <h4 className="text-xs font-bold text-primary uppercase mb-2">Improved AI Version</h4>
                  <p className="text-sm text-blue-900 leading-relaxed font-medium">{qa.improvedAnswer}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Coach Feedback</h4>
                  <p className="text-sm">{qa.feedback}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="body">
          <Card>
            <CardHeader>
              <CardTitle>Non-Verbal Communication Report</CardTitle>
              <CardDescription>Based on camera and computer vision analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="aspect-video bg-muted rounded-2xl relative overflow-hidden group">
                    <img src="https://picsum.photos/seed/assessai-face/600/400" className="object-cover w-full h-full opacity-60" data-ai-hint="professional headshot" />
                    <div className="absolute inset-0 border-2 border-primary/40 rounded-2xl m-8 pointer-events-none" />
                    <div className="absolute top-4 left-4 bg-primary/80 backdrop-blur-sm text-white px-2 py-1 rounded text-[10px] font-bold">EMOTION: CONFIDENT</div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border bg-slate-50">
                      <h4 className="font-bold text-sm mb-1">Eye Contact Consistency</h4>
                      <p className="text-xs text-muted-foreground">You maintained focus 92% of the time, which is well above the professional average.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="font-headline font-bold text-xl">Expert Observations</h3>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {report?.bodyLanguageReport}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coach">
          <Card className="bg-primary text-white overflow-hidden relative border-none">
            <CardHeader>
              <CardTitle className="text-2xl">Tailored Practice Routine</CardTitle>
              <CardDescription className="text-primary-foreground/70">Daily tasks to address your gaps</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Focus on 2-min pitch drills",
                  "Practice STAR method for Behavioral",
                  "Reduce 'like' and 'um' usage",
                  "Review technical roadmap basics"
                ].map((task, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{task}</span>
                  </div>
                ))}
              </div>
              <Button variant="secondary" className="w-full h-12 text-lg font-bold" asChild>
                <Link href="/dashboard">Return to Practice Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}