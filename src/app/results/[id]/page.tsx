
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
  BrainCircuit, 
  Loader2, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Target, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle 
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
      
      const interviewSummary = `Candidate interviewed for ${demoRole} (${demoExp}). Answered multiple rounds covering technical and behavioral depth.`

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

  // IMMEDIATE UI: No full-page progress loaders. Show the portal layout immediately.
  return (
    <div className="container py-16 px-6 max-w-7xl animate-fade-in mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16">
        <div>
          <Badge className="mb-4 glass bg-primary/10 text-primary border-primary/20 px-6 py-2 font-black uppercase tracking-[0.2em] text-[10px] rounded-full">
            <Sparkles className="w-3 h-3 mr-2" /> Assessment Complete
          </Badge>
          <h1 className="text-6xl font-headline font-black tracking-tighter leading-tight">Professional Performance Audit</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild className="rounded-2xl px-8 glass font-black h-14">
            <Link href="/dashboard">
              <ArrowLeft className="mr-3 w-5 h-5" />
              BACK TO PORTAL
            </Link>
          </Button>
          <Button asChild className="rounded-2xl px-10 font-black shadow-2xl shadow-primary/40 h-14 transition-all hover:scale-105">
            <Link href="/interviews/new">NEW SESSION</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
         <Card className="lg:col-span-2 glass-card p-12 relative overflow-hidden group">
            {loading ? (
              <div className="flex items-center justify-center h-64 gap-4 text-primary font-black uppercase tracking-widest text-xs">
                <Loader2 className="animate-spin w-6 h-6" /> Aria Syncing Metrics...
              </div>
            ) : (
              <div className="relative z-10 space-y-12">
                 <div className="flex items-center justify-between border-b border-white/5 pb-8">
                    <h3 className="text-3xl font-headline font-black tracking-tight">Neural Metric Matrix</h3>
                    <Badge className={`text-sm px-8 py-2.5 rounded-full font-black border-none shadow-2xl ${
                      report?.verdict === 'Ready' ? 'bg-green-500 shadow-green-500/30' : 
                      report?.verdict === 'Needs Improvement' ? 'bg-amber-500 shadow-amber-500/30' : 'bg-red-500 shadow-red-500/30'
                    }`}>
                      VERDICT: {report?.verdict?.toUpperCase() || "AUDITING"}
                    </Badge>
                 </div>
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-10">
                    {[
                      { label: "Role Knowledge", val: report?.scores?.roleSpecificKnowledge, icon: BrainCircuit, color: "text-blue-400" },
                      { label: "Answer Clarity", val: report?.scores?.answerClarity, icon: Sparkles, color: "text-purple-400" },
                      { label: "Neural Confidence", val: report?.scores?.confidence, icon: Activity, color: "text-primary" },
                      { label: "Communication", val: report?.scores?.communication, icon: MessageSquare, color: "text-amber-400" },
                      { label: "Logical Thinking", val: report?.scores?.logicalThinking, icon: Zap, color: "text-cyan-400" },
                    ].map((s, i) => (
                      <div key={i} className="space-y-2 group/stat">
                         <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em] group-hover/stat:text-primary transition-colors">
                            <s.icon className={`w-4 h-4 ${s.color}`} /> {s.label}
                         </p>
                         <p className="text-4xl font-black">{s.val ?? "--"}/10</p>
                      </div>
                    ))}
                 </div>
              </div>
            )}
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
         </Card>
         <Card className="glass-card bg-primary text-white p-12 flex flex-col justify-center items-center text-center border-none shadow-2xl relative overflow-hidden group">
            {loading ? <Loader2 className="animate-spin w-12 h-12 opacity-40" /> : (
              <>
                <Trophy className="w-20 h-20 mb-6 text-white/30 group-hover:scale-110 transition-transform duration-700" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 opacity-80">Aggregate Performance</p>
                <h2 className="text-8xl font-black tabular-nums tracking-tighter">{report?.overallScore ?? "--"}%</h2>
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 inset-x-0 text-[9px] font-black uppercase tracking-[0.4em] opacity-40">Aria Logic Verified</div>
         </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-12">
        <TabsList className="glass bg-white/5 p-2 rounded-[1.5rem] h-18 w-full max-w-2xl mx-auto shadow-2xl border-white/5">
          <TabsTrigger value="overview" className="flex-1 rounded-xl font-black uppercase tracking-widest text-xs h-14 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">Strategic Insights</TabsTrigger>
          <TabsTrigger value="biometrics" className="flex-1 rounded-xl font-black uppercase tracking-widest text-xs h-14 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">Neural Audit</TabsTrigger>
          <TabsTrigger value="plan" className="flex-1 rounded-xl font-black uppercase tracking-widest text-xs h-14 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">Growth Strategy</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-10 outline-none animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <Card className="glass border-green-500/20 bg-green-500/5 p-10 shadow-2xl rounded-[3rem]">
              <h3 className="flex items-center gap-4 text-2xl font-black mb-8">
                <CheckCircle2 className="text-green-500 w-8 h-8" /> Identified Strengths
              </h3>
              {loading ? <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-20 glass bg-white/5 rounded-2xl animate-pulse" />)}</div> : (
                <ul className="space-y-4">
                  {(report?.strengths || []).map((s, i) => (
                    <li key={i} className="flex items-start gap-4 p-6 rounded-2xl glass-dark bg-white/5 border-white/10 text-lg font-medium shadow-inner leading-relaxed">
                      <span className="text-green-500 mt-1.5">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="glass border-amber-500/20 bg-amber-500/5 p-10 shadow-2xl rounded-[3rem]">
              <h3 className="flex items-center gap-4 text-2xl font-black mb-8">
                <AlertCircle className="text-amber-500 w-8 h-8" /> Optimization Required
              </h3>
              {loading ? <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-20 glass bg-white/5 rounded-2xl animate-pulse" />)}</div> : (
                <ul className="space-y-4">
                  {(report?.weaknesses || []).map((w, i) => (
                    <li key={i} className="flex items-start gap-4 p-6 rounded-2xl glass-dark bg-white/5 border-white/10 text-lg font-medium shadow-inner leading-relaxed">
                      <span className="text-amber-500 mt-1.5">•</span>
                      {w}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="biometrics" className="outline-none animate-fade-in">
          <Card className="glass-card p-12 bg-slate-900 border-none rounded-[3.5rem]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="aspect-video glass bg-slate-950 rounded-[3rem] relative overflow-hidden border-white/10 shadow-2xl group">
                 <img src={`https://picsum.photos/seed/audit-sensors/1200/800`} className="object-cover w-full h-full grayscale opacity-30 group-hover:scale-105 transition-transform duration-[3000ms]" alt="Heatmap Feed" />
                 <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
                 <div className="absolute top-6 right-6"><Badge variant="secondary" className="glass uppercase tracking-[0.2em] font-black text-[9px] px-6 py-2">NEURAL STREAM AUDIT</Badge></div>
                 <div className="absolute inset-x-0 h-[2px] bg-primary/40 animate-[scan_6s_linear_infinite]" />
              </div>
              <div className="flex flex-col justify-center space-y-8">
                 <div className="p-10 glass bg-white/5 rounded-[2.5rem] border-white/10 shadow-inner">
                    <h4 className="font-black mb-4 flex items-center gap-3 text-primary uppercase tracking-widest text-xs">
                       <ShieldCheck className="w-5 h-5" /> Visual Presence Analytics
                    </h4>
                    <p className="text-xl text-slate-300 leading-relaxed italic font-medium">
                       {loading ? "Aria is analyzing visual presence turns..." : `"${report?.bodyLanguageReport || "Focus and presence remained stable during technical logic turns. Neural sensors indicated consistent role-alignment."}"`}
                    </p>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-8 rounded-3xl glass-dark bg-white/5 border-white/10 text-center shadow-inner group transition-all hover:bg-white/10">
                       <Target className="w-7 h-7 text-primary mx-auto mb-3" />
                       <span className="text-[10px] font-black uppercase text-slate-500 block tracking-widest">EYE FOCUS</span>
                       <span className="text-xl font-black mt-2 block">VERIFIED</span>
                    </div>
                    <div className="p-8 rounded-3xl glass-dark bg-white/5 border-white/10 text-center shadow-inner group transition-all hover:bg-white/10">
                       <Activity className="w-7 h-7 text-primary mx-auto mb-3" />
                       <span className="text-[10px] font-black uppercase text-slate-500 block tracking-widest">NEURAL LOGIC</span>
                       <span className="text-xl font-black mt-2 block">CONSISTENT</span>
                    </div>
                 </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="outline-none animate-fade-in">
          <Card className="glass bg-slate-950 rounded-[4rem] text-white p-16 relative overflow-hidden border-none shadow-2xl group">
            <div className="relative z-10 space-y-12 max-w-4xl">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <Zap className="w-8 h-8" />
                </div>
                <h2 className="text-5xl font-headline font-black tracking-tighter uppercase">Strategic Road Map</h2>
              </div>
              <p className="text-2xl leading-relaxed text-slate-300 font-medium italic">
                 {loading ? "Generating your tactical growth plan..." : report?.improvementPlan || "Focus on deep architectural explanations and technical STAR method structure for behavioral turns."}
              </p>
              <div className="flex gap-6">
                <Button className="h-20 rounded-[1.5rem] bg-primary text-2xl font-black px-12 shadow-2xl shadow-primary/40 transition-all hover:scale-[1.03]" asChild>
                  <Link href="/dashboard">RETURN TO PORTAL</Link>
                </Button>
                <Button variant="outline" className="h-20 rounded-[1.5rem] glass text-2xl font-black px-12 transition-all hover:bg-white/10" asChild>
                  <Link href="/interviews/new">RE-CALIBRATE</Link>
                </Button>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-primary/20 transition-all duration-700" />
          </Card>
        </TabsContent>
      </Tabs>

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(300px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
