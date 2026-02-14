
"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
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
  PlayCircle,
  BrainCircuit,
  Loader2,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { comprehensiveInterviewFeedbackReport, ComprehensiveInterviewFeedbackReportOutput } from "@/ai/flows/comprehensive-interview-feedback-report"

export default function ResultsPage() {
  const params = useParams()
  const [report, setReport] = useState<ComprehensiveInterviewFeedbackReportOutput | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const demoRole = sessionStorage.getItem('demo_role') || "Professional Candidate"
      const demoExp = sessionStorage.getItem('demo_exp') || "Mid-level"
      const answers = JSON.parse(sessionStorage.getItem('session_answers') || '[]')
      
      const interviewSummary = answers.length > 0 
        ? `The candidate answered ${answers.length} questions for a ${demoRole} role. Key highlights include responses focused on professional experience and skills.`
        : "Session summary: The candidate completed a series of professional mock interview questions."

      try {
        const result = await comprehensiveInterviewFeedbackReport({
          jobRole: demoRole,
          experienceLevel: demoExp,
          interviewSummary: interviewSummary,
          overallTextAnalysisFeedback: "Responses were structured, though some elaboration could be added for technical depth.",
          overallVoiceAnalysisFeedback: "Vocal tone was consistent and confident throughout the session.",
          overallCameraAnalysisFeedback: "Good eye contact and professional composure maintained.",
          confidenceConsistencyScore: 85
        })
        setReport(result)
      } catch (err) {
        console.error("Report generation failed", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
        <div className="relative mb-8">
           <BrainCircuit className="w-24 h-24 text-primary animate-pulse" />
           <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping" />
        </div>
        <h2 className="text-3xl font-headline font-bold text-center">Synthesizing Your Neural Report</h2>
        <p className="text-slate-400 mt-4 text-center max-w-md">
          Sarah is aggregating your voice, face, and text performance to generate personalized coaching insights...
        </p>
        <div className="mt-12 flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest">
           <Loader2 className="w-4 h-4 animate-spin" />
           Processing Performance Data
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12 px-4 max-w-6xl animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div>
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-3 py-1">Session ID: #AI-{Math.floor(Math.random() * 9000) + 1000}</Badge>
          <h1 className="text-5xl font-headline font-bold mb-2">Performance Report</h1>
          <p className="text-muted-foreground text-xl">
            {sessionStorage.getItem('demo_role') || "Professional Candidate"} • {new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-12 rounded-xl"><Share2 className="mr-2 w-4 h-4" /> Share</Button>
          <Button variant="outline" className="h-12 rounded-xl"><Download className="mr-2 w-4 h-4" /> Export PDF</Button>
          <Button asChild className="h-12 rounded-xl px-8 font-bold"><Link href="/dashboard">Return Home</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Overall Score", value: report?.overallScore, icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-100" },
          { label: "Confidence", value: report?.confidenceScore, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Communication", value: report?.communicationScore, icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-100" },
          { label: "Role Alignment", value: report?.technicalRoleFitScore, icon: UserCircle, color: "text-green-600", bg: "bg-green-100" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-xl rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-transform">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:rotate-6 transition-transform`}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <span className="text-4xl font-black tracking-tighter">{stat.value}%</span>
              </div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-12">
        <TabsList className="bg-muted/50 p-1.5 border rounded-2xl h-14 flex w-full max-w-2xl mx-auto shadow-sm">
          <TabsTrigger value="overview" className="flex-1 rounded-xl font-bold">Comprehensive Overview</TabsTrigger>
          <TabsTrigger value="qa" className="flex-1 rounded-xl font-bold">Q&A Analysis</TabsTrigger>
          <TabsTrigger value="body" className="flex-1 rounded-xl font-bold">Neural Bio-feedback</TabsTrigger>
          <TabsTrigger value="coach" className="flex-1 rounded-xl font-bold">AI Coaching</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[2.5rem] border-green-100 shadow-sm bg-green-50/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-green-100 rounded-xl">
                    <CheckCircle className="text-green-600 w-6 h-6" />
                  </div>
                  Performance Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 pt-4">
                  {report?.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-4 p-5 rounded-3xl bg-white border border-green-50 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2.5 shrink-0" />
                      <span className="text-base font-semibold text-slate-800 leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-amber-100 shadow-sm bg-amber-50/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-2xl">
                   <div className="p-2 bg-amber-100 rounded-xl">
                    <AlertTriangle className="text-amber-600 w-6 h-6" />
                  </div>
                  Refinement Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 pt-4">
                  {report?.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-4 p-5 rounded-3xl bg-white border border-amber-50 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-2.5 shrink-0" />
                      <span className="text-base font-semibold text-slate-800 leading-relaxed">{w}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[3rem] shadow-xl border-primary/10 overflow-hidden">
            <div className="bg-primary/5 p-12">
               <h3 className="text-3xl font-headline font-bold mb-6">Strategic Improvement Plan</h3>
               <div className="prose prose-blue max-w-none text-slate-700 text-lg leading-loose">
                  <p>{report?.improvementPlan}</p>
               </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="qa" className="space-y-8">
          {report?.sampleAnswerImprovements.map((qa, i) => (
            <Card key={i} className="overflow-hidden rounded-[3rem] shadow-lg border-none">
              <CardHeader className="bg-slate-50 p-10">
                <div className="flex justify-between items-start gap-8">
                  <CardTitle className="text-2xl leading-snug font-headline">Q: {qa.question}</CardTitle>
                  <Button variant="outline" className="rounded-2xl border-primary/20 text-primary whitespace-nowrap"><PlayCircle className="mr-2 w-4 h-4" /> Watch Playback</Button>
                </div>
              </CardHeader>
              <CardContent className="p-12 space-y-10">
                <div>
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Original Response Summary</h4>
                  <p className="text-lg italic text-slate-600 leading-relaxed">{qa.originalAnswerSummary}</p>
                </div>
                <div className="p-8 rounded-[2rem] bg-blue-50/50 border border-blue-100 border-l-8 border-l-primary relative">
                  <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Recommended AI Version
                  </h4>
                  <p className="text-xl text-slate-800 leading-loose font-bold">{qa.improvedAnswer}</p>
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Sarah's Feedback</h4>
                  <p className="text-base text-slate-600 leading-relaxed">{qa.feedback}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="body">
          <Card className="rounded-[3rem] shadow-2xl overflow-hidden border-none">
            <CardHeader className="p-12 bg-slate-900 text-white">
              <CardTitle className="text-3xl font-headline">Biometric Interaction Report</CardTitle>
              <CardDescription className="text-slate-400 text-lg">Analyzed via neural eye-tracking and facial micro-expression mapping</CardDescription>
            </CardHeader>
            <CardContent className="p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
                <div className="space-y-8">
                  <div className="aspect-video bg-slate-100 rounded-[2.5rem] relative overflow-hidden group shadow-inner">
                    <img 
                      src="https://picsum.photos/seed/face-analytics-report/800/600" 
                      className="object-cover w-full h-full opacity-70 grayscale-[0.2]" 
                      data-ai-hint="professional headshot"
                    />
                    <div className="absolute inset-0 border-[30px] border-black/10 rounded-[2.5rem] m-6 pointer-events-none" />
                    <div className="absolute top-8 left-8 bg-primary text-white px-4 py-2 rounded-2xl text-[10px] font-black tracking-widest shadow-2xl">MAP: EMOTIONAL_STABILITY_V3</div>
                  </div>
                  <div className="p-8 rounded-[2rem] border bg-slate-50 shadow-sm">
                    <h4 className="font-black text-xs uppercase tracking-widest mb-3 text-primary">Engagement Score</h4>
                    <p className="text-3xl font-bold text-slate-800 mb-2">94% Consistency</p>
                    <p className="text-sm text-slate-500 leading-relaxed">Your eye contact remained focused on the camera for 94% of the session duration.</p>
                  </div>
                </div>
                <div className="space-y-10 pt-4">
                  <h3 className="font-headline font-bold text-3xl">Expert Biometric Observation</h3>
                  <div className="prose prose-slate max-w-none text-slate-600 text-lg leading-loose">
                    <p>{report?.bodyLanguageReport}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     {[
                       { label: "Smile Frequency", value: "Natural" },
                       { label: "Blink Rate", value: "Normal" },
                       { label: "Posture", value: "Open" },
                       { label: "Stress Level", value: "Low" },
                     ].map((b, i) => (
                       <div key={i} className="p-6 rounded-2xl border border-slate-100 bg-white">
                          <span className="text-[10px] font-black text-slate-400 uppercase mb-1 block">{b.label}</span>
                          <span className="text-base font-bold text-slate-800">{b.value}</span>
                       </div>
                     ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coach">
          <Card className="bg-primary rounded-[3rem] text-white overflow-hidden relative border-none shadow-[0_30px_100px_rgba(var(--primary),0.4)]">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <CardHeader className="p-16 relative z-10">
              <CardTitle className="text-5xl font-headline font-bold mb-4">Neural Practice Routine</CardTitle>
              <CardDescription className="text-primary-foreground/80 text-xl">Daily actionable drills to reach your potential</CardDescription>
            </CardHeader>
            <CardContent className="px-16 pb-16 space-y-10 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  "Execute 2-minute elevator pitch drills with focal point",
                  "Deep-dive into STAR method for behavioral storytelling",
                  "Conscious pause technique to eliminate filler words",
                  "Technical concept articulation without technical jargon"
                ].map((task, i) => (
                  <div key={i} className="flex items-center gap-6 p-8 rounded-[2rem] bg-white/15 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all">
                    <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shrink-0 shadow-lg">
                      <ChevronRight className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold text-lg leading-tight">{task}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="secondary" className="flex-1 h-16 rounded-[2rem] text-xl font-black text-primary shadow-xl" asChild>
                  <Link href="/dashboard">Continue Professional Development</Link>
                </Button>
                <Button variant="outline" className="flex-1 h-16 rounded-[2rem] text-xl font-bold border-white/30 text-white bg-transparent hover:bg-white/10">
                   Schedule New Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
