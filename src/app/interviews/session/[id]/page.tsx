
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
  User, 
  Target, 
  Play, 
  CheckCircle2,
  Mic,
  ShieldCheck,
  BrainCircuit,
  Sparkles,
  Zap,
  Code2,
  Terminal,
  AlertCircle,
  HelpCircle,
  VideoOff
} from "lucide-react"
import { generateInterviewQuestions } from "@/ai/flows/dynamic-interview-question-generation"
import { textToSpeech } from "@/ai/flows/tts-flow"
import { instantTextualAnswerFeedback } from "@/ai/flows/instant-textual-answer-feedback"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PlaceHolderImages } from "@/lib/placeholder-images"

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
  
  const [confidenceLevel, setConfidenceLevel] = useState(85)
  const [eyeFocus, setEyeFocus] = useState(90)

  const userVideoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const recognitionRef = useRef<any>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const stuckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptAccumulatorRef = useRef("")
  
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
  }, [speaking, listening, processingTurn, turnCount, currentQuestion, askedQuestions, sessionStarted, isStuck])

  useEffect(() => {
    if (!sessionStarted) return;
    const interval = setInterval(() => {
      const { listening: isListening } = stateRef.current;
      const currentText = (transcriptAccumulatorRef.current + interimTranscript).trim();
      
      setConfidenceLevel(prev => {
        let change = (Math.random() * 2) - 1; 
        if (isListening) {
          if (currentText.length < 5) change -= 1.5; 
          if (currentText.length > 50) change += 1; 
        }
        return Math.min(100, Math.max(0, prev + change));
      });

      setEyeFocus(prev => {
        let change = (Math.random() * 2) - 1;
        if (Math.random() > 0.98) change = -15;
        return Math.min(100, Math.max(0, prev + change));
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStarted, interimTranscript]);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 640 }, height: { ideal: 480 } }, 
          audio: true 
        });
        setStream(mediaStream)
        setHasCameraPermission(true)
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Camera access error:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Permission Required',
          description: 'Aria needs camera access to monitor biometric confidence.',
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
          if (combinedText.length > 20) {
             completeTurn(false);
          }
        }, 5000); 

        if (stuckTimeoutRef.current) clearTimeout(stuckTimeoutRef.current);
        stuckTimeoutRef.current = setTimeout(() => {
          const { listening: isListeningNow } = stateRef.current;
          if (isListeningNow) {
            setIsStuck(true);
            completeTurn(true);
          }
        }, 12000); 
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
    if (stream && userVideoRef.current) {
      userVideoRef.current.srcObject = stream;
    }
  }, [stream, sessionStarted, hasCameraPermission]);

  useEffect(() => {
    async function init() {
      const demoRole = sessionStorage.getItem('demo_role') || "Professional Candidate";
      const demoExp = sessionStorage.getItem('demo_exp') || "Mid-level";
      const demoJd = sessionStorage.getItem('demo_jd') || "Professional assessment session.";
      const demoRound = sessionStorage.getItem('demo_round') || "technical";
      const demoResume = sessionStorage.getItem('demo_resume') || "";
      const analysisSkills = JSON.parse(sessionStorage.getItem('analysis_skills') || '["Logic", "Communication", "Technical Depth"]');

      try {
        const result = await generateInterviewQuestions({
          jobRole: demoRole,
          experienceLevel: demoExp,
          skills: analysisSkills,
          jobDescriptionText: demoJd,
          resumeText: demoResume,
          roundType: demoRound
        })
        setOpening(result.openingStatement)
        setCurrentQuestion(result.firstQuestion)
        setAskedQuestions([result.firstQuestion])
        sessionStorage.setItem('session_answers', '[]');
      } catch (err) {
        setOpening("Hi, I'm Aria. It's a pleasure to meet you.")
        const fb = "To get us started, could you walk me through a complex challenge you solved recently?";
        setCurrentQuestion(fb)
        setAskedQuestions([fb])
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
        overallScore: Math.round(confidenceLevel * 0.7 + 25)
      });
    }
    router.push(`/results/${params.id === "demo-session" ? 'demo-results' : params.id}`);
  };

  const completeTurn = async (forcedStuck: boolean = false) => {
    const { processingTurn: isProcessing, turnCount: currentTurn, currentQuestion: question, askedQuestions: history } = stateRef.current;
    if (isProcessing) return;
    
    setProcessingTurn(true);
    setListening(false);
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {}

    const fullAnswer = (transcriptAccumulatorRef.current + interimTranscript).trim();
    const currentAnswers = JSON.parse(sessionStorage.getItem('session_answers') || '[]');
    currentAnswers.push({ question, answer: fullAnswer || (forcedStuck ? "Silence/Struggling" : "No answer provided") });
    sessionStorage.setItem('session_answers', JSON.stringify(currentAnswers));

    try {
      const feedback = await instantTextualAnswerFeedback({
        interviewQuestion: question,
        userAnswer: fullAnswer || (forcedStuck ? "Hmm... I'm find this a bit difficult to articulate right now." : "Silence."),
        jobRole: sessionStorage.getItem('demo_role') || "Candidate",
        experienceLevel: sessionStorage.getItem('demo_exp') || "Professional",
        currentRound: sessionStorage.getItem('demo_round') === 'hr' ? 'hr' : 'technical',
        previousQuestions: history,
        isStuck: forcedStuck || fullAnswer.length < 8
      });
      
      setCurrentEmotion(feedback.detectedEmotion);
      const nextTurnCount = feedback.isOfferingHint ? currentTurn : currentTurn + 1;
      setTurnCount(nextTurnCount);

      if (!feedback.isInterviewComplete && nextTurnCount < 6) {
        setCurrentQuestion(feedback.nextQuestion);
        if (!feedback.isOfferingHint) {
          setAskedQuestions(prev => [...prev, feedback.nextQuestion]);
        }
        setTranscript("");
        setInterimTranscript("");
        transcriptAccumulatorRef.current = "";
        setIsStuck(false);
        
        const finalPrompt = `${feedback.verbalReaction}. ${feedback.nextQuestion}`;
        setTimeout(() => {
          triggerSpeech(finalPrompt);
        }, 800);
      } else {
        terminateSession();
      }
    } catch (err) {
      router.push(`/results/demo-results`);
    } finally {
      setProcessingTurn(false);
    }
  };

  const ariaImage = PlaceHolderImages.find(img => img.id === 'aria-persona')?.imageUrl || "https://picsum.photos/seed/aria-interviewer/1280/720";

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <BrainCircuit className="w-16 h-16 text-primary animate-pulse mb-6" />
        <h2 className="text-xl font-headline font-bold uppercase tracking-widest text-primary">Neural Sync...</h2>
      </div>
    )
  }

  if (!sessionStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-xl w-full text-center space-y-10">
          <div className="w-64 h-64 bg-slate-900 rounded-[3rem] flex items-center justify-center border-4 border-primary/20 mx-auto overflow-hidden relative shadow-2xl group">
            <video ref={userVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            {!hasCameraPermission && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                <VideoOff className="w-12 h-12 text-slate-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-transparent transition-all" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-headline font-bold uppercase tracking-tighter">Aria Performance Audit</h1>
            <p className="text-slate-400">Aria is ready to evaluate your background and technical logic.</p>
          </div>
          <Button className="w-full h-18 rounded-[2rem] bg-primary text-xl font-black shadow-lg hover:scale-[1.03] transition-all shadow-primary/30" onClick={startSession}>
            START ASSESSMENT
            <Play className="ml-3 w-5 h-5 fill-current" />
          </Button>
          {!hasCameraPermission && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 rounded-xl">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Camera Disabled</AlertTitle>
              <AlertDescription>Enable camera for biometric focus tracking.</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-body select-none">
      <div className="h-16 border-b border-white/5 bg-slate-950 px-6 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-4">
          <ShieldCheck className="text-primary w-5 h-5" />
          <Badge variant="outline" className="text-[10px] border-white/10 text-slate-500 py-1 px-3 rounded-full font-bold">
            PROGRESS: {turnCount + 1} / 6
          </Badge>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">
            {sessionStorage.getItem('demo_role')} ASSESSMENT
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-slate-500 hover:text-red-500 font-bold h-9 rounded-xl" 
          onClick={terminateSession}
          disabled={terminating}
        >
          {terminating ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <StopCircle className="w-4 h-4 mr-2" />} 
          END & AUDIT
        </Button>
      </div>

      <div className="flex-1 flex relative bg-slate-950 overflow-hidden">
        <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
          <div className="absolute inset-0">
             <img 
               src={ariaImage} 
               alt="Aria" 
               className={`w-full h-full object-cover transition-all duration-1000 ${speaking ? 'opacity-100 scale-105' : 'opacity-60 grayscale-[20%]'}`}
               data-ai-hint="professional human persona"
             />
             {speaking && <div className="absolute inset-0 bg-primary/5 animate-pulse-slow pointer-events-none" />}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
          
          <div className="absolute top-8 left-8 z-20 flex flex-col gap-3">
             {fetchingAudio && <Badge className="bg-blue-600/80 backdrop-blur-md animate-pulse px-4 py-1.5 rounded-full shadow-2xl text-[10px] font-black uppercase tracking-widest">Reasoning...</Badge>}
             {speaking && !fetchingAudio && <Badge className="bg-primary/80 backdrop-blur-md animate-pulse px-4 py-1.5 rounded-full flex gap-2 shadow-2xl text-[10px] font-black uppercase tracking-widest"><Volume2 className="w-3 h-3" /> Aria Speaking</Badge>}
             {listening && !isStuck && <Badge className="bg-green-600/80 backdrop-blur-md animate-bounce px-4 py-1.5 rounded-full flex gap-2 shadow-2xl text-[10px] font-black uppercase tracking-widest"><Mic className="w-3 h-3" /> Listening</Badge>}
             {isStuck && <Badge className="bg-amber-600/80 backdrop-blur-md animate-pulse px-4 py-1.5 rounded-full flex gap-2 shadow-2xl text-[10px] font-black uppercase tracking-widest"><HelpCircle className="w-3 h-3" /> Detection: Stuck</Badge>}
          </div>

          <div className="absolute bottom-10 inset-x-6 sm:inset-x-12 z-20 animate-fade-in">
            <div className="max-w-4xl mx-auto bg-slate-950/80 backdrop-blur-3xl border border-white/5 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl">
              <h3 className="text-lg md:text-2xl font-headline font-bold leading-tight text-white tracking-tight">
                {currentQuestion || "Calibrating next turn..."}
              </h3>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex w-[420px] bg-slate-950 border-l border-white/5 flex-col z-30 shadow-2xl overflow-hidden">
          <div className="p-8 space-y-8 flex-1 overflow-y-auto scrollbar-hide">
            
            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block text-center">Neural Biometric Feed</span>
              <div className="aspect-video bg-slate-900 rounded-[2rem] overflow-hidden border border-white/5 relative group shadow-inner">
                <video ref={userVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                {!hasCameraPermission && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 gap-3">
                    <VideoOff className="w-8 h-8 text-slate-700" />
                    <p className="text-[10px] uppercase font-black text-slate-800 tracking-widest">Feed Disabled</p>
                  </div>
                )}
                <div className="absolute inset-x-0 h-[2px] bg-primary/40 shadow-[0_0_15px_rgba(var(--primary),0.6)] animate-[scan_6s_linear_infinite]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 border border-white/5 rounded-2xl text-center relative overflow-hidden group shadow-inner">
                <Activity className="w-4 h-4 text-primary mb-2 mx-auto" />
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Confidence</p>
                <p className="text-2xl font-black mt-1">{Math.round(confidenceLevel)}%</p>
                <div className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000 shadow-lg" style={{ width: `${confidenceLevel}%` }} />
              </div>
              <div className="p-6 bg-white/5 border border-white/5 rounded-2xl text-center relative overflow-hidden group shadow-inner">
                <Target className="w-4 h-4 text-primary mb-2 mx-auto" />
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Focus</p>
                <p className="text-2xl font-black mt-1">{Math.round(eyeFocus)}%</p>
                <div className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000 shadow-lg" style={{ width: `${eyeFocus}%` }} />
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Terminal className={`w-3 h-3 ${listening ? 'text-green-500 animate-pulse' : 'text-slate-700'}`} />
                Linguistic Feed
              </span>
              <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-8 h-48 overflow-y-auto scrollbar-hide flex flex-col justify-end shadow-inner relative">
                {(transcript || interimTranscript) ? (
                  <p className="text-base text-slate-300 italic leading-relaxed font-medium">
                    {transcript}
                    <span className="text-primary font-black">{interimTranscript}</span>
                  </p>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-800">
                    <Mic className="w-8 h-8 opacity-20" />
                    <p className="text-[9px] uppercase tracking-[0.2em] font-black">Awaiting Verbal Response</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-white/5 bg-slate-900/30 shrink-0">
            {listening ? (
              <Button className="w-full h-16 rounded-[1.5rem] bg-primary hover:bg-primary/90 font-black text-lg shadow-2xl hover:scale-[1.02] transition-transform" onClick={() => completeTurn(false)}>
                SUBMIT RESPONSE
                <CheckCircle2 className="ml-2 w-5 h-5" />
              </Button>
            ) : (
              <div className="w-full h-16 rounded-[1.5rem] bg-slate-800/40 flex items-center justify-center text-slate-500 font-black gap-3 border border-white/5">
                <Loader2 className="animate-spin h-5 w-5" />
                <span className="text-[10px] uppercase tracking-[0.2em]">Aria Reasoning...</span>
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
          100% { transform: translateY(220px); opacity: 0; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
