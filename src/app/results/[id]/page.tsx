
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

  return (
    <div className="container py-8 md:py-16 px-4 md:px-6 max-w-7xl animate-fade-in mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-10 mb-8 md:mb-16">
        <div className="text-center lg:text-left">
          <Badge className="mb-4 glass bg-primary/10 text-primary border-primary/20 px-4 py-1.5 md:px-6 md:py-2 font-black uppercase tracking-[0.2em] text-[9px] md:text-[10px] rounded-full">
            <Sparkles className="w-3 h-3 mr-2" /> Assessment Complete
          </Badge>
          <h1 className="text-3xl md:text-6xl font-headline font-black tracking-tighter leading-tight">Professional Performance Audit</h1>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button variant="outline" asChild className="w-full sm:w-auto rounded-xl md:rounded-2xl px-8 glass font-black h-12 md:h-14">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5" />
              BACK TO PORTAL
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto rounded-xl md:rounded-2xl px-8 md:px-10 font-black shadow-2xl shadow-primary/40 h-12 md:h-14 transition-all hover:scale-105">
            <Link href="/interviews/new">NEW SESSION</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10 mb-8 md:mb-16">
         <Card className="lg:col-span-2 glass-card p-6 md:p-12 relative overflow-hidden group">
            {loading ? (
              <div className="flex items-center justify-center h-48 md:h-64 gap-4 text-primary font-black uppercase tracking-widest text-[10px] md:text-xs">
                <Loader2 className="animate-spin w-5 h-5 md:w-6 md:h-6" /> Aria Syncing Metrics...
              </div>
            ) : (
              <div className="relative z-10 space-y-8 md:space-y-12">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-6 md:pb-8 gap-4">
                    <h3 className="text-xl md:text-3xl font-headline font-black tracking-tight">Neural Metric Matrix</h3>
                    <Badge className={`text-xs md:text-sm px-4 md:px-8 py-1.5 md:py-2.5 rounded-full font-black border-none shadow-2xl w-fit ${
                      report?.verdict === 'Ready' ? 'bg-green-500 shadow-green-500/30' : 
                      report?.verdict === 'Needs Improvement' ? 'bg-amber-500 shadow-amber-500/30' : 'bg-red-500 shadow-red-500/30'
                    }`}>
                      VERDICT: {report?.verdict?.toUpperCase() || "AUDITING"}
                    </Badge>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-10">
                    {[
                      { label: "Role Knowledge", val: report?.scores?.roleSpecificKnowledge, icon: BrainCircuit, color: "text-blue-400" },
                      { label: "Answer Clarity", val: report?.scores?.answerClarity, icon: Sparkles, color: "text-purple-400" },
                      { label: "Neural Confidence", val: report?.scores?.confidence, icon: Activity, color: "text-primary" },
                      { label: "Communication", val: report?.scores?.communication, icon: MessageSquare, color: "text-amber-400" },
                      { label: "Logical Thinking", val: report?.scores?.logicalThinking, icon: Zap, color: "text-cyan-400" },
                    ].map((s, i) => (
                      <div key={i} className="space-y-1 md:space-y-2 group/stat">
                         <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em] group-hover/stat:text-primary transition-colors">
                            <s.icon className={`w-3 h-3 md:w-4 md:h-4 ${s.color}`} /> {s.label}
                         </p>
                         <p className="text-2xl md:text-4xl font-black">{s.val ?? "--"}/10</p>
                      </div>
                    ))}
                 </div>
              </div>
            )}
            <div className="absolute top-0 right-0 w-48 md:w-80 h-48 md:h-80 bg-primary/10 blur-[80px] md:blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
         </Card>
         <Card className="glass-card bg-primary text-white p-8 md:p-12 flex flex-col justify-center items-center text-center border-none shadow-2xl relative overflow-hidden group">
            {loading ? <Loader2 className="animate-spin w-10 h-10 md:w-12 md:h-12 opacity-40" /> : (
              <>
                <Trophy className="w-16 h-16 md:w-20 md:h-20 mb-4 md:mb-6 text-white/30 group-hover:scale-110 transition-transform duration-700" />
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] mb-2 md:mb-3 opacity-80">Aggregate Score</p>
                <h2 className="text-6xl md:text-8xl font-black tabular-nums tracking-tighter">{report?.overallScore ?? "--"}%</h2>
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <div className="absolute bottom-2 md:bottom-4 inset-x-0 text-[7px] md:text-[9px] font-black uppercase tracking-[0.4em] opacity-40">Aria Logic Verified</div>
         </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-8 md:space-y-12">
        <TabsList className="glass bg-white/5 p-1.5 md:p-2 rounded-xl md:rounded-[1.5rem] h-auto w-full max-w-2xl mx-auto shadow-2xl border-white/5 flex flex-col sm:flex-row">
          <TabsTrigger value="overview" className="flex-1 rounded-lg md:rounded-xl font-black uppercase tracking-widest text-[10px] h-10 md:h-14 data-[state=active]:bg-primary data-[state=active]:text-white transition-all w-full">Insights</TabsTrigger>
          <TabsTrigger value="biometrics" className="flex-1 rounded-lg md:rounded-xl font-black uppercase tracking-widest text-[10px] h-10 md:h-14 data-[state=active]:bg-primary data-[state=active]:text-white transition-all w-full">Biometrics</TabsTrigger>
          <TabsTrigger value="plan" className="flex-1 rounded-lg md:rounded-xl font-black uppercase tracking-widest text-[10px] h-10 md:h-14 data-[state=active]:bg-primary data-[state=active]:text-white transition-all w-full">Growth</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 md:space-y-10 outline-none animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            <Card className="glass border-green-500/20 bg-green-500/5 p-6 md:p-10 shadow-2xl rounded-[1.5rem] md:rounded-[3rem]">
              <h3 className="flex items-center gap-3 md:gap-4 text-xl md:text-2xl font-black mb-6 md:mb-8">
                <CheckCircle2 className="text-green-500 w-6 h-6 md:w-8 md:h-8" /> Strengths
              </h3>
              {loading ? <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-16 md:h-20 glass bg-white/5 rounded-xl animate-pulse" />)}</div> : (
                <ul className="space-y-3 md:space-y-4">
                  {(report?.strengths || []).map((s, i) => (
                    <li key={i} className="flex items-start gap-3 md:gap-4 p-4 md:p-6 rounded-xl md:rounded-2xl glass-dark bg-white/5 border-white/10 text-sm md:text-lg font-medium shadow-inner leading-relaxed">
                      <span className="text-green-500 mt-1.5">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="glass border-amber-500/20 bg-amber-500/5 p-6 md:p-10 shadow-2xl rounded-[1.5rem] md:rounded-[3rem]">
              <h3 className="flex items-center gap-3 md:gap-4 text-xl md:text-2xl font-black mb-6 md:mb-8">
                <AlertCircle className="text-amber-500 w-6 h-6 md:w-8 md:h-8" /> Required
              </h3>
              {loading ? <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-16 md:h-20 glass bg-white/5 rounded-xl animate-pulse" />)}</div> : (
                <ul className="space-y-3 md:space-y-4">
                  {(report?.weaknesses || []).map((w, i) => (
                    <li key={i} className="flex items-start gap-3 md:gap-4 p-4 md:p-6 rounded-xl md:rounded-2xl glass-dark bg-white/5 border-white/10 text-sm md:text-lg font-medium shadow-inner leading-relaxed">
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
          <Card className="glass-card p-6 md:p-12 bg-slate-900 border-none rounded-[1.5rem] md:rounded-[3.5rem]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
              <div className="aspect-video glass bg-slate-950 rounded-[1rem] md:rounded-[3rem] relative overflow-hidden border-white/10 shadow-2xl group">
                 <img src={`https://picsum.photos/seed/audit-sensors/1200/800`} className="object-cover w-full h-full grayscale opacity-30 group-hover:scale-105 transition-transform duration-[3000ms]" alt="Heatmap Feed" />
                 <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
                 <div className="absolute top-4 right-4 md:top-6 md:right-6"><Badge variant="secondary" className="glass uppercase tracking-[0.2em] font-black text-[7px] md:text-[9px] px-3 py-1 md:px-6 md:py-2">NEURAL AUDIT</Badge></div>
                 <div className="absolute inset-x-0 h-[1px] md:h-[2px] bg-primary/40 animate-[scan_6s_linear_infinite]" />
              </div>
              <div className="flex flex-col justify-center space-y-6 md:space-y-8">
                 <div className="p-6 md:p-10 glass bg-white/5 rounded-xl md:rounded-[2.5rem] border-white/10 shadow-inner">
                    <h4 className="font-black mb-3 md:mb-4 flex items-center gap-2 md:gap-3 text-primary uppercase tracking-widest text-[9px] md:text-xs">
                       <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" /> Presence Analytics
                    </h4>
                    <p className="text-base md:text-xl text-slate-300 leading-relaxed italic font-medium">
                       {loading ? "Aria is analyzing visual presence..." : `"${report?.bodyLanguageReport || "Focus and presence remained stable during technical logic turns."}"`}
                    </p>
                 </div>
                 <div className="grid grid-cols-2 gap-4 md:gap-6">
                    <div className="p-4 md:p-8 rounded-2xl md:rounded-3xl glass-dark bg-white/5 border-white/10 text-center shadow-inner">
                       <Target className="w-5 h-5 md:w-7 md:h-7 text-primary mx-auto mb-2 md:mb-3" />
                       <span className="text-[7px] md:text-[10px] font-black uppercase text-slate-500 block tracking-widest">FOCUS</span>
                       <span className="text-base md:text-xl font-black mt-1 md:mt-2 block">VERIFIED</span>
                    </div>
                    <div className="p-4 md:p-8 rounded-2xl md:rounded-3xl glass-dark bg-white/5 border-white/10 text-center shadow-inner">
                       <Activity className="w-5 h-5 md:w-7 md:h-7 text-primary mx-auto mb-2 md:mb-3" />
                       <span className="text-[7px] md:text-[10px] font-black uppercase text-slate-500 block tracking-widest">LOGIC</span>
                       <span className="text-base md:text-xl font-black mt-1 md:mt-2 block">CONSISTENT</span>
                    </div>
                 </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="outline-none animate-fade-in">
          <Card className="glass bg-slate-950 rounded-[2rem] md:rounded-[4rem] text-white p-8 md:p-16 relative overflow-hidden border-none shadow-2xl group">
            <div className="relative z-10 space-y-8 md:space-y-12 max-w-4xl text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <Zap className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h2 className="text-3xl md:text-5xl font-headline font-black tracking-tighter uppercase">Road Map</h2>
              </div>
              <p className="text-lg md:text-2xl leading-relaxed text-slate-300 font-medium italic">
                 {loading ? "Generating tactical plan..." : report?.improvementPlan || "Focus on deep architectural explanations and technical STAR method structure."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center md:justify-start">
                <Button className="h-14 md:h-20 rounded-xl md:rounded-[1.5rem] bg-primary text-lg md:text-2xl font-black px-8 md:px-12 shadow-2xl transition-all hover:scale-[1.03]" asChild>
                  <Link href="/dashboard">BACK TO PORTAL</Link>
                </Button>
                <Button variant="outline" className="h-14 md:h-20 rounded-xl md:rounded-[1.5rem] glass text-lg md:text-2xl font-black px-8 md:px-12 transition-all hover:bg-white/10" asChild>
                  <Link href="/interviews/new">RE-CALIBRATE</Link>
                </Button>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/10 blur-[100px] md:blur-[150px] rounded-full translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-primary/20 transition-all duration-700" />
          </Card>
        </TabsContent>
      </Tabs>

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(200px); opacity: 0; }
        }
        @media (min-width: 768px) {
          @keyframes scan {
            0% { transform: translateY(0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(300px); opacity: 0; }
          }
        }
      `}</style>
    </div>
  )
}
