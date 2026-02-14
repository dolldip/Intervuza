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
  X
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
    
    // In a real app, we'd use a PDF parser. 
    // For this prototype, we'll read text files or use a fallback mock if it's binary.
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const text = await file.text()
      setResumeText(text)
    } else {
      // Fallback mock for PDF/Doc in this prototype environment
      setResumeText(`Candidate Resume Profile: ${file.name}. Experience in ${role || 'industry'}. Technical expertise in React, Next.js, and Cloud Infrastructure. Previously worked at high-growth tech firms.`)
    }

    toast({
      title: "Resume Uploaded",
      description: `${file.name} has been processed for analysis.`
    })
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
        title: "Missing Information",
        description: "Please provide a job role and description to begin."
      })
      return
    }

    setLoading(true)
    
    // Store data for the session
    sessionStorage.setItem('demo_role', role);
    sessionStorage.setItem('demo_exp', experience);
    sessionStorage.setItem('demo_round', roundType);
    sessionStorage.setItem('demo_jd', jd);
    sessionStorage.setItem('demo_resume', resumeText || "Standard professional background.");
    
    try {
      let analysisResult = null;
      if (resumeText) {
        try {
          analysisResult = await resumeJobDescriptionAnalysis({
            resumeText,
            jobDescriptionText: jd
          })
          sessionStorage.setItem('analysis_skills', JSON.stringify(analysisResult.matchingSkills));
        } catch (aiError) {
          console.warn("AI Analysis failed, proceeding with default settings.")
        }
      }
      
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
      console.error("Session creation error:", error)
      router.push(`/interviews/session/demo-session`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-12 px-4 animate-fade-in">
      <div className="mb-10 text-center space-y-4">
        <Badge variant="secondary" className="px-4 py-1.5 rounded-full font-bold text-primary gap-2">
          <Sparkles className="w-3 h-3" /> Aria Intelligence Engine
        </Badge>
        <h1 className="text-5xl font-headline font-bold tracking-tight text-foreground">Prepare for Your Next Big Move</h1>
        <p className="text-muted-foreground text-xl max-w-2xl mx-auto">Aria will conduct a role-specific adaptive interview targeting top-tier firms.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-lg border-primary/10 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-muted/30 p-8">
              <CardTitle className="font-headline text-2xl">Interview Parameters</CardTitle>
              <CardDescription>Aria adapts her conversational depth based on your role.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="role">Job Role</Label>
                  <Input 
                    id="role" 
                    placeholder="e.g. Senior Software Engineer" 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Experience Level</Label>
                  <Select value={experience} onValueChange={setExperience}>
                    <SelectTrigger id="level" className="h-12 rounded-xl">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior">Junior (0-2 years)</SelectItem>
                      <SelectItem value="mid">Mid-Level (3-5 years)</SelectItem>
                      <SelectItem value="senior">Senior (6-10 years)</SelectItem>
                      <SelectItem value="lead">Lead / Executive (10+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="round">Focus Round</Label>
                <Select value={roundType} onValueChange={setRoundType}>
                  <SelectTrigger id="round" className="h-12 rounded-xl">
                    <SelectValue placeholder="Select round" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical / Skills Round</SelectItem>
                    <SelectItem value="hr">Behavioral / HR Round</SelectItem>
                    <SelectItem value="both">Comprehensive (Both)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jd">Job Description</Label>
                <Textarea 
                  id="jd" 
                  placeholder="Paste the job description here for hyper-targeted questions..." 
                  className="min-h-[180px] resize-none rounded-2xl p-4"
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-lg border-primary/10 rounded-[2.5rem] flex flex-col overflow-hidden h-full">
            <CardHeader className="bg-muted/30 p-8">
              <CardTitle className="font-headline text-2xl">Profile Context</CardTitle>
              <CardDescription>Aria tailors her logic based on your resume.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6 p-8">
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
                  className="border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center text-center bg-muted/20 group cursor-pointer hover:bg-muted/40 transition-all border-primary/20"
                >
                  <UploadCloud className="w-10 h-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-bold">Upload Resume</p>
                  <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">PDF, DOCX, TXT</p>
                </div>
              ) : (
                <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/20 relative group">
                  <button 
                    onClick={clearResume}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-red-50 text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold truncate">{resumeFileName}</p>
                      <p className="text-[10px] uppercase tracking-widest text-primary font-black">Ready for Analysis</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 text-xs flex gap-3 shadow-sm italic leading-relaxed">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>Aria analyzes your experience gaps compared to JD requirements in real-time.</span>
              </div>
            </CardContent>
            <CardFooter className="p-8 bg-muted/10">
              <Button 
                className="w-full h-16 text-xl font-black shadow-xl rounded-2xl hover:scale-[1.02] transition-transform" 
                disabled={!role || !experience || !jd || loading}
                onClick={handleStart}
              >
                {loading ? <Loader2 className="animate-spin" /> : "START ASSESSMENT"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
