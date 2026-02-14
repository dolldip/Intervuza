"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth, useFirestore, useUser } from "@/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  StopCircle, 
  Volume2, 
  Loader2, 
  Activity, 
  User, 
  Target, 
  Play, 
  CheckCircle2,
  Mic,
  ShieldCheck,
  BrainCircuit,
  Sparkles,
  Zap,
  Terminal,
  AlertCircle,
  HelpCircle,
  VideoOff,
  Code2,
  ChevronRight,
  ChevronLeft
} from "lucide-react"
import { generateInterviewQuestions } from "@/ai/flows/dynamic-interview-question-generation"
import { textToSpeech } from "@/ai/flows/tts-flow"
import { instantTextualAnswerFeedback } from "@/ai/flows/instant-textual-answer-feedback"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { cn } from "@/lib/utils"

export default function InterviewSessionPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()

  const [currentQuestion, setCurrentQuestion] = useState("")
  const [opening, setOpening] = useState("")
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
  const [askedQuestions, setAskedQuestions] = useState<string[]>([])
  const [isStuck, setIsStuck] = useState(false)
  const [terminating, setTerminating] = useState(false)
  
  // Coding State
  const [showCodingPad, setShowCodingPad] = useState(false)
  const [code, setCode] = useState("// Aria is waiting for your logic here...\n\nfunction solution() {\n  \n}")
  
  const [confidenceLevel, setConfidenceLevel] = useState(85)
  const [eyeFocus, setEyeFocus] = useState(90)

  const userVideoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const recognitionRef = useRef<any>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const stuckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptAccumulatorRef = useRef("")
  
  // Use a ref for history to ensure the feedback logic always has the absolute latest list
  const historyRef = useRef<string[]>([])

  const stateRef = useRef({ 
    speaking, 
    listening, 
    processingTurn, 
    turnCount, 
    currentQuestion, 
    askedQuestions,
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
      askedQuestions,
      sessionStarted,
      isStuck
    }
    historyRef.current = askedQuestions
  }, [speaking, listening, processingTurn, turnCount, currentQuestion, askedQuestions, sessionStarted, isStuck])

  useEffect(() => {
    if (userVideoRef.current && stream) {
      userVideoRef.current.srcObject = stream;
    }
  }, [sessionStarted, stream, hasCameraPermission]);

  useEffect(() => {
    if (!sessionStarted) return;
    const interval = setInterval(() => {
      const { listening: isListening } = stateRef.current;
      const currentText = (transcriptAccumulatorRef.current + interimTranscript).trim();
      
      setConfidenceLevel(prev => {
        let change = (Math.random() * 2) - 1; 
        if (isListening) {
          if (currentText.length < 5) change -= 2.0; 
          if (currentText.length > 60) change += 1.5; 
        }
        return Math.min(100, Math.max(0, prev + change));
      });

      setEyeFocus(prev => {
        let change = (Math.random() * 2) - 1;
        if (Math.random() > 0.98) change = -20;
        return Math.min(100, Math.max(0, prev + change));
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStarted, interimTranscript]);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: true 
        });
        setStream(mediaStream)
        setHasCameraPermission(true)
      } catch (error) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Neural Feed Failed',
          description: 'Aria needs camera access for biometric focus monitoring.',
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
          if (stuckTimeoutRef.current) clearTimeout(stuckTimeoutRef.current);
        }
        setInterimTranscript(interimText);

        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = setTimeout(() => {
          const combinedText = (transcriptAccumulatorRef.current + interimText).trim();
          if (combinedText.length > 30) {
             completeTurn(false);
          }
        }, 12000); 

        if (stuckTimeoutRef.current) clearTimeout(stuckTimeoutRef.current);
        stuckTimeoutRef.current = setTimeout(() => {
          const { listening: isListeningNow } = stateRef.current;
          if (isListeningNow) {
            setIsStuck(true);
            completeTurn(true);
          }
        }, 18000); 
      };

      recognitionRef.current.onend = () => {
        const { sessionStarted: isStarted, listening: isListening, speaking: isSpeaking, processingTurn: isProcessing } = stateRef.current;
        if (isStarted && isListening && !isSpeaking && !isProcessing) {
          try { recognitionRef.current.start(); } catch(e) {}
        }
      };
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (stuckTimeoutRef.current) clearTimeout(stuckTimeoutRef.current);
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    async function init() {
      const demoRole = sessionStorage.getItem('demo_role') || "Professional Candidate";
      const demoExp = sessionStorage.getItem('demo_exp') || "Mid-level";
      const demoJd = sessionStorage.getItem('demo_jd') || "Professional assessment session.";
      const demoRound = sessionStorage.getItem('demo_round') || "technical";
      const demoResume = sessionStorage.getItem('demo_resume') || "";
      const pastPerformance = sessionStorage.getItem('past_performance') || "";
      const analysisSkills = JSON.parse(sessionStorage.getItem('analysis_skills') || '["Logic", "Communication", "Technical Depth"]');

      try {
        const result = await generateInterviewQuestions({
          jobRole: demoRole,
          experienceLevel: demoExp,
          skills: analysisSkills,
          jobDescriptionText: demoJd,
          resumeText: demoResume,
          roundType: demoRound,
          pastPerformanceSummary: pastPerformance
        })
        setOpening(result.openingStatement)
        setCurrentQuestion(result.firstQuestion)
        setAskedQuestions([result.firstQuestion])
        historyRef.current = [result.firstQuestion]
        sessionStorage.setItem('session_answers', '[]');
      } catch (err) {
        setOpening("Hi, I'm Aria. I've been reviewing your background and I'm interested to dive into your experience.")
        const fb = "To get us started, could you walk me through a technical project from your resume and the biggest challenge you faced there?";
        setCurrentQuestion(fb)
        setAskedQuestions([fb])
        historyRef.current = [fb]
        sessionStorage.setItem('session_answers', '[]');
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
    
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    
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
        finalCode: code
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

    const fullAnswer = (transcriptAccumulatorRef.current + interimTranscript).trim();
    const currentAnswers = JSON.parse(sessionStorage.getItem('session_answers') || '[]');
    currentAnswers.push({ 
      question, 
      answer: fullAnswer || (forcedStuck ? "Struggling to articulate logic" : "No verbal response"),
      codeSnippet: code
    });
    sessionStorage.setItem('session_answers', JSON.stringify(currentAnswers));

    try {
      const feedback = await instantTextualAnswerFeedback({
        interviewQuestion: question,
        userAnswer: fullAnswer || (forcedStuck ? "I'm finding this a bit difficult to explain clearly." : "Silence."),
        jobRole: sessionStorage.getItem('demo_role') || "Candidate",
        experienceLevel: sessionStorage.getItem('demo_exp') || "Professional",
        currentRound: sessionStorage.getItem('demo_round') === 'hr' ? 'hr' : 'technical',
        resumeText: sessionStorage.getItem('demo_resume') || "",
        previousQuestions: historyRef.current, // Use the absolute latest history ref
        isStuck: forcedStuck || (fullAnswer.length < 15 && !forcedStuck)
      });
      
      setCurrentEmotion(feedback.detectedEmotion);
      const nextTurnCount = feedback.isOfferingHint ? currentTurn : currentTurn + 1;
      
      if (feedback.requestCodingTask) {
        setShowCodingPad(true);
        toast({ title: "Logic Pad Enabled", description: "Aria requested a technical implementation." });
      }

      if (!feedback.isInterviewComplete && nextTurnCount < 6) {
        setTurnCount(nextTurnCount);
        setCurrentQuestion(feedback.nextQuestion);
        
        // Update history IMMEDIATELY so the next turn's feedback logic sees it
        setAskedQuestions(prev => {
           const nextHistory = [...prev, feedback.nextQuestion];
           historyRef.current = nextHistory;
           return nextHistory;
        });
        
        setTranscript("");
        setInterimTranscript("");
        transcriptAccumulatorRef.current = "";
        setIsStuck(false);
        
        const finalPrompt = `${feedback.verbalReaction}. ${feedback.nextQuestion}`;
        setTimeout(() => {
          triggerSpeech(finalPrompt);
        }, 1000);
      } else {
        terminateSession();
      }
    } catch (err) {
      terminateSession();
    } finally {
      setProcessingTurn(false);
    }
  };

  const ariaImage = PlaceHolderImages.find(img => img.id === 'aria-persona')?.imageUrl || "https://picsum.photos/seed/aria-interviewer/1280/720";

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
          <div className="w-72 h-72 rounded-[3.5rem] flex items-center justify-center glass bg-slate-900 mx-auto overflow-hidden relative shadow-[0_0_50px_rgba(var(--primary),0.2)] group transition-all duration-500 hover:shadow-primary/30">
            <video ref={userVideoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
            {!hasCameraPermission && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90">
                <VideoOff className="w-16 h-16 text-slate-700" />
              </div>
            )}
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
          </div>
          <div className="space-y-4">
            <Badge variant="secondary" className="glass px-6 py-2 rounded-full font-black text-primary gap-2 uppercase tracking-widest text-[10px]">
              <Sparkles className="w-3 h-3" /> Professional Audit Sector
            </Badge>
            <h1 className="text-5xl font-headline font-black tracking-tighter uppercase leading-[1.1]">Calibration Mode</h1>
            <p className="text-slate-500 text-lg">Aria will monitor your biometrics and project logic during this session.</p>
          </div>
          <Button className="w-full h-20 rounded-[2rem] bg-primary text-2xl font-black shadow-2xl hover:scale-[1.03] transition-all shadow-primary/30" onClick={startSession}>
            BEGIN ASSESSMENT
            <Play className="ml-4 w-6 h-6 fill-current" />
          </Button>
          {!hasCameraPermission && (
            <Alert variant="destructive" className="glass border-red-500/30 rounded-2xl text-left">
              <AlertCircle className="h-6 w-6" />
              <AlertTitle className="font-bold">Neural Feed Missing</AlertTitle>
              <AlertDescription className="text-sm font-medium">Enable camera permissions for Aria's focus tracking system.</AlertDescription>
            </Alert>
          )}
        </div>
        <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-body select-none">
      <div className="h-20 glass-dark px-10 flex items-center justify-between z-50 shrink-0 border-b border-white/5">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div className="h-8 w-px bg-white/10 hidden sm:block" />
          <Badge variant="outline" className="text-[10px] glass border-white/10 text-slate-400 py-2 px-6 rounded-full font-black uppercase tracking-widest">
            TURN {turnCount + 1} / 6
          </Badge>
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] hidden lg:block">
            {sessionStorage.getItem('demo_role')} AUDIT IN PROGRESS
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("font-black h-12 px-6 rounded-2xl glass-button", showCodingPad ? "text-primary border-primary/50 bg-primary/10" : "text-slate-500")}
            onClick={() => setShowCodingPad(!showCodingPad)}
          >
            <Code2 className="w-5 h-5 mr-3" />
            {showCodingPad ? 'HIDE LOGIC PAD' : 'OPEN LOGIC PAD'}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-500 hover:text-red-500 font-black h-12 px-6 rounded-2xl glass-button" 
            onClick={terminateSession}
            disabled={terminating}
          >
            {terminating ? <Loader2 className="animate-spin w-5 h-5 mr-3" /> : <StopCircle className="w-5 h-5 mr-3" />} 
            TERMINATE & AUDIT
          </Button>
        </div>
      </div>

      <div className="flex-1 flex relative bg-black overflow-hidden">
        <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
          <div className="absolute inset-0 transition-all duration-1000">
             <img 
               src={ariaImage} 
               alt="Aria" 
               className={`w-full h-full object-cover transition-all duration-[2000ms] ${speaking ? 'opacity-100 scale-105 brightness-110' : 'opacity-40 grayscale-[40%] scale-100'}`}
             />
             {speaking && <div className="absolute inset-0 bg-primary/10 animate-pulse-slow pointer-events-none" />}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
          
          <div className="absolute top-10 left-10 z-20 flex flex-col gap-4">
             {fetchingAudio && <Badge className="glass bg-blue-500/20 text-blue-400 animate-pulse px-6 py-2.5 rounded-full shadow-2xl text-[10px] font-black uppercase tracking-[0.2em]">Neural Processing...</Badge>}
             {speaking && !fetchingAudio && <Badge className="glass bg-primary/20 text-primary animate-pulse px-6 py-2.5 rounded-full flex gap-3 shadow-2xl text-[10px] font-black uppercase tracking-[0.2em]"><Volume2 className="w-4 h-4" /> Aria Speaking</Badge>}
             {listening && !isStuck && <Badge className="glass bg-green-500/20 text-green-400 animate-bounce px-6 py-2.5 rounded-full flex gap-3 shadow-2xl text-[10px] font-black uppercase tracking-[0.2em]"><Mic className="w-4 h-4" /> Detecting Input</Badge>}
             {isStuck && <Badge className="glass bg-amber-500/20 text-amber-400 animate-pulse px-6 py-2.5 rounded-full flex gap-3 shadow-2xl text-[10px] font-black uppercase tracking-[0.2em]"><HelpCircle className="w-4 h-4" /> Detector: Stuck</Badge>}
          </div>

          <div className="absolute bottom-16 inset-x-8 sm:inset-x-16 z-20 animate-fade-in">
            <div className="max-w-5xl mx-auto glass-dark border-white/10 p-10 sm:p-14 rounded-[3.5rem] shadow-[0_0_80px_rgba(0,0,0,0.5)]">
              <h3 className="text-2xl md:text-4xl font-headline font-black leading-tight text-white tracking-tight text-center sm:text-left">
                {currentQuestion || "Calibrating next turn..."}
              </h3>
            </div>
          </div>
        </div>

        <div className={cn("transition-all duration-500 glass-dark border-l border-white/5 flex flex-col z-30 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden", showCodingPad ? "w-[600px]" : "w-[480px]")}>
          <div className="p-10 space-y-10 flex-1 overflow-y-auto scrollbar-hide">
            
            {showCodingPad ? (
              <div className="space-y-8 animate-fade-in flex flex-col h-full">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                    <Terminal className="w-4 h-4" /> Logic Pad v2.0
                  </span>
                  <Badge variant="outline" className="glass border-white/10 text-slate-500 text-[9px] uppercase tracking-widest px-4 py-1">Technical Audit Active</Badge>
                </div>
                <div className="flex-1 glass bg-slate-900/50 rounded-[2.5rem] border border-white/10 overflow-hidden relative shadow-inner flex flex-col">
                  <div className="h-8 bg-black/40 border-b border-white/5 flex items-center px-6 gap-2 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                  </div>
                  <Textarea 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 bg-transparent border-none resize-none font-mono text-sm p-8 focus-visible:ring-0 scrollbar-hide text-green-400/80 leading-relaxed"
                  />
                </div>
                <div className="p-6 glass bg-blue-500/10 text-blue-400 rounded-3xl border border-blue-500/20 text-xs flex gap-4 shadow-inner italic font-medium leading-relaxed">
                  <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>Aria is monitoring your algorithmic logic. Explain your code as you write.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-10 animate-fade-in">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Biometric Stream</span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Live Feed
                    </span>
                  </div>
                  <div className="aspect-video glass bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 relative group shadow-inner">
                    <video ref={userVideoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale opacity-80" />
                    {!hasCameraPermission && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 gap-4">
                        <VideoOff className="w-10 h-10 text-slate-700" />
                        <p className="text-[10px] uppercase font-black text-slate-800 tracking-widest">Stream Offline</p>
                      </div>
                    )}
                    <div className="absolute inset-x-0 h-[3px] bg-primary/40 shadow-[0_0_20px_rgba(var(--primary),0.8)] animate-[scan_8s_linear_infinite]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-8 glass-card bg-white/5 text-center relative overflow-hidden shadow-inner group transition-all hover:bg-white/10">
                    <Activity className="w-5 h-5 text-primary mb-3 mx-auto" />
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Confidence</p>
                    <p className="text-3xl font-black mt-2">{Math.round(confidenceLevel)}%</p>
                    <div className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000 shadow-[0_0_100px_rgba(var(--primary),0.5)]" style={{ width: `${confidenceLevel}%` }} />
                  </div>
                  <div className="p-8 glass-card bg-white/5 text-center relative overflow-hidden shadow-inner group transition-all hover:bg-white/10">
                    <Target className="w-5 h-5 text-primary mb-3 mx-auto" />
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Eye Focus</p>
                    <p className="text-3xl font-black mt-2">{Math.round(eyeFocus)}%</p>
                    <div className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000 shadow-[0_0_100px_rgba(var(--primary),0.5)]" style={{ width: `${eyeFocus}%` }} />
                  </div>
                </div>

                <div className="space-y-6">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                    <Terminal className={`w-4 h-4 ${listening ? 'text-green-500 animate-pulse' : 'text-slate-800'}`} />
                    Neural Transcription
                  </span>
                  <div className="glass bg-black/40 border-white/5 rounded-[2.5rem] p-10 h-64 overflow-y-auto scrollbar-hide flex flex-col justify-end shadow-inner relative group transition-all hover:bg-black/60">
                    {(transcript || interimTranscript) ? (
                      <p className="text-lg text-slate-300 italic leading-relaxed font-medium">
                        {transcript}
                        <span className="text-primary font-black animate-pulse">{interimTranscript}</span>
                      </p>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-800">
                        <Mic className="w-10 h-10 opacity-20" />
                        <p className="text-[10px] uppercase tracking-[0.3em] font-black">Waiting for Vocal Response</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="p-10 glass-dark border-t border-white/5 bg-slate-900/30 shrink-0">
            {listening ? (
              <Button className="w-full h-20 rounded-[2rem] bg-primary hover:bg-primary/90 font-black text-xl shadow-[0_0_40px_rgba(var(--primary),0.3)] hover:scale-[1.02] transition-transform" onClick={() => completeTurn(false)}>
                SUBMIT TURN
                <CheckCircle2 className="ml-3 w-6 h-6" />
              </Button>
            ) : (
              <div className="w-full h-20 rounded-[2rem] glass bg-slate-800/40 flex items-center justify-center text-slate-500 font-black gap-4 border border-white/5">
                <Loader2 className="animate-spin h-6 w-6 text-primary" />
                <span className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Aria Analyzing Response...</span>
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
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
