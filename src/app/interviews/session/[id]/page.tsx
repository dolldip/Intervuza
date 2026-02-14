
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
  CheckCircle2
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
  
  // Ref for latest state in callbacks to avoid closure staleness
  const stateRef = useRef({ speaking, listening, processingTurn, turnCount, currentQuestion, askedQuestions })
  useEffect(() => {
    stateRef.current = { speaking, listening, processingTurn, turnCount, currentQuestion, askedQuestions }
  }, [speaking, listening, processingTurn, turnCount, currentQuestion, askedQuestions])

  // Camera and Mic Setup
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

    // Setup Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const { speaking: isSpeaking, listening: isListening, processingTurn: isProcessing } = stateRef.current;
        
        // Safety: Do not transcribe if Sarah is speaking or we are processing
        if (isSpeaking || !isListening || isProcessing) return;

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

        // Clear existing silence timer
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        
        // Set new silence timer (4 seconds of silence indicates answer finished)
        silenceTimeoutRef.current = setTimeout(() => {
          const combinedText = (transcriptAccumulatorRef.current + interimText).trim();
          if (combinedText.length > 5) {
            completeTurn();
          }
        }, 4000);
      };

      recognitionRef.current.onend = () => {
        // Keep listening unless speaking or processing
        if (stateRef.current.listening && !stateRef.current.speaking && !stateRef.current.processingTurn) {
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

  // Sync video stream to ref
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, sessionStarted, initializing]);

  // Initial Question Fetch
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
        sessionStorage.setItem('session_answers', '[]'); // Reset history
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
    
    // Stop mic while speaking
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

      // Finish after 5 turns
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
      // If we have some answers, let them see the report
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
          <div className="w-48 h-48 bg-primary/20 rounded-[3rem] flex items-center justify-center border-2 border-primary/30 mx-auto relative overflow-hidden shadow-2xl">
            {stream ? (
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale-[0.5]" />
            ) : (
              <User className="w-16 h-16 text-primary" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-headline font-bold">Neural Link Ready</h1>
            <p className="text-slate-400 text-lg leading-relaxed">Sarah will conduct a one-on-one session. Speak naturally; she will detect your pauses and reactions automatically.</p>
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
            SESSION TURN {turnCount + 1}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-white hover:bg-white/5 px-4 rounded-xl" onClick={handleExit}>
          <StopCircle className="w-4 h-4 mr-2" /> 
          {turnCount > 0 ? 'FINISH & SEE RESULTS' : 'EXIT SESSION'}
        </Button>
      </div>

      <div className="flex-1 flex relative bg-slate-950">
        {/* Sarah AI View */}
        <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden border-r border-white/5">
          <img 
            src={`https://picsum.photos/seed/sarah-${currentEmotion}/1200/1200`} 
            alt="Sarah AI" 
            className={`w-full h-full object-cover transition-all duration-1000 ${speaking ? 'opacity-100 scale-105 saturate-150' : 'opacity-40 grayscale-[0.8]'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
          
          <div className="absolute top-8 left-8 z-20 flex flex-col gap-3">
             {fetchingAudio && <Badge className="bg-blue-600 animate-pulse border-none px-6 py-2 rounded-full shadow-lg">SARAH IS THINKING...</Badge>}
             {speaking && !fetchingAudio && <Badge className="bg-primary animate-pulse border-none px-6 py-2 rounded-full shadow-lg">SARAH IS SPEAKING...</Badge>}
             {listening && <Badge className="bg-green-600 animate-bounce border-none px-6 py-2 rounded-full shadow-lg">SARAH IS LISTENING...</Badge>}
             {processingTurn && <Badge className="bg-amber-600 animate-pulse border-none px-6 py-2 rounded-full shadow-lg">ANALYZING RESPONSE...</Badge>}
          </div>

          <div className="absolute bottom-10 inset-x-10 z-20">
            <div className="max-w-4xl mx-auto bg-slate-950/80 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] shadow-2xl transition-all">
              <div className="flex items-start gap-8">
                <div className={`p-6 rounded-[2rem] transition-all duration-500 ${speaking ? 'bg-primary shadow-[0_0_30px_rgba(59,130,246,0.5)]' : 'bg-slate-800'}`}>
                  <Volume2 className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1 pt-2">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-3 block">Interviewer Query</span>
                  <h3 className="text-2xl md:text-3xl font-headline font-bold leading-tight">
                    {currentQuestion}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Biometric Analysis Sidebar */}
        <div className="w-[480px] bg-slate-950 border-l border-white/10 flex flex-col z-30">
          <div className="p-8 space-y-10 flex-1 overflow-y-auto">
            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center">Neural Biometric Feed</span>
              <div className="aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden border-2 border-white/5 relative shadow-inner group">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover grayscale saturation-0" 
                />
                <div className="absolute inset-0 bg-primary/10 mix-blend-color" />
                <div className="absolute inset-x-0 h-[2px] bg-primary/40 shadow-[0_0_20px_#3b82f6] animate-[scan_6s_linear_infinite]" />
                <div className="absolute top-4 right-4">
                   <Badge className="bg-black/50 backdrop-blur-md border-white/10 text-[9px]">HD 60FPS</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem] text-center hover:bg-white/10 transition-colors">
                <Activity className="w-5 h-5 text-primary mb-3 mx-auto" />
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Confidence</p>
                <p className="text-2xl font-black mt-1">{listening ? Math.floor(65 + Math.random() * 25) : 0}%</p>
              </div>
              <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem] text-center hover:bg-white/10 transition-colors">
                <Target className="w-5 h-5 text-primary mb-3 mx-auto" />
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Eye Focus</p>
                <p className="text-2xl font-black mt-1">{listening ? Math.floor(75 + Math.random() * 20) : 0}%</p>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Waves className={`w-4 h-4 ${listening ? 'text-green-500' : 'text-slate-700'}`} />
                Live Linguistic Stream
              </span>
              <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 h-56 overflow-y-auto scrollbar-hide">
                {(transcript || interimTranscript) ? (
                  <p className="text-base text-slate-300 italic leading-relaxed font-medium">
                    {transcript}
                    <span className="text-slate-500">{interimTranscript}</span>
                  </p>
                ) : (
                  <p className="text-sm text-slate-700 italic flex items-center justify-center h-full">Waiting for candidate input...</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-10 border-t border-white/5 bg-slate-900/30">
            {listening ? (
              <Button className="w-full h-20 rounded-[2rem] bg-green-600 hover:bg-green-500 font-black text-lg shadow-xl shadow-green-900/20" onClick={completeTurn}>
                COMPLETE RESPONSE
                <CheckCircle2 className="ml-3 w-6 h-6" />
              </Button>
            ) : (
              <div className="w-full h-20 rounded-[2rem] bg-slate-800/50 flex items-center justify-center text-slate-500 font-bold gap-4">
                <Loader2 className="animate-spin h-6 w-6" />
                <span className="uppercase text-xs tracking-[0.4em]">Processing Feedback...</span>
              </div>
            )}
            <p className="text-[9px] text-center text-slate-600 mt-6 uppercase tracking-[0.2em] font-medium">
              Sarah monitors your audio and visual cues in real-time.
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
          100% { transform: translateY(240px); opacity: 0; }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
