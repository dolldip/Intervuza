"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth, useFirestore, useDoc } from "@/firebase"
import { doc, updateDoc, arrayUnion } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { 
  Mic, 
  Video as VideoIcon, 
  MessageSquare, 
  Clock,
  ShieldCheck,
  ChevronRight,
  BrainCircuit,
  StopCircle,
  Volume2,
  Loader2,
  Camera,
  AlertCircle
} from "lucide-react"
import { generateInterviewQuestions } from "@/ai/flows/dynamic-interview-question-generation"
import { textToSpeech } from "@/ai/flows/tts-flow"
import { useToast } from "@/hooks/use-toast"
import { isMockConfig } from "@/firebase/config"

export default function InterviewSessionPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const db = useFirestore()
  const { toast } = useToast()

  const userDocRef = user ? doc(db!, "users", user.uid) : null
  const { data: profile, loading: profileLoading } = useDoc(userDocRef)

  const [questions, setQuestions] = useState<string[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answer, setAnswer] = useState("")
  const [initializing, setInitializing] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(180)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Camera and Audio Permission
  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions to see your face during the interview.',
        });
      }
    };
    getCameraPermission();
  }, [toast]);

  // Initial Question Generation using Profile (Real) or Session Storage (Demo)
  useEffect(() => {
    async function init() {
      // Small delay to ensure session storage is readable
      await new Promise(r => setTimeout(r, 800));

      const demoRole = typeof window !== 'undefined' ? sessionStorage.getItem('demo_role') : null;
      const demoExp = typeof window !== 'undefined' ? sessionStorage.getItem('demo_exp') : null;
      const demoEdu = typeof window !== 'undefined' ? sessionStorage.getItem('demo_edu') : null;
      const demoJD = typeof window !== 'undefined' ? sessionStorage.getItem('demo_jd') : null;

      try {
        const result = await generateInterviewQuestions({
          jobRole: demoRole || profile?.targetRole || "Software Engineer",
          experienceLevel: demoExp || profile?.experienceLevel || "Mid-Level",
          skills: profile?.skills || ["Problem Solving", "Communication"],
          resumeText: `Education: ${demoEdu || profile?.education || "General background"}`,
          jobDescriptionText: demoJD || ""
        })
        if (result && result.questions && result.questions.length > 0) {
          setQuestions(result.questions)
        } else {
          throw new Error("No questions generated")
        }
      } catch (err) {
        console.warn("AI generation failed, using tailored fallback questions.")
        setQuestions([
          `Based on your background in ${demoEdu || "your field"}, how would you approach the role of ${demoRole || "this position"}?`,
          "Can you walk me through a complex technical problem you solved recently?",
          "How do you ensure clear communication when working with non-technical stakeholders?",
          "What motivates you to excel in this specific industry?",
          "If you were hired tomorrow, what would be your first priority?"
        ])
      } finally {
        setInitializing(false)
      }
    }
    
    // We proceed if auth is done OR if we are in demo mode
    if (!authLoading && (profile || isMockConfig || params.id === "demo-session")) {
      init()
    }
  }, [profile, authLoading, params.id])

  // AI Voice: Speak the question when it changes
  useEffect(() => {
    async function speak() {
      if (questions.length > 0 && questions[currentIdx]) {
        try {
          setSpeaking(true)
          const { media } = await textToSpeech(questions[currentIdx])
          setAudioSrc(media)
        } catch (err) {
          console.warn("TTS failed:", err)
          setSpeaking(false)
        }
      }
    }
    if (!initializing && questions.length > 0) {
      speak()
    }
  }, [currentIdx, questions, initializing])

  // Timer logic
  useEffect(() => {
    if (timeLeft > 0 && !initializing) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, initializing])

  const handleNext = async () => {
    if (!questions[currentIdx]) return
    
    setSubmitting(true)
    
    // DEMO MODE logic - bypass Firestore update
    if (isMockConfig || !db || params.id === "demo-session") {
      setTimeout(() => {
        if (currentIdx < questions.length - 1) {
          setCurrentIdx(currentIdx + 1)
          setAnswer("")
          setTimeLeft(180)
          setAudioSrc(null)
          setSubmitting(false)
        } else {
          router.push(`/dashboard`)
        }
      }, 500)
      return
    }

    try {
      const interviewRef = doc(db, "interviews", params.id as string);
      await updateDoc(interviewRef, {
        answers: arrayUnion({
          question: questions[currentIdx],
          answer: answer || "User provided a verbal response.",
          timestamp: new Date().toISOString()
        })
      });

      if (currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1)
        setAnswer("")
        setTimeLeft(180)
        setAudioSrc(null)
      } else {
        router.push(`/results/${params.id}`)
      }
    } catch (err) {
      console.error(err)
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1)
        setAnswer("")
      } else {
        router.push(`/dashboard`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6 text-center">
        <BrainCircuit className="w-20 h-20 text-primary animate-pulse mb-6" />
        <h2 className="text-3xl font-headline font-bold">Initializing AI Interviewer</h2>
        <p className="text-muted-foreground mt-4 max-w-xs">
          Crafting questions based on your background and target role...
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-900 overflow-hidden">
      {/* Sidebar Info */}
      <div className="lg:w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="font-headline font-bold text-white text-xl">AssessAI</span>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Progress</span>
              <span>{currentIdx + 1} / {questions.length}</span>
            </div>
            <Progress value={((currentIdx + 1) / (questions.length || 1)) * 100} className="h-1.5 bg-slate-700" />
            
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span>Timer</span>
              </div>
              <span className={`font-mono font-bold ${timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">Interview Room Status</div>
          <div className="space-y-2">
            <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-700/50 flex items-center justify-between">
              <span className="text-xs text-slate-300">Face Detection (Camera)</span>
              <div className={`w-2 h-2 rounded-full ${hasCameraPermission ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
            <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-700/50 flex items-center justify-between">
              <span className="text-xs text-slate-300">AI Voice (TTS)</span>
              <div className={`w-2 h-2 rounded-full ${audioSrc ? 'bg-green-500' : 'bg-yellow-500'}`} />
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <h4 className="text-[10px] font-bold text-primary uppercase mb-1">Target Role</h4>
            <p className="text-sm text-white font-medium capitalize">
              {typeof window !== 'undefined' ? (sessionStorage.getItem('demo_role') || profile?.targetRole || "General Candidate") : "Loading..."}
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700">
          <Button variant="destructive" className="w-full" onClick={() => router.push("/dashboard")}>
            <StopCircle className="mr-2 w-4 h-4" />
            End Session
          </Button>
        </div>
      </div>

      {/* Main Viewport: Camera and AI Overlay */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 bg-black relative flex items-center justify-center">
          {/* USER VIDEO - REAL HUMAN FACE */}
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline
            className="w-full h-full object-cover"
          />
          
          {hasCameraPermission === false && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 z-20 px-6">
              <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Please allow camera access to show your face during the mock interview.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* AI Voice Player */}
          {audioSrc && (
            <audio 
              ref={audioRef} 
              src={audioSrc} 
              autoPlay 
              onEnded={() => setSpeaking(false)} 
              className="hidden" 
            />
          )}

          {/* Question UI Overlay */}
          <div className="absolute bottom-10 inset-x-0 px-8 z-10">
            <Card className="max-w-3xl mx-auto bg-slate-900/90 backdrop-blur-md border-primary/40 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${speaking ? 'bg-primary/20 border-primary animate-pulse' : 'bg-slate-800 border-slate-700'}`}>
                    <Volume2 className={`w-6 h-6 ${speaking ? 'text-primary' : 'text-slate-400'}`} />
                  </div>
                  <div className="space-y-2">
                    <Badge variant="secondary" className="bg-primary/20 text-primary border-none">AI Interviewer</Badge>
                    <h3 className="text-xl md:text-2xl font-headline font-bold text-white">
                      {questions[currentIdx]}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Bar: Input and Controls */}
        <div className="h-28 bg-slate-800 border-t border-slate-700 px-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full bg-slate-700 text-white">
              <Mic className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full bg-slate-700 text-white">
              <Camera className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 max-w-xl">
            <textarea 
              placeholder="Your answer will be recorded. You can also type notes here..." 
              className="w-full bg-slate-950 border-slate-700 text-white rounded-xl py-2 px-4 h-16 resize-none focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          </div>

          <Button 
            size="lg" 
            className="h-14 px-8 font-bold bg-primary hover:bg-primary/90"
            onClick={handleNext}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                {currentIdx < questions.length - 1 ? 'Next' : 'Finish'}
                <ChevronRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
