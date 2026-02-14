
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth, useFirestore } from "@/firebase"
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
  Waves, 
  ChevronRight,
  ShieldCheck,
  BrainCircuit,
  AlertCircle,
  CheckCircle2,
  Mic,
  Eye,
  Sparkles
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
  const [confidenceLevel, setConfidenceLevel] = useState(0)
  const [eyeFocus, setEyeFocus] = useState(0)

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

  // Biometric simulation logic - reacts to state
  useEffect(() => {
    if (!sessionStarted) return;
    const interval = setInterval(() => {
      if (listening) {
        // More realistic variation based on listening status
        setConfidenceLevel(prev => Math.min(100, Math.max(30, prev + (Math.random() > 0.6 ? 3 : -2))));
        setEyeFocus(prev => Math.min(100, Math.max(20, prev + (Math.random() > 0.4 ? 2 : -3))));
      } else {
        setConfidenceLevel(prev => Math.max(0, prev - 1));
        setEyeFocus(prev => Math.max(0, prev - 1.5));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [sessionStarted, listening]);

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
          title: "Hardware Access Required",
          description: "Sarah needs your camera and microphone to conduct the assessment."
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
          // Detect turn completion by phrases or silence
          const lowerText = combinedText.toLowerCase();
          const isDone = lowerText.includes("i am done") || lowerText.includes("that is all") || lowerText.includes("i am finished");
          
          if (combinedText.length > 10 || isDone) {
             completeTurn();
          }
        }, 4000); // 4 seconds of silence to detect turn end
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
  }, [stream, sessionStarted]);

  useEffect(() => {
    async function init() {
      const demoRole = sessionStorage.getItem('demo_role') || "Professional";
      const demoExp = sessionStorage.getItem('demo_exp') || "Mid-level";
      const demoJd = sessionStorage.getItem('demo_jd') || "Standard Job Description";
      const demoRound = sessionStorage.getItem('demo_round') || "technical";
      try {
        const result = await generateInterviewQuestions({
          jobRole: demoRole,
          experienceLevel: demoExp,
          skills: ["Communication", "Domain Knowledge"],
          jobDescriptionText: demoJd,
          roundType: demoRound
        })
        setOpening(result.openingStatement)
        setCurrentQuestion(result.firstQuestion)
        setAskedQuestions([result.firstQuestion])
        sessionStorage.setItem('session_answers', '[]');
      } catch (err) {
        const fallbackQ = "Could you start by telling me about your background and why you're interested in this role?";
        setOpening("Hello, I'm Sarah. I'll be your AI interviewer today.")
        setCurrentQuestion(fallbackQ)
        setAskedQuestions([fallbackQ])
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
    setConfidenceLevel(75);
    setEyeFocus(90);
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
    currentAnswers.push({ question, answer: fullAnswer || "No spoken answer." });
    sessionStorage.setItem('session_answers', JSON.stringify(currentAnswers));

    try {
      const feedback = await instantTextualAnswerFeedback({
        interviewQuestion: question,
        userAnswer: fullAnswer || "...",
        jobRole: sessionStorage.getItem('demo_role') || "Professional",
        experienceLevel: sessionStorage.getItem('demo_exp') || "Mid-level",
        currentRound: sessionStorage.getItem('demo_round') === 'hr' ? 'hr' : (currentTurn < 3 ? 'technical' : 'hr'),
        previousQuestions: history
      });
      
      setCurrentEmotion(feedback.detectedEmotion);
      const nextTurnCount = currentTurn + 1;
      setTurnCount(nextTurnCount);

      if (!feedback.isInterviewComplete && nextTurnCount < 8) {
        setCurrentQuestion(feedback.nextQuestion);
        setAskedQuestions(prev => [...prev, feedback.nextQuestion]);
        setTranscript("");
        setInterimTranscript("");
        transcriptAccumulatorRef.current = "";
        // Sarah acknowledges before moving on
        await triggerSpeech(`${feedback.verbalReaction}. ${feedback.nextQuestion}`);
      } else {
        router.push(`/results/${params.id === "demo-session" ? 'demo-results' : params.id}`)
      }
    } catch (err) {
      router.push(`/results/demo-results`);
    } finally {
      setProcessingTurn(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <BrainCircuit className="w-20 h-20 text-primary animate-pulse mb-8" />
        <h2 className="text-2xl font-headline font-bold uppercase tracking-widest text-primary">Initializing Neural Session</h2>
      </div>
    )
  }

  if (!sessionStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-xl w-full text-center space-y-10">
          <div className="w-40 h-40 bg-primary/10 rounded-[2.5rem] flex items-center justify-center border-2 border-primary/20 mx-auto overflow-hidden relative shadow-2xl">
            {stream ? (
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-primary" />
            )}
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-headline font-bold">Professional Mock Interview</h1>
            <p className="text-slate-400">Sarah will evaluate your clarity, logic, and technical depth. Speak naturally; turn detection is automatic.</p>
          </div>
          <Button className="w-full h-20 rounded-[2rem] bg-primary text-2xl font-black shadow-lg hover:scale-105 transition-all" onClick={startSession}>
            BEGIN ASSESSMENT
            <Play className="ml-4 w-6 h-6 fill-current" />
          </Button>
          {!hasCameraPermission && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 rounded-2xl">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Hardware Required</AlertTitle>
              <AlertDescription>Please enable camera and microphone access.</AlertDescription>
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
          <ShieldCheck className="text-primary w-5 h-5" />
          <Badge variant="outline" className="text-[10px] border-white/10 text-slate-500 py-1 px-3">
            TURN {turnCount + 1}
          </Badge>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
            {sessionStorage.getItem('demo_role')}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-white" onClick={() => router.push(`/results/${params.id}`)}>
          <StopCircle className="w-4 h-4 mr-2" /> EXIT & FINISH
        </Button>
      </div>

      <div className="flex-1 flex relative bg-slate-950">
        <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden border-r border-white/5">
          <div className="absolute inset-0">
             <img 
               src={`https://picsum.photos/seed/sarah-hr-professional/1200/1200`} 
               alt="Sarah AI" 
               className={`w-full h-full object-cover transition-all duration-1000 ${speaking ? 'opacity-100 scale-105 saturate-150 blur-none' : 'opacity-70 blur-sm brightness-75'}`}
             />
             {speaking && <div className="absolute inset-0 animate-pulse bg-primary/20 mix-blend-overlay" />}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
          <div className="absolute top-8 left-8 z-20 flex flex-col gap-3">
             {fetchingAudio && <Badge className="bg-blue-600 animate-pulse px-4 py-1.5 rounded-full">SYNTHESIZING...</Badge>}
             {speaking && !fetchingAudio && <Badge className="bg-primary animate-pulse px-4 py-1.5 rounded-full flex gap-2"><Volume2 className="w-4 h-4" /> SARAH SPEAKING</Badge>}
             {listening && <Badge className="bg-green-600 animate-bounce px-4 py-1.5 rounded-full flex gap-2"><Mic className="w-4 h-4" /> LISTENING</Badge>}
             {processingTurn && <Badge className="bg-amber-600 animate-pulse px-4 py-1.5 rounded-full">ANALYZING...</Badge>}
          </div>
          <div className="absolute bottom-10 inset-x-10 z-20">
            <div className="max-w-3xl mx-auto bg-slate-950/80 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] shadow-2xl">
              <h3 className="text-xl md:text-2xl font-headline font-bold leading-tight">
                {currentQuestion || "Preparing next question..."}
              </h3>
            </div>
          </div>
        </div>

        <div className="w-[420px] bg-slate-950 border-l border-white/10 flex flex-col z-30">
          <div className="p-8 space-y-8 flex-1 overflow-y-auto scrollbar-hide">
            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center">Biometric Scan (LIVE)</span>
              <div className="aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden border-2 border-white/5 relative">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                <div className="absolute inset-x-0 h-[2px] bg-primary/40 shadow-lg animate-[scan_6s_linear_infinite]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-white/5 border border-white/5 rounded-3xl text-center">
                <Activity className="w-4 h-4 text-primary mb-2 mx-auto" />
                <p className="text-[9px] text-slate-500 uppercase">Confidence</p>
                <p className="text-xl font-black">{confidenceLevel}%</p>
              </div>
              <div className="p-5 bg-white/5 border border-white/5 rounded-3xl text-center">
                <Target className="w-4 h-4 text-primary mb-2 mx-auto" />
                <p className="text-[9px] text-slate-500 uppercase">Focus</p>
                <p className="text-xl font-black">{eyeFocus}%</p>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Waves className={`w-3 h-3 ${listening ? 'text-green-500 animate-pulse' : 'text-slate-700'}`} />
                Neural Linguistic Stream
              </span>
              <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-6 h-56 overflow-y-auto scrollbar-hide flex flex-col justify-end">
                {(transcript || interimTranscript) ? (
                  <p className="text-base text-slate-300 italic leading-relaxed">
                    {transcript}
                    <span className="text-primary font-bold">{interimTranscript}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-700 italic flex flex-col items-center justify-center h-full gap-2 text-center">
                    <Mic className="w-5 h-5 opacity-20" />
                    Waiting for spoken input...
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-white/5 bg-slate-900/30">
            {listening ? (
              <Button className="w-full h-16 rounded-[2rem] bg-green-600 hover:bg-green-500 font-bold" onClick={completeTurn}>
                COMPLETE TURN
                <CheckCircle2 className="ml-2 w-5 h-5" />
              </Button>
            ) : (
              <div className="w-full h-16 rounded-[2rem] bg-slate-800/50 flex items-center justify-center text-slate-500 font-bold gap-3">
                <Loader2 className="animate-spin h-5 w-5" />
                <span className="text-xs uppercase tracking-widest">Processing response...</span>
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
          100% { transform: translateY(200px); opacity: 0; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
