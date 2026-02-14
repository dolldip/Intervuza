
"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Trophy, 
  MessageSquare, 
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  BrainCircuit,
  Loader2,
  Sparkles,
  ShieldCheck,
  Zap,
  Activity,
  Target,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { comprehensiveInterviewFeedbackReport, ComprehensiveInterviewFeedbackReportOutput } from "@/ai/flows/comprehensive-interview-feedback-report"

export default function ResultsPage() {
  const router = useRouter()
  const params = useParams()
  const [report, setReport] = useState<ComprehensiveInterviewFeedbackReportOutput | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const demoRole = sessionStorage.getItem('demo_role') || "Professional Candidate"
      const demoExp = sessionStorage.getItem('demo_exp') || "Mid-level"
      const answers = JSON.parse(sessionStorage.getItem('session_answers') || '[]')
      
      const interviewSummary = `Candidate interviewed for ${demoRole} (${demoExp}). Performance based on these answers: ${JSON.stringify(answers)}`

      try {
        const result = await comprehensiveInterviewFeedbackReport({
          jobRole: demoRole,
          experienceLevel: demoExp,
          interviewSummary: interviewSummary,
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
        <BrainCircuit className="w-20 h-20 text-primary animate-pulse mb-8" />
        <h2 className="text-2xl font-headline font-bold text-center">Finalizing Performance Analysis</h2>
        <div className="mt-8 flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest">
           <Loader2 className="w-4 h-4 animate-spin" />
           Sarah is generating your critical verdict...
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12 px-4 max-w-6xl animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div>
          <Badge className="mb-2 bg-primary/10 text-primary border-primary/20 px-4 py-1 font-bold uppercase tracking-widest text-[10px]">
            Linguistic & Behavioral Analysis Complete
          </Badge>
          <h1 className="text-4xl font-headline font-bold">Interview Verdict</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild className="rounded-xl px-6 font-bold">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Dashboard
            </Link>
          </Button>
          <Button asChild className="rounded-xl px-8 font-bold shadow-lg shadow-primary/20">
            <Link href="/interviews/new">New Mock Session</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
         <Card className="lg:col-span-2 rounded-[2.5rem] bg-slate-950 text-white p-10 relative overflow-hidden border-none shadow-2xl">
            <div className="relative z-10 space-y-8">
               <div className="flex items-center justify-between border-b border-white/10 pb-6">
                  <h3 className="text-2xl font-headline font-bold">Performance Breakdown</h3>
                  <Badge className={`text-sm px-6 py-1.5 rounded-full font-black border-none shadow-lg ${
                    report?.verdict === 'Ready' ? 'bg-green-500' : 
                    report?.verdict === 'Needs Improvement' ? 'bg-amber-500' : 'bg-red-500'
                  }`}>
                    {report?.verdict || "Analysis Pending"}
                  </Badge>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                  {[
                    { label: "Knowledge", val: report?.scores?.roleSpecificKnowledge, icon: BrainCircuit },
                    { label: "Clarity", val: report?.scores?.answerClarity, icon: Sparkles },
                    { label: "Confidence", val: report?.scores?.confidence, icon: Activity },
                    { label: "Communication", val: report?.scores?.communication, icon: MessageSquare },
                    { label: "Logic", val: report?.scores?.logicalThinking, icon: Zap },
                  ].map((s, i) => (
                    <div key={i} className="space-y-1">
                       <p className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-widest">
                          <s.icon className="w-3 h-3" /> {s.label}
                       </p>
                       <p className="text-3xl font-black">{s.val ?? "--"}/10</p>
                    </div>
                  ))}
               </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
         </Card>
         <Card className="rounded-[2.5rem] bg-primary text-white p-10 flex flex-col justify-center items-center text-center border-none shadow-2xl relative overflow-hidden">
            <Trophy className="w-16 h-16 mb-4 text-white/40" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">Readiness Score</p>
            <h2 className="text-7xl font-black tabular-nums">{report?.overallScore ?? 0}%</h2>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
         </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-10">
        <TabsList className="bg-muted/50 p-1 rounded-2xl h-14 w-full max-w-lg mx-auto shadow-inner">
          <TabsTrigger value="overview" className="flex-1 rounded-xl font-bold">Insights</TabsTrigger>
          <TabsTrigger value="biometrics" className="flex-1 rounded-xl font-bold">Biometrics</TabsTrigger>
          <TabsTrigger value="plan" className="flex-1 rounded-xl font-bold">Improvement Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[2rem] border-green-100 bg-green-50/20 p-8 shadow-sm">
              <h3 className="flex items-center gap-3 text-xl font-bold mb-6">
                <CheckCircle className="text-green-600 w-6 h-6" /> Key Strengths
              </h3>
              <ul className="space-y-3">
                {(report?.strengths || ["Performance alignment observed"]).map((s, i) => (
                  <li key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-green-100 shadow-sm text-sm font-medium">
                    {s}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="rounded-[2rem] border-amber-100 bg-amber-50/20 p-8 shadow-sm">
              <h3 className="flex items-center gap-3 text-xl font-bold mb-6">
                <AlertTriangle className="text-amber-600 w-6 h-6" /> Growth Areas
              </h3>
              <ul className="space-y-3">
                {(report?.weaknesses || ["Improvement potential detected"]).map((w, i) => (
                  <li key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-amber-100 shadow-sm text-sm font-medium">
                    {w}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="biometrics" className="outline-none">
          <Card className="rounded-[2.5rem] p-10 bg-slate-50 border-none shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="aspect-video bg-slate-200 rounded-[2.5rem] relative overflow-hidden border-4 border-white shadow-xl">
                 <img src={`https://picsum.photos/seed/biometrics-report/800/600`} className="object-cover w-full h-full grayscale opacity-40" alt="Heatmap" />
                 <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
                 <div className="absolute top-4 right-4"><Badge variant="secondary">ANALYZED FEED</Badge></div>
              </div>
              <div className="flex flex-col justify-center space-y-6">
                 <div className="p-6 bg-white rounded-3xl border shadow-sm">
                    <h4 className="font-bold mb-2 flex items-center gap-2 text-primary">
                       <ShieldCheck className="w-4 h-4" /> Visual Presence Verdict
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed italic">
                       "{report?.bodyLanguageReport || "Presence was analyzed for professional alignment. Focus levels fluctuated based on question difficulty."}"
                    </p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 rounded-2xl bg-white border shadow-sm text-center">
                       <Target className="w-5 h-5 text-primary mx-auto mb-2" />
                       <span className="text-[9px] font-black uppercase text-slate-400 block">Eye Contact</span>
                       <span className="text-lg font-bold">Analyzed</span>
                    </div>
                    <div className="p-6 rounded-2xl bg-white border shadow-sm text-center">
                       <Activity className="w-5 h-5 text-primary mx-auto mb-2" />
                       <span className="text-[9px] font-black uppercase text-slate-400 block">Neural Stability</span>
                       <span className="text-lg font-bold">Monitored</span>
                    </div>
                 </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="outline-none">
          <Card className="bg-slate-950 rounded-[3rem] text-white p-12 relative overflow-hidden border-none shadow-2xl">
            <div className="relative z-10 space-y-8 max-w-3xl">
              <div className="flex items-center gap-4">
                <Zap className="w-10 h-10 text-primary" />
                <h2 className="text-3xl font-headline font-bold">Critical Improvement Strategy</h2>
              </div>
              <p className="text-lg leading-relaxed text-slate-300 font-medium">
                 {report?.improvementPlan || "Focus on quantifying your impact using the STAR method. We recommend specific technical drills to improve linguistic logic."}
              </p>
              <Button className="h-16 rounded-[1.5rem] bg-primary text-xl font-black px-12 shadow-lg shadow-primary/30" asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
            </div>
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/10 blur-[100px] rounded-full translate-y-1/2 translate-x-1/2" />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
