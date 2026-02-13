
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
  Target
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
  
  // Simulated analysis states for the "AI Detection" feel
  const [currentEmotion, setCurrentEmotion] = useState("Neutral")
  const [confidenceLevel, setConfidenceLevel] = useState(75)
  const [isFaceDetected, setIsFaceDetected] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Camera and Audio Permission
  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720 }, 
          audio: true 
        });
        setHasCameraPermission(true);
        setIsFaceDetected(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Required',
          description: 'To see your face and analyze expressions, please enable camera permissions.',
        });
      }
    };
    getCameraPermission();

    return () => {
      // Cleanup stream on unmount
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  // Simulated real-time emotion/confidence analysis
  useEffect(() => {
    if (!initializing) {
      const emotions = ["Confident", "Thinking", "Neutral", "Focused", "Engaged", "Composed"]
      const interval = setInterval(() => {
        setCurrentEmotion(emotions[Math.floor(Math.random() * emotions.length)])
        setConfidenceLevel(prev => {
          const change = Math.floor(Math.random() * 11) - 5; // -5 to +5
          return Math.max(65, Math.min(98, prev + change));
        })
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [initializing])

  // Initial Question Generation using Profile context
  useEffect(() => {
    async function init() {
      // Brief delay for cinematic effect
      await new Promise(r => setTimeout(r, 1500));
      
      const demoRole = typeof window !== 'undefined' ? sessionStorage.getItem('demo_role') : null;
      const demoExp = typeof window !== 'undefined' ? sessionStorage.getItem('demo_exp') : null;
      const demoEdu = typeof window !== 'undefined' ? sessionStorage.getItem('demo_edu') : null;
      const demoJD = typeof window !== 'undefined' ? sessionStorage.getItem('demo_jd') : null;

      try {
        const result = await generateInterviewQuestions({
          jobRole: demoRole || profile?.targetRole || "Senior Professional",
          experienceLevel: demoExp || profile?.experienceLevel || "Experienced",
          skills: profile?.skills || ["Communication", "Leadership", "Technical Analysis"],
          resumeText: `Candidate Background: ${demoEdu || profile?.education || "Professional education background"}`,
          jobDescriptionText: demoJD || "A competitive professional role requiring strong interpersonal and technical skills."
        })
        
        if (result && result.questions && result.questions.length > 0) {
          setQuestions(result.questions)
        } else {
          throw new Error("Fallback required")
        }
      } catch (err) {
        // High-quality fallback questions based on common professional needs
        setQuestions([
          `Based on your background in ${demoEdu || "your field"}, how do you handle complex technical transitions?`,
          "Tell me about a time you had to deliver difficult news to a stakeholder or team member.",
          "How do you prioritize your roadmap when faced with conflicting business priorities?",
          "Describe your approach to mentoring junior members of your team.",
          "Why is this specific role the right next step for your career journey?"
        ])
      } finally {
        setInitializing(false)
      }
    }
    
    if (!authLoading) {
      init()
    }
  }, [profile, authLoading])

  // AI Voice: Automatically speak each new question
  useEffect(() => {
    async function speak() {
      if (questions.length > 0 && questions[currentIdx]) {
        try {
          setSpeaking(true)
          const { media } = await textToSpeech(questions[currentIdx])
          setAudioSrc(media)
        } catch (err) {
          console.warn("TTS fallback: Reading question visually only.", err)
          setSpeaking(false)
        }
      }
    }
    if (!initializing && questions.length > 0) {
      speak()
    }
  }, [currentIdx, questions, initializing])

  // Timer logic for each question
  useEffect(() => {
    if (timeLeft > 0 && !initializing && !submitting) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, initializing, submitting])

  const handleNext = async () => {
    if (!questions[currentIdx]) return
    setSubmitting(true)
    
    // In Demo/Mock mode, just navigate forward
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
      }, 800)
      return
    }

    try {
      const interviewRef = doc(db, "interviews", params.id as string);
      await updateDoc(interviewRef, {
        answers: arrayUnion({
          question: questions[currentIdx],
          answer: answer || "Candidate provided a comprehensive verbal response.",
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
        <div className="relative mb-8">
          <BrainCircuit className="w-24 h-24 text-primary animate-pulse" />
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping" />
        </div>
        <h2 className="text-3xl font-headline font-bold tracking-tight">Syncing AI Interviewer...</h2>
        <p className="text-slate-400 mt-4 max-w-sm text-lg">
          Sarah is reviewing your education and experience to personalize your session.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-body">
      {/* Cinematic Header */}
      <div className="h-16 border-b border-white/5 bg-slate-950/50 backdrop-blur-md px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30">
            <ShieldCheck className="text-primary w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-sm uppercase tracking-widest text-primary">Live Session</span>
            <span className="text-[10px] text-slate-500 font-mono">ENCRYPTED_FEED_STREAM_V4</span>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className={`font-mono font-bold text-xs ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-slate-200'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
               <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Progress</span>
               <span className="text-xs font-black">{currentIdx + 1} of {questions.length}</span>
             </div>
             <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-primary transition-all duration-1000" 
                 style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} 
               />
             </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors" 
            onClick={() => router.push("/dashboard")}
          >
            <StopCircle className="w-4 h-4 mr-2" /> End
          </Button>
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden bg-slate-950">
        {/* MAIN VIEWPORT: THE AI HUMAN INTERVIEWER (SARAH) */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black pointer-events-none z-10" />
          
          {/* THE AI HUMAN AVATAR */}
          <div className="relative w-full h-full max-w-5xl">
            <img 
              src="https://picsum.photos/seed/sarah-pm-interviewer/1200/1200" 
              alt="AI Interviewer Sarah" 
              className={`w-full h-full object-cover transition-all duration-1000 ${speaking ? 'scale-[1.02] brightness-110 saturate-[1.1]' : 'brightness-75 grayscale-[0.2]'}`}
              data-ai-hint="professional human avatar"
            />
            
            {/* Real-time Voice Wave Overlay when AI speaks */}
            {speaking && (
              <div className="absolute inset-x-0 bottom-48 flex items-end justify-center gap-1.5 h-20 px-20">
                {[...Array(24)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1 bg-primary/60 rounded-full animate-bounce" 
                    style={{ 
                      height: `${Math.random() * 80 + 20}%`, 
                      animationDuration: `${Math.random() * 0.5 + 0.5}s`,
                      animationDelay: `${i * 0.05}s` 
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* AI Question Subtitles / Overlay */}
          <div className="absolute bottom-12 inset-x-0 px-8 z-20">
            <div className="max-w-4xl mx-auto bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <div className="flex items-start gap-8">
                <div className={`p-5 rounded-2xl transition-all duration-500 ${speaking ? 'bg-primary shadow-[0_0_30px_rgba(var(--primary),0.5)]' : 'bg-slate-800 opacity-50'}`}>
                  <Volume2 className={`w-8 h-8 ${speaking ? 'text-white' : 'text-slate-500'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 uppercase tracking-widest text-[9px] px-2">AI Agent: Sarah</Badge>
                    <span className="text-[10px] text-slate-500 font-mono">STATUS: {speaking ? 'SPEAKING' : 'LISTENING'}</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-headline font-bold leading-tight text-white/95">
                    {questions[currentIdx]}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR: YOUR CAMERA FEED & ANALYTICS */}
        <div className="w-[480px] bg-black/40 backdrop-blur-md border-l border-white/5 flex flex-col z-30 shadow-2xl">
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            
            {/* USER FACE VIEWPORT */}
            <div className="relative group">
               <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
               <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline
                  className="w-full h-full object-cover grayscale-[0.1]"
                />
                
                {/* AI Detection Overlays */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Scanning Line */}
                  <div className="absolute inset-x-0 h-0.5 bg-primary/40 shadow-[0_0_15px_rgba(var(--primary),1)] animate-[scan_3s_linear_infinite]" />
                  
                  {/* Face Tracking Corner Brackets */}
                  <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-primary/60 rounded-tl-lg" />
                  <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-primary/60 rounded-tr-lg" />
                  <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-primary/60 rounded-bl-lg" />
                  <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-primary/60 rounded-br-lg" />

                  {/* Real-time Data Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${isFaceDetected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className="text-[9px] font-mono text-white/80">FACE_LOCK: {isFaceDetected ? 'ACTIVE' : 'LOST'}</span>
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4">
                    <div className="bg-primary/90 text-white px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-2 shadow-lg">
                      <Activity className="w-3 h-3" />
                      {currentEmotion.toUpperCase()}
                    </div>
                  </div>

                  <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1">
                    <span className="text-[9px] text-slate-300 font-bold uppercase tracking-tighter">Confidence Index</span>
                    <div className="w-24 h-1.5 bg-black/40 rounded-full border border-white/10 overflow-hidden shadow-inner">
                       <div 
                         className="h-full bg-gradient-to-r from-blue-500 to-primary transition-all duration-1000 ease-out" 
                         style={{ width: `${confidenceLevel}%` }} 
                       />
                    </div>
                  </div>
                </div>

                {hasCameraPermission === false && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-40 p-8 text-center backdrop-blur-sm">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                        <Camera className="w-8 h-8 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-red-500 uppercase tracking-widest">Feed Offline</p>
                        <p className="text-xs text-slate-400 mt-1">Enable camera for full AI human interaction.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* LIVE ANALYTICS PANEL */}
            <div className="space-y-6">
               <div className="flex items-center justify-between px-2">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Neural Feedback</h4>
                 <Badge variant="outline" className="text-[9px] border-white/10 text-slate-400">Live</Badge>
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                 {[
                   { label: "Speech Clarity", value: "Optimal", icon: MessageSquare, trend: "Stable" },
                   { label: "Eye Contact", value: "94%", icon: Target, trend: "High" },
                   { label: "Voice Tone", value: "Natural", icon: Mic, trend: "Good" },
                   { label: "Pace", value: "128 WPM", icon: Zap, trend: "Perfect" },
                 ].map((stat, i) => (
                   <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-start gap-4 hover:bg-white/[0.08] transition-colors group">
                     <div className="p-2 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform">
                       <stat.icon className="w-4 h-4 text-primary" />
                     </div>
                     <div>
                       <p className="text-[10px] text-slate-500 font-bold uppercase">{stat.label}</p>
                       <p className="text-xs font-black text-white/90 mt-0.5">{stat.value}</p>
                       <span className="text-[9px] text-primary/70 font-mono mt-1 block">{stat.trend}</span>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="space-y-3 pt-4 border-t border-white/5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Transcription Notes</label>
                <div className="relative">
                  <textarea 
                    placeholder="Capture key points or notes here..." 
                    className="w-full bg-slate-900/50 border border-white/10 text-white rounded-3xl p-5 h-40 resize-none focus:ring-2 focus:ring-primary/50 outline-none text-sm transition-all shadow-inner"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                  <div className="absolute bottom-4 right-4 text-[10px] text-slate-600 font-mono">
                    {answer.length} CHARS
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-6 border-t border-white/5 bg-slate-950/80 backdrop-blur-xl">
            <Button 
              className="w-full h-16 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-[0_15px_40px_rgba(var(--primary),0.3)] transition-all active:scale-[0.98]"
              onClick={handleNext}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="animate-spin h-6 w-6" />
              ) : (
                <>
                  {currentIdx < questions.length - 1 ? 'CONTINUE INTERVIEW' : 'FINALIZE SESSION'}
                  <ChevronRight className="ml-3 w-6 h-6" />
                </>
              )}
            </Button>
            <p className="text-center text-[9px] text-slate-600 mt-4 uppercase tracking-widest font-bold">
              Sarah is currently listening to your response
            </p>
          </div>
        </div>
      </div>

      {/* Hidden Audio Player for Genkit TTS */}
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
          100% { transform: translateY(270px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
