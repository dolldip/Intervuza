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
  Sparkles,
  ShieldCheck,
  Zap,
  Activity,
  Target
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
      
      const interviewSummary = `Candidate interviewed for ${demoRole} (${demoExp}). Completed ${answers.length} total questions across Technical and HR rounds.`

      try {
        const result = await comprehensiveInterviewFeedbackReport({
          jobRole: demoRole,
          experienceLevel: demoExp,
          interviewSummary: interviewSummary,
          overallTextAnalysisFeedback: "Technical depth was solid. Communication was professional.",
          overallVoiceAnalysisFeedback: "Tone was clear and confident.",
          overallCameraAnalysisFeedback: "Good eye focus detected.",
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
        <h2 className="text-3xl font-headline font-bold text-center">Synthesizing Neural Report</h2>
        <p className="text-slate-400 mt-4 text-center max-w-md">
          Sarah is aggregating your biometric and verbal performance data...
        </p>
        <div className="mt-12 flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest">
           <Loader2 className="w-4 h-4 animate-spin" />
           Finalizing Recommendation
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12 px-4 max-w-6xl animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div>
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-3 py-1">FINAL ASSESSMENT COMPLETED</Badge>
          <h1 className="text-5xl font-headline font-bold mb-2">Performance Dashboard</h1>
          <p className="text-muted-foreground text-xl">
            {sessionStorage.getItem('demo_role') || "Candidate"} • {new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-12 rounded-xl"><Download className="mr-2 w-4 h-4" /> Export Report</Button>
          <Button asChild className="h-12 rounded-xl px-8 font-bold shadow-lg shadow-primary/20"><Link href="/dashboard">Dashboard</Link></Button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
         <Card className="lg:col-span-2 rounded-[2.5rem] shadow-xl border-none bg-slate-950 text-white p-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 opacity-5">
               <ShieldCheck className="w-64 h-64" />
            </div>
            <div className="relative z-10 space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-headline font-bold">Hiring Recommendation</h3>
                  <Badge className={`text-xl px-6 py-2 rounded-full font-black ${
                    report?.hiringRecommendation === 'Yes' ? 'bg-green-500' : 
                    report?.hiringRecommendation === 'Maybe' ? 'bg-amber-500' : 'bg-red-500'
                  }`}>
                    {report?.hiringRecommendation}
                  </Badge>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {[
                    { label: "Readiness", val: report?.readinessScore, icon: Zap },
                    { label: "Technical", val: report?.technicalAccuracyScore, icon: BrainCircuit },
                    { label: "Communication", val: report?.communicationScore, icon: MessageSquare },
                    { label: "Professionalism", val: report?.professionalismScore, icon: UserCircle },
                  ].map((s, i) => (
                    <div key={i} className="space-y-2">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <s.icon className="w-3 h-3" /> {s.label}
                       </p>
                       <p className="text-3xl font-black">{s.val}%</p>
                    </div>
                  ))}
               </div>
            </div>
         </Card>
         <Card className="rounded-[2.5rem] shadow-xl border-none bg-primary text-white p-10 flex flex-col justify-center items-center text-center">
            <Trophy className="w-16 h-16 mb-6 opacity-50" />
            <p className="text-sm font-black uppercase tracking-widest mb-2 opacity-80">Overall Score</p>
            <h2 className="text-7xl font-black tracking-tighter">{report?.overallScore}%</h2>
            <p className="mt-4 text-primary-foreground/80 font-medium">Top 15% of candidates for this role.</p>
         </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-12">
        <TabsList className="bg-muted/50 p-1.5 border rounded-2xl h-14 flex w-full max-w-3xl mx-auto shadow-sm">
          <TabsTrigger value="overview" className="flex-1 rounded-xl font-bold">Insights</TabsTrigger>
          <TabsTrigger value="qa" className="flex-1 rounded-xl font-bold">Q&A Deep Dive</TabsTrigger>
          <TabsTrigger value="body" className="flex-1 rounded-xl font-bold">Biometrics</TabsTrigger>
          <TabsTrigger value="coach" className="flex-1 rounded-xl font-bold">Sarah's Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[2.5rem] border-green-100 shadow-sm bg-green-50/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-green-100 rounded-xl">
                    <CheckCircle className="text-green-600 w-6 h-6" />
                  </div>
                  Core Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-4">
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
                  Refinement Needed
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-4">
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

          <Card className="rounded-[3rem] shadow-xl border-none overflow-hidden bg-slate-50">
            <div className="p-12">
               <h3 className="text-3xl font-headline font-bold mb-6 flex items-center gap-3">
                  <TrendingUp className="text-primary w-8 h-8" />
                  Strategic Summary
               </h3>
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
                  <Button variant="outline" className="rounded-2xl border-primary/20 text-primary whitespace-nowrap"><PlayCircle className="mr-2 w-4 h-4" /> View Feedback</Button>
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
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Sarah's Evaluation</h4>
                  <p className="text-base text-slate-600 leading-relaxed">{qa.feedback}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="body">
          <Card className="rounded-[3rem] shadow-2xl overflow-hidden border-none">
            <CardHeader className="p-12 bg-slate-900 text-white">
              <CardTitle className="text-3xl font-headline">Neural Interaction Mapping</CardTitle>
              <CardDescription className="text-slate-400 text-lg">Detailed analysis of micro-expressions and eye focus</CardDescription>
            </CardHeader>
            <CardContent className="p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
                <div className="space-y-8">
                  <div className="aspect-video bg-slate-100 rounded-[2.5rem] relative overflow-hidden group shadow-inner">
                    <img 
                      src={`https://picsum.photos/seed/face-map/800/600`} 
                      className="object-cover w-full h-full opacity-70 grayscale-[0.2]" 
                      alt="Face Map"
                    />
                    <div className="absolute inset-0 border-[30px] border-black/10 rounded-[2.5rem] m-6 pointer-events-none" />
                    <div className="absolute top-8 left-8 bg-primary text-white px-4 py-2 rounded-2xl text-[10px] font-black tracking-widest shadow-2xl">LIVE_MAP_V4</div>
                  </div>
                  <div className="p-8 rounded-[2rem] border bg-slate-50 shadow-sm">
                    <h4 className="font-black text-xs uppercase tracking-widest mb-3 text-primary">Engagement Stability</h4>
                    <p className="text-3xl font-bold text-slate-800 mb-2">94% Target Focus</p>
                    <p className="text-sm text-slate-500 leading-relaxed">Your eye focus remained professional and engaged for the majority of the assessment.</p>
                  </div>
                </div>
                <div className="space-y-10 pt-4">
                  <h3 className="font-headline font-bold text-3xl">Professional Observations</h3>
                  <div className="prose prose-slate max-w-none text-slate-600 text-lg leading-loose">
                    <p>{report?.bodyLanguageReport}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     {[
                       { label: "Stability", value: "High", icon: ShieldCheck },
                       { label: "Eye Focus", value: "Excellent", icon: Target },
                       { label: "Stress Markers", value: "Minimal", icon: Activity },
                       { label: "Vocal Clarity", value: "Normal", icon: MessageSquare },
                     ].map((b, i) => (
                       <div key={i} className="p-6 rounded-2xl border border-slate-100 bg-white flex items-center gap-4">
                          <b.icon className="w-5 h-5 text-primary opacity-50" />
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase block">{b.label}</span>
                            <span className="text-base font-bold text-slate-800">{b.value}</span>
                          </div>
                       </div>
                     ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coach">
          <Card className="bg-slate-950 rounded-[3rem] text-white overflow-hidden relative border-none shadow-2xl">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <CardHeader className="p-16 relative z-10">
              <CardTitle className="text-5xl font-headline font-bold mb-4">Neural Training Routine</CardTitle>
              <CardDescription className="text-slate-400 text-xl">Personalized daily drills recommended by Sarah</CardDescription>
            </CardHeader>
            <CardContent className="px-16 pb-16 space-y-10 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  "Conduct 2-minute 'Elevator Pitch' drills in front of a mirror",
                  "Master the STAR method for behavioral story-telling",
                  "Practice 'Conscious Pausing' to eliminate filler words",
                  "Technical scenario articulation without using jargon"
                ].map((task, i) => (
                  <div key={i} className="flex items-center gap-6 p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-default">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg">
                      <ChevronRight className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold text-lg leading-tight">{task}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <Button className="flex-1 h-16 rounded-[2rem] text-xl font-black bg-primary hover:bg-primary/90 shadow-xl" asChild>
                  <Link href="/dashboard">Return to Development</Link>
                </Button>
                <Button variant="outline" className="flex-1 h-16 rounded-[2rem] text-xl font-bold border-white/20 text-white bg-white/5 hover:bg-white/10">
                   Export Training PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
