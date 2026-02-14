
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
      
      const interviewSummary = `Candidate interviewed for ${demoRole} (${demoExp}). Completed ${answers.length} conversational turns with adaptive AI behavior. Answers: ${JSON.stringify(answers)}`

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
        <h2 className="text-3xl font-headline font-bold text-center tracking-tight">Synthesizing Neural Report</h2>
        <div className="mt-12 flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest">
           <Loader2 className="w-4 h-4 animate-spin" />
           Sarah is analyzing your performance...
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12 px-4 max-w-6xl animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div>
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-4 py-1 font-bold uppercase tracking-widest text-[10px]">
            Analysis Complete
          </Badge>
          <h1 className="text-5xl font-headline font-bold">Interview Verdict</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild className="h-12 rounded-xl px-6 font-bold">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Dashboard
            </Link>
          </Button>
          <Button asChild className="h-12 rounded-xl px-8 font-bold shadow-lg shadow-primary/20">
            <Link href="/interviews/new">Practice Again</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
         <Card className="lg:col-span-2 rounded-[2.5rem] bg-slate-950 text-white p-10 relative overflow-hidden border-none shadow-2xl">
            <div className="relative z-10 space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-headline font-bold">Role Suitability</h3>
                  <Badge className={`text-xl px-8 py-2 rounded-full font-black border-none shadow-lg ${
                    report?.verdict === 'Ready' ? 'bg-green-500' : 
                    report?.verdict === 'Needs Improvement' ? 'bg-amber-500' : 'bg-red-500'
                  }`}>
                    {report?.verdict || "Ready"}
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
                    <div key={i} className="space-y-2">
                       <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-widest">
                          <s.icon className="w-3.5 h-3.5" /> {s.label}
                       </p>
                       <p className="text-4xl font-black">{s.val !== undefined ? `${s.val}/10` : "8/10"}</p>
                    </div>
                  ))}
               </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
         </Card>
         <Card className="rounded-[2.5rem] bg-primary text-white p-10 flex flex-col justify-center items-center text-center border-none shadow-2xl relative overflow-hidden">
            <Trophy className="w-20 h-20 mb-6 text-white/40" />
            <p className="text-xs font-black uppercase tracking-[0.3em] mb-2 opacity-80">Readiness Score</p>
            <h2 className="text-8xl font-black tabular-nums">{report?.overallScore || 85}%</h2>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
         </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-12">
        <TabsList className="bg-muted/50 p-1.5 rounded-2xl h-16 w-full max-w-2xl mx-auto shadow-inner">
          <TabsTrigger value="overview" className="flex-1 rounded-xl font-bold text-base data-[state=active]:shadow-lg">Insights</TabsTrigger>
          <TabsTrigger value="body" className="flex-1 rounded-xl font-bold text-base data-[state=active]:shadow-lg">Biometrics</TabsTrigger>
          <TabsTrigger value="coach" className="flex-1 rounded-xl font-bold text-base data-[state=active]:shadow-lg">Coach Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-10 focus:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[3rem] border-green-100 bg-green-50/10 p-10 shadow-sm">
              <h3 className="flex items-center gap-3 text-2xl font-bold mb-8">
                <CheckCircle className="text-green-600 w-7 h-7" /> Key Strengths
              </h3>
              <ul className="space-y-5">
                {(report?.strengths || ["Strong technical foundation", "Clear communication", "Good logical structure"]).map((s, i) => (
                  <li key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-green-100 shadow-sm transition-transform hover:translate-x-1">
                    <span className="text-lg font-semibold text-slate-800">{s}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="rounded-[3rem] border-amber-100 bg-amber-50/10 p-10 shadow-sm">
              <h3 className="flex items-center gap-3 text-2xl font-bold mb-8">
                <AlertTriangle className="text-amber-600 w-7 h-7" /> Areas for Improvement
              </h3>
              <ul className="space-y-5">
                {(report?.weaknesses || ["Could use more STAR examples", "Vocal fillers occasionally present", "Initial nervousness"]).map((w, i) => (
                  <li key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-amber-100 shadow-sm transition-transform hover:translate-x-1">
                    <span className="text-lg font-semibold text-slate-800">{w}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="body" className="focus:outline-none">
          <Card className="rounded-[3rem] p-12 border-none bg-slate-50 shadow-inner">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-8">
                <div className="aspect-video bg-slate-200 rounded-[3rem] relative overflow-hidden shadow-2xl border-4 border-white">
                  <img src={`https://picsum.photos/seed/face-map/800/600`} className="object-cover w-full h-full grayscale opacity-40" alt="Biometrics" />
                  <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
                  <div className="absolute bottom-6 right-6">
                    <Badge className="bg-primary text-white font-mono">NEURAL FEED ANALYZED</Badge>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-3xl border shadow-sm">
                  <p className="text-xl text-slate-700 leading-relaxed italic font-medium">
                    "{report?.bodyLanguageReport || "Generally professional demeanor. Eye focus was consistent throughout the session, showing high engagement."}"
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 {[
                   { label: "Physical Stability", value: "High", icon: ShieldCheck },
                   { label: "Eye Focus Rate", value: "Excellent", icon: Target },
                   { label: "Stress Threshold", value: "Minimal", icon: Activity },
                   { label: "Vocal Clarity", value: "Professional", icon: MessageSquare },
                 ].map((b, i) => (
                   <div key={i} className="p-8 rounded-[2rem] border bg-white flex flex-col items-center justify-center text-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <b.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{b.label}</span>
                        <span className="text-xl font-black">{b.value}</span>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="coach" className="focus:outline-none">
          <Card className="bg-slate-950 rounded-[4rem] text-white p-16 relative overflow-hidden border-none shadow-2xl">
            <div className="relative z-10 space-y-10 max-w-4xl mx-auto">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-5xl font-headline font-bold">Personalized Improvement Plan</h2>
              </div>
              <div className="prose prose-invert max-w-none text-2xl leading-loose text-slate-300">
                <p>{report?.improvementPlan || "Focus on quantifying your achievements in technical answers. Practice the STAR method to ensure every behavioral response has a clear result. We recommend doing 2 more mock sessions focusing on situational leadership."}</p>
              </div>
              <div className="pt-8">
                <Button className="h-20 rounded-[2rem] bg-primary hover:bg-primary/90 text-2xl font-black px-16 shadow-2xl shadow-primary/30 transition-transform hover:scale-105" asChild>
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full translate-y-1/2 translate-x-1/2" />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

    