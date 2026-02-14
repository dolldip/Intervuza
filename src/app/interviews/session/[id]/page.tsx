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
  Terminal
} from "lucide-react"
import { generateInterviewQuestions } from "@/ai/flows/dynamic-interview-question-generation"
import { textToSpeech } from "@/ai/flows/tts-flow"
import { instantTextualAnswerFeedback } from "@/ai/flows/instant-textual-answer-feedback"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  
  const [confidenceLevel, setConfidenceLevel] = useState(70)
  const [eyeFocus, setEyeFocus] = useState(80)
  const [isCodingTask, setIsCodingTask] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const recognitionRef = useRef<any>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptAccumulatorRef = useRef("")
  
  const stateRef = useRef({ 
    speaking, 
    listening, 
    processingTurn, 
    turnCount, 
    currentQuestion, 
    askedQuestions,
    sessionStarted
  })

  useEffect(() => {
    stateRef.current = { 
      speaking, 
      listening, 
      processingTurn, 
      turnCount, 
      currentQuestion, 
      askedQuestions,
      sessionStarted
    }
  }, [speaking, listening, processingTurn, turnCount, currentQuestion, askedQuestions, sessionStarted])

  // Realistic Biometrics Logic
  useEffect(() => {
    if (!sessionStarted) return;
    const interval = setInterval(() => {
      const { listening: isListening } = stateRef.current;
      const currentText = transcriptAccumulatorRef.current;
      
      setConfidenceLevel(prev => {
        let change = (Math.random() * 2) - 1; 
        if (isListening && currentText.length < 5) change -= 8; // Drop if silent during turn
        if (isListening && currentText.length > 50) change += 4; // Rise if providing detail
        return Math.min(99, Math.max(5, prev + change));
      });

      setEyeFocus(prev => {
        let change = (Math.random() * 4) - 2;
        if (Math.random() > 0.96) change = -35; // Simulate looking away
        return Math.min(100, Math.max(10, prev + change));
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStarted]);

  useEffect(() => {
    async function setupMedia() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: true 
        });
        setStream(mediaStream)
        setHasCameraPermission(true)
      } catch (error) {
        setHasCameraPermission(false)
        toast({
          variant: "destructive",
          title: "Hardware Permission Denied",
          description: "Aria needs camera and microphone access to conduct the assessment."
        })
      }
    }
    setupMedia();

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
        }
        setInterimTranscript(interimText);

        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = setTimeout(() => {
          const combinedText = (transcriptAccumulatorRef.current + interimText).trim();
          if (combinedText.length > 10) {
             completeTurn();
          }
        }, 5000); // 5s silence triggers auto-submit
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
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    async function init() {
      const demoRole = sessionStorage.getItem('demo_role') || "Professional";
      const demoExp = sessionStorage.getItem('demo_exp') || "Mid-level";
      const demoJd = sessionStorage.getItem('demo_jd') || "Professional Job Description";
      const demoRound = sessionStorage.getItem('demo_round') || "technical";
      
      const needsCoding = demoRole.toLowerCase().includes('engineer') || 
                          demoRole.toLowerCase().includes('developer');
      setIsCodingTask(needsCoding && demoRound === 'technical');

      try {
        const result = await generateInterviewQuestions({
          jobRole: demoRole,
          experienceLevel: demoExp,
          skills: ["Logic", "Communication", "Domain Mastery"],
          jobDescriptionText: demoJd,
          roundType: demoRound
        })
        setOpening(result.openingStatement)
        setCurrentQuestion(result.firstQuestion)
        setAskedQuestions([result.firstQuestion])
        sessionStorage.setItem('session_answers', '[]');
      } catch (err) {
        setOpening("Hi, I'm Aria. I'm glad we could connect for this assessment.")
        const fb = "To get us started, could you walk me through your background and what's led you to this specific role?";
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

  const completeTurn = async () => {
    const { processingTurn: isProcessing, turnCount: currentTurn, currentQuestion: question, askedQuestions: history } = stateRef.current;
    if (isProcessing) return;
    
    setProcessingTurn(true);
    setListening(false);
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {}

    const fullAnswer = (transcriptAccumulatorRef.current + interimTranscript).trim();
    const currentAnswers = JSON.parse(sessionStorage.getItem('session_answers') || '[]');
    currentAnswers.push({ question, answer: fullAnswer || "No response." });
    sessionStorage.setItem('session_answers', JSON.stringify(currentAnswers));

    try {
      const feedback = await instantTextualAnswerFeedback({
        interviewQuestion: question,
        userAnswer: fullAnswer || "Silence.",
        jobRole: sessionStorage.getItem('demo_role') || "Professional",
        experienceLevel: sessionStorage.getItem('demo_exp') || "Mid-level",
        currentRound: sessionStorage.getItem('demo_round') === 'hr' ? 'hr' : 'technical',
        previousQuestions: history
      });
      
      setCurrentEmotion(feedback.detectedEmotion);
      const nextTurnCount = currentTurn + 1;
      setTurnCount(nextTurnCount);

      if (!feedback.isInterviewComplete && nextTurnCount < 6) {
        setCurrentQuestion(feedback.nextQuestion);
        setAskedQuestions(prev => [...prev, feedback.nextQuestion]);
        setTranscript("");
        setInterimTranscript("");
        transcriptAccumulatorRef.current = "";
        
        const finalPrompt = `${feedback.verbalReaction}. ${feedback.nextQuestion}`;
        await triggerSpeech(finalPrompt);
      } else {
        if (user && db && params.id !== "demo-session") {
          const sessionRef = doc(db, "users", user.uid, "interviewSessions", params.id as string);
          await updateDoc(sessionRef, {
            status: "completed",
            endTime: new Date().toISOString(),
            overallScore: Math.round(confidenceLevel * 0.8 + 20) 
          });
        }
        router.push(`/results/${params.id === "demo-session" ? 'demo-results' : params.id}`)
      }
    } catch (err) {
      console.error("Session turn processing error:", err);
      router.push(`/results/demo-results`);
    } finally {
      setProcessingTurn(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <BrainCircuit className="w-20 h-20 text-primary animate-pulse mb-8" />
        <h2 className="text-2xl font-headline font-bold uppercase tracking-widest text-primary">Neural Synchronization...</h2>
      </div>
    )
  }

  if (!sessionStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-xl w-full text-center space-y-10">
          <div className="w-56 h-56 bg-primary/10 rounded-[3rem] flex items-center justify-center border-2 border-primary/20 mx-auto overflow-hidden relative shadow-2xl group">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-transparent transition-all" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-headline font-bold uppercase tracking-tighter">Professional Assessment</h1>
            <p className="text-slate-400">Aria will evaluate your technical logic and linguistic structure. Ensure your environment is quiet.</p>
          </div>
          <Button className="w-full h-20 rounded-[2rem] bg-primary text-2xl font-black shadow-lg hover:scale-105 transition-all shadow-primary/20" onClick={startSession}>
            BEGIN SESSION
            <Play className="ml-4 w-6 h-6 fill-current" />
          </Button>
          {!hasCameraPermission && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 rounded-2xl">
              <ShieldCheck className="h-5 w-5" />
              <AlertTitle>Hardware Access Required</AlertTitle>
              <AlertDescription>Please enable camera and mic for the assessment.</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      <div className="h-14 border-b border-white/5 bg-slate-950 px-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-6">
          <Sparkles className="text-primary w-5 h-5" />
          <Badge variant="outline" className="text-[10px] border-white/10 text-slate-500 py-1 px-3">
            TURN {turnCount + 1} / 6
          </Badge>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
            {sessionStorage.getItem('demo_role')} Assessment with Aria
          </span>
        </div>
        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-white" onClick={() => router.push(`/dashboard`)}>
          <StopCircle className="w-4 h-4 mr-2" /> TERMINATE
        </Button>
      </div>

      <div className="flex-1 flex relative bg-slate-950">
        <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden border-r border-white/5">
          <div className="absolute inset-0">
             <img 
               src={`https://picsum.photos/seed/aria-interviewer/1200/1200`} 
               alt="Aria" 
               className={`w-full h-full object-cover transition-all duration-1000 ${speaking ? 'opacity-100 scale-105 saturate-150' : 'opacity-60 brightness-50'}`}
               data-ai-hint="professional woman recruiter"
             />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
          
          <div className="absolute top-8 left-8 z-20 flex flex-col gap-3">
             {fetchingAudio && <Badge className="bg-blue-600 animate-pulse px-4 py-1.5 rounded-full shadow-lg">THINKING...</Badge>}
             {speaking && !fetchingAudio && <Badge className="bg-primary animate-pulse px-4 py-1.5 rounded-full flex gap-2 shadow-lg"><Volume2 className="w-4 h-4" /> ARIA SPEAKING</Badge>}
             {listening && <Badge className="bg-green-600 animate-bounce px-4 py-1.5 rounded-full flex gap-2 shadow-lg"><Mic className="w-4 h-4" /> LISTENING</Badge>}
          </div>

          <div className="absolute bottom-10 inset-x-10 z-20">
            <div className="max-w-3xl mx-auto bg-slate-950/80 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] shadow-2xl">
              <h3 className="text-xl md:text-2xl font-headline font-bold leading-tight">
                {currentQuestion || "Preparing next challenge..."}
              </h3>
            </div>
          </div>
        </div>

        <div className="w-[440px] bg-slate-950 border-l border-white/10 flex flex-col z-30">
          <div className="p-8 space-y-8 flex-1 overflow-y-auto scrollbar-hide">
            
            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center">Neural Biometric Feed</span>
              <div className="aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden border-2 border-white/5 relative group shadow-2xl">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                <div className="absolute inset-x-0 h-[2px] bg-primary/40 shadow-lg animate-[scan_6s_linear_infinite]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 border border-white/5 rounded-3xl text-center relative overflow-hidden group">
                <Activity className="w-4 h-4 text-primary mb-2 mx-auto" />
                <p className="text-[9px] text-slate-500 uppercase tracking-tighter">Confidence</p>
                <p className="text-2xl font-black">{Math.round(confidenceLevel)}%</p>
                <div className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000" style={{ width: `${confidenceLevel}%` }} />
              </div>
              <div className="p-6 bg-white/5 border border-white/5 rounded-3xl text-center relative overflow-hidden group">
                <Target className="w-4 h-4 text-primary mb-2 mx-auto" />
                <p className="text-[9px] text-slate-500 uppercase tracking-tighter">Focus</p>
                <p className="text-2xl font-black">{Math.round(eyeFocus)}%</p>
                <div className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000" style={{ width: `${eyeFocus}%` }} />
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Terminal className={`w-3 h-3 ${listening ? 'text-green-500 animate-pulse' : 'text-slate-700'}`} />
                Linguistic Feed
              </span>
              <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 h-48 overflow-y-auto scrollbar-hide flex flex-col justify-end">
                {(transcript || interimTranscript) ? (
                  <p className="text-base text-slate-200 italic leading-relaxed">
                    {transcript}
                    <span className="text-primary font-bold">{interimTranscript}</span>
                  </p>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-700">
                    <Mic className="w-8 h-8 opacity-20" />
                    <p className="text-[10px] uppercase tracking-widest font-bold">Waiting for input...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-white/5 bg-slate-900/30">
            {listening ? (
              <Button className="w-full h-16 rounded-[2rem] bg-primary hover:bg-primary/90 font-bold shadow-xl shadow-primary/20" onClick={completeTurn}>
                SUBMIT ANSWER
                <CheckCircle2 className="ml-2 w-5 h-5" />
              </Button>
            ) : (
              <div className="w-full h-16 rounded-[2rem] bg-slate-800/50 flex items-center justify-center text-slate-500 font-bold gap-3 border border-white/5">
                <Loader2 className="animate-spin h-5 w-5" />
                <span className="text-xs uppercase tracking-widest">Processing...</span>
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
          100% { transform: translateY(240px); opacity: 0; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
