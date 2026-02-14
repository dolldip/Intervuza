
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth, useFirestore, useUser } from "@/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  StopCircle, 
  Volume2, 
  Loader2, 
  Activity, 
  Target, 
  Play, 
  CheckCircle2,
  Mic,
  ShieldCheck,
  BrainCircuit,
  Sparkles,
  Zap,
  Terminal,
  X,
  TrendingUp,
  ChevronRight,
  Lightbulb,
  Code2
} from "lucide-react"
import { generateInterviewQuestions } from "@/ai/flows/dynamic-interview-question-generation"
import { textToSpeech } from "@/ai/flows/tts-flow"
import { instantTextualAnswerFeedback } from "@/ai/flows/instant-textual-answer-feedback"
import { useToast } from "@/hooks/use-toast"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"

export default function InterviewSessionPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()

  const [currentQuestion, setCurrentQuestion] = useState("")
  const [opening, setOpening] = useState("")
  const [roleCategory, setRoleCategory] = useState("Other")
  const [turnCount, setTurnCount] = useState(0)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [initializing, setInitializing] = useState(true)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [processingTurn, setProcessingTurn] = useState(false)
  const [fetchingAudio, setFetchingAudio] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [currentEmotion, setCurrentEmotion] = useState("Neutral")
  const [hasCameraPermission, setHasCameraPermission] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isStuck, setIsStuck] = useState(false)
  const [terminating, setTerminating] = useState(false)
  
  // Real-time Feedback State
  const [turnFeedback, setTurnFeedback] = useState<any>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  
  // Coding Logic Pad State
  const [code, setCode] = useState("// Write your logic or explanation here...")
  const [showCodePad, setShowCodePad] = useState(false)
  
  const [confidenceLevel, setConfidenceLevel] = useState(85)
  const [eyeFocus, setEyeFocus] = useState(90)

  const userVideoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const recognitionRef = useRef<any>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptAccumulatorRef = useRef("")
  
  // IRONCLAD MEMORY: Tracks every single question asked to prevent ANY repetition.
  const historyRef = useRef<string[]>([])

  const stateRef = useRef({ 
    speaking, 
    listening, 
    processingTurn, 
    turnCount, 
    currentQuestion, 
    sessionStarted,
    isStuck
  })

  useEffect(() => {
    stateRef.current = { 
      speaking, 
      listening, 
      processingTurn, 
      turnCount, 
      currentQuestion, 
      sessionStarted,
      isStuck
    }
  }, [speaking, listening, processingTurn, turnCount, currentQuestion, sessionStarted, isStuck])

  useEffect(() => {
    if (userVideoRef.current && stream) {
      userVideoRef.current.srcObject = stream;
    }
  }, [sessionStarted, stream, hasCameraPermission]);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(mediaStream)
        setHasCameraPermission(true)
      } catch (error) {
        setHasCameraPermission(false);
      }
    };
    getCameraPermission();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const { speaking: isSpeaking, processingTurn: isProcessing, sessionStarted: isStarted } = stateRef.current;
        if (!isStarted || isSpeaking || isProcessing) return;

        let interimText = '';
        let currentFinalText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentFinalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        if (currentFinalText) {
          transcriptAccumulatorRef.current += currentFinalText + ' ';
          setTranscript(transcriptAccumulatorRef.current);
          setIsStuck(false);
        }
        setInterimTranscript(interimText);

        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = setTimeout(() => {
          const combinedText = (transcriptAccumulatorRef.current + interimText).trim();
          if (combinedText.length > 5) completeTurn(false);
          else if (combinedText.length === 0) setIsStuck(true);
        }, 15000); 
      };

      recognitionRef.current.onend = () => {
        const { sessionStarted: isStarted, listening: isListening } = stateRef.current;
        if (isStarted && isListening) {
          try { recognitionRef.current.start(); } catch(e) {}
        }
      };
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    async function init() {
      const demoRole = sessionStorage.getItem('demo_role') || "Professional Candidate";
      const demoExp = sessionStorage.getItem('demo_exp') || "Mid-level";
      const demoJd = sessionStorage.getItem('demo_jd') || "";
      const demoRound = sessionStorage.getItem('demo_round') || "technical";
      const demoResume = sessionStorage.getItem('demo_resume') || "";

      try {
        const result = await generateInterviewQuestions({
          jobRole: demoRole,
          experienceLevel: demoExp,
          skills: [],
          jobDescriptionText: demoJd,
          resumeText: demoResume,
          roundType: demoRound,
        })
        setOpening(result.openingStatement)
        setCurrentQuestion(result.firstQuestion)
        setRoleCategory(result.roleCategory)
        // INITIAL LOGGING: Ensure first question is in history instantly
        historyRef.current = [result.firstQuestion]
      } catch (err) {
        setOpening("Hi, I'm Aria. Let's begin your professional audit.")
        const fb = "Given your background, what do you think is the biggest challenge in your industry today?"
        setCurrentQuestion(fb)
        historyRef.current = [fb]
      } finally {
        setInitializing(false)
      }
    }
    init();
  }, [])

  const triggerSpeech = async (text: string) => {
    setSpeaking(true)
    setListening(false)
    setFetchingAudio(true)
    
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {}
    
    try {
      const result = await textToSpeech(text)
      setFetchingAudio(false)
      if (result.fallback || !result.media) {
        useLocalSpeech(text);
      } else {
        setAudioSrc(result.media)
        if (audioRef.current) {
          audioRef.current.load()
          audioRef.current.play().catch(() => useLocalSpeech(text));
        }
      }
    } catch (err) {
      setFetchingAudio(false)
      useLocalSpeech(text);
    }
  }

  const useLocalSpeech = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      setSpeaking(false);
      setListening(true);
      if (recognitionRef.current) try { recognitionRef.current.start(); } catch (e) {}
    };
    window.speechSynthesis.speak(utterance);
  }

  const startSession = () => {
    setSessionStarted(true);
    triggerSpeech(`${opening}. ${currentQuestion}`);
  };

  const handleAudioEnded = () => {
    setSpeaking(false);
    setListening(true);
    if (recognitionRef.current) try { recognitionRef.current.start(); } catch (e) {}
  };

  const terminateSession = async () => {
    setTerminating(true);
    if (user && db && params.id !== "demo-session") {
      const sessionRef = doc(db, "users", user.uid, "interviewSessions", params.id as string);
      await updateDoc(sessionRef, {
        status: "completed",
        endTime: new Date().toISOString(),
        overallScore: Math.round(confidenceLevel * 0.7 + 25),
      });
    }
    router.push(`/results/${params.id === "demo-session" ? 'demo-results' : params.id}`);
  };

  const completeTurn = async (forcedStuck: boolean = false) => {
    const { processingTurn: isProcessing, turnCount: currentTurn, currentQuestion: question } = stateRef.current;
    if (isProcessing) return;
    
    setProcessingTurn(true);
    setListening(false);
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {}

    const fullAnswer = (transcriptAccumulatorRef.current + interimTranscript).trim() + (showCodePad ? ` [Code Submission: ${code}]` : "");
    
    try {
      const feedback = await instantTextualAnswerFeedback({
        interviewQuestion: question,
        userAnswer: fullAnswer || "Silence.",
        jobRole: sessionStorage.getItem('demo_role') || "Candidate",
        experienceLevel: sessionStorage.getItem('demo_exp') || "junior",
        currentRound: sessionStorage.getItem('demo_round') === 'hr' ? 'hr' : 'technical',
        resumeText: sessionStorage.getItem('demo_resume') || "",
        previousQuestions: historyRef.current,
        isStuck: forcedStuck || isStuck
      });
      
      setCurrentEmotion(feedback.detectedEmotion);
      setTurnFeedback(feedback.feedback);
      setShowFeedback(true);
      
      if (!feedback.isInterviewComplete && currentTurn < 6) {
        setTurnCount(currentTurn + 1);
        setCurrentQuestion(feedback.nextQuestion);
        
        // IRONCLAD MEMORY COMMIT: Add the newly generated question to history BEFORE it's even spoken
        historyRef.current = [...historyRef.current, feedback.nextQuestion];
        
        setTranscript("");
        setInterimTranscript("");
        transcriptAccumulatorRef.current = "";
        
        const finalPrompt = `${feedback.verbalReaction}. ${feedback.nextQuestion}`;
        setTimeout(() => {
          triggerSpeech(finalPrompt);
        }, 1500);
      } else {
        terminateSession();
      }
    } catch (err) {
      terminateSession();
    } finally {
      setProcessingTurn(false);
      setIsStuck(false);
    }
  };

  const ariaImage = PlaceHolderImages.find(img => img.id === 'aria-persona')?.imageUrl || "https://picsum.photos/seed/aria/1280/720";

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <BrainCircuit className="w-20 h-20 text-primary animate-pulse mb-8" />
        <h2 className="text-xl font-headline font-black uppercase tracking-[0.3em] text-primary">Neural Synchronization</h2>
      </div>
    )
  }

  if (!sessionStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 relative">
        <div className="max-w-2xl w-full text-center space-y-12 relative z-10">
          <div className="w-72 h-72 rounded-[3.5rem] flex items-center justify-center glass bg-slate-900 mx-auto overflow-hidden relative shadow-[0_0_50px_rgba(var(--primary),0.2)] group">
            <video ref={userVideoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
          </div>
          <div className="space-y-4">
            <Badge variant="secondary" className="glass px-6 py-2 rounded-full font-black text-primary gap-2 uppercase tracking-widest text-[10px]">
              <TrendingUp className="w-3 h-3" /> {roleCategory} Sector Active
            </Badge>
            <h1 className="text-5xl font-headline font-black tracking-tighter uppercase leading-[1.1]">Elite Calibration</h1>
            <p className="text-slate-500 text-lg">Aria is ready to begin your professional audit. Questions are calibrated for your specific level and industry.</p>
          </div>
          <Button className="w-full h-20 rounded-[2rem] bg-primary text-2xl font-black shadow-2xl hover:scale-[1.03] transition-all" onClick={startSession}>
            START INTERVIEW
            <Play className="ml-4 w-6 h-6 fill-current" />
          </Button>
        </div>
        <div className="absolute inset-0 bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-body select-none">
      <div className="h-20 glass-dark px-10 flex items-center justify-between z-50 shrink-0 border-b border-white/5">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div className="h-8 w-px bg-white/10" />
          <Badge variant="outline" className="text-[10px] glass border-white/10 text-slate-400 py-2 px-6 rounded-full font-black uppercase tracking-widest">
            TURN {turnCount + 1} / 7
          </Badge>
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">
            {roleCategory} Assessment
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-12 px-6 rounded-2xl glass-button font-black transition-all", showCodePad ? "bg-primary text-white" : "text-slate-500")}
            onClick={() => setShowCodePad(!showCodePad)}
          >
            <Code2 className="w-5 h-5 mr-3" />
            {showCodePad ? "HIDE LOGIC PAD" : "SHOW LOGIC PAD"}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-500 hover:text-red-500 font-black h-12 px-6 rounded-2xl glass-button" 
            onClick={terminateSession}
            disabled={terminating}
          >
            {terminating ? <Loader2 className="animate-spin w-5 h-5 mr-3" /> : <StopCircle className="w-5 h-5 mr-3" />} 
            FINISH AUDIT
          </Button>
        </div>
      </div>

      <div className="flex-1 flex relative bg-black overflow-hidden">
        <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
          <div className="absolute inset-0 transition-all duration-1000">
             <img 
               src={ariaImage} 
               alt="Aria" 
               className={`w-full h-full object-cover transition-all duration-[2000ms] ${speaking ? 'opacity-100 scale-105 brightness-110' : 'opacity-40 grayscale-[40%]'}`}
             />
             {speaking && <div className="absolute inset-0 bg-primary/10 animate-pulse-slow pointer-events-none" />}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
          
          <div className="absolute top-10 left-10 z-20 flex flex-col gap-4">
             {fetchingAudio && <Badge className="glass bg-blue-500/20 text-blue-400 animate-pulse px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Aria Reasoning...</Badge>}
             {speaking && !fetchingAudio && <Badge className="glass bg-primary/20 text-primary animate-pulse px-6 py-2.5 rounded-full flex gap-3 text-[10px] font-black uppercase tracking-[0.2em]"><Volume2 className="w-4 h-4" /> Aria Speaking</Badge>}
             {listening && <Badge className="glass bg-green-500/20 text-green-400 animate-bounce px-6 py-2.5 rounded-full flex gap-3 text-[10px] font-black uppercase tracking-[0.2em]"><Mic className="w-4 h-4" /> Listening...</Badge>}
             {isStuck && <Badge className="glass bg-amber-500/20 text-amber-400 px-6 py-2.5 rounded-full flex gap-3 text-[10px] font-black uppercase tracking-[0.2em]"><Lightbulb className="w-4 h-4" /> Detecting Hesitation...</Badge>}
          </div>

          <div className="absolute bottom-16 inset-x-16 z-20 animate-fade-in">
            <div className="max-w-5xl mx-auto glass-dark border-white/10 p-14 rounded-[3.5rem] shadow-2xl relative">
              {showFeedback && turnFeedback && (
                <div className="absolute -top-64 left-0 right-0 animate-fade-in z-30">
                  <div className="glass bg-slate-900/90 backdrop-blur-3xl border-primary/20 p-8 rounded-[2.5rem] shadow-2xl flex flex-col gap-4 max-w-2xl mx-auto">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Performance Insight
                      </span>
                      <button onClick={() => setShowFeedback(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-green-400 uppercase tracking-widest">Strength</p>
                        <p className="text-xs text-slate-300 italic">{turnFeedback.strengths[0]}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Weakness</p>
                        <p className="text-xs text-slate-300 italic">{turnFeedback.weaknesses[0]}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest">Strategy Tip</p>
                      <p className="text-xs text-slate-400">{turnFeedback.tips}</p>
                    </div>
                  </div>
                </div>
              )}
              <h3 className="text-4xl font-headline font-black leading-tight text-white tracking-tight">
                {currentQuestion || "Calibrating industry logic..."}
              </h3>
            </div>
          </div>
        </div>

        {showCodePad && (
          <div className="w-[600px] glass-dark border-l border-white/10 flex flex-col z-40 shadow-2xl animate-in slide-in-from-right duration-500">
            <div className="p-10 flex-1 space-y-6 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3">
                  <Code2 className="w-4 h-4" /> Logic & Coding Pad
                </span>
                <Badge className="bg-primary/10 text-primary border-none">Visual Editor</Badge>
              </div>
              <Textarea 
                value={code} 
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 bg-black/40 border-white/5 rounded-[2rem] p-10 font-code text-green-400 resize-none focus:ring-1 focus:ring-primary/30"
                placeholder="Write your code or architectural explanation here..."
              />
              <p className="text-[10px] text-slate-500 italic">This content will be submitted along with your verbal response.</p>
            </div>
          </div>
        )}

        <div className="w-[480px] glass-dark border-l border-white/5 flex flex-col z-30 shadow-2xl overflow-hidden">
          <div className="p-10 space-y-10 flex-1 overflow-y-auto scrollbar-hide">
            <div className="space-y-6">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Biometric Feed</span>
              <div className="aspect-video glass bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 relative shadow-inner">
                <video ref={userVideoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale opacity-80" />
                <div className="absolute inset-x-0 h-[2px] bg-primary/40 shadow-[0_0_20px_rgba(var(--primary),0.8)] animate-[scan_8s_linear_infinite]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-8 glass-card bg-white/5 text-center relative overflow-hidden shadow-inner group">
                <Activity className="w-5 h-5 text-primary mb-3 mx-auto" />
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Confidence</p>
                <p className="text-3xl font-black mt-2">{Math.round(confidenceLevel)}%</p>
              </div>
              <div className="p-8 glass-card bg-white/5 text-center relative overflow-hidden shadow-inner group">
                <Target className="w-5 h-5 text-primary mb-3 mx-auto" />
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Focus</p>
                <p className="text-3xl font-black mt-2">{Math.round(eyeFocus)}%</p>
              </div>
            </div>

            <div className="space-y-6">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <Terminal className={cn("w-4 h-4", listening ? "text-green-500 animate-pulse" : "text-slate-800")} />
                Live Transcription
              </span>
              <div className="glass bg-black/40 border-white/5 rounded-[2.5rem] p-10 h-64 overflow-y-auto scrollbar-hide flex flex-col justify-end shadow-inner relative group transition-all">
                {(transcript || interimTranscript) ? (
                  <p className="text-lg text-slate-300 italic leading-relaxed font-medium">
                    {transcript}
                    <span className="text-primary font-black animate-pulse">{interimTranscript}</span>
                  </p>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-800">
                    <Mic className="w-10 h-10 opacity-20" />
                    <p className="text-[10px] uppercase tracking-[0.3em] font-black">Awaiting Response</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-10 glass-dark border-t border-white/5 bg-slate-900/30 shrink-0">
            {listening ? (
              <Button className="w-full h-20 rounded-[2rem] bg-primary hover:bg-primary/90 font-black text-xl shadow-2xl transition-transform active:scale-95" onClick={() => completeTurn(false)}>
                SUBMIT ANSWER
                <CheckCircle2 className="ml-3 w-6 h-6" />
              </Button>
            ) : (
              <div className="w-full h-20 rounded-[2rem] glass bg-slate-800/40 flex items-center justify-center text-slate-400 font-black gap-4 border border-white/5">
                <Loader2 className="animate-spin h-6 w-6 text-primary" />
                <span className="text-[11px] uppercase tracking-[0.3em]">Neural Feedback...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={audioSrc || undefined} onEnded={handleAudioEnded} className="hidden" />

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(280px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
