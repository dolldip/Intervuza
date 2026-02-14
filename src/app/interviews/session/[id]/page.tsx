
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
  AlertCircle
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

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const recognitionRef = useRef<any>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptAccumulatorRef = useRef("")
  
  // Ref for latest state in callbacks
  const stateRef = useRef({ speaking, listening, processingTurn, turnCount, currentQuestion })
  useEffect(() => {
    stateRef.current = { speaking, listening, processingTurn, turnCount, currentQuestion }
  }, [speaking, listening, processingTurn, turnCount, currentQuestion])

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
          title: "Camera/Mic Required",
          description: "Please enable permissions to proceed with the interview."
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

        const currentFull = (transcriptAccumulatorRef.current + interimText).toLowerCase();
        const finishPhrases = ["i'm done", "that's all", "i am done", "that is all", "finish answer", "no idea", "i don't know"];
        const detectedFinish = finishPhrases.some(p => currentFull.includes(p));

        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        
        silenceTimeoutRef.current = setTimeout(() => {
          const combinedText = (transcriptAccumulatorRef.current + interimText).trim();
          if (combinedText.length > 5 || detectedFinish) {
            completeTurn();
          }
        }, detectedFinish ? 1500 : 4000);
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'no-speech' && stateRef.current.listening) {
          try { recognitionRef.current.start(); } catch(e) {}
        }
      };

      recognitionRef.current.onend = () => {
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

  // Ensure videoRef is updated when stream or session state changes
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
        setOpening("Hello, I'm Sarah. I'll be conducting your interview today.")
        setCurrentQuestion("To start off, could you tell me a bit about your professional background?")
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
    const { processingTurn: isProcessing, turnCount: currentTurn, currentQuestion: question } = stateRef.current;
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
        jobRole: sessionStorage.getItem('demo_role') || "Candidate",
        experienceLevel: sessionStorage.getItem('demo_exp') || "Mid-level",
        currentRound: currentTurn < 4 ? 'technical' : 'hr'
      });
      
      setCurrentEmotion(feedback.detectedEmotion);
      const nextTurnCount = currentTurn + 1;
      setTurnCount(nextTurnCount);

      const shouldFinish = feedback.isInterviewComplete && nextTurnCount >= 6;

      if (!shouldFinish && nextTurnCount < 10) {
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
      console.error("Turn processing error", err);
      // Fallback behavior to prevent stopping
      const nextTurnCount = currentTurn + 1;
      setTurnCount(nextTurnCount);
      if (nextTurnCount < 6) {
        const fallbackNext = "I see. Let's move on. Can you describe a challenging project you worked on recently?";
        setCurrentQuestion(fallbackNext);
        setTranscript("");
        setInterimTranscript("");
        transcriptAccumulatorRef.current = "";
        await triggerSpeech(fallbackNext);
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
          <div className="w-40 h-40 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 mx-auto relative overflow-hidden">
            {stream ? (
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-150" />
            ) : (
              <User className="w-16 h-16 text-primary" />
            )}
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-headline font-bold">Ready to Start?</h1>
            <p className="text-slate-400 text-lg">Sarah will speak naturally. Just talk to her when she finishes. The interview will proceed automatically.</p>
          </div>
          <Button className="w-full h-20 rounded-full bg-primary text-xl font-bold shadow-2xl hover:scale-105 transition-transform" onClick={startSession}>
            BEGIN ASSESSMENT
            <Play className="ml-3 w-5 h-5 fill-current" />
          </Button>
          {!hasCameraPermission && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive-foreground">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>Please enable your camera and microphone to begin the interview.</AlertDescription>
            </Alert>
          )}
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
          <Badge variant="outline" className="text-[10px] border-white/10 text-slate-500">
            TURN {turnCount + 1}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-white" onClick={() => router.push("/dashboard")}>
          <StopCircle className="w-4 h-4 mr-2" /> EXIT SESSION
        </Button>
      </div>

      <div className="flex-1 flex relative bg-slate-950">
        {/* Sarah View */}
        <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden border-r border-white/5">
          <img 
            src={`https://picsum.photos/seed/sarah-${currentEmotion}/1200/1200`} 
            alt="Sarah AI" 
            className={`w-full h-full object-cover transition-all duration-1000 ${speaking ? 'opacity-100 scale-105' : 'opacity-60 grayscale-[0.5]'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
          
          <div className="absolute top-8 left-8 z-20 space-y-3">
             {fetchingAudio && <Badge className="bg-blue-600 animate-pulse border-none px-4 py-1">SARAH IS THINKING...</Badge>}
             {speaking && !fetchingAudio && <Badge className="bg-primary animate-pulse border-none px-4 py-1">SARAH IS SPEAKING...</Badge>}
             {listening && <Badge className="bg-green-600 animate-bounce border-none px-4 py-1">SARAH IS LISTENING...</Badge>}
             {processingTurn && <Badge className="bg-amber-600 animate-pulse border-none px-4 py-1">ANALYZING RESPONSE...</Badge>}
          </div>

          <div className="absolute bottom-8 inset-x-8 z-20">
            <div className="max-w-4xl mx-auto bg-slate-950/90 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
              <div className="flex items-start gap-6">
                <div className={`p-5 rounded-2xl transition-colors ${speaking ? 'bg-primary' : 'bg-slate-800'}`}>
                  <Volume2 className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 pt-1">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 block">Sarah's Question</span>
                  <h3 className="text-xl md:text-2xl font-headline font-bold leading-relaxed">
                    {currentQuestion}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User View & Stats */}
        <div className="w-[420px] bg-slate-950 border-l border-white/10 flex flex-col z-30">
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Live Feed</span>
              <div className="aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-white/10 relative">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover grayscale-[0.4]" 
                />
                <div className="absolute inset-x-0 h-[1px] bg-primary/40 shadow-[0_0_15px_#3b82f6] animate-[scan_5s_linear_infinite]" />
                {!hasCameraPermission && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-center p-4">
                     <p className="text-xs text-slate-400">Camera access is required to see your feed.</p>
                   </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                <Activity className="w-4 h-4 text-primary mb-2" />
                <p className="text-[9px] text-slate-500 font-black uppercase">Confidence</p>
                <p className="text-xl font-black">{listening ? Math.floor(60 + Math.random() * 30) : 0}%</p>
              </div>
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                <Target className="w-4 h-4 text-primary mb-2" />
                <p className="text-[9px] text-slate-500 font-black uppercase">Eye Focus</p>
                <p className="text-xl font-black">{listening ? Math.floor(70 + Math.random() * 25) : 0}%</p>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Waves className={`w-3 h-3 ${listening ? 'text-green-500' : 'text-slate-700'}`} />
                Live Transcript
              </span>
              <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 h-48 overflow-y-auto">
                {(transcript || interimTranscript) ? (
                  <p className="text-sm text-slate-300 italic leading-relaxed">
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
              <Button className="w-full h-16 rounded-2xl bg-green-600 hover:bg-green-500 font-bold shadow-lg" onClick={completeTurn}>
                FINISH ANSWER
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            ) : (
              <div className="w-full h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-500 font-bold gap-3">
                <Loader2 className="animate-spin h-5 w-5" />
                <span className="uppercase text-xs tracking-widest">Sarah is thinking...</span>
              </div>
            )}
            <p className="text-[10px] text-center text-slate-600 mt-4 uppercase tracking-tighter">
              Hands-free mode active. Interview proceeds automatically.
            </p>
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
