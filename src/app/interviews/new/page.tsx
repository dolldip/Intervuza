"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db, isMockConfig } from "@/firebase/config"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText, 
  ChevronRight, 
  ShieldCheck, 
  AlertCircle,
  UploadCloud,
  Loader2,
  Info
} from "lucide-react"
import { resumeJobDescriptionAnalysis } from "@/ai/flows/resume-job-description-analysis-flow"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function NewInterviewPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState("")
  const [experience, setExperience] = useState("")
  const [jd, setJd] = useState("")
  const [resumeText, setResumeText] = useState("Standard candidate profile.")

  const handleStart = async () => {
    if (!role || !experience || !jd) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all fields before starting."
      })
      return
    }

    setLoading(true)
    
    // DEMO MODE NAVIGATION
    if (isMockConfig) {
      setTimeout(() => {
        // Store choices in session storage for demo
        sessionStorage.setItem('demo_role', role);
        sessionStorage.setItem('demo_exp', experience);
        sessionStorage.setItem('demo_jd', jd);
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
      
      const sessionRef = await addDoc(collection(db, "interviews"), {
        userId: auth.currentUser?.uid || "anonymous",
        role: role,
        experienceLevel: experience,
        date: serverTimestamp(),
        questions: [],
        answers: [],
        status: "in-progress"
      });

      router.push(`/interviews/session/${sessionRef.id}`)
    } catch (error: any) {
      console.error("Session creation error:", error)
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Falling back to Demo Session..."
      })
      router.push(`/interviews/session/demo-session`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-12 px-4 animate-fade-in">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-headline font-bold mb-2 text-foreground">Prepare for Your Next Big Move</h1>
        <p className="text-muted-foreground text-lg">AI will generate a tailored interview based on your profile and target role.</p>
      </div>

      {isMockConfig && (
        <Alert className="mb-8 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 font-bold">Demo Mode Active</AlertTitle>
          <AlertDescription className="text-blue-700">
            You can still test the **Real Face (Camera)** and **AI Voice** features even without connecting Firebase!
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-lg border-primary/10">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Interview Parameters</CardTitle>
              <CardDescription>Tell us about the role you are targeting</CardDescription>
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
                <Label htmlFor="jd">Job Description</Label>
                <Textarea 
                  id="jd" 
                  placeholder="Paste the job description here..." 
                  className="min-h-[200px] resize-none"
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-lg border-primary/10 h-full">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Resume</CardTitle>
              <CardDescription>We'll use your resume to tailor technical questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center bg-muted/30 group cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium">Click to upload PDF</p>
                <p className="text-xs text-muted-foreground mt-1">Maximum file size 5MB</p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg border border-green-100 text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Your data is encrypted and private.</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" 
                disabled={!role || !experience || !jd || loading}
                onClick={handleStart}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Initializing AI...
                  </>
                ) : (
                  <>
                    Start Interview
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
