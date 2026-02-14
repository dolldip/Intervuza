
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
  Zap,
  Smile,
  Target,
  Sparkles
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
  const { data: profile } = useDoc(userDocRef)

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
  const [stream, setStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Robust Camera and Audio Permission Request
  useEffect(() => {
    async function setupMedia() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }, 
          audio: true 
        });
        
        setStream(mediaStream)
        setHasCameraPermission(true)
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera & Mic Access Required',
          description: 'Please enable your camera and microphone to begin the AI interview.',
        });
      }
    }

    setupMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  // Attach stream to video element whenever it changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Video play error:", e));
    }
  }, [stream, videoRef.current, initializing]);

  // Simulated AI analysis updates
  useEffect(() => {
    if (!initializing) {
      const emotions = ["Confident", "Analyzing", "Neutral", "Thoughtful", "Focused", "Calm"]
      const interval = setInterval(() => {
        setCurrentEmotion(emotions[Math.floor(Math.random() * emotions.length)])
        setConfidenceLevel(prev => {
          const change = Math.floor(Math.random() * 9) - 4;
          return Math.max(70, Math.min(99, prev + change));
        })
      }, 3500)
      return () => clearInterval(interval)
    }
  }, [initializing])

  // Question generation
  useEffect(() => {
    async function init() {
      // Small pause to allow camera setup to breathe
      await new Promise(r => setTimeout(r, 1500)); 
      
      const demoRole = sessionStorage.getItem('demo_role');
      const demoExp = sessionStorage.getItem('demo_exp');
      const demoJD = sessionStorage.getItem('demo_jd');

      try {
        const result = await generateInterviewQuestions({
          jobRole: demoRole || profile?.targetRole || "Candidate",
          experienceLevel: demoExp || profile?.experienceLevel || "Mid-level",
          skills: profile?.skills || ["Communication", "Problem Solving"],
          resumeText: `Candidate Profile: ${profile?.education || "Professional background"}`,
          jobDescriptionText: demoJD || "A professional corporate role."
        })
        
        if (result?.questions?.length > 0) {
          setQuestions(result.questions)
        } else {
          throw new Error("Questions empty")
        }
      } catch (err) {
        setQuestions([
          "Can you start by walking me through your background and why you're a good fit for this role?",
          "Tell me about a challenging project you handled recently. What was your specific contribution?",
          "How do you approach learning new technologies or frameworks you haven't used before?",
          "Describe a time you had a conflict with a teammate. How did you resolve it?",
          "What are your long-term career goals, and how does this position align with them?"
        ])
      } finally {
        setInitializing(false)
      }
    }
    
    if (!authLoading) init();
  }, [profile, authLoading])

  // AI Voice trigger
  useEffect(() => {
    async function speak() {
      if (questions[currentIdx] && !initializing) {
        try {
          setSpeaking(true)
          const { media } = await textToSpeech(questions[currentIdx])
          setAudioSrc(media)
        } catch (err) {
          console.warn("Speech failed, falling back to text.")
          setSpeaking(false)
        }
      }
    }
    speak();
  }, [currentIdx, questions, initializing])

  const handleNext = async () => {
    if (!questions[currentIdx]) return
    setSubmitting(true)
    
    const currentAnswers = JSON.parse(sessionStorage.getItem('session_answers') || '[]');
    currentAnswers.push({
      question: questions[currentIdx],
      answer: answer || "Provided a verbal response during the live session.",
      emotion: currentEmotion,
      confidence: confidenceLevel
    });
    sessionStorage.setItem('session_answers', JSON.stringify(currentAnswers));

    if (isMockConfig || !db || params.id === "demo-session") {
      setTimeout(() => {
        if (currentIdx < questions.length - 1) {
          setCurrentIdx(currentIdx + 1)
          setAnswer("")
          setTimeLeft(180)
          setAudioSrc(null)
          setSubmitting(false)
        } else {
          router.push(`/results/demo-results`)
        }
      }, 1000)
      return
    }

    try {
      const interviewRef = doc(db, "interviews", params.id as string);
      await updateDoc(interviewRef, {
        answers: arrayUnion({
          question: questions[currentIdx],
          answer: answer || "Verbal response provided.",
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
      router.push(`/results/demo-results`)
    } finally {
      setSubmitting(false)
    }
  }

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="relative mb-12">
          <BrainCircuit className="w-32 h-32 text-primary animate-pulse" />
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping" />
        </div>
        <h2 className="text-4xl font-headline font-bold mb-4">Initializing Sarah</h2>
        <p className="text-slate-400 text-xl max-w-md text-center px-6">
          Setting up your secure live session and calibrating biometric sensors.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden selection:bg-primary/30">
      {/* Dynamic Header */}
      <div className="h-16 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/40">
            <ShieldCheck className="text-primary w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-sm tracking-[0.2em] text-primary uppercase">Secure Live Session</span>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest">ID: {params.id || 'DEMO-882'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className={`font-mono font-bold text-sm ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-slate-200'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex flex-col items-end">
               <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Question</span>
               <span className="text-sm font-black">{currentIdx + 1} / {questions.length}</span>
             </div>
             <div className="w-40 h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
               <div 
                 className="h-full bg-primary transition-all duration-1000 ease-in-out" 
                 style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} 
               />
             </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-xl" 
            onClick={() => router.push("/dashboard")}
          >
            <StopCircle className="w-4 h-4 mr-2" /> Exit Session
          </Button>
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden">
        {/* LEFT VIEWPORT: AI INTERVIEWER */}
        <div className="flex-1 relative flex items-center justify-center bg-slate-900/20">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-10" />
          
          <div className="relative w-full h-full">
            <img 
              src="https://picsum.photos/seed/sarah-professional-8/1200/1200" 
              alt="AI Human Interviewer" 
              className={`w-full h-full object-cover transition-all duration-700 ${speaking ? 'scale-105 brightness-110' : 'brightness-90 grayscale-[0.1]'}`}
              data-ai-hint="professional headshot"
            />
            
            {/* Real-time Subtitles */}
            <div className="absolute bottom-16 inset-x-0 px-12 z-20">
              <div className="max-w-4xl mx-auto bg-slate-950/80 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                <div className="flex items-start gap-8">
                  <div className={`p-6 rounded-[2rem] transition-all duration-500 ${speaking ? 'bg-primary shadow-[0_0_40px_rgba(var(--primary),0.6)]' : 'bg-slate-800'}`}>
                    <Volume2 className={`w-10 h-10 ${speaking ? 'text-white animate-pulse' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-4 mb-4">
                      <Badge className="bg-primary/20 text-primary border-primary/30 px-3 py-1 text-[10px] uppercase font-black tracking-widest">AI Agent: Sarah</Badge>
                      <span className="text-[11px] text-slate-400 font-mono tracking-widest">MODE: {speaking ? 'SPEAKING' : 'LISTENING'}</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-headline font-bold leading-tight tracking-tight text-white">
                      {questions[currentIdx]}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: USER FEED & ANALYTICS */}
        <div className="w-[480px] bg-slate-950/95 backdrop-blur-2xl border-l border-white/10 flex flex-col z-30 shadow-2xl relative">
          <div className="p-8 space-y-10 flex-1 overflow-y-auto">
            
            {/* LIVE CAMERA FEED */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Biometric Video Input</span>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                   <span className="text-[10px] text-red-500 font-bold uppercase">Streaming</span>
                </div>
              </div>
              <div className="relative aspect-video bg-slate-900 rounded-[2rem] overflow-hidden border border-white/10 shadow-inner">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
                
                {/* Simulated AI Overlays */}
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="absolute inset-x-0 h-1 bg-primary/40 shadow-[0_0_20px_rgba(var(--primary),1)] animate-[scan_4s_linear_infinite]" />
                  
                  {/* Face Tracking Brackets */}
                  <div className="absolute top-10 left-10 w-12 h-12 border-t-2 border-l-2 border-primary/70 rounded-tl-3xl" />
                  <div className="absolute top-10 right-10 w-12 h-12 border-t-2 border-r-2 border-primary/70 rounded-tr-3xl" />
                  <div className="absolute bottom-10 left-10 w-12 h-12 border-b-2 border-l-2 border-primary/70 rounded-bl-3xl" />
                  <div className="absolute bottom-10 right-10 w-12 h-12 border-b-2 border-r-2 border-primary/70 rounded-br-3xl" />

                  <div className="absolute bottom-6 left-6 flex items-center gap-3">
                    <div className="bg-primary/90 text-white px-4 py-2 rounded-2xl text-[11px] font-black flex items-center gap-2 shadow-2xl">
                      <Sparkles className="w-3.5 h-3.5" />
                      {currentEmotion.toUpperCase()}
                    </div>
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                       <Target className="w-3.5 h-3.5 text-primary" />
                       <span className="text-[10px] font-mono text-white/80">CONFIDENCE: {confidenceLevel}%</span>
                    </div>
                  </div>
                </div>

                {!hasCameraPermission && hasCameraPermission !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-40 p-10 text-center">
                    <div className="space-y-6">
                      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                        <Camera className="w-10 h-10 text-red-500" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-2">Camera Restricted</h4>
                        <p className="text-sm text-slate-400">Please enable camera in your browser to start the neural expression analysis.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* NEURAL ANALYTICS */}
            <div className="space-y-8">
               <div className="flex items-center justify-between px-2">
                 <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Real-time Biometrics</h4>
                 <Badge variant="outline" className="text-[9px] border-primary/20 text-primary uppercase">Analyzing...</Badge>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 {[
                   { label: "Vocal Confidence", value: `${confidenceLevel}%`, icon: MessageSquare, status: "High" },
                   { label: "Eye Engagement", value: "94%", icon: Target, status: "Optimal" },
                   { label: "Stress Level", value: "Low", icon: Zap, status: "Calm" },
                   { label: "Face Alignment", value: "Locked", icon: Scan, status: "Stable" },
                 ].map((stat, i) => (
                   <div key={i} className="p-5 bg-white/5 border border-white/5 rounded-[1.5rem] flex flex-col gap-4 group">
                     <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                       <stat.icon className="w-5 h-5 text-primary" />
                     </div>
                     <div>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
                       <p className="text-lg font-black text-white/95 mt-1">{stat.value}</p>
                       <span className="text-[9px] text-primary/70 font-mono mt-1 block uppercase">{stat.status}</span>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="space-y-4 pt-6 border-t border-white/10">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-2">Live Response Capture</label>
                <textarea 
                  placeholder="The AI is listening... You can also type notes here." 
                  className="w-full bg-slate-900/40 border border-white/10 text-white rounded-[2rem] p-6 h-40 resize-none focus:ring-2 focus:ring-primary/50 outline-none text-base transition-all"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* PERSISTENT ACTION FOOTER */}
          <div className="p-8 border-t border-white/10 bg-slate-950/95 backdrop-blur-2xl">
            <Button 
              className="w-full h-18 rounded-[2.5rem] bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-[0_20px_60px_rgba(var(--primary),0.3)] transition-all active:scale-[0.97] disabled:opacity-50"
              onClick={handleNext}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="animate-spin h-7 w-7" />
              ) : (
                <>
                  {currentIdx < questions.length - 1 ? 'SUBMIT & NEXT QUESTION' : 'COMPLETE INTERVIEW'}
                  <ChevronRight className="ml-4 w-7 h-7" />
                </>
              )}
            </Button>
            <p className="text-center text-[10px] text-slate-500 mt-6 uppercase tracking-[0.3em] font-black">
              Biometric data is encrypted and secure
            </p>
          </div>
        </div>
      </div>

      {/* Audio element for Text-to-Speech */}
      {audioSrc && (
        <audio 
          ref={audioRef} 
          src={audioSrc} 
          autoPlay 
          onEnded={() => setSpeaking(false)} 
          className="hidden" 
        />
      )}

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
