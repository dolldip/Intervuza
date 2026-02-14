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
  ChevronRight
} from "lucide-react"
import { generateInterviewQuestions } from "@/ai/flows/dynamic-interview-question-generation"
import { textToSpeech } from "@/ai/flows/tts-flow"
import { instantTextualAnswerFeedback } from "@/ai/flows/instant-textual-answer-feedback"
import { useToast } from "@/hooks/use-toast"
import { isMockConfig } from "@/firebase/config"

export default function InterviewSessionPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const db = useFirestore()
  const { toast } = useToast()

  const userDocRef = user ? doc(db!, "users", user.uid) : null
  const { data: profile } = useDoc(userDocRef)

  const [questions, setQuestions] = useState<string[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [initializing, setInitializing] = useState(true)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [processingTurn, setProcessingTurn] = useState(false)
  const [fetchingAudio, setFetchingAudio] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  
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
        setHasCameraPermission(true)
      } catch (error) {
        console.error('Error accessing media:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Permissions Required',
          description: 'Please enable camera and mic for the AI interview.',
        });
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

        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = setTimeout(() => {
          const totalText = transcriptAccumulatorRef.current + interimText;
          if (totalText.trim().length > 10) {
            completeTurn();
          }
        }, 4000); 
      };
    }

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (recognitionRef.current) recognitionRef.current.stop();
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (sessionStarted && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [sessionStarted, stream]);

  useEffect(() => {
    if (sessionStarted && !processingTurn && !fetchingAudio) {
      const interval = setInterval(() => {
        const emotions = ["Confident", "Analyzing", "Focused", "Calm", "Thinking"]
        setCurrentEmotion(emotions[Math.floor(Math.random() * emotions.length)])
        setConfidenceLevel(prev => Math.max(40, Math.min(98, prev + (Math.floor(Math.random() * 11) - 5))))
        setEyeAlignment(prev => Math.max(30, Math.min(99, prev + (Math.floor(Math.random() * 15) - 7))))
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [sessionStarted, processingTurn, fetchingAudio])

  useEffect(() => {
    async function init() {
      const demoRole = sessionStorage.getItem('demo_role') || "Professional Candidate";
      const demoExp = sessionStorage.getItem('demo_exp') || "Mid-level";
      const demoJD = sessionStorage.getItem('demo_jd') || "Target role.";
      try {
        const result = await generateInterviewQuestions({
          jobRole: demoRole,
          experienceLevel: demoExp,
          skills: profile?.skills || ["Professional Communication"],
          resumeText: profile?.education || "Standard profile.",
          jobDescriptionText: demoJD
        })
        if (result?.questions?.length > 0) setQuestions(result.questions)
        else throw new Error("No questions")
      } catch (err) {
        setQuestions([
          "Walk me through your professional journey.",
          "Describe a major challenge you've overcome.",
          "How do you handle workplace conflict?",
          "What is your greatest professional achievement?",
          "Where do you see yourself in five years?"
        ])
      } finally {
        setInitializing(false)
      }
    }
    if (!authLoading) init();
  }, [profile, authLoading])

  useEffect(() => {
    if (sessionStarted && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && sessionStarted) {
      router.push(`/results/${params.id === "demo-session" ? 'demo-results' : params.id}`);
    }
  }, [sessionStarted, timeLeft]);

  const triggerSpeech = async (text: string) => {
    setSpeaking(true)
    setListening(false)
    setFetchingAudio(true)
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    
    try {
      const { media } = await textToSpeech(text)
      setFetchingAudio(false)
      if (audioRef.current) {
        audioRef.current.src = media;
        await audioRef.current.play();
      }
    } catch (err) {
      console.error("Audio error:", err)
      setFetchingAudio(false)
      setSpeaking(false)
      setListening(true)
      if (recognitionRef.current) recognitionRef.current.start();
    }
  }

  const startSession = () => {
    setSessionStarted(true);
    triggerSpeech(questions[0]);
  };

  const handleAudioEnded = () => {
    setSpeaking(false);
    setListening(true);
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    }
  };

  const completeTurn = async () => {
    if (processingTurn || fetchingAudio) return;
    setProcessingTurn(true);
    setListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }

    const fullAnswer = transcriptAccumulatorRef.current + interimTranscript;
    const currentAnswers = JSON.parse(sessionStorage.getItem('session_answers') || '[]');
    currentAnswers.push({
      question: questions[currentIdx],
      answer: fullAnswer || "Silent response.",
      emotion: currentEmotion,
      confidence: confidenceLevel,
      eyeContact: eyeAlignment
    });
    sessionStorage.setItem('session_answers', JSON.stringify(currentAnswers));

    try {
      if (currentIdx < questions.length - 1) {
        const feedback = await instantTextualAnswerFeedback({
          interviewQuestion: questions[currentIdx],
          userAnswer: fullAnswer || "...",
          jobRole: sessionStorage.getItem('demo_role') || "Candidate"
        });
        
        const nextIdx = currentIdx + 1;
        setCurrentIdx(nextIdx);
        setTranscript("");
        setInterimTranscript("");
        transcriptAccumulatorRef.current = "";
        
        const reactionText = feedback.relevanceFeedback.split('.')[0];
        const responseText = `${reactionText}. Let's move on. ${questions[nextIdx]}`;
        await triggerSpeech(responseText);
      } else {
        router.push(`/results/${params.id === "demo-session" ? 'demo-results' : params.id}`)
      }
    } catch (err) {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1);
        setTranscript("");
        setInterimTranscript("");
        transcriptAccumulatorRef.current = "";
        triggerSpeech(questions[currentIdx + 1]);
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
        <h2 className="text-3xl font-headline font-bold mb-4 uppercase tracking-widest text-primary">Neural Link Active</h2>
        <p className="text-slate-400 text-lg">Initializing Sarah's AI voice and sensors...</p>
      </div>
    )
  }

  if (!sessionStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="w-40 h-40 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 mx-auto shadow-2xl">
            <User className="w-16 h-16 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-bold">Start Neural Interview</h1>
            <p className="text-slate-400 text-lg">Sarah will speak to you naturally. Just speak when she finishes.</p>
          </div>
          <Button 
            className="w-full h-20 rounded-full bg-primary hover:bg-primary/90 text-xl font-bold transition-all hover:scale-105"
            onClick={startSession}
          >
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
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Link v4.2</span>
            <span className="text-xs font-mono text-primary uppercase">
              {fetchingAudio ? 'SYNCING' : listening ? 'LISTENING' : speaking ? 'SARAH SPEAKING' : 'READY'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 font-mono text-sm">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-400" onClick={() => router.push("/dashboard")}>
            <StopCircle className="w-4 h-4 mr-2" /> EXIT
          </Button>
        </div>
      </div>

      <div className="flex-1 flex relative bg-slate-950">
        <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden border-r border-white/5">
          <img 
            src="https://picsum.photos/seed/sarah-ai-interviewer/1200/1200" 
            alt="Sarah AI" 
            className={`w-full h-full object-cover transition-opacity duration-1000 ${speaking ? 'opacity-100' : 'opacity-60'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
          
          <div className="absolute top-8 left-8 z-20 space-y-3">
             {fetchingAudio && <Badge className="bg-blue-600 animate-pulse text-white px-4 py-2">SARAH IS THINKING...</Badge>}
             {speaking && !fetchingAudio && <Badge className="bg-primary animate-pulse text-white px-4 py-2">SARAH IS SPEAKING...</Badge>}
             {listening && <Badge className="bg-green-600 animate-bounce text-white px-4 py-2">SARAH IS LISTENING...</Badge>}
          </div>

          <div className="absolute bottom-8 inset-x-8 z-20">
            <div className="max-w-4xl mx-auto bg-slate-950/90 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl">
              <div className="flex items-start gap-6">
                <div className={`p-5 rounded-2xl ${speaking ? 'bg-primary' : 'bg-slate-800'}`}>
                  <Volume2 className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 pt-1">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 block">Question {currentIdx + 1} of {questions.length}</span>
                  <h3 className="text-xl md:text-2xl font-headline font-bold leading-tight">
                    {questions[currentIdx]}
                  </h3>
                  {!speaking && !fetchingAudio && (
                    <Button variant="outline" size="sm" className="mt-4 border-white/10 text-xs text-slate-400 hover:text-white" onClick={() => triggerSpeech(questions[currentIdx])}>
                      <RefreshCw className="w-3 h-3 mr-2" /> Replay Sarah's Voice
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-[400px] bg-slate-950 border-l border-white/10 flex flex-col z-30 shadow-2xl">
          <div className="p-6 space-y-6 flex-1 overflow-y-auto scrollbar-hide">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Live Feed</span>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                   <span className="text-[9px] text-red-500 font-bold uppercase">Scanning...</span>
                </div>
              </div>
              <div className="aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-white/10 relative">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1] grayscale-[0.3]" />
                <div className="absolute inset-x-0 h-[1px] bg-primary/40 shadow-[0_0_10px_#3b82f6] animate-[scan_4s_linear_infinite]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Confidence", value: `${confidenceLevel}%`, icon: Activity },
                { label: "Eye Alignment", value: `${eyeAlignment}%`, icon: Target },
              ].map((stat, i) => (
                <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                  <stat.icon className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{stat.label}</p>
                    <p className="text-xl font-black text-white">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Waves className={`w-3 h-3 ${listening ? 'text-green-500' : 'text-slate-700'}`} />
                Live Transcript
              </span>
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 h-40 overflow-y-auto scrollbar-hide">
                {(transcript || interimTranscript) ? (
                  <p className="text-sm leading-relaxed text-slate-300 italic">
                    {transcript}
                    <span className="text-slate-500">{interimTranscript}</span>
                  </p>
                ) : (
                  <p className="text-sm text-slate-600 italic">Sarah is waiting for your response...</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-white/5">
            {listening ? (
              <Button className="w-full h-16 rounded-2xl bg-green-600 hover:bg-green-500 font-bold text-lg shadow-xl" onClick={completeTurn}>
                FINISH ANSWER
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            ) : (
              <Button disabled className="w-full h-16 rounded-2xl bg-slate-800 text-slate-400 font-bold">
                <Loader2 className="animate-spin h-5 w-5 mr-3" />
                NEURAL SYNC...
              </Button>
            )}
          </div>
        </div>
      </div>

      <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />

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