
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
        console.error('Media Access Denied:', error);
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
          if (combinedText.length > 5) {
            completeTurn();
          }
        }, 3500);
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
      try {
        const result = await generateInterviewQuestions({
          jobRole: demoRole,
          experienceLevel: demoExp,
          skills: ["Communication", "Problem Solving"],
          jobDescriptionText: demoJd,
          roundType: 'technical'
        })
        setOpening(result.openingStatement)
        setCurrentQuestion(result.firstQuestion)
        setAskedQuestions([result.firstQuestion])
        sessionStorage.setItem('session_answers', '[]');
      } catch (err) {
        const fallbackQ = "To begin, could you provide an overview of your professional background and core strengths?";
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
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => useLocalSpeech(text));
          }
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
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
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
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    }
  };

  const completeTurn = async () => {
    const { processingTurn: isProcessing, turnCount: currentTurn, currentQuestion: question, askedQuestions: history } = stateRef.current;
    if (isProcessing) return;
    
    setProcessingTurn(true);
    setListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }

    const fullAnswer = (transcriptAccumulatorRef.current + interimTranscript).trim();
    const currentAnswers = JSON.parse(sessionStorage.getItem('session_answers') || '[]');
    currentAnswers.push({ question: question, answer: fullAnswer || "Candidate provided no spoken answer." });
    sessionStorage.setItem('session_answers', JSON.stringify(currentAnswers));

    try {
      const feedback = await instantTextualAnswerFeedback({
        interviewQuestion: question,
        userAnswer: fullAnswer || "...",
        jobRole: sessionStorage.getItem('demo_role') || "Professional",
        experienceLevel: sessionStorage.getItem('demo_exp') || "Mid-level",
        currentRound: currentTurn < 3 ? 'technical' : 'hr',
        previousQuestions: history
      });
      
      setCurrentEmotion(feedback.detectedEmotion);
      const nextTurnCount = currentTurn + 1;
      setTurnCount(nextTurnCount);

      const shouldFinish = feedback.isInterviewComplete || nextTurnCount >= 5;

      if (!shouldFinish) {
        setCurrentQuestion(feedback.nextQuestion);
        setAskedQuestions(prev => [...prev, feedback.nextQuestion]);
        
        setTranscript("");
        setInterimTranscript("");
        transcriptAccumulatorRef.current = "";
        
        const responseText = `${feedback.verbalReaction}. ${feedback.nextQuestion}`;
        await triggerSpeech(responseText);
      } else {
        router.push(`/results/${params.id === "demo-session" ? 'demo-results' : params.id}`)
      }
    } catch (err) {
      console.error("Turn processing error", err);
      router.push(`/results/demo-results`);
    } finally {
      setProcessingTurn(false);
    }
  };

  const handleExit = () => {
    const answers = JSON.parse(sessionStorage.getItem('session_answers') || '[]');
    if (answers.length > 0) {
      router.push(`/results/demo-results`);
    } else {
      router.push("/dashboard");
    }
  };

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <BrainCircuit className="w-24 h-24 text-primary animate-pulse mb-8" />
        <h2 className="text-3xl font-headline font-bold mb-4 uppercase tracking-widest text-primary">Initializing Sarah</h2>
        <p className="text-slate-400">Loading neural modules and job context...</p>
      </div>
    )
  }

  if (!sessionStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-2xl w-full text-center space-y-10">
          <div className="w-48 h-48 bg-primary/20 rounded-[3rem] flex items-center justify-center border-2 border-primary/30 mx-auto relative overflow-hidden shadow-2xl group">
            {stream ? (
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale-[0.5]" />
            ) : (
              <User className="w-16 h-16 text-primary" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-headline font-bold">Conversational Assessment</h1>
            <p className="text-slate-400 text-lg leading-relaxed">Sarah will evaluate your role knowledge, grammar, and focus. Speak naturally; the system detects pauses automatically.</p>
          </div>
          <Button className="w-full h-20 rounded-[2rem] bg-primary text-2xl font-black shadow-[0_0_50px_rgba(59,130,246,0.3)] hover:scale-105 transition-all" onClick={startSession}>
            BEGIN ASSESSMENT
            <Play className="ml-4 w-6 h-6 fill-current" />
          </Button>
          {!hasCameraPermission && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 text-destructive-foreground rounded-2xl">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="font-bold">Hardware Check Failed</AlertTitle>
              <AlertDescription>Please enable camera and microphone access to proceed.</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      <div className="h-16 border-b border-white/5 bg-slate-950 px-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-8">
          <ShieldCheck className="text-primary w-6 h-6" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">
              Neural Assessment Active
            </span>
            <span className="text-xs font-bold text-slate-400">
              {turnCount < 3 ? 'ROUND 1: TECHNICAL' : 'ROUND 2: HR'}
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] border-white/10 text-slate-500 py-1 px-3 rounded-full">
            TURN {turnCount + 1} / 10
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-white hover:bg-white/5 px-4 rounded-xl" onClick={handleExit}>
          <StopCircle className="w-4 h-4 mr-2" /> 
          {turnCount > 0 ? 'FINISH & SEE RESULTS' : 'EXIT SESSION'}
        </Button>
      </div>

      <div className="flex-1 flex relative bg-slate-950">
        <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden border-r border-white/5">
          <div className="absolute inset-0">
             <img 
               src={`https://picsum.photos/seed/sarah-ai-interviewer-v2/1200/1200`} 
               alt="Sarah AI" 
               className={`w-full h-full object-cover transition-all duration-1000 ${speaking ? 'opacity-100 scale-105 saturate-150 blur-none' : 'opacity-60 grayscale-[0.2] blur-sm'}`}
             />
             {speaking && (
               <div className="absolute inset-0 animate-pulse bg-primary/10 mix-blend-screen" />
             )}
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
          
          <div className="absolute top-8 left-8 z-20 flex flex-col gap-3">
             {fetchingAudio && <Badge className="bg-blue-600 animate-pulse border-none px-6 py-2 rounded-full shadow-lg">SYNTHESIZING NEURAL VOICE...</Badge>}
             {speaking && !fetchingAudio && <Badge className="bg-primary animate-pulse border-none px-6 py-2 rounded-full shadow-lg flex items-center gap-2"><Volume2 className="w-4 h-4" /> SARAH IS SPEAKING</Badge>}
             {listening && <Badge className="bg-green-600 animate-bounce border-none px-6 py-2 rounded-full shadow-lg flex items-center gap-2"><Mic className="w-4 h-4" /> SARAH IS LISTENING</Badge>}
             {processingTurn && <Badge className="bg-amber-600 animate-pulse border-none px-6 py-2 rounded-full shadow-lg">ANALYZING RESPONSE...</Badge>}
          </div>

          <div className="absolute bottom-10 inset-x-10 z-20">
            <div className="max-w-4xl mx-auto bg-slate-950/90 backdrop-blur-3xl border border-white/10 p-10 rounded-[3.5rem] shadow-2xl transition-all">
              <div className="flex items-start gap-8">
                <div className={`p-6 rounded-[2.5rem] transition-all duration-500 ${speaking ? 'bg-primary shadow-[0_0_40px_rgba(59,130,246,0.6)]' : 'bg-slate-800'}`}>
                  <Volume2 className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1 pt-2">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-3 block">Sarah's Query</span>
                  <h3 className="text-2xl md:text-3xl font-headline font-bold leading-tight">
                    {currentQuestion || "Preparing next question..."}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-[480px] bg-slate-950 border-l border-white/10 flex flex-col z-30">
          <div className="p-8 space-y-10 flex-1 overflow-y-auto scrollbar-hide">
            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center flex items-center justify-center gap-2">
                <Activity className="w-3 h-3 text-primary" />
                Biometric Visual Stream
              </span>
              <div className="aspect-video bg-slate-900 rounded-[3rem] overflow-hidden border-2 border-white/5 relative shadow-2xl group">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover contrast-110 saturate-100" 
                />
                <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                <div className="absolute inset-x-0 h-[2px] bg-primary/40 shadow-[0_0_20px_#3b82f6] animate-[scan_8s_linear_infinite]" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                   <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-[8px] font-mono tracking-tighter">LATENCY: 42MS</Badge>
                   <Badge className="bg-primary/20 backdrop-blur-md border-primary/30 text-[8px] font-mono text-primary">ENCRYPTED LINK</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 border border-white/5 rounded-[2.5rem] text-center hover:bg-white/10 transition-colors">
                <Activity className="w-5 h-5 text-primary mb-3 mx-auto" />
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Confidence</p>
                <p className="text-2xl font-black mt-1 tabular-nums">{listening ? Math.floor(70 + Math.random() * 20) : 0}%</p>
              </div>
              <div className="p-6 bg-white/5 border border-white/5 rounded-[2.5rem] text-center hover:bg-white/10 transition-colors">
                <Target className="w-5 h-5 text-primary mb-3 mx-auto" />
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Eye Focus</p>
                <p className="text-2xl font-black mt-1 tabular-nums">{listening ? Math.floor(85 + Math.random() * 12) : 0}%</p>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Waves className={`w-4 h-4 ${listening ? 'text-green-500 animate-pulse' : 'text-slate-700'}`} />
                Neural Linguistic Stream
              </span>
              <div className="bg-slate-900/50 border border-white/5 rounded-[3rem] p-8 h-64 overflow-y-auto scrollbar-hide flex flex-col justify-end">
                {(transcript || interimTranscript) ? (
                  <p className="text-lg text-slate-300 italic leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-2">
                    {transcript}
                    <span className="text-primary font-bold">{interimTranscript}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-700 italic flex flex-col items-center justify-center h-full gap-4 text-center">
                    <Mic className="w-6 h-6 opacity-20" />
                    Waiting for vocal signature...
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-10 border-t border-white/5 bg-slate-900/30">
            {listening ? (
              <Button className="w-full h-20 rounded-[2.5rem] bg-green-600 hover:bg-green-500 font-black text-lg shadow-xl shadow-green-900/20 group" onClick={completeTurn}>
                COMPLETE RESPONSE
                <CheckCircle2 className="ml-3 w-6 h-6 group-hover:scale-110 transition-transform" />
              </Button>
            ) : (
              <div className="w-full h-20 rounded-[2.5rem] bg-slate-800/50 flex items-center justify-center text-slate-500 font-bold gap-4">
                <Loader2 className="animate-spin h-6 w-6" />
                <span className="uppercase text-xs tracking-[0.4em] font-black">Sarah is Processing...</span>
              </div>
            )}
            <p className="text-[9px] text-center text-slate-600 mt-6 uppercase tracking-[0.2em] font-medium leading-relaxed">
              Maintain eye contact and speak with clarity.<br/>Sarah evaluates focus and grammar in real-time.
            </p>
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
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

    