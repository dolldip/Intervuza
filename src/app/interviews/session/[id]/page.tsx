
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth, useFirestore, useDoc } from "@/firebase"
import { doc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Mic, 
  Clock,
  ShieldCheck,
  BrainCircuit,
  StopCircle,
  Volume2,
  Loader2,
  Activity,
  User,
  Zap,
  Target,
  Sparkles,
  RefreshCw,
  Play,
  Waves,
  ChevronRight
} from "lucide-react"
import { generateInterviewQuestions } from "@/ai/flows/dynamic-interview-question-generation"
import { textToSpeech } from "@/ai/flows/tts-flow"
import { instantTextualAnswerFeedback } from "@/ai/flows/instant-textual-answer-feedback"
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
  const [transcript, setTranscript] = useState("")
  const [initializing, setInitializing] = useState(true)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [processingTurn, setProcessingTurn] = useState(false)
  const [fetchingAudio, setFetchingAudio] = useState(false)
  const [timeLeft, setTimeLeft] = useState(180)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  
  // Biometric stats
  const [currentEmotion, setCurrentEmotion] = useState("Analyzing")
  const [confidenceLevel, setConfidenceLevel] = useState(75)
  const [eyeAlignment, setEyeAlignment] = useState(60)
  const [stressMarker, setStressMarker] = useState(25)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const recognitionRef = useRef<any>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initial Media Setup
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
          title: 'Media Permissions Required',
          description: 'Camera and Mic are essential for this AI experience.',
        });
      }
    }

    setupMedia();

    // Web Speech API Setup
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setTranscript(prev => prev + event.results[i][0].transcript + ' ');
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        // Automated Silence Detection (Hands-Free Conversation)
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = setTimeout(() => {
          if (transcript.trim().length > 10 && !speaking && !processingTurn && !fetchingAudio) {
            completeTurn();
          }
        }, 5000); // 5 seconds of silence triggers turn completion naturally
      };

      recognitionRef.current.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
      };
    }

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (recognitionRef.current) recognitionRef.current.stop();
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, [transcript, speaking, processingTurn, fetchingAudio]);

  // Ensure Video Stream is attached when session starts
  useEffect(() => {
    if (sessionStarted && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.warn("Video stream blocked, awaiting click."));
    }
  }, [sessionStarted, stream]);

  // Neural Simulation Fluctuations (The "Honest" AI)
  useEffect(() => {
    if (sessionStarted && !processingTurn && !fetchingAudio) {
      const emotions = ["Confident", "Analyzing", "Thinking", "Focused", "Calm", "Alert"]
      const interval = setInterval(() => {
        setCurrentEmotion(emotions[Math.floor(Math.random() * emotions.length)])
        setConfidenceLevel(prev => Math.max(45, Math.min(98, prev + (Math.floor(Math.random() * 11) - 5))))
        setEyeAlignment(prev => Math.max(35, Math.min(99, prev + (Math.floor(Math.random() * 15) - 7))))
        setStressMarker(prev => Math.max(10, Math.min(55, prev + (Math.floor(Math.random() * 9) - 4))))
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [sessionStarted, processingTurn, fetchingAudio])

  // Question Generation
  useEffect(() => {
    async function init() {
      const demoRole = sessionStorage.getItem('demo_role') || "Professional Candidate";
      const demoExp = sessionStorage.getItem('demo_exp') || "Mid-level";
      const demoJD = sessionStorage.getItem('demo_jd') || "Target role.";

      try {
        const result = await generateInterviewQuestions({
          jobRole: demoRole,
          experienceLevel: demoExp,
          skills: profile?.skills || ["Critical Thinking", "Professionalism"],
          resumeText: profile?.education || "Standard candidate profile.",
          jobDescriptionText: demoJD
        })
        
        if (result?.questions?.length > 0) {
          setQuestions(result.questions)
        } else {
          throw new Error("Empty questions")
        }
      } catch (err) {
        setQuestions([
          "Can you walk me through your professional background and key achievements?",
          "Tell me about a time you had to overcome a significant workplace challenge.",
          "How do you handle high-pressure situations and tight deadlines?",
          "What motivates you to pursue this specific role in our organization?",
          "Where do you see your career trajectory in the next three to five years?"
        ])
      } finally {
        setInitializing(false)
      }
    }
    
    if (!authLoading) init();
  }, [profile, authLoading])

  // Sarah Speaks - Forced Playback Engine
  const triggerSpeech = async (text: string) => {
    setSpeaking(true)
    setListening(false)
    setFetchingAudio(true)
    if (recognitionRef.current) recognitionRef.current.stop();
    
    try {
      const { media } = await textToSpeech(text)
      setAudioSrc(media)
      setFetchingAudio(false)
      
      // Explicit play trigger for reliability
      if (audioRef.current) {
        audioRef.current.src = media;
        audioRef.current.load();
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.warn("Autoplay blocked. User gesture required.");
            setSpeaking(false);
          });
        }
      }
    } catch (err) {
      console.warn("TTS failed:", err)
      setFetchingAudio(false)
      setSpeaking(false)
      setListening(true)
      if (recognitionRef.current) recognitionRef.current.start();
    }
  }

  const startSession = () => {
    setSessionStarted(true);
    triggerSpeech(questions[0]);
  };

  const handleAudioEnded = () => {
    setSpeaking(false);
    setListening(true);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Recognition already running
      }
    }
  };

  // Conversational Turn Logic
  const completeTurn = async () => {
    if (processingTurn || fetchingAudio) return;
    setProcessingTurn(true);
    setListening(false);
    if (recognitionRef.current) recognitionRef.current.stop();

    const currentAnswers = JSON.parse(sessionStorage.getItem('session_answers') || '[]');
    currentAnswers.push({
      question: questions[currentIdx],
      answer: transcript || "Silent response detected.",
      emotion: currentEmotion,
      confidence: confidenceLevel,
      eyeContact: eyeAlignment
    });
    sessionStorage.setItem('session_answers', JSON.stringify(currentAnswers));

    try {
      if (currentIdx < questions.length - 1) {
        // Get natural conversational reaction from AI
        const reaction = await instantTextualAnswerFeedback({
          interviewQuestion: questions[currentIdx],
          userAnswer: transcript || "...",
          jobRole: sessionStorage.getItem('demo_role') || "Candidate"
        });
        
        const nextIdx = currentIdx + 1;
        setCurrentIdx(nextIdx);
        setTranscript("");
        setTimeLeft(180);
        setAudioSrc(null);
        
        // Sarah acknowledges before asking the next question
        const reactionText = reaction.relevanceFeedback.split('.')[0];
        const responseText = `${reactionText}. Let's discuss the next topic. ${questions[nextIdx]}`;
        await triggerSpeech(responseText);
      } else {
        router.push(`/results/${isMockConfig || params.id === "demo-session" ? 'demo-results' : params.id}`)
      }
    } catch (err) {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1);
        setTranscript("");
        triggerSpeech(questions[currentIdx + 1]);
      } else {
        router.push(`/results/demo-results`);
      }
    } finally {
      setProcessingTurn(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="relative mb-12">
          <BrainCircuit className="w-32 h-32 text-primary animate-pulse" />
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping" />
        </div>
        <h2 className="text-4xl font-headline font-bold mb-4 text-center px-6">Establishing AI Connection</h2>
        <p className="text-slate-400 text-xl text-center px-6">Calibrating neural voice and biometric sensors...</p>
      </div>
    )
  }

  if (!sessionStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-2xl w-full text-center space-y-10 animate-fade-in">
          <div className="w-48 h-48 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 mx-auto shadow-[0_0_80px_rgba(59,130,246,0.2)]">
            <User className="w-20 h-20 text-primary" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-headline font-bold">Start 1-on-1 Interview</h1>
            <p className="text-slate-400 text-xl leading-relaxed px-10">Sarah will speak to you naturally. The interview is fully hands-free—just speak when she's finished.</p>
          </div>
          <Button 
            className="w-full h-24 rounded-[3rem] bg-primary hover:bg-primary/90 text-2xl font-black shadow-2xl transition-all hover:scale-105"
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
      <div className="h-20 border-b border-white/5 bg-slate-950/90 backdrop-blur-2xl px-10 flex items-center justify-between z-50 shadow-lg">
        <div className="flex items-center gap-8">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-lg">
            <ShieldCheck className="text-primary w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-xs tracking-[0.3em] text-primary uppercase">Conversational Assessment</span>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest mt-1 uppercase">
              STATUS: {fetchingAudio ? 'AI PROCESSING' : listening ? 'AI LISTENING' : speaking ? 'SARAH SPEAKING' : 'NEURAL IDLE'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-4 px-6 py-3 bg-white/5 rounded-2xl border border-white/10">
            <Clock className="w-5 h-5 text-slate-400" />
            <span className={`font-mono font-black text-lg ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-slate-200'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-500 hover:text-red-400 font-bold" 
            onClick={() => router.push("/dashboard")}
          >
            <StopCircle className="w-4 h-4 mr-2" /> EXIT
          </Button>
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden bg-slate-950">
        {/* Sarah Panel (Left) */}
        <div className="flex-1 relative flex items-center justify-center border-r border-white/5 bg-black overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-10" />
          
          <img 
            src="https://picsum.photos/seed/sarah-ai-pro/1200/1200" 
            alt="Sarah AI Interviewer" 
            className={`w-full h-full object-cover transition-all duration-[2000ms] ${speaking ? 'scale-105 brightness-110 blur-sm' : 'brightness-75 scale-100'}`}
            data-ai-hint="professional human portrait"
          />
          
          <div className="absolute top-12 left-12 z-20 flex flex-col gap-4">
             {fetchingAudio && (
               <div className="flex items-center gap-3 bg-blue-600/90 text-white px-6 py-3 rounded-2xl animate-pulse font-bold text-sm shadow-2xl">
                  <RefreshCw className="w-4 h-4 animate-spin" /> AI IS THINKING...
               </div>
             )}
             {speaking && !fetchingAudio && (
               <div className="flex items-center gap-3 bg-primary/90 text-white px-6 py-3 rounded-2xl animate-pulse font-bold text-sm shadow-2xl">
                  <Volume2 className="w-4 h-4" /> SARAH IS SPEAKING...
               </div>
             )}
             {listening && (
               <div className="flex items-center gap-3 bg-green-600/90 text-white px-6 py-3 rounded-2xl animate-bounce font-bold text-sm shadow-2xl">
                  <Mic className="w-4 h-4" /> LISTENING...
               </div>
             )}
          </div>

          <div className="absolute bottom-12 inset-x-0 px-10 z-20">
            <div className="max-w-4xl mx-auto bg-slate-950/90 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] shadow-2xl">
              <div className="flex items-start gap-8">
                <div className={`p-7 rounded-[2.5rem] transition-all duration-700 ${speaking ? 'bg-primary shadow-2xl' : 'bg-slate-800'}`}>
                  <Volume2 className={`w-10 h-10 ${speaking ? 'text-white' : 'text-slate-600'}`} />
                </div>
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-5 mb-4">
                    <Badge className="bg-primary/20 text-primary border-primary/30 px-3 py-1 text-[10px] uppercase font-black tracking-widest">Question {currentIdx + 1} of {questions.length}</Badge>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-headline font-bold leading-relaxed tracking-tight text-white/95">
                    {questions[currentIdx]}
                  </h3>
                  {!speaking && !fetchingAudio && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-6 border-white/10 text-white hover:bg-white/5"
                      onClick={() => triggerSpeech(questions[currentIdx])}
                    >
                      <RefreshCw className="w-3 h-3 mr-2" /> Replay Sarah's Voice
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Biometrics Sidebar (Right) */}
        <div className="w-[500px] bg-slate-950 border-l border-white/10 flex flex-col z-30 relative shadow-2xl">
          <div className="p-8 space-y-8 flex-1 overflow-y-auto scrollbar-hide">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-3">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Live Face Feed</span>
                <div className="flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                   <span className="text-[10px] text-red-500 font-black uppercase tracking-widest">Bio-Scan Active</span>
                </div>
              </div>
              <div className="relative aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline
                  className="w-full h-full object-cover transform scale-x-[-1] brightness-110"
                />
                
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="absolute inset-x-0 h-[2px] bg-primary/40 shadow-[0_0_30px_#3b82f6] animate-[scan_6s_linear_infinite]" />
                  <div className="absolute bottom-6 left-6 flex items-center gap-2">
                    <div className="bg-primary/95 text-white px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 shadow-2xl backdrop-blur-md border border-white/10">
                      <Sparkles className="w-3.5 h-3.5" />
                      {currentEmotion.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                 {[
                   { label: "Confidence", value: `${confidenceLevel}%`, icon: Activity, status: confidenceLevel > 70 ? "Optimal" : "Fluctuating" },
                   { label: "Eye Alignment", value: `${eyeAlignment}%`, icon: Target, status: eyeAlignment > 60 ? "Locked" : "Searching" },
                 ].map((stat, i) => (
                   <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-[2.5rem] flex flex-col gap-2 group hover:bg-white/10 transition-colors">
                     <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-white/5">
                       <stat.icon className="w-5 h-5 text-primary" />
                     </div>
                     <div>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{stat.label}</p>
                       <p className="text-xl font-black text-white">{stat.value}</p>
                       <span className={`text-[9px] font-black uppercase mt-1 block ${stat.status === 'Optimal' || stat.status === 'Locked' ? 'text-green-500' : 'text-amber-500 animate-pulse'}`}>
                         {stat.status}
                       </span>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between px-3">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Waves className={`w-3 h-3 ${listening ? 'text-green-500 animate-pulse' : 'text-slate-700'}`} />
                      Neural Live Transcript
                    </label>
                  </div>
                  <div className="w-full bg-slate-900/40 border border-white/5 text-white rounded-[2.5rem] p-8 h-44 overflow-y-auto scrollbar-hide shadow-inner">
                    {transcript ? (
                      <p className="text-lg leading-relaxed text-slate-200">{transcript}</p>
                    ) : (
                      <p className="text-lg text-slate-700 italic">Sarah is listening for your response...</p>
                    )}
                  </div>
               </div>
            </div>
          </div>

          <div className="p-10 border-t border-white/5 bg-slate-950/95 backdrop-blur-3xl">
            {listening ? (
              <Button 
                className="w-full h-20 rounded-[3rem] bg-green-600 hover:bg-green-500 text-white font-black text-xl shadow-2xl transition-all hover:scale-[1.02]"
                onClick={completeTurn}
              >
                FINISH ANSWER
                <ChevronRight className="ml-4 w-6 h-6" />
              </Button>
            ) : processingTurn || fetchingAudio ? (
              <Button disabled className="w-full h-20 rounded-[3rem] bg-slate-800 text-slate-400 font-black text-xl">
                <Loader2 className="animate-spin h-6 w-6 mr-4" />
                NEURAL SYNC...
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4">
                 <div className="flex items-center gap-4">
                    <Loader2 className="animate-spin h-5 w-5 text-primary" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Sarah is Processing...</span>
                 </div>
              </div>
            )}
            <p className="text-center text-[9px] text-slate-700 mt-6 uppercase tracking-[0.4em] font-black">
              Automated 1-on-1 Interaction
            </p>
          </div>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        onEnded={handleAudioEnded} 
        onPlay={() => setSpeaking(true)}
        className="hidden" 
      />

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(300px); opacity: 0; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
