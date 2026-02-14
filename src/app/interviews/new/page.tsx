
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useFirestore, useUser } from "@/firebase"
import { collection, addDoc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ShieldCheck, 
  UploadCloud,
  Loader2
} from "lucide-react"
import { resumeJobDescriptionAnalysis } from "@/ai/flows/resume-job-description-analysis-flow"
import { useToast } from "@/hooks/use-toast"

export default function NewInterviewPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState("")
  const [experience, setExperience] = useState("")
  const [roundType, setRoundType] = useState("technical")
  const [jd, setJd] = useState("")
  const [resumeText, setResumeText] = useState("Standard candidate profile.")

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
    
    sessionStorage.setItem('demo_role', role);
    sessionStorage.setItem('demo_exp', experience);
    sessionStorage.setItem('demo_round', roundType);
    sessionStorage.setItem('demo_jd', jd);
    
    if (!user || !db) {
      setTimeout(() => {
        router.push(`/interviews/session/demo-session`)
      }, 1000)
      return
    }
    
    try {
      try {
        await resumeJobDescriptionAnalysis({
          resumeText,
          jobDescriptionText: jd
        })
      } catch (aiError) {
        console.warn("AI Analysis failed, proceeding with default settings.")
      }
      
      const sessionRef = await addDoc(collection(db, "users", user.uid, "interviewSessions"), {
        userId: user.uid,
        jobRole: role,
        experienceLevel: experience,
        roundType: roundType,
        startTime: new Date().toISOString(),
        status: "in-progress",
        createdAt: new Date().toISOString()
      });

      router.push(`/interviews/session/${sessionRef.id}`)
    } catch (error: any) {
      console.error("Session creation error:", error)
      router.push(`/interviews/session/demo-session`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-12 px-4 animate-fade-in">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-headline font-bold mb-2 text-foreground">Prepare for Your Next Big Move</h1>
        <p className="text-muted-foreground text-lg">Sarah will conduct a role-specific adaptive interview targeting top companies.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-lg border-primary/10">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Interview Parameters</CardTitle>
              <CardDescription>Sarah adapts to your specific role and round focus.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Job Role</Label>
                  <Input 
                    id="role" 
                    placeholder="e.g. Senior Software Engineer" 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Experience Level</Label>
                  <Select value={experience} onValueChange={setExperience}>
                    <SelectTrigger id="level">
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
                  <SelectTrigger id="round">
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
                  placeholder="Paste the job description here..." 
                  className="min-h-[150px] resize-none"
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-lg border-primary/10 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Resume</CardTitle>
              <CardDescription>Tailors questions based on your history.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center bg-muted/30 group cursor-pointer hover:bg-muted/50 transition-colors">
                <UploadCloud className="w-8 h-8 text-primary mb-2" />
                <p className="text-xs font-medium">Upload PDF Resume</p>
              </div>

              <div className="p-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-[10px] flex gap-2">
                <ShieldCheck className="w-3 h-3 shrink-0" />
                <span>AI will identify gaps in your profile compared to the role requirements.</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full h-12 text-lg font-bold shadow-lg" 
                disabled={!role || !experience || !jd || loading}
                onClick={handleStart}
              >
                {loading ? <Loader2 className="animate-spin" /> : "Start Assessment"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
