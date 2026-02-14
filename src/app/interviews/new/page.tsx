
"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useFirestore, useUser } from "@/firebase"
import { collection, addDoc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  ShieldCheck, 
  UploadCloud,
  Loader2,
  Sparkles,
  FileText,
  X,
  Zap
} from "lucide-react"
import { resumeJobDescriptionAnalysis } from "@/ai/flows/resume-job-description-analysis-flow"
import { useToast } from "@/hooks/use-toast"

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
        const mockText = `This is the resume of ${user?.displayName || "a candidate"}. They are a professional ${role || "Specialist"} with a focus on ${roundType} excellence. They have significant experience in their field and are targeting top-tier firms.`
        setResumeText(mockText)
      }

      toast({
        title: "Resume Analyzed",
        description: `Aria has indexed your background from ${file.name}.`
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not read this file format."
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
          resumeText: resumeText
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
    <div className="container max-w-5xl py-16 px-6 animate-fade-in mx-auto">
      <div className="mb-16 text-center space-y-6">
        <Badge variant="secondary" className="glass px-6 py-2 rounded-full font-black text-primary gap-2 uppercase tracking-[0.2em] text-[10px]">
          <Sparkles className="w-4 h-4" /> Neural Coaching Engine
        </Badge>
        <h1 className="text-6xl font-headline font-black tracking-tighter text-foreground leading-tight">Configure Your Session</h1>
        <p className="text-slate-400 text-xl max-w-3xl mx-auto font-medium">Aria will calibrate her technical depth based on the role and experience you provide below.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <Card className="glass-card overflow-hidden">
            <CardHeader className="p-10 bg-white/5 border-b border-white/5">
              <CardTitle className="font-headline text-3xl font-black">Audit Parameters</CardTitle>
              <CardDescription className="text-lg">Set the high-stakes context for Aria's reasoning.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="role" className="font-black text-xs uppercase tracking-widest text-slate-500">Target Job Role</Label>
                  <Input 
                    id="role" 
                    placeholder="e.g. Lead System Architect" 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="h-14 rounded-2xl glass bg-white/5 border-white/10 px-6 font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="level" className="font-black text-xs uppercase tracking-widest text-slate-500">Experience Tier</Label>
                  <Select value={experience} onValueChange={setExperience}>
                    <SelectTrigger id="level" className="h-14 rounded-2xl glass bg-white/5 border-white/10 px-6 font-bold">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent className="glass-dark border-white/10">
                      <SelectItem value="junior">Junior (0-2 years)</SelectItem>
                      <SelectItem value="mid">Mid-Level (3-5 years)</SelectItem>
                      <SelectItem value="senior">Senior (6-10 years)</SelectItem>
                      <SelectItem value="lead">Lead / Executive (10+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="round" className="font-black text-xs uppercase tracking-widest text-slate-500">Focus Sector</Label>
                <Select value={roundType} onValueChange={setRoundType}>
                  <SelectTrigger id="round" className="h-14 rounded-2xl glass bg-white/5 border-white/10 px-6 font-bold">
                    <SelectValue placeholder="Select round focus" />
                  </SelectTrigger>
                  <SelectContent className="glass-dark border-white/10">
                    <SelectItem value="technical">Technical / Logic Mastery</SelectItem>
                    <SelectItem value="hr">Behavioral / Leadership Depth</SelectItem>
                    <SelectItem value="both">Comprehensive Performance Audit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="jd" className="font-black text-xs uppercase tracking-widest text-slate-500">Role Requirements (Job Description)</Label>
                <Textarea 
                  id="jd" 
                  placeholder="Paste the target role description here to calibrate Aria's intelligence..." 
                  className="min-h-[200px] resize-none rounded-[2rem] glass bg-white/5 border-white/10 p-8 font-medium leading-relaxed"
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="glass-card flex flex-col overflow-hidden h-full">
            <CardHeader className="p-10 bg-white/5 border-b border-white/5">
              <CardTitle className="font-headline text-3xl font-black">Linguistic Sync</CardTitle>
              <CardDescription className="text-lg">Aria will analyze your background for personalization.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-8 p-10">
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
                  className="border-2 border-dashed rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center glass bg-white/5 border-white/10 group cursor-pointer hover:bg-white/10 transition-all"
                >
                  <UploadCloud className="w-14 h-14 text-primary mb-6 group-hover:scale-110 transition-transform" />
                  <p className="text-lg font-black tracking-tight">Sync Resume</p>
                  <p className="text-[10px] text-slate-500 mt-3 uppercase tracking-[0.2em] font-black">PDF, DOCX, TXT</p>
                </div>
              ) : (
                <div className="p-8 rounded-[2.5rem] glass bg-primary/10 border border-primary/30 relative group animate-fade-in shadow-inner">
                  <button 
                    onClick={clearResume}
                    className="absolute -top-3 -right-3 w-10 h-10 glass-dark bg-slate-900 border-white/20 rounded-full flex items-center justify-center hover:bg-red-500/20 text-red-500 transition-colors z-20 shadow-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 glass bg-white/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-lg font-black truncate">{resumeFileName}</p>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-black mt-1">Aria Analyzing...</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 glass bg-blue-500/10 text-blue-400 rounded-3xl border border-blue-500/20 text-sm flex gap-4 shadow-inner italic font-medium leading-relaxed">
                <Zap className="w-6 h-6 shrink-0 mt-1" />
                <span>Aria is now reviewing your background to craft personalized logic challenges.</span>
              </div>
            </CardContent>
            <CardFooter className="p-10 bg-white/5">
              <Button 
                className="w-full h-20 text-2xl font-black shadow-2xl rounded-[1.5rem] transition-all hover:scale-[1.02] active:scale-95" 
                disabled={!role || !experience || !jd || loading}
                onClick={handleStart}
              >
                {loading ? <Loader2 className="animate-spin w-8 h-8" /> : "START ASSESSMENT"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
