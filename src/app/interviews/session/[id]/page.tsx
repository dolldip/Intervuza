
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
  BrainCircuit,
  Sparkles,
  Zap,
  X,
  TrendingUp,
  Lightbulb,
  Code2,
  Waves
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
  
  const [turnFeedback, setTurnFeedback] = useState<any>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  
  const [code, setCode] = useState("// Natural logic pad active...")
  const [showCodePad, setShowCodePad] = useState(false)
  
  const [confidenceLevel, setConfidenceLevel] = useState(85)
  const [eyeFocus, setEyeFocus] = useState(90)

  const audioRef = useRef<HTMLAudioElement>(null)
  const recognitionRef = useRef<any>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptAccumulatorRef = useRef("")
  
  const historyRef = useRef<string[]>([])

  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node && stream) {
      node.srcObject = stream;
    }
  }, [stream]);

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

  const completeTurn = async (forcedStuck: boolean = false) => {
    const { processingTurn: isProcessing, turnCount: currentTurn, currentQuestion: question } = stateRef.current;
    if (isProcessing) return;
    
    setProcessingTurn(true);
    setListening(false);
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {}

    const fullAnswer = (transcriptAccumulatorRef.current + interimTranscript).trim() + (showCodePad ? ` [Visual Submission: ${code}]` : "");
    
    try {
      const feedback = await instantTextualAnswerFeedback({
        interviewQuestion: question,
        userAnswer: fullAnswer || "Silence.",
        jobRole: sessionStorage.getItem('demo_role') || "Candidate",
        experienceLevel: sessionStorage.getItem('demo_exp') || "mid",
        currentRound: sessionStorage.getItem('demo_round') === 'hr' ? 'hr' : 'technical',
        jobDescriptionText: sessionStorage.getItem('demo_jd') || "",
        resumeText: sessionStorage.getItem('demo_resume') || "",
        previousQuestions: historyRef.current,
        isStuck: forcedStuck || isStuck
      });
      
      setCurrentEmotion(feedback.detectedEmotion);
      setTurnFeedback(feedback.feedback);
      setShowFeedback(true);
      
      if (!feedback.isInterviewComplete && currentTurn < 6) {
        historyRef.current = [...historyRef.current, feedback.nextQuestion];
        
        setTurnCount(currentTurn + 1);
        setCurrentQuestion(feedback.nextQuestion);
        
        setTranscript("");
        setInterimTranscript("");
        transcriptAccumulatorRef.current = "";
        
        const finalPrompt = `${feedback.verbalReaction}. ${feedback.nextQuestion}`;
        setTimeout(() => {
          triggerSpeech(finalPrompt);
        }, 1200);
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

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(mediaStream)
        setHasCameraPermission(true)
      } catch (error) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions to use the biometric analyzer.',
        });
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

        // SILENCE DETECTION FOR AUTO-SUBMIT (Natural Conversational Loop)
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        
        const totalTextLen = (transcriptAccumulatorRef.current + interimText).trim().length;
        if (totalTextLen > 5) {
          // If the user has said something substantial, trigger auto-submit after 2.5s of silence
          silenceTimeoutRef.current = setTimeout(() => {
            completeTurn(false);
          }, 2500); 
        } else if (totalTextLen === 0) {
          // If they haven't started talking yet, wait longer before flagging as "stuck"
          silenceTimeoutRef.current = setTimeout(() => {
            setIsStuck(true);
          }, 8000);
        }
      };

      recognitionRef.current.onend = () => {
        const { sessionStarted: isStarted, listening: isListening, speaking: isSpeaking, processingTurn: isProcessing } = stateRef.current;
        if (isStarted && !isSpeaking && !isProcessing) {
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
      const demoExp = sessionStorage.getItem('demo_exp') || "mid";
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
        historyRef.current = [result.firstQuestion]
      } catch (err) {
        setOpening("Hi, I'm Aria. Let's begin your professional audit.")
        const fb = "Given your specific industry background, what is the most significant strategic shift you've observed recently?"
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
      if (recognitionRef.current) try { recognitionRef.current.start(); } catch ( e) {}
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
      updateDoc(sessionRef, {
        status: "completed",
        endTime: new Date().toISOString(),
        overallScore: Math.round(confidenceLevel * 0.7 + 25),
      });
    }
    router.push(`/results/${params.id === "demo-session" ? 'demo-results' : params.id}`);
  };

  const ariaImage = PlaceHolderImages.find(img => img.id === 'aria-persona')?.imageUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000";

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <BrainCircuit className="w-12 h-12 md:w-20 md:h-20 text-primary animate-pulse mb-8" />
        <h2 className="text-sm md:text-xl font-headline font-black uppercase tracking-[0.2em] text-primary text-center">Neural Synchronization</h2>
      </div>
    )
  }

  if (!sessionStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 relative overflow-hidden">
        <div className="max-w-2xl w-full text-center space-y-8 md:space-y-12 relative z-10">
          <div className="w-48 h-48 md:w-72 md:h-72 rounded-[2rem] md:rounded-[3.5rem] flex items-center justify-center glass bg-slate-900 mx-auto overflow-hidden relative shadow-[0_0_50px_rgba(var(--primary),0.2)] group">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
          </div>
          <div className="space-y-4">
            <Badge variant="secondary" className="glass px-4 py-1.5 md:px-6 md:py-2 rounded-full font-black text-primary gap-2 uppercase tracking-widest text-[9px] md:text-[10px]">
              <TrendingUp className="w-3 h-3" /> {roleCategory} Sector Active
            </Badge>
            <h1 className="text-3xl md:text-5xl font-headline font-black tracking-tighter uppercase leading-[1.1]">Elite Calibration</h1>
            <p className="text-slate-500 text-sm md:text-lg">Aria is ready to begin your professional audit. Questions are calibrated for your specific level and industry.</p>
          </div>
          <Button className="w-full h-16 md:h-20 rounded-[1.5rem] md:rounded-[2rem] bg-primary text-lg md:text-2xl font-black shadow-2xl hover:scale-[1.03] transition-all" onClick={startSession}>
            START INTERVIEW
            <Play className="ml-3 md:ml-4 w-5 h-5 md:w-6 md:h-6 fill-current" />
          </Button>
        </div>
        <div className="absolute inset-0 bg-primary/5 blur-[100px] md:blur-[150px] rounded-full pointer-events-none" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-body select-none">
      <div className="h-16 md:h-20 glass-dark px-4 md:px-10 flex items-center justify-between z-50 shrink-0 border-b border-white/5">
        <div className="flex items-center gap-2 md:gap-6">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-lg md:rounded-xl flex items-center justify-center">
            <BrainCircuit className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="h-6 md:h-8 w-px bg-white/10 hidden md:block" />
          <Badge variant="outline" className="text-[8px] md:text-[10px] glass border-white/10 text-slate-400 py-1 md:py-2 px-3 md:px-6 rounded-full font-black uppercase tracking-widest">
            {turnCount + 1} / 7
          </Badge>
          <span className="text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.3em] hidden sm:block">
            {roleCategory} Turn
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-9 md:h-12 px-3 md:px-6 rounded-lg md:rounded-2xl glass-button font-black transition-all text-[10px] md:text-sm", showCodePad ? "bg-primary text-white" : "text-slate-500")}
            onClick={() => setShowCodePad(!showCodePad)}
          >
            <Code2 className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-3" />
            <span className="hidden sm:inline">{showCodePad ? "HIDE LOGIC PAD" : "SHOW LOGIC PAD"}</span>
            <span className="sm:hidden">PAD</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-500 hover:text-red-500 font-black h-9 md:h-12 px-3 md:px-6 rounded-lg md:rounded-2xl glass-button text-[10px] md:text-sm" 
            onClick={terminateSession}
            disabled={terminating}
          >
            {terminating ? <Loader2 className="animate-spin w-4 h-4 mr-1 md:mr-3" /> : <StopCircle className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-3" />} 
            FINISH
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row relative bg-black overflow-hidden">
        <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden min-h-[40vh] md:min-h-0">
          <div className="absolute inset-0 transition-all duration-1000">
             <img 
               src={ariaImage} 
               alt="Aria" 
               className={`w-full h-full object-cover transition-all duration-[2000ms] ${speaking ? 'opacity-100 scale-105 brightness-110' : 'opacity-40 grayscale-[40%]'}`}
             />
             {speaking && <div className="absolute inset-0 bg-primary/10 animate-pulse-slow pointer-events-none" />}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
          
          <div className="absolute top-4 left-4 md:top-10 md:left-10 z-20 flex flex-col gap-2 md:gap-4">
             {fetchingAudio && <Badge className="glass bg-blue-500/20 text-blue-400 animate-pulse px-3 py-1.5 md:px-6 md:py-2.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]">Aria Reasoning...</Badge>}
             {speaking && !fetchingAudio && <Badge className="glass bg-primary/20 text-primary animate-pulse px-3 py-1.5 md:px-6 md:py-2.5 rounded-full flex gap-2 md:gap-3 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]"><Volume2 className="w-3 h-3 md:w-4 md:h-4" /> Aria Speaking</Badge>}
             {listening && <Badge className="glass bg-green-500/20 text-green-400 animate-bounce px-3 py-1.5 md:px-6 md:py-2.5 rounded-full flex gap-2 md:gap-3 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]"><Waves className="w-3 h-3 md:w-4 md:h-4" /> Natural Sync Active</Badge>}
             {processingTurn && <Badge className="glass bg-purple-500/20 text-purple-400 animate-pulse px-3 py-1.5 md:px-6 md:py-2.5 rounded-full flex gap-2 md:gap-3 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]"><Sparkles className="w-3 h-3 md:w-4 md:h-4" /> Analyzing NLP Context...</Badge>}
             {isStuck && <Badge className="glass bg-amber-500/20 text-amber-400 px-3 py-1.5 md:px-6 md:py-2.5 rounded-full flex gap-2 md:gap-3 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]"><Lightbulb className="w-3 h-3 md:w-4 md:h-4" /> Awaiting Input...</Badge>}
          </div>

          <div className="absolute bottom-4 inset-x-4 md:bottom-16 md:inset-x-16 z-20 animate-fade-in">
            <div className="max-w-5xl mx-auto glass-dark border-white/10 p-6 md:p-14 rounded-[1.5rem] md:rounded-[3.5rem] shadow-2xl relative">
              {showFeedback && turnFeedback && (
                <div className="absolute -top-40 md:-top-64 left-0 right-0 animate-fade-in z-30 px-2">
                  <div className="glass bg-slate-900/90 backdrop-blur-3xl border-primary/20 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl flex flex-col gap-2 md:gap-4 max-w-2xl mx-auto">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Sparkles className="w-3 h-3 md:w-4 md:h-4" /> Performance Insight
                      </span>
                      <button onClick={() => setShowFeedback(false)} className="text-slate-500 hover:text-white"><X className="w-3 h-3 md:w-4 md:h-4" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-1">
                        <p className="text-[7px] md:text-[9px] font-black text-green-400 uppercase tracking-widest">Linguistic Strength</p>
                        <p className="text-[10px] md:text-xs text-slate-300 italic line-clamp-2">{turnFeedback.strengths[0]}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[7px] md:text-[9px] font-black text-amber-400 uppercase tracking-widest">NLP Audit Note</p>
                        <p className="text-[10px] md:text-xs text-slate-300 italic line-clamp-2">{turnFeedback.weaknesses[0]}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <h3 className="text-lg md:text-4xl font-headline font-black leading-tight text-white tracking-tight">
                {currentQuestion || "Initializing industry conversation..."}
              </h3>
            </div>
          </div>
        </div>

        {showCodePad && (
          <div className="fixed inset-0 md:relative md:inset-auto md:w-[600px] glass-dark border-l border-white/10 flex flex-col z-50 shadow-2xl animate-in slide-in-from-right duration-500">
            <div className="p-6 md:p-10 flex-1 space-y-4 md:space-y-6 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2 md:gap-3">
                  <Code2 className="w-4 h-4" /> Logic & Coding Pad
                </span>
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowCodePad(false)}><X className="w-5 h-5" /></Button>
              </div>
              <Textarea 
                value={code} 
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 bg-black/40 border-white/5 rounded-[1rem] md:rounded-[2rem] p-6 md:p-10 font-code text-green-400 resize-none focus:ring-1 focus:ring-primary/30 text-sm md:text-base"
                placeholder="Write your code or architectural explanation here..."
              />
              <p className="text-[9px] text-slate-500 italic">This content will be submitted along with your verbal response automatically.</p>
            </div>
          </div>
        )}

        <div className="w-full md:w-[380px] lg:w-[480px] glass-dark md:border-l border-white/5 flex flex-col z-30 shadow-2xl overflow-hidden max-h-[40vh] md:max-h-none">
          <div className="p-6 md:p-10 space-y-6 md:space-y-10 flex-1 overflow-y-auto scrollbar-hide">
            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Biometric Feed</span>
              <div className="aspect-video glass bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border border-white/10 relative shadow-inner">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale opacity-80" />
                <div className="absolute inset-x-0 h-[1px] md:h-[2px] bg-primary/40 shadow-[0_0_20px_rgba(var(--primary),0.8)] animate-[scan_8s_linear_infinite]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div className="p-4 md:p-8 glass-card bg-white/5 text-center relative overflow-hidden shadow-inner group">
                <Activity className="w-4 h-4 md:w-5 md:h-5 text-primary mb-2 md:mb-3 mx-auto" />
                <p className="text-[7px] md:text-[9px] text-slate-500 uppercase font-black tracking-widest">Confidence</p>
                <p className="text-xl md:text-3xl font-black mt-1 md:mt-2">{Math.round(confidenceLevel)}%</p>
              </div>
              <div className="p-4 md:p-8 glass-card bg-white/5 text-center relative overflow-hidden shadow-inner group">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-primary mb-2 md:mb-3 mx-auto" />
                <p className="text-[7px] md:text-[9px] text-slate-500 uppercase font-black tracking-widest">Focus</p>
                <p className="text-xl md:text-3xl font-black mt-1 md:mt-2">{Math.round(eyeFocus)}%</p>
              </div>
            </div>

            <div className="space-y-4 md:space-y-6">
              <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center gap-2 md:gap-3">
                <Mic className={cn("w-3 h-3 md:w-4 md:h-4", listening ? "text-green-500 animate-pulse" : "text-slate-800")} />
                Conversational Sync
              </span>
              <div className="glass bg-black/40 border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 h-32 md:h-64 overflow-y-auto scrollbar-hide flex flex-col justify-end shadow-inner relative group transition-all">
                {(transcript || interimTranscript) ? (
                  <p className="text-sm md:text-lg text-slate-300 italic leading-relaxed font-medium">
                    {transcript}
                    <span className="text-primary font-black animate-pulse">{interimTranscript}</span>
                  </p>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-800">
                    <Waves className="w-6 h-6 md:w-10 md:h-10 opacity-20" />
                    <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-black">Aria is Listening</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10 glass-dark border-t border-white/5 bg-slate-900/30 shrink-0">
            {processingTurn ? (
              <div className="w-full h-14 md:h-20 rounded-[1rem] md:rounded-[2rem] glass bg-primary/10 flex items-center justify-center text-primary font-black gap-2 md:gap-4 border border-primary/20">
                <Loader2 className="animate-spin h-5 w-5 md:h-6 md:w-6 text-primary" />
                <span className="text-[9px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.3em]">Aria is Reasoning...</span>
              </div>
            ) : listening ? (
              <div className="w-full h-14 md:h-20 rounded-[1rem] md:rounded-[2rem] glass bg-green-500/10 flex items-center justify-center text-green-400 font-black gap-2 md:gap-4 border border-green-500/20">
                <Waves className="animate-pulse h-5 w-5 md:h-6 md:w-6" />
                <span className="text-[9px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.3em]">Natural Listening On</span>
              </div>
            ) : (
              <div className="w-full h-14 md:h-20 rounded-[1rem] md:rounded-[2rem] glass bg-slate-800/40 flex items-center justify-center text-slate-400 font-black gap-2 md:gap-4 border border-white/5">
                <Loader2 className="animate-spin h-5 w-5 md:h-6 md:w-6 text-primary" />
                <span className="text-[9px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.3em]">Aria Syncing...</span>
              </div>
            )}
            <p className="text-center text-[8px] md:text-[9px] text-slate-600 mt-3 md:mt-4 uppercase tracking-[0.2em] font-black">Conversation flows automatically after silence.</p>
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={audioSrc || undefined} onEnded={handleAudioEnded} className="hidden" />

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(180px); opacity: 0; }
        }
        @media (min-width: 768px) {
          @keyframes scan {
            0% { transform: translateY(0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(280px); opacity: 0; }
          }
        }
      `}</style>
    </div>
  )
}
