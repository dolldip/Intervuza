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
  ChevronRight,
  Info
} from "lucide-react"
import { generateInterviewQuestions } from "@/ai/flows/dynamic-interview-question-generation"
import { textToSpeech } from "@/ai/flows/tts-flow"
import { instantTextualAnswerFeedback } from "@/ai/flows/instant-textual-answer-feedback"
import { useToast } from "@/hooks/use-toast"

export default function InterviewSessionPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const db = useFirestore()
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
  const [timeLeft, setTimeLeft] = useState(900)
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [currentEmotion, setCurrentEmotion] = useState("Analyzing")
  const [confidenceLevel, setConfidenceLevel] = useState(75)
  const [eyeAlignment, setEyeAlignment] = useState(60)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const recognitionRef = useRef<any>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptAccumulatorRef = useRef("")

  useEffect(() => {
    async function setupMedia() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: true 
        });
        setStream(mediaStream)
      } catch (error) {
        console.error('Media Access Denied:', error);
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

        const currentFull = (transcriptAccumulatorRef.current + interimText).toLowerCase();
        const finishPhrases = ["i'm done", "that's all", "i don't know", "no idea", "that is it"];
        const detectedFinish = finishPhrases.some(p => currentFull.includes(p));

        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = setTimeout(() => {
          if (currentFull.trim().length > 10 && !processingTurn && !speaking && listening) {
            completeTurn();
          }
        }, detectedFinish ? 1500 : 4000);
      };
    }

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (recognitionRef.current) recognitionRef.current.stop();
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, [listening, processingTurn, speaking]);

  useEffect(() => {
    if (sessionStarted && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [sessionStarted, stream]);

  useEffect(() => {
    async function init() {
      const demoRole = sessionStorage.getItem('demo_role') || "Professional";
      const demoExp = sessionStorage.getItem('demo_exp') || "Mid-level";
      try {
        const result = await generateInterviewQuestions({
          jobRole: demoRole,
          experienceLevel: demoExp,
          skills: ["Problem Solving", "Communication"],
          roundType: 'technical'
        })
        setOpening(result.openingStatement)
        setCurrentQuestion(result.firstQuestion)
      } catch (err) {
        setCurrentQuestion("Could you tell me a bit about yourself?")
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
    if (processingTurn || fetchingAudio || speaking) return;
    setProcessingTurn(true);
    setListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }

    const fullAnswer = transcriptAccumulatorRef.current + interimTranscript;
    const currentAnswers = JSON.parse(sessionStorage.getItem('session_answers') || '[]');
    currentAnswers.push({ question: currentQuestion, answer: fullAnswer || "Silent response." });
    sessionStorage.setItem('session_answers', JSON.stringify(currentAnswers));

    try {
      const feedback = await instantTextualAnswerFeedback({
        interviewQuestion: currentQuestion,
        userAnswer: fullAnswer || "...",
        jobRole: sessionStorage.getItem('demo_role') || "Candidate",
        experienceLevel: sessionStorage.getItem('demo_exp') || "Mid-level",
        currentRound: turnCount < 5 ? 'technical' : 'hr'
      });
      
      setCurrentEmotion(feedback.detectedEmotion);
      setTurnCount(prev => prev + 1);

      if (!feedback.isInterviewComplete && turnCount < 10) {
        setCurrentQuestion(feedback.nextQuestion);
        setTranscript("");
        setInterimTranscript("");
        transcriptAccumulatorRef.current = "";
        
        const responseText = `${feedback.verbalReaction}. ${feedback.nextQuestion}`;
        await triggerSpeech(responseText);
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
        <BrainCircuit className="w-24 h-24 text-primary animate-pulse mb-8" />
        <h2 className="text-3xl font-headline font-bold mb-4 uppercase tracking-widest text-primary">Neural Link Loading</h2>
        <p className="text-slate-400">Sarah is preparing your tailored session...</p>
      </div>
    )
  }

  if (!sessionStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="w-40 h-40 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 mx-auto">
            <User className="w-16 h-16 text-primary" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-headline font-bold">Ready to Start?</h1>
            <p className="text-slate-400 text-lg">Sarah will speak naturally. Just talk to her when she finishes. No clicking required.</p>
          </div>
          <Button className="w-full h-20 rounded-full bg-primary text-xl font-bold shadow-2xl" onClick={startSession}>
            BEGIN ASSESSMENT
            <Play className="ml-3 w-5 h-5 fill-current" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      <div className="h-16 border-b border-white/5 bg-slate-950 px-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-6">
          <ShieldCheck className="text-primary w-6 h-6" />
          <span className="text-xs font-mono text-primary uppercase">
            {turnCount < 5 ? 'ROUND 1: TECHNICAL' : 'ROUND 2: HR'}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="text-slate-500" onClick={() => router.push("/dashboard")}>
          <StopCircle className="w-4 h-4 mr-2" /> EXIT
        </Button>
      </div>

      <div className="flex-1 flex relative bg-slate-950">
        <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden border-r border-white/5">
          <img 
            src={`https://picsum.photos/seed/sarah-${currentEmotion}/1200/1200`} 
            alt="Sarah AI" 
            className={`w-full h-full object-cover transition-all duration-1000 ${speaking ? 'opacity-100 scale-105' : 'opacity-60 grayscale-[0.5]'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
          
          <div className="absolute top-8 left-8 z-20 space-y-3">
             {fetchingAudio && <Badge className="bg-blue-600 animate-pulse">SARAH IS THINKING...</Badge>}
             {speaking && !fetchingAudio && <Badge className="bg-primary animate-pulse">SARAH IS SPEAKING...</Badge>}
             {listening && <Badge className="bg-green-600 animate-bounce">SARAH IS LISTENING...</Badge>}
          </div>

          <div className="absolute bottom-8 inset-x-8 z-20">
            <div className="max-w-4xl mx-auto bg-slate-950/90 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem]">
              <div className="flex items-start gap-6">
                <div className={`p-5 rounded-2xl ${speaking ? 'bg-primary' : 'bg-slate-800'}`}>
                  <Volume2 className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 pt-1">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 block">Sarah's Question</span>
                  <h3 className="text-xl md:text-2xl font-headline font-bold">
                    {currentQuestion}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-[420px] bg-slate-950 border-l border-white/10 flex flex-col z-30">
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Live Feed</span>
              <div className="aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-white/10 relative">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale-[0.4]" />
                <div className="absolute inset-x-0 h-[1px] bg-primary/40 shadow-[0_0_15px_#3b82f6] animate-[scan_5s_linear_infinite]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                <Activity className="w-4 h-4 text-primary mb-2" />
                <p className="text-[9px] text-slate-500 font-black uppercase">Confidence</p>
                <p className="text-xl font-black">{confidenceLevel}%</p>
              </div>
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                <Target className="w-4 h-4 text-primary mb-2" />
                <p className="text-[9px] text-slate-500 font-black uppercase">Eye Focus</p>
                <p className="text-xl font-black">{eyeAlignment}%</p>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Waves className={`w-3 h-3 ${listening ? 'text-green-500' : 'text-slate-700'}`} />
                Live Transcript
              </span>
              <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 h-48 overflow-y-auto">
                {(transcript || interimTranscript) ? (
                  <p className="text-sm text-slate-300 italic">
                    {transcript}
                    <span className="text-slate-500">{interimTranscript}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-600 italic">Awaiting voice input...</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-white/5 bg-slate-900/20">
            {listening ? (
              <Button className="w-full h-16 rounded-2xl bg-green-600 hover:bg-green-500 font-bold" onClick={completeTurn}>
                FINISH ANSWER
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            ) : (
              <div className="w-full h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-500 font-bold gap-3">
                <Loader2 className="animate-spin h-5 w-5" />
                <span className="uppercase text-xs tracking-widest">Processing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={audioSrc || undefined} onEnded={handleAudioEnded} className="hidden" />

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(220px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
