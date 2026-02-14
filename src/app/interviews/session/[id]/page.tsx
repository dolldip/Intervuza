
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth, useFirestore, useDoc } from "@/firebase"
import { doc, updateDoc, arrayUnion } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
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
  Sparkles,
  RefreshCw,
  Play
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
  const [sessionStarted, setSessionStarted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(180)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState(false)
  
  // Simulated analysis states
  const [currentEmotion, setCurrentEmotion] = useState("Neutral")
  const [confidenceLevel, setConfidenceLevel] = useState(82)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Robust Camera and Audio Permission Request
  useEffect(() => {
    async function setupMedia() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 }, 
            facingMode: "user" 
          }, 
          audio: true 
        });
        
        setStream(mediaStream)
        setHasCameraPermission(true)
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera & Mic Access Required',
          description: 'Please enable your camera and microphone in the browser settings to continue.',
        });
      }
    }

    setupMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Ensure stream is always attached to videoRef
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Video play error:", e));
    }
  }, [stream, sessionStarted]);

  // Simulated AI analysis updates
  useEffect(() => {
    if (sessionStarted) {
      const emotions = ["Confident", "Analyzing", "Neutral", "Thoughtful", "Focused", "Calm"]
      const interval = setInterval(() => {
        setCurrentEmotion(emotions[Math.floor(Math.random() * emotions.length)])
        setConfidenceLevel(prev => {
          const change = Math.floor(Math.random() * 7) - 3;
          return Math.max(75, Math.min(98, prev + change));
        })
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [sessionStarted])

  // Timer logic
  useEffect(() => {
    if (sessionStarted && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [sessionStarted, timeLeft]);

  // Question generation
  useEffect(() => {
    async function init() {
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
          "Walk me through your professional background and why you are the ideal candidate for this role.",
          "Describe a time you faced a significant technical hurdle. How did you overcome it?",
          "How do you stay updated with industry trends and new technologies?",
          "Tell me about a conflict you had with a colleague. What was the resolution?",
          "Where do you see yourself in five years within our organization?"
        ])
      } finally {
        setInitializing(false)
      }
    }
    
    if (!authLoading) init();
  }, [profile, authLoading])

  // AI Voice trigger
  const triggerSpeech = async (index: number) => {
    if (questions[index]) {
      try {
        setSpeaking(true)
        const { media } = await textToSpeech(questions[index])
        setAudioSrc(media)
      } catch (err) {
        console.warn("Speech failed, falling back to text.")
        setSpeaking(false)
      }
    }
  }

  // Effect to play audio when audioSrc updates
  useEffect(() => {
    if (audioSrc && audioRef.current) {
      audioRef.current.play().catch(e => {
        console.warn("Autoplay blocked, user must interact.");
        setSpeaking(false);
      });
    }
  }, [audioSrc]);

  const startSession = () => {
    setSessionStarted(true);
    triggerSpeech(0);
  };

  const handleNext = async () => {
    if (!questions[currentIdx]) return
    setSubmitting(true)
    
    const currentAnswers = JSON.parse(sessionStorage.getItem('session_answers') || '[]');
    currentAnswers.push({
      question: questions[currentIdx],
      answer: answer || "Provided a response during the session.",
      emotion: currentEmotion,
      confidence: confidenceLevel
    });
    sessionStorage.setItem('session_answers', JSON.stringify(currentAnswers));

    const isDemo = isMockConfig || !db || params.id === "demo-session";

    if (isDemo) {
      setTimeout(() => {
        if (currentIdx < questions.length - 1) {
          const nextIdx = currentIdx + 1;
          setCurrentIdx(nextIdx)
          setAnswer("")
          setTimeLeft(180)
          setAudioSrc(null)
          setSubmitting(false)
          triggerSpeech(nextIdx);
        } else {
          router.push(`/results/demo-results`)
        }
      }, 800)
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
        const nextIdx = currentIdx + 1;
        setCurrentIdx(nextIdx)
        setAnswer("")
        setTimeLeft(180)
        setAudioSrc(null)
        triggerSpeech(nextIdx);
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
        <h2 className="text-4xl font-headline font-bold mb-4 tracking-tight">Initializing Sarah AI</h2>
        <p className="text-slate-400 text-xl max-w-md text-center px-6 font-medium">
          Setting up your secure live session and calibrating biometric sensors...
        </p>
      </div>
    )
  }

  if (!sessionStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-2xl w-full text-center space-y-10 animate-fade-in">
          <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 mx-auto shadow-[0_0_50px_rgba(var(--primary),0.2)]">
            <VideoIcon className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-headline font-bold">Secure Session Ready</h1>
            <p className="text-slate-400 text-lg">
              Sarah AI is ready to begin your assessment. Ensure you are in a quiet, well-lit environment.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <ShieldCheck className="w-5 h-5 text-green-500 mb-2" />
              <p className="text-xs font-black uppercase text-slate-500">Privacy</p>
              <p className="text-sm font-bold">End-to-End Encrypted</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <Mic className="w-5 h-5 text-blue-500 mb-2" />
              <p className="text-xs font-black uppercase text-slate-500">Audio</p>
              <p className="text-sm font-bold">Noise Cancellation Active</p>
            </div>
          </div>
          <Button 
            className="w-full h-20 rounded-[2.5rem] bg-primary hover:bg-primary/90 text-2xl font-black shadow-[0_20px_60px_rgba(var(--primary),0.3)] transition-all hover:scale-[1.02]"
            onClick={startSession}
          >
            BEGIN ASSESSMENT
            <Play className="ml-4 w-6 h-6 fill-current" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Cinematic Header */}
      <div className="h-20 border-b border-white/5 bg-slate-950/90 backdrop-blur-2xl px-10 flex items-center justify-between z-50">
        <div className="flex items-center gap-8">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
            <ShieldCheck className="text-primary w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-xs tracking-[0.3em] text-primary uppercase">Biometric Live Assessment</span>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest mt-1">SESSION_TOKEN: {params.id?.toString().toUpperCase() || 'LIVE_DEMO'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-16">
          <div className="flex items-center gap-4 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
            <Clock className="w-5 h-5 text-slate-400" />
            <span className={`font-mono font-black text-lg ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-slate-200'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="flex items-center gap-8">
             <div className="flex flex-col items-end">
               <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Current Task</span>
               <span className="text-sm font-black">Question {currentIdx + 1} of {questions.length}</span>
             </div>
             <div className="w-48 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5 shadow-inner">
               <div 
                 className="h-full bg-primary transition-all duration-1000 ease-in-out shadow-[0_0_15px_rgba(var(--primary),0.5)]" 
                 style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} 
               />
             </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-xl font-bold" 
            onClick={() => router.push("/dashboard")}
          >
            <StopCircle className="w-4 h-4 mr-2" /> EXIT
          </Button>
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden bg-slate-950">
        {/* LEFT VIEWPORT: AI INTERVIEWER (SARAH) */}
        <div className="flex-1 relative flex items-center justify-center border-r border-white/5 bg-slate-900/10">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent z-10" />
          
          <div className="relative w-full h-full flex items-center justify-center">
            <img 
              src="https://picsum.photos/seed/sarah-pm-ai/1200/1200" 
              alt="Sarah AI Interviewer" 
              className={`w-full h-full object-cover transition-all duration-1000 ${speaking ? 'scale-105 brightness-110 saturate-[1.1]' : 'brightness-75 grayscale-[0.2]'}`}
              data-ai-hint="professional headshot"
            />
            
            {/* Real-time Subtitles Overlaid on AI */}
            <div className="absolute bottom-16 inset-x-0 px-16 z-20">
              <div className="max-w-4xl mx-auto bg-slate-950/80 backdrop-blur-3xl border border-white/10 p-12 rounded-[3rem] shadow-[0_0_120px_rgba(0,0,0,0.6)] animate-fade-in">
                <div className="flex items-start gap-10">
                  <div className="flex flex-col gap-4">
                    <div className={`p-8 rounded-[2.5rem] transition-all duration-700 ${speaking ? 'bg-primary shadow-[0_0_50px_rgba(var(--primary),0.5)]' : 'bg-slate-800'}`}>
                      <Volume2 className={`w-12 h-12 ${speaking ? 'text-white animate-pulse' : 'text-slate-600'}`} />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full hover:bg-white/10 text-slate-500"
                      onClick={() => triggerSpeech(currentIdx)}
                    >
                      <RefreshCw className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="flex-1 pt-3">
                    <div className="flex items-center gap-5 mb-5">
                      <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-1.5 text-[11px] uppercase font-black tracking-widest shadow-sm">AI COACH: SARAH</Badge>
                      <span className="text-[12px] text-slate-500 font-mono tracking-widest flex items-center gap-2">
                         <Activity className="w-3.5 h-3.5" /> 
                         STATUS: {speaking ? 'SPEAKING' : 'LISTENING'}
                      </span>
                    </div>
                    <h3 className="text-3xl md:text-5xl font-headline font-bold leading-[1.2] tracking-tight text-white/95">
                      {questions[currentIdx]}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT VIEWPORT: USER FACE & BIOMETRICS */}
        <div className="w-[580px] bg-slate-950 border-l border-white/10 flex flex-col z-30 shadow-2xl relative">
          <div className="p-10 space-y-12 flex-1 overflow-y-auto">
            
            {/* USER CAMERA FEED */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-3">
                <span className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em]">User Expression Feed</span>
                <div className="flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                   <span className="text-[11px] text-red-500 font-black uppercase tracking-widest">LIVE_CAPTURING</span>
                </div>
              </div>
              <div className="relative aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] group">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline
                  className="w-full h-full object-cover transform scale-x-[-1] bg-black"
                />
                
                {/* AI Overlays on User Face */}
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="absolute inset-x-0 h-1 bg-primary/50 shadow-[0_0_30px_rgba(var(--primary),1)] animate-[scan_5s_linear_infinite]" />
                  
                  {/* Face Tracking Wireframe Brackets */}
                  <div className="absolute top-12 left-12 w-16 h-16 border-t-2 border-l-2 border-primary/60 rounded-tl-[2rem]" />
                  <div className="absolute top-12 right-12 w-16 h-16 border-t-2 border-r-2 border-primary/60 rounded-tr-[2rem]" />
                  <div className="absolute bottom-12 left-12 w-16 h-16 border-b-2 border-l-2 border-primary/60 rounded-bl-[2rem]" />
                  <div className="absolute bottom-12 right-12 w-16 h-16 border-b-2 border-r-2 border-primary/60 rounded-br-[2rem]" />

                  <div className="absolute bottom-8 left-8 flex items-center gap-4">
                    <div className="bg-primary text-white px-5 py-2.5 rounded-2xl text-[12px] font-black flex items-center gap-3 shadow-[0_10px_30px_rgba(var(--primary),0.4)]">
                      <Sparkles className="w-4 h-4" />
                      {currentEmotion.toUpperCase()}
                    </div>
                    <div className="bg-black/70 backdrop-blur-xl border border-white/15 px-5 py-2.5 rounded-2xl flex items-center gap-3">
                       <Target className="w-4 h-4 text-primary" />
                       <span className="text-[11px] font-mono text-white/90">CONFIDENCE: {confidenceLevel}%</span>
                    </div>
                  </div>
                </div>

                {!hasCameraPermission && hasCameraPermission !== null && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-40 p-12 text-center animate-fade-in">
                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.1)]">
                      <Camera className="w-12 h-12 text-red-500" />
                    </div>
                    <h4 className="text-xl font-black text-white mb-3 uppercase tracking-widest">Access Denied</h4>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      Camera access is required for real-time expression mapping. Please enable it in your browser settings.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* NEURAL ANALYSIS METRICS */}
            <div className="space-y-10">
               <div className="flex items-center justify-between px-3">
                 <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em]">Real-time Biometrics</h4>
                 <Badge variant="outline" className="text-[10px] border-primary/20 text-primary uppercase font-black px-3 py-1">Analyzing...</Badge>
               </div>
               
               <div className="grid grid-cols-2 gap-5">
                 {[
                   { label: "Vocal Confidence", value: `${confidenceLevel}%`, icon: MessageSquare, status: "EXCELLENT" },
                   { label: "Neural Clarity", value: "92%", icon: Zap, status: "SHARP" },
                   { label: "Eye Alignment", value: "Locked", icon: Target, status: "OPTIMAL" },
                   { label: "Stress Marker", value: "Min", icon: Activity, status: "STABLE" },
                 ].map((stat, i) => (
                   <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-[2rem] flex flex-col gap-5 hover:bg-white/[0.08] transition-all group cursor-default">
                     <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                       <stat.icon className="w-6 h-6 text-primary" />
                     </div>
                     <div>
                       <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                       <p className="text-2xl font-black text-white mt-1">{stat.value}</p>
                       <span className="text-[10px] text-primary/70 font-mono mt-2 block uppercase font-black tracking-widest">{stat.status}</span>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="space-y-5 pt-10 border-t border-white/10">
                <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] px-3">Response Transcription</label>
                <textarea 
                  placeholder="The AI is listening and transcribing... You can also type here for technical notes." 
                  className="w-full bg-slate-900/50 border border-white/10 text-white rounded-[2.5rem] p-8 h-44 resize-none focus:ring-2 focus:ring-primary/50 outline-none text-lg transition-all shadow-inner placeholder:text-slate-600 font-medium"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ACTION FOOTER */}
          <div className="p-10 border-t border-white/10 bg-slate-950/95 backdrop-blur-3xl">
            <Button 
              className="w-full h-20 rounded-[3rem] bg-primary hover:bg-primary/90 text-white font-black text-2xl shadow-[0_25px_70px_rgba(var(--primary),0.4)] transition-all active:scale-[0.98] disabled:opacity-50 group"
              onClick={handleNext}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="animate-spin h-8 w-8" />
              ) : (
                <>
                  {currentIdx < questions.length - 1 ? 'PROCEED TO NEXT QUESTION' : 'SUBMIT ASSESSMENT'}
                  <ChevronRight className="ml-5 w-8 h-8 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
            <p className="text-center text-[11px] text-slate-600 mt-8 uppercase tracking-[0.4em] font-black">
              Biometric session is encrypted and secure
            </p>
          </div>
        </div>
      </div>

      {/* Audio playback for AI Voice */}
      {audioSrc && (
        <audio 
          ref={audioRef} 
          src={audioSrc} 
          onEnded={() => setSpeaking(false)} 
          className="hidden" 
        />
      )}

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(400px); opacity: 0; }
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
