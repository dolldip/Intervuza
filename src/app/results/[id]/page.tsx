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
      
      const interviewSummary = `Candidate interviewed for ${demoRole} (${demoExp}). Completed ${answers.length} turns.`

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
        <BrainCircuit className="w-24 h-24 text-primary animate-pulse mb-8" />
        <h2 className="text-3xl font-headline font-bold text-center">Synthesizing Neural Report</h2>
        <div className="mt-12 flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest">
           <Loader2 className="w-4 h-4 animate-spin" />
           Finalizing Recommendation
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12 px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div>
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-3 py-1">ASSESSMENT COMPLETED</Badge>
          <h1 className="text-5xl font-headline font-bold">Interview Verdict</h1>
        </div>
        <Button asChild className="h-12 rounded-xl px-8 font-bold"><Link href="/dashboard">Return to Dashboard</Link></Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
         <Card className="lg:col-span-2 rounded-[2.5rem] bg-slate-950 text-white p-10 relative overflow-hidden">
            <div className="relative z-10 space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-headline font-bold">Suitability Verdict</h3>
                  <Badge className={`text-xl px-6 py-2 rounded-full font-black ${
                    report?.verdict === 'Ready' ? 'bg-green-500' : 
                    report?.verdict === 'Needs Improvement' ? 'bg-amber-500' : 'bg-red-500'
                  }`}>
                    {report?.verdict}
                  </Badge>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {[
                    { label: "Knowledge", val: report?.scores.roleSpecificKnowledge, icon: BrainCircuit },
                    { label: "Clarity", val: report?.scores.answerClarity, icon: Sparkles },
                    { label: "Confidence", val: report?.scores.confidence, icon: Activity },
                    { label: "Communication", val: report?.scores.communication, icon: MessageSquare },
                    { label: "Logic", val: report?.scores.logicalThinking, icon: Zap },
                  ].map((s, i) => (
                    <div key={i} className="space-y-2">
                       <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2">
                          <s.icon className="w-3 h-3" /> {s.label}
                       </p>
                       <p className="text-3xl font-black">{s.val}/10</p>
                    </div>
                  ))}
               </div>
            </div>
         </Card>
         <Card className="rounded-[2.5rem] bg-primary text-white p-10 flex flex-col justify-center items-center text-center">
            <Trophy className="w-16 h-16 mb-6 opacity-50" />
            <p className="text-sm font-black uppercase tracking-widest mb-2">Readiness Score</p>
            <h2 className="text-7xl font-black">{report?.overallScore}%</h2>
         </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-12">
        <TabsList className="bg-muted/50 p-1 rounded-2xl h-14 w-full max-w-2xl mx-auto">
          <TabsTrigger value="overview" className="flex-1 rounded-xl font-bold">Insights</TabsTrigger>
          <TabsTrigger value="body" className="flex-1 rounded-xl font-bold">Biometrics</TabsTrigger>
          <TabsTrigger value="coach" className="flex-1 rounded-xl font-bold">Coach Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[2.5rem] border-green-100 bg-green-50/10 p-8">
              <h3 className="flex items-center gap-3 text-2xl font-bold mb-6">
                <CheckCircle className="text-green-600 w-6 h-6" /> Strengths
              </h3>
              <ul className="space-y-4">
                {report?.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-green-50 shadow-sm">
                    <span className="text-base font-semibold">{s}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="rounded-[2.5rem] border-amber-100 bg-amber-50/10 p-8">
              <h3 className="flex items-center gap-3 text-2xl font-bold mb-6">
                <AlertTriangle className="text-amber-600 w-6 h-6" /> Areas to Improve
              </h3>
              <ul className="space-y-4">
                {report?.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-amber-50 shadow-sm">
                    <span className="text-base font-semibold">{w}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="body">
          <Card className="rounded-[3rem] p-12 border-none bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-8">
                <div className="aspect-video bg-slate-200 rounded-[2.5rem] relative overflow-hidden">
                  <img src={`https://picsum.photos/seed/face-map/800/600`} className="object-cover w-full h-full opacity-60" alt="Biometrics" />
                </div>
                <p className="text-lg text-slate-700 leading-relaxed">{report?.bodyLanguageReport}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 {[
                   { label: "Vocal Clarity", value: "Normal", icon: MessageSquare },
                   { label: "Eye Focus", value: "High", icon: Target },
                   { label: "Stability", value: "Good", icon: ShieldCheck },
                   { label: "Stress", value: "Low", icon: Activity },
                 ].map((b, i) => (
                   <div key={i} className="p-6 rounded-2xl border bg-white flex flex-col gap-2">
                      <b.icon className="w-5 h-5 text-primary opacity-50" />
                      <span className="text-[10px] font-black text-slate-400 uppercase">{b.label}</span>
                      <span className="text-base font-bold">{b.value}</span>
                   </div>
                 ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="coach">
          <Card className="bg-slate-950 rounded-[3rem] text-white p-16 relative overflow-hidden">
            <h2 className="text-5xl font-headline font-bold mb-8 relative z-10">Improvement Plan</h2>
            <div className="prose prose-invert max-w-none text-xl relative z-10">
              <p>{report?.improvementPlan}</p>
            </div>
            <Button className="mt-12 h-16 rounded-2xl bg-primary text-xl font-bold px-12" asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
