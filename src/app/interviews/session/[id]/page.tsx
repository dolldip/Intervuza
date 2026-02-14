
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth, useFirestore, useDoc } from "@/firebase"
import { doc, updateDoc, arrayUnion } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Mic, 
  Video as VideoIcon, 
  Clock,
  ShieldCheck,
  BrainCircuit,
  StopCircle,
  Volume2,
  Loader2,
  Camera,
  Activity,
  User,
  Zap,
  Target,
  Sparkles,
  RefreshCw,
  Play,
  MicOff,
  Waveform,
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
  const [timeLeft, setTimeLeft] = useState(180)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  
  // Real-time analysis simulation states
  const [currentEmotion, setCurrentEmotion] = useState("Analyzing")
  const [confidenceLevel, setConfidenceLevel] = useState(75)
  const [eyeAlignment, setEyeAlignment] = useState(60)
  const [neuralClarity, setNeuralClarity] = useState(82)
  const [stressMarker, setStressMarker] = useState(25)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const recognitionRef = useRef<any>(null)

  // Initial Media Permission Request
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
          description: 'Camera and Mic are essential for AI human interaction.',
        });
      }
    }

    setupMedia();

    // Initialize Web Speech API
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
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
      };
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Ensure Video Stream is attached when UI loads
  useEffect(() => {
    if (sessionStarted && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Video play error:", e));
    }
  }, [sessionStarted, stream]);

  // Neural Analysis Simulation
  useEffect(() => {
    if (sessionStarted) {
      const emotions = ["Confident", "Analyzing", "Searching", "Thoughtful", "Focused", "Stressed", "Uncertain"]
      const interval = setInterval(() => {
        setCurrentEmotion(emotions[Math.floor(Math.random() * emotions.length)])
        setConfidenceLevel(prev => Math.max(35, Math.min(98, prev + (Math.floor(Math.random() * 21) - 10))))
        setEyeAlignment(prev => Math.max(25, Math.min(99, prev + (Math.floor(Math.random() * 31) - 15))))
        setNeuralClarity(prev => Math.max(45, Math.min(96, prev + (Math.floor(Math.random() * 15) - 7))))
        setStressMarker(prev => Math.max(10, Math.min(85, prev + (Math.floor(Math.random() * 21) - 10))))
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [sessionStarted])

  // Timer logic
  useEffect(() => {
    if (sessionStarted && timeLeft > 0 && !processingTurn) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [sessionStarted, timeLeft, processingTurn]);

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

  // Sarah Speaks
  const triggerSpeech = async (text: string) => {
    setSpeaking(true)
    setListening(false)
    if (recognitionRef.current) recognitionRef.current.stop();
    
    try {
      const { media } = await textToSpeech(text)
      setAudioSrc(media)
      // Playback triggered by useEffect on audioSrc
    } catch (err) {
      console.warn("Speech generation failed:", err)
      setSpeaking(false)
      setListening(true)
      if (recognitionRef.current) recognitionRef.current.start();
    }
  }

  // Handle Audio State
  useEffect(() => {
    if (audioSrc && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(e => console.error("Audio play error", e));
    }
  }, [audioSrc]);

  const startSession = () => {
    setSessionStarted(true);
    triggerSpeech(questions[0]);
  };

  const handleAudioEnded = () => {
    setSpeaking(false);
    setListening(true);
    if (recognitionRef.current) recognitionRef.current.start();
  };

  // Turn Progression
  const completeTurn = async () => {
    if (processingTurn) return;
    setProcessingTurn(true);
    setListening(false);
    if (recognitionRef.current) recognitionRef.current.stop();

    const currentAnswers = JSON.parse(sessionStorage.getItem('session_answers') || '[]');
    currentAnswers.push({
      question: questions[currentIdx],
      answer: transcript || "Silent response.",
      emotion: currentEmotion,
      confidence: confidenceLevel,
      eyeContact: eyeAlignment
    });
    sessionStorage.setItem('session_answers', JSON.stringify(currentAnswers));

    if (!isMockConfig && db && params.id !== "demo-session") {
      try {
        const interviewRef = doc(db, "interviews", params.id as string);
        await updateDoc(interviewRef, {
          answers: arrayUnion({
            question: questions[currentIdx],
            answer: transcript,
            timestamp: new Date().toISOString(),
            metrics: { confidence: confidenceLevel, emotion: currentEmotion, eyeContact: eyeAlignment }
          })
        });
      } catch (e) { console.error("Firebase update failed", e); }
    }

    try {
      if (currentIdx < questions.length - 1) {
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
        
        const responseText = `I understand. ${reaction.relevanceFeedback.split('.')[0]}. Now, let's move to the next topic. ${questions[nextIdx]}`;
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
        <h2 className="text-4xl font-headline font-bold mb-4">Initializing Sarah AI</h2>
        <p className="text-slate-400 text-xl text-center px-6">Calibrating neural sensors and voice engine...</p>
      </div>
    )
  }

  if (!sessionStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-2xl w-full text-center space-y-10">
          <div className="w-40 h-40 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 mx-auto shadow-2xl">
            <User className="w-16 h-16 text-primary" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-headline font-bold">Conversational Session Ready</h1>
            <p className="text-slate-400 text-lg">Sarah will speak to you and listen to your answers in real-time. No typing required.</p>
          </div>
          <Button 
            className="w-full h-24 rounded-[3rem] bg-primary hover:bg-primary/90 text-2xl font-black shadow-2xl"
            onClick={startSession}
          >
            BEGIN REAL-TIME INTERVIEW
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
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-lg">
            <ShieldCheck className="text-primary w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-xs tracking-[0.3em] text-primary uppercase">Conversational AI Stream</span>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest mt-1">STATUS: {listening ? 'LISTENING' : speaking ? 'SARAH SPEAKING' : 'THINKING...'}</span>
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
        <div className="flex-1 relative flex items-center justify-center border-r border-white/5 bg-black">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-10" />
          
          <div className="relative w-full h-full flex items-center justify-center">
            <img 
              src="https://picsum.photos/seed/sarah-interview-pro/1200/1200" 
              alt="Sarah AI Interviewer" 
              className={`w-full h-full object-cover transition-all duration-1000 ${speaking ? 'scale-105 brightness-110' : 'brightness-75'}`}
              data-ai-hint="professional headshot female"
            />
            
            <div className="absolute top-12 left-12 z-20 flex flex-col gap-4">
               {speaking && (
                 <div className="flex items-center gap-3 bg-primary/90 text-white px-5 py-2.5 rounded-2xl animate-pulse font-bold text-sm shadow-xl">
                    <Volume2 className="w-4 h-4" /> SARAH IS SPEAKING
                 </div>
               )}
               {listening && (
                 <div className="flex items-center gap-3 bg-green-600/90 text-white px-5 py-2.5 rounded-2xl animate-bounce font-bold text-sm shadow-xl">
                    <Mic className="w-4 h-4" /> AI IS LISTENING...
                 </div>
               )}
            </div>

            <div className="absolute bottom-12 inset-x-0 px-10 z-20">
              <div className="max-w-4xl mx-auto bg-slate-950/90 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] shadow-2xl animate-fade-in">
                <div className="flex items-start gap-8">
                  <div className={`p-6 rounded-[2rem] transition-all duration-700 ${speaking ? 'bg-primary shadow-[0_0_60px_rgba(var(--primary),0.4)] animate-pulse' : 'bg-slate-800'}`}>
                    <Volume2 className={`w-10 h-10 ${speaking ? 'text-white' : 'text-slate-600'}`} />
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-5 mb-4">
                      <Badge className="bg-primary/20 text-primary border-primary/30 px-3 py-1 text-[10px] uppercase font-black tracking-widest">SARAH AI INTERVIEWER</Badge>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-headline font-bold leading-relaxed tracking-tight text-white/95">
                      {questions[currentIdx]}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-[540px] bg-slate-950 border-l border-white/10 flex flex-col z-30 relative shadow-2xl">
          <div className="p-8 space-y-10 flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-3">
                <span className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em]">Biometric Feed</span>
                <div className="flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                   <span className="text-[11px] text-red-500 font-black uppercase tracking-widest">Live Scan</span>
                </div>
              </div>
              <div className="relative aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-inner">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
                
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="absolute inset-x-0 h-1 bg-primary/40 shadow-[0_0_30px_rgba(var(--primary),1)] animate-[scan_5s_linear_infinite]" />
                  <div className="absolute bottom-6 left-6 flex items-center gap-2">
                    <div className="bg-primary/90 text-white px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-2 shadow-lg backdrop-blur-md">
                      <Sparkles className="w-3 h-3" />
                      {currentEmotion.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                 {[
                   { label: "Confidence", value: `${confidenceLevel}%`, icon: Activity },
                   { label: "Eye Alignment", value: `${eyeAlignment}%`, icon: Target },
                 ].map((stat, i) => (
                   <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-[2rem] flex flex-col gap-2">
                     <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                       <stat.icon className="w-5 h-5 text-primary" />
                     </div>
                     <div>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{stat.label}</p>
                       <p className="text-xl font-black text-white">{stat.value}</p>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between px-3">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Mic className={`w-3 h-3 ${listening ? 'text-green-500' : 'text-slate-700'}`} />
                      Live Transcription
                    </label>
                  </div>
                  <div className="w-full bg-slate-900/50 border border-white/10 text-white rounded-[2.5rem] p-8 h-48 overflow-y-auto scrollbar-hide">
                    {transcript ? (
                      <p className="text-lg leading-relaxed text-slate-200 animate-in fade-in">{transcript}</p>
                    ) : (
                      <p className="text-lg text-slate-700 italic">Sarah is waiting for your response...</p>
                    )}
                  </div>
               </div>
            </div>
          </div>

          <div className="p-10 border-t border-white/10 bg-slate-950/95 backdrop-blur-3xl">
            {listening ? (
              <Button 
                className="w-full h-20 rounded-[3rem] bg-green-600 hover:bg-green-500 text-white font-black text-xl shadow-2xl transition-all"
                onClick={completeTurn}
              >
                FINISH ANSWER
                <ChevronRight className="ml-4 w-6 h-6" />
              </Button>
            ) : processingTurn ? (
              <Button disabled className="w-full h-20 rounded-[3rem] bg-slate-800 text-white font-black text-xl">
                <Loader2 className="animate-spin h-6 w-6 mr-4" />
                SARAH IS THINKING...
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-4">
                 <div className="flex items-center gap-4">
                    <Loader2 className="animate-spin h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Awaiting AI Transition...</span>
                 </div>
              </div>
            )}
            <p className="text-center text-[9px] text-slate-700 mt-6 uppercase tracking-[0.3em] font-black">
              Biometric & Audio analysis is real-time
            </p>
          </div>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        src={audioSrc ?? undefined} 
        onEnded={handleAudioEnded} 
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
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
