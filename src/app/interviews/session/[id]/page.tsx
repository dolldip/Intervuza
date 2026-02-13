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
  AlertCircle,
  Scan,
  Activity,
  User,
  Zap
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
  
  // Simulated analysis states
  const [currentEmotion, setCurrentEmotion] = useState("Neutral")
  const [confidenceLevel, setConfidenceLevel] = useState(75)

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

  // Simulated real-time emotion analysis
  useEffect(() => {
    if (!initializing) {
      const emotions = ["Confident", "Thinking", "Neutral", "Focused", "Engaged"]
      const interval = setInterval(() => {
        setCurrentEmotion(emotions[Math.floor(Math.random() * emotions.length)])
        setConfidenceLevel(Math.floor(Math.random() * 20) + 70) // 70-90 range
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [initializing])

  // Initial Question Generation
  useEffect(() => {
    async function init() {
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
        setQuestions([
          `Given your background in ${demoEdu || "your field"}, how would you apply your skills to the role of ${demoRole || "this position"}?`,
          "Can you describe a time you faced a difficult technical challenge and how you overcame it?",
          "How do you handle disagreements within a team during a high-stakes project?",
          "What is your approach to staying updated with rapidly evolving industry trends?",
          "Why are you interested in this specific role and our organization?"
        ])
      } finally {
        setInitializing(false)
      }
    }
    
    if (!authLoading && (profile || isMockConfig || params.id === "demo-session")) {
      init()
    }
  }, [profile, authLoading, params.id])

  // AI Voice: Speak the question
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
        <h2 className="text-3xl font-headline font-bold">Initializing AI Humanoid</h2>
        <p className="text-muted-foreground mt-4 max-w-xs text-lg">
          Analyzing your profile to generate specialized questions...
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Top Header Bar */}
      <div className="h-16 border-b border-white/10 bg-slate-950 px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-primary w-6 h-6" />
          <span className="font-headline font-bold text-xl uppercase tracking-tighter">AI Session Live</span>
          <div className="ml-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Recording</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className={`font-mono font-bold text-sm ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-slate-200'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-xs text-slate-400">Progress:</span>
             <span className="text-sm font-bold">{currentIdx + 1} / {questions.length}</span>
             <Progress value={((currentIdx + 1) / questions.length) * 100} className="w-32 h-1 bg-slate-800" />
          </div>
          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => router.push("/dashboard")}>
            <StopCircle className="w-4 h-4 mr-2" /> Exit
          </Button>
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden">
        {/* MAIN VIEWPORT: AI HUMAN (LEFT) */}
        <div className="flex-1 relative bg-slate-900 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* THE AI HUMAN AVATAR */}
            <div className="relative w-full h-full max-w-4xl">
              <img 
                src="https://picsum.photos/seed/ai-interviewer-sarah/1200/1200" 
                alt="AI Interviewer" 
                className={`w-full h-full object-cover transition-all duration-1000 ${speaking ? 'scale-105 brightness-110' : 'brightness-75'}`}
                data-ai-hint="professional human avatar"
              />
              {/* Voice Waves for AI */}
              {speaking && (
                <div className="absolute inset-x-0 bottom-40 flex items-center justify-center gap-1">
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 bg-primary/80 rounded-full animate-bounce" 
                      style={{ height: `${Math.random() * 40 + 10}px`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Question Overlay */}
          <div className="absolute bottom-10 inset-x-0 px-12 z-20">
            <div className="max-w-3xl mx-auto bg-slate-950/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
              <div className="flex items-start gap-6">
                <div className={`p-4 rounded-2xl ${speaking ? 'bg-primary shadow-[0_0_20px_rgba(var(--primary),0.4)]' : 'bg-slate-800'}`}>
                  <Volume2 className={`w-8 h-8 ${speaking ? 'text-white' : 'text-slate-500'}`} />
                </div>
                <div>
                  <Badge variant="outline" className="mb-2 border-primary/40 text-primary">Interviewer: Sarah</Badge>
                  <h3 className="text-2xl md:text-3xl font-headline font-bold leading-tight">
                    {questions[currentIdx]}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SIDE VIEWPORT: USER (RIGHT/FLOATING) */}
        <div className="w-[450px] bg-slate-950 border-l border-white/10 flex flex-col z-30">
          <div className="relative aspect-video bg-black overflow-hidden m-4 rounded-2xl border border-white/5 shadow-inner group">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline
              className="w-full h-full object-cover grayscale-[0.2]"
            />
            
            {/* ANALYTICS OVERLAYS ON USER FACE */}
            <div className="absolute inset-0 pointer-events-none">
              <Scan className="absolute top-4 left-4 w-6 h-6 text-primary animate-pulse opacity-40" />
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-[10px] font-mono">
                LIVE_FEED_ID: {params.id?.toString().slice(0, 8)}
              </div>
              
              {/* Simulated Face Tracking Box */}
              <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border border-primary/20 rounded-lg animate-pulse" />
              
              {/* Dynamic Emotion Label */}
              <div className="absolute bottom-4 left-4 bg-primary/90 text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-2">
                <Activity className="w-3 h-3" />
                EMOTION: {currentEmotion.toUpperCase()}
              </div>

              {/* Confidence Bar Overlay */}
              <div className="absolute bottom-4 right-4 text-right">
                <span className="text-[10px] text-slate-400 uppercase block mb-1">Confidence</span>
                <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${confidenceLevel}%` }} />
                </div>
              </div>
            </div>

            {hasCameraPermission === false && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 z-40 p-4 text-center">
                <div className="space-y-2">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                  <p className="text-xs font-bold text-red-400">CAMERA ACCESS BLOCKED</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 px-4 py-2 space-y-6 overflow-y-auto">
            <div className="space-y-4">
               <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Interview Analytics</h4>
               <div className="grid grid-cols-2 gap-2">
                 {[
                   { label: "Speech Pace", value: "Normal", icon: Activity },
                   { label: "Fillers", value: "Low", icon: Zap },
                   { label: "Eye Contact", value: "92%", icon: User },
                   { label: "Clarity", value: "High", icon: MessageSquare },
                 ].map((stat, i) => (
                   <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
                     <stat.icon className="w-4 h-4 text-primary" />
                     <div>
                       <p className="text-[10px] text-slate-400">{stat.label}</p>
                       <p className="text-xs font-bold">{stat.value}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase px-2">Transcription Notes (Optional)</label>
              <textarea 
                placeholder="Type your thoughts or notes here..." 
                className="w-full bg-white/5 border border-white/10 text-white rounded-2xl p-4 h-32 resize-none focus:ring-1 focus:ring-primary outline-none text-sm"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
            </div>
          </div>

          <div className="p-4 border-t border-white/10 bg-slate-950">
            <Button 
              className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-[0_0_30px_rgba(var(--primary),0.3)] transition-all"
              onClick={handleNext}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="animate-spin h-6 w-6" />
              ) : (
                <>
                  {currentIdx < questions.length - 1 ? 'CONTINUE INTERVIEW' : 'COMPLETE SESSION'}
                  <ChevronRight className="ml-2 w-6 h-6" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden Audio Player */}
      {audioSrc && (
        <audio 
          ref={audioRef} 
          src={audioSrc} 
          autoPlay 
          onEnded={() => setSpeaking(false)} 
          className="hidden" 
        />
      )}
    </div>
  )
}
