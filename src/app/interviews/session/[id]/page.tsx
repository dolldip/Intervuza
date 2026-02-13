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
      }
    };
    getCameraPermission();
  }, []);

  // Initial Question Generation
  useEffect(() => {
    async function init() {
      // Allow demo mode to skip loading checks
      if (!isMockConfig && (authLoading || profileLoading)) return;

      const demoRole = typeof window !== 'undefined' ? sessionStorage.getItem('demo_role') : null;
      const demoExp = typeof window !== 'undefined' ? sessionStorage.getItem('demo_exp') : null;

      try {
        const result = await generateInterviewQuestions({
          jobRole: demoRole || profile?.targetRole || "Software Engineer",
          experienceLevel: demoExp || profile?.experienceLevel || "Mid-Level",
          skills: profile?.skills || ["Problem Solving"],
          resumeText: `Education: ${profile?.education || "Professional background"}`
        })
        if (result && result.questions && result.questions.length > 0) {
          setQuestions(result.questions)
        } else {
          throw new Error("No questions generated")
        }
      } catch (err) {
        console.warn("AI generation failed, using fallback questions.")
        setQuestions([
          "Can you describe your professional background and education?",
          "What motivates you to pursue a role in this field?",
          "Tell me about a time you handled a difficult technical challenge.",
          "How do you stay updated with the latest trends in your field?",
          "Where do you see yourself in five years?"
        ])
      } finally {
        setInitializing(false)
      }
    }
    
    init()
  }, [authLoading, profileLoading, profile])

  // Speak the question when it changes
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
    
    // DEMO MODE OR FIREBASE
    if (isMockConfig || !db) {
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
          answer: answer || "No verbal response recorded.",
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
        <BrainCircuit className="w-20 h-20 text-primary animate-pulse mb-6" />
        <h2 className="text-3xl font-headline font-bold text-center">Preparing Your Interview Room</h2>
        <p className="text-muted-foreground mt-4 text-center max-w-xs">
          Loading AI interviewer and tailoring questions to your profile...
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <div className="lg:w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="font-headline font-bold text-white text-xl">AssessAI</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
                <span>Session Progress</span>
                <span>{currentIdx + 1} / {questions.length}</span>
              </div>
              <Progress value={((currentIdx + 1) / (questions.length || 1)) * 100} className="h-1.5 bg-slate-700" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span>Time Left</span>
              </div>
              <span className={`font-mono font-bold ${timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">Real-time Analysis</div>
          <div className="space-y-2">
            <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-700/50 flex items-center justify-between">
              <span className="text-xs text-slate-300">Face Detected</span>
              <div className={`w-2 h-2 rounded-full ${hasCameraPermission ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
            </div>
            <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-700/50 flex items-center justify-between">
              <span className="text-xs text-slate-300">Audio Stream</span>
              <div className={`w-2 h-2 rounded-full ${speaking ? 'bg-primary animate-ping' : 'bg-slate-500'}`} />
            </div>
          </div>

          <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl">
            <h4 className="text-[10px] font-bold text-primary uppercase mb-2">Interviewing For:</h4>
            <p className="text-xs text-white font-medium capitalize">
              {sessionStorage.getItem('demo_role') || profile?.targetRole || "Software Engineer"}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
          {/* USER VIDEO - REAL FACE */}
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline
            className="w-full h-full object-cover"
          />
          
          {hasCameraPermission === false && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-20 px-6">
              <Alert variant="destructive" className="max-w-md">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Please enable your camera and microphone in the browser settings to see your face and speak.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* AI Interviewer Audio */}
          {audioSrc && (
            <audio 
              ref={audioRef} 
              src={audioSrc} 
              autoPlay 
              onEnded={() => setSpeaking(false)} 
              className="hidden" 
            />
          )}

          {/* Question Overlay */}
          <div className="absolute bottom-10 inset-x-0 px-8 z-10">
            <div className="max-w-3xl mx-auto">
              <Card className="bg-slate-900/80 backdrop-blur-lg border-primary/30 shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/40">
                      <MessageSquare className="text-primary w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className="bg-primary text-white border-none text-[10px]">AI INTERVIEWER</Badge>
                        {speaking && (
                          <div className="flex items-center gap-1.5 text-[10px] text-primary font-bold">
                            <Volume2 className="w-4 h-4 animate-bounce" />
                            SPEAKING...
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl md:text-2xl font-headline font-bold text-white leading-tight">
                        {questions[currentIdx]}
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="h-32 bg-slate-800 border-t border-slate-700 px-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 shrink-0">
            <Button size="icon" variant="ghost" className="h-14 w-14 rounded-full bg-slate-700 text-white hover:bg-slate-600">
              <Mic className="h-6 w-6" />
            </Button>
            <Button size="icon" variant="ghost" className="h-14 w-14 rounded-full bg-slate-700 text-white hover:bg-slate-600">
              <Camera className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <textarea 
                placeholder="Type your response here..." 
                className="w-full bg-slate-950 border-slate-700 text-white rounded-xl py-3 px-4 h-20 resize-none focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <div className="absolute right-3 bottom-2">
                <span className="text-[10px] text-slate-500 font-medium italic">Demo: Not saving to cloud</span>
              </div>
            </div>
          </div>

          <Button 
            size="lg" 
            className="h-14 px-10 font-bold group bg-primary hover:bg-primary/90 shrink-0"
            onClick={handleNext}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                {currentIdx < questions.length - 1 ? 'Next Question' : 'Finish Interview'}
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
