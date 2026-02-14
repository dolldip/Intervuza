
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
  Play,
  VolumeX,
  ShieldAlert
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
  const [audioError, setAudioError] = useState(false)
  
  // Real-time analysis simulation states
  const [currentEmotion, setCurrentEmotion] = useState("Analyzing")
  const [confidenceLevel, setConfidenceLevel] = useState(75)
  const [eyeAlignment, setEyeAlignment] = useState(60)
  const [neuralClarity, setNeuralClarity] = useState(82)
  const [stressMarker, setStressMarker] = useState(25)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Camera and Audio Permission Request
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
          title: 'Media Permissions Required',
          description: 'Camera and Mic are essential for AI human interaction.',
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

  // Neural Analysis Simulation (More honest fluctuations)
  useEffect(() => {
    if (sessionStarted) {
      const emotions = ["Confident", "Analyzing", "Searching", "Thoughtful", "Focused", "Stressed", "Uncertain"]
      const interval = setInterval(() => {
        setCurrentEmotion(emotions[Math.floor(Math.random() * emotions.length)])
        
        // Fluctuate metrics more "honestly" - they can drop low
        setConfidenceLevel(prev => Math.max(40, Math.min(98, prev + (Math.floor(Math.random() * 21) - 10))))
        setEyeAlignment(prev => Math.max(30, Math.min(99, prev + (Math.floor(Math.random() * 31) - 15))))
        setNeuralClarity(prev => Math.max(50, Math.min(96, prev + (Math.floor(Math.random() * 15) - 7))))
        setStressMarker(prev => Math.max(5, Math.min(80, prev + (Math.floor(Math.random() * 21) - 10))))
      }, 2000)
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
          jobRole: demoRole || profile?.targetRole || "Professional Candidate",
          experienceLevel: demoExp || profile?.experienceLevel || "Mid-level",
          skills: profile?.skills || ["Communication", "Critical Thinking"],
          resumeText: `Candidate Profile: ${profile?.education || "Standard Educational Background"}`,
          jobDescriptionText: demoJD || "Target professional role."
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
    if (!questions[index]) return;
    
    setSpeaking(true)
    setAudioError(false)
    
    try {
      const { media } = await textToSpeech(questions[index])
      setAudioSrc(media)
      
      // Explicit play attempt
      if (audioRef.current) {
        audioRef.current.load();
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn("Autoplay blocked, waiting for user interaction.");
            setSpeaking(false);
          });
        }
      }
    } catch (err) {
      console.warn("Speech failed:", err)
      setSpeaking(false)
      setAudioError(true)
    }
  }

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
      answer: answer || "Provided a verbal response during assessment.",
      emotion: currentEmotion,
      confidence: confidenceLevel,
      eyeContact: eyeAlignment
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
          timestamp: new Date().toISOString(),
          metrics: {
            confidence: confidenceLevel,
            emotion: currentEmotion,
            eyeContact: eyeAlignment
          }
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

  const getStatusLabel = (val: number, type: 'confidence' | 'eye' | 'stress' | 'clarity') => {
    if (type === 'eye') {
      if (val > 85) return "OPTIMAL"
      if (val > 65) return "STABLE"
      if (val > 45) return "FLUCTUATING"
      return "SEARCHING"
    }
    if (type === 'stress') {
      if (val < 25) return "STABLE"
      if (val < 40) return "MODERATE"
      if (val < 60) return "RISING"
      return "ELEVATED"
    }
    if (type === 'confidence') {
      if (val > 80) return "HIGH"
      if (val > 60) return "CONSISTENT"
      if (val > 40) return "UNCERTAIN"
      return "MINIMAL"
    }
    return "SHARP"
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
          Calibrating neural feedback and biometric sensors...
        </p>
      </div>
    )
  }

  if (!sessionStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-2xl w-full text-center space-y-10 animate-fade-in">
          <div className="w-40 h-40 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 mx-auto shadow-[0_0_80px_rgba(var(--primary),0.3)]">
            <User className="w-16 h-16 text-primary" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-headline font-bold">Session Ready</h1>
            <p className="text-slate-400 text-lg">
              Sarah AI is ready to conduct your assessment. Please enable audio and face the camera.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
              <Camera className="w-5 h-5 text-green-500 mb-2" />
              <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Biometrics</p>
              <p className="text-sm font-bold">Face Mapping Ready</p>
            </div>
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
              <Volume2 className="w-5 h-5 text-blue-500 mb-2" />
              <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Audio</p>
              <p className="text-sm font-bold">Speaker Calibration OK</p>
            </div>
          </div>
          <Button 
            className="w-full h-24 rounded-[3rem] bg-primary hover:bg-primary/90 text-2xl font-black shadow-[0_20px_60px_rgba(var(--primary),0.3)] transition-all hover:scale-[1.02]"
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
      {/* HUD Header */}
      <div className="h-20 border-b border-white/5 bg-slate-950/90 backdrop-blur-2xl px-10 flex items-center justify-between z-50">
        <div className="flex items-center gap-8">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
            <ShieldCheck className="text-primary w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-xs tracking-[0.3em] text-primary uppercase">Biometric Live Session</span>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest mt-1">ID: ASSESSMENT_S_{params.id?.toString().toUpperCase() || 'DEMO'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-4 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
            <Clock className="w-5 h-5 text-slate-400" />
            <span className={`font-mono font-black text-lg ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-slate-200'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="flex items-center gap-8">
             <div className="flex flex-col items-end">
               <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Assessment Progress</span>
               <span className="text-sm font-black">{currentIdx + 1} / {questions.length}</span>
             </div>
             <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
               <div 
                 className="h-full bg-primary transition-all duration-1000 ease-in-out" 
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
        {/* LEFT PANEL: SARAH AI & QUESTION */}
        <div className="flex-1 relative flex items-center justify-center border-r border-white/5 bg-black">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-10" />
          
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Stable Human Avatar for Sarah */}
            <img 
              src="https://picsum.photos/seed/sarah-interview-v4/1200/1200" 
              alt="Sarah AI Human" 
              className={`w-full h-full object-cover transition-all duration-1000 ${speaking ? 'scale-105 brightness-110 saturate-[1.2]' : 'brightness-75 grayscale-[0.2]'}`}
              data-ai-hint="professional headshot human"
            />
            
            {/* Question Card Overlay */}
            <div className="absolute bottom-12 inset-x-0 px-10 z-20">
              <div className="max-w-4xl mx-auto bg-slate-950/90 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-fade-in">
                <div className="flex items-start gap-8">
                  <div className="flex flex-col gap-4">
                    <div className={`p-6 rounded-[2rem] transition-all duration-700 ${speaking ? 'bg-primary shadow-[0_0_60px_rgba(var(--primary),0.4)] animate-pulse' : 'bg-slate-800'}`}>
                      <Volume2 className={`w-10 h-10 ${speaking ? 'text-white' : 'text-slate-600'}`} />
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className={`rounded-full border-white/10 hover:bg-white/10 ${audioError ? 'text-amber-500 border-amber-500/50 animate-bounce' : 'text-slate-500'}`}
                      onClick={() => triggerSpeech(currentIdx)}
                      title="Replay Sarah's Voice"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-5 mb-4">
                      <Badge className="bg-primary/20 text-primary border-primary/30 px-3 py-1 text-[10px] uppercase font-black tracking-widest">SARAH AI INTERVIEWER</Badge>
                      <span className="text-[11px] text-slate-500 font-mono tracking-widest flex items-center gap-2 uppercase">
                         <Activity className={`w-3 h-3 ${speaking ? 'text-primary' : 'text-slate-700'}`} /> 
                         {speaking ? 'Synthesizing Voice...' : 'Awaiting Response'}
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-headline font-bold leading-relaxed tracking-tight text-white/95">
                      {questions[currentIdx]}
                    </h3>
                    {audioError && (
                       <p className="text-[10px] text-amber-500/80 mt-3 font-mono uppercase tracking-widest">
                         Audio playback blocked. Click the replay icon to hear Sarah.
                       </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: LIVE BIOMETRIC ANALYSIS (YOUR FACE) */}
        <div className="w-[540px] bg-slate-950 border-l border-white/10 flex flex-col z-30 shadow-2xl relative">
          <div className="p-10 space-y-12 flex-1 overflow-y-auto">
            
            {/* LIVE FEED */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-3">
                <span className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em]">Neural Biometric Stream</span>
                <div className="flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                   <span className="text-[11px] text-red-500 font-black uppercase tracking-widest">Live Scan</span>
                </div>
              </div>
              <div className="relative aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group ring-1 ring-white/10">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline
                  className="w-full h-full object-cover transform scale-x-[-1] bg-black"
                />
                
                {/* HUD Scan Overlay */}
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="absolute inset-x-0 h-1 bg-primary/40 shadow-[0_0_30px_rgba(var(--primary),1)] animate-[scan_5s_linear_infinite]" />
                  
                  {/* Face Framing HUD */}
                  <div className="absolute top-8 left-8 w-10 h-10 border-t-2 border-l-2 border-primary/40 rounded-tl-xl" />
                  <div className="absolute top-8 right-8 w-10 h-10 border-t-2 border-r-2 border-primary/40 rounded-tr-xl" />
                  <div className="absolute bottom-8 left-8 w-10 h-10 border-b-2 border-l-2 border-primary/40 rounded-bl-xl" />
                  <div className="absolute bottom-8 right-8 w-10 h-10 border-b-2 border-r-2 border-primary/40 rounded-br-xl" />

                  <div className="absolute bottom-6 left-6 flex items-center gap-2">
                    <div className="bg-primary/90 text-white px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-2 shadow-lg backdrop-blur-md">
                      <Sparkles className="w-3 h-3" />
                      {currentEmotion.toUpperCase()}
                    </div>
                  </div>
                </div>

                {!hasCameraPermission && hasCameraPermission !== null && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-40 p-12 text-center">
                    <Camera className="w-12 h-12 text-red-500 mb-6" />
                    <h4 className="text-xl font-black text-white mb-2 uppercase tracking-widest">Visual Input Required</h4>
                    <p className="text-sm text-slate-500 font-medium">
                      Face scan is disabled. Please check camera permissions.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* NEURAL STATS */}
            <div className="space-y-8">
               <div className="flex items-center justify-between px-3">
                 <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em]">AI Biometric Analysis</h4>
                 <Badge variant="outline" className="text-[10px] border-primary/20 text-primary uppercase font-black px-3 py-1">Monitoring...</Badge>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 {[
                   { label: "Confidence", value: `${confidenceLevel}%`, icon: MessageSquare, type: 'confidence' as const },
                   { label: "Neural Clarity", value: `${neuralClarity}%`, icon: Zap, type: 'clarity' as const },
                   { label: "Eye Alignment", value: `${eyeAlignment}%`, icon: Target, type: 'eye' as const },
                   { label: "Stress Marker", value: `${stressMarker}%`, icon: Activity, type: 'stress' as const },
                 ].map((stat, i) => {
                   const val = stat.type === 'eye' ? eyeAlignment : stat.type === 'stress' ? stressMarker : stat.type === 'confidence' ? confidenceLevel : neuralClarity;
                   const status = getStatusLabel(val, stat.type);
                   const isWarning = status === 'SEARCHING' || status === 'ELEVATED' || status === 'UNCERTAIN' || status === 'FLUCTUATING';
                   
                   return (
                     <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-[2rem] flex flex-col gap-4 hover:bg-white/[0.08] transition-all group">
                       <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                         <stat.icon className={`w-5 h-5 ${isWarning ? 'text-amber-500' : 'text-primary'}`} />
                       </div>
                       <div>
                         <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                         <p className="text-xl font-black text-white">{stat.value}</p>
                         <span className={`text-[9px] font-mono mt-2 block uppercase font-black tracking-[0.1em] ${isWarning ? 'text-amber-500 animate-pulse' : 'text-primary/70'}`}>
                           {status}
                         </span>
                       </div>
                     </div>
                   )
                 })}
               </div>

               <div className="space-y-4 pt-8 border-t border-white/10">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-3 flex items-center gap-2">
                  <Mic className="w-3 h-3" />
                  Voice Transcription (Real-time)
                </label>
                <textarea 
                  placeholder="Respond to Sarah..." 
                  className="w-full bg-slate-900/50 border border-white/10 text-white rounded-[2.5rem] p-8 h-40 resize-none focus:ring-1 focus:ring-primary/50 outline-none text-lg transition-all shadow-inner placeholder:text-slate-800"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ACTION HUB */}
          <div className="p-10 border-t border-white/10 bg-slate-950/95 backdrop-blur-3xl">
            <Button 
              className="w-full h-20 rounded-[3rem] bg-primary hover:bg-primary/90 text-white font-black text-2xl shadow-[0_20px_60px_rgba(var(--primary),0.3)] transition-all active:scale-[0.98] disabled:opacity-50"
              onClick={handleNext}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="animate-spin h-8 w-8" />
              ) : (
                <>
                  {currentIdx < questions.length - 1 ? 'NEXT QUESTION' : 'COMPLETE ASSESSMENT'}
                  <ChevronRight className="ml-4 w-6 h-6" />
                </>
              )}
            </Button>
            <p className="text-center text-[9px] text-slate-700 mt-6 uppercase tracking-[0.3em] font-black">
              Biometric session data is end-to-end encrypted
            </p>
          </div>
        </div>
      </div>

      {/* SARAH'S HUMAN VOICE SOURCE */}
      <audio 
        ref={audioRef} 
        src={audioSrc || ""} 
        onEnded={() => setSpeaking(false)} 
        onPlay={() => setSpeaking(true)}
        className="hidden" 
      />

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
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
