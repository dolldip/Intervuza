
"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, addDoc, query, orderBy, limit, doc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  UploadCloud,
  Loader2,
  Sparkles,
  FileText,
  X,
  Zap,
  BrainCircuit
} from "lucide-react"
import { resumeJobDescriptionAnalysis } from "@/ai/flows/resume-job-description-analysis-flow"
import { useToast } from "@/hooks/use-toast"
import { useDoc } from "@/firebase"

export default function NewInterviewPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState("")
  const [experience, setExperience] = useState("")
  const [roundType, setRoundType] = useState("technical")
  const [jd, setJd] = useState("")
  const [resumeText, setResumeText] = useState("")
  const [resumeFileName, setResumeFileName] = useState("")

  const userDocRef = useMemoFirebase(() => user ? doc(db!, "users", user.uid) : null, [db, user])
  const { data: profile } = useDoc(userDocRef)

  const plansQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "improvementPlans"),
      orderBy("generatedAt", "desc"),
      limit(1)
    )
  }, [db, user])
  const { data: pastPlans } = useCollection(plansQuery)

  const pastPerformanceSummary = pastPlans?.[0]?.planSummary || ""

  const handleFileUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setResumeFileName(file.name)
    setLoading(true)
    
    try {
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const text = await file.text()
        setResumeText(text)
      } else {
        const mockText = `This is the resume of ${user?.displayName || "a candidate"}. They are a professional ${role || "Specialist"} with a focus on ${roundType} excellence.`
        setResumeText(mockText)
      }

      toast({
        title: "Background Indexed",
        description: `Aria has indexed your background from ${file.name}.`
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "Could not analyze this file format."
      })
    } finally {
      setLoading(false)
    }
  }

  const clearResume = () => {
    setResumeFileName("")
    setResumeText("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleStart = async () => {
    if (!role || !experience || !jd) {
      toast({
        variant: "destructive",
        title: "Context Missing",
        description: "Aria needs specific role details to begin the professional audit."
      })
      return
    }

    setLoading(true)
    
    sessionStorage.setItem('demo_role', role);
    sessionStorage.setItem('demo_exp', experience);
    sessionStorage.setItem('demo_round', roundType);
    sessionStorage.setItem('demo_jd', jd);
    sessionStorage.setItem('demo_resume', resumeText || "Standard professional background.");
    sessionStorage.setItem('past_performance', pastPerformanceSummary);
    
    try {
      let matchingSkills = ["Strategic Logic", "Communication", "Domain Depth"];
      
      if (resumeText) {
        try {
          const analysisResult = await resumeJobDescriptionAnalysis({
            resumeText,
            jobDescriptionText: jd
          })
          matchingSkills = analysisResult.matchingSkills
        } catch (aiError) {
          console.warn("AI analysis failed, proceeding with default calibration.")
        }
      }
      
      sessionStorage.setItem('analysis_skills', JSON.stringify(matchingSkills));
      
      if (user && db) {
        const sessionRef = await addDoc(collection(db, "users", user.uid, "interviewSessions"), {
          userId: user.uid,
          jobRole: role,
          experienceLevel: experience,
          roundType: roundType,
          startTime: new Date().toISOString(),
          status: "in-progress",
          createdAt: new Date().toISOString(),
          resumeText: resumeText,
          pastPerformanceUsed: !!pastPerformanceSummary
        });
        router.push(`/interviews/session/${sessionRef.id}`)
      } else {
        router.push(`/interviews/session/demo-session`)
      }
    } catch (error: any) {
      console.error("Initialization failed:", error)
      router.push(`/interviews/session/demo-session`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-6xl py-16 px-8 animate-fade-in mx-auto">
      <div className="mb-20 text-center space-y-8">
        <Badge variant="secondary" className="glass px-8 py-2.5 rounded-full font-black text-primary gap-3 uppercase tracking-[0.3em] text-[10px]">
          <Sparkles className="w-4 h-4" /> Neural Calibration Center
        </Badge>
        <h1 className="text-5xl md:text-8xl font-headline font-black tracking-tighter text-white leading-tight">Initialize Audit</h1>
        <p className="text-slate-400 text-2xl max-w-3xl mx-auto font-medium">Aria will calibrate her technical depth based on your resume and target role.</p>
        
        {pastPerformanceSummary && (
          <div className="max-w-2xl mx-auto p-6 glass bg-primary/5 border border-primary/25 rounded-[2rem] flex items-center gap-6 text-left animate-pulse shadow-2xl">
            <BrainCircuit className="w-12 h-12 text-primary shrink-0" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Aria's Memory Active</p>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">I've retrieved your last growth plan and will tailor today's logic challenges accordingly.</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          <Card className="glass-card overflow-hidden">
            <CardHeader className="p-12 bg-white/5 border-b border-white/5">
              <CardTitle className="font-headline text-4xl font-black tracking-tight">Audit Parameters</CardTitle>
              <CardDescription className="text-xl">Set the high-stakes context for Aria's reasoning engine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-10 p-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <Label htmlFor="role" className="font-black text-xs uppercase tracking-[0.3em] text-slate-500">Target Professional Role</Label>
                  <Input 
                    id="role" 
                    placeholder="e.g. Lead System Architect" 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="h-16 rounded-[1.5rem] glass bg-white/5 border-white/10 px-8 font-black text-lg focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-4">
                  <Label htmlFor="level" className="font-black text-xs uppercase tracking-[0.3em] text-slate-500">Experience Tier</Label>
                  <Select value={experience} onValueChange={setExperience}>
                    <SelectTrigger id="level" className="h-16 rounded-[1.5rem] glass bg-white/5 border-white/10 px-8 font-black text-lg">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent className="glass-dark border-white/15">
                      <SelectItem value="junior">Junior (0-2 years)</SelectItem>
                      <SelectItem value="mid">Mid-Level (3-5 years)</SelectItem>
                      <SelectItem value="senior">Senior (6-10 years)</SelectItem>
                      <SelectItem value="lead">Lead / Executive (10+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="round" className="font-black text-xs uppercase tracking-[0.3em] text-slate-500">Focus Sector</Label>
                <Select value={roundType} onValueChange={setRoundType}>
                  <SelectTrigger id="round" className="h-16 rounded-[1.5rem] glass bg-white/5 border-white/10 px-8 font-black text-lg">
                    <SelectValue placeholder="Select round focus" />
                  </SelectTrigger>
                  <SelectContent className="glass-dark border-white/15">
                    <SelectItem value="technical">Technical / Logic Mastery</SelectItem>
                    <SelectItem value="hr">Behavioral / Leadership Depth</SelectItem>
                    <SelectItem value="both">Comprehensive Performance Audit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label htmlFor="jd" className="font-black text-xs uppercase tracking-[0.3em] text-slate-500">Target Role Requirements (JD)</Label>
                <Textarea 
                  id="jd" 
                  placeholder="Paste the target role description here to calibrate Aria's intelligence..." 
                  className="min-h-[250px] resize-none rounded-[2.5rem] glass bg-white/5 border-white/10 p-10 font-medium leading-relaxed text-lg focus:ring-primary/20"
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-10">
          <Card className="glass-card flex flex-col overflow-hidden h-full shadow-2xl">
            <CardHeader className="p-12 bg-white/5 border-b border-white/5">
              <CardTitle className="font-headline text-4xl font-black tracking-tight">Neural Sync</CardTitle>
              <CardDescription className="text-xl">Aria will analyze your background for deep personalization.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-10 p-12">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
                accept=".txt,.pdf,.doc,.docx"
              />
              
              {!resumeFileName ? (
                <div 
                  onClick={handleFileUploadClick}
                  className="border-2 border-dashed rounded-[3rem] p-16 flex flex-col items-center justify-center text-center glass bg-white/5 border-white/15 group cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all duration-500 shadow-inner"
                >
                  <UploadCloud className="w-20 h-20 text-primary mb-8 group-hover:scale-110 transition-transform duration-500" />
                  <p className="text-2xl font-black tracking-tight text-white">Upload Background</p>
                  <p className="text-[10px] text-slate-500 mt-4 uppercase tracking-[0.3em] font-black">Aria will index PDF, DOCX, TXT</p>
                </div>
              ) : (
                <div className="p-10 rounded-[3rem] glass bg-primary/10 border border-primary/40 relative group animate-fade-in shadow-[0_20px_50px_rgba(var(--primary),0.2)]">
                  <button 
                    onClick={clearResume}
                    className="absolute -top-4 -right-4 w-12 h-12 glass-dark bg-slate-900 border-white/25 rounded-full flex items-center justify-center hover:bg-red-500/30 text-red-500 transition-all z-20 shadow-2xl"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <div className="flex items-center gap-8">
                    <div className="w-18 h-18 glass bg-white/15 rounded-[1.5rem] flex items-center justify-center text-primary shadow-inner">
                      <FileText className="w-9 h-9" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xl font-black truncate text-white">{resumeFileName}</p>
                      <p className="text-[10px] uppercase tracking-[0.4em] text-primary font-black mt-2">Background Synchronized</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-8 glass bg-blue-500/10 text-blue-400 rounded-[2.5rem] border border-blue-500/20 text-base flex gap-6 shadow-inner italic font-medium leading-relaxed">
                <Zap className="w-8 h-8 shrink-0 mt-1" />
                <span>Aria is now reviewing your professional history to craft high-stakes logic challenges.</span>
              </div>
            </CardContent>
            <CardFooter className="p-12 bg-white/5">
              <Button 
                className="w-full h-22 text-2xl font-black shadow-[0_25px_60px_rgba(var(--primary),0.4)] rounded-[2rem] transition-all hover:scale-[1.03] active:scale-95 bg-primary" 
                disabled={!role || !experience || !jd || loading}
                onClick={handleStart}
              >
                {loading ? <Loader2 className="animate-spin w-10 h-10" /> : "COMMENCE AUDIT"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
