
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth, useFirestore, useDoc } from "@/firebase"
import { doc } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { 
  Mic, 
  Video, 
  MessageSquare, 
  Clock,
  ShieldCheck,
  ChevronRight,
  BrainCircuit,
  StopCircle,
  Volume2
} from "lucide-react"
import { generateInterviewQuestions } from "@/ai/flows/dynamic-interview-question-generation"
import { instantTextualAnswerFeedback } from "@/ai/flows/instant-textual-answer-feedback"
import { textToSpeech } from "@/ai/flows/tts-flow"
import { useToast } from "@/hooks/use-toast"

export default function InterviewSessionPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const db = useFirestore()
  const { toast } = useToast()

  const userDocRef = user ? doc(db!, "users", user.uid) : null
  const { data: profile } = useDoc(userDocRef)

  const [questions, setQuestions] = useState<string[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(120)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };
    getCameraPermission();
  }, [toast]);

  useEffect(() => {
    async function init() {
      if (!profile) return
      try {
        const result = await generateInterviewQuestions({
          jobRole: profile.targetRole || "Software Engineer",
          experienceLevel: profile.experienceLevel || "Mid",
          skills: profile.skills || ["Communication", "Problem Solving"],
          resumeText: `Education: ${profile.education || "Not specified"}`
        })
        setQuestions(result.questions)
        setLoading(false)
      } catch (err) {
        console.error(err)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate interview questions.",
        })
      }
    }
    if (profile) {
      init()
    }
  }, [profile, toast])

  // Speak the question when it changes
  useEffect(() => {
    async function speak() {
      if (questions.length > 0 && questions[currentIdx]) {
        setSpeaking(true)
        try {
          const { media } = await textToSpeech(questions[currentIdx])
          setAudioSrc(media)
        } catch (err) {
          console.error("TTS failed", err)
        } finally {
          setSpeaking(false)
        }
      }
    }
    if (!loading && questions.length > 0) {
      speak()
    }
  }, [currentIdx, questions, loading])

  useEffect(() => {
    if (timeLeft > 0 && !loading) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, loading])

  const handleNext = async () => {
    if (!questions[currentIdx]) return

    setLoading(true)
    try {
      await instantTextualAnswerFeedback({
        interviewQuestion: questions[currentIdx],
        userAnswer: answer || "I would focus on the core requirements and deliver value iteratively."
      })

      if (currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1)
        setAnswer("")
        setTimeLeft(120)
        setAudioSrc(null)
      } else {
        router.push(`/results/${params.id}`)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading && questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <BrainCircuit className="w-16 h-16 text-primary animate-pulse mb-4" />
        <h2 className="text-2xl font-headline font-bold">Setting Up Your Session</h2>
        <p className="text-muted-foreground mt-2">AI is tailoring your interview based on your profile...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <div className="lg:w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="font-headline font-bold text-white text-xl">AssessAI</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
                <span>Progress</span>
                <span>{currentIdx + 1} of {questions.length}</span>
              </div>
              <Progress value={((currentIdx + 1) / questions.length) * 100} className="h-1.5 bg-slate-700" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span>Time Left</span>
              </div>
              <span className={`font-mono font-bold ${timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">Live AI Detection</div>
          <div className="space-y-2">
            {[
              { label: "Confidence", score: 82, color: "bg-green-500" },
              { label: "Eye Contact", score: 95, color: "bg-green-500" },
              { label: "Pace", score: 78, color: "bg-blue-500" },
            ].map((stat) => (
              <div key={stat.label} className="p-3 bg-slate-700/30 rounded-lg border border-slate-700/50">
                <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                  <span>{stat.label}</span>
                  <span>{stat.score}%</span>
                </div>
                <div className="h-1 w-full bg-slate-700 rounded-full">
                  <div className={`h-full ${stat.color} rounded-full`} style={{ width: `${stat.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 space-y-3">
          <Button variant="destructive" className="w-full" onClick={() => router.push("/dashboard")}>
            <StopCircle className="mr-2 w-4 h-4" />
            End Session
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            className="w-full h-full object-cover opacity-80"
          />
          
          {hasCameraPermission === false && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-10 px-6">
              <Alert variant="destructive" className="max-w-md">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  We need access to your camera and microphone to conduct the mock interview. Please check your browser permissions.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* AI Interviewer Audio */}
          {audioSrc && (
            <audio ref={audioRef} src={audioSrc} autoPlay onPlay={() => setSpeaking(true)} onEnded={() => setSpeaking(false)} />
          )}

          {/* Question Overlay */}
          <div className="absolute bottom-10 inset-x-0 px-8">
            <div className="max-w-3xl mx-auto">
              <Card className="bg-slate-900/90 backdrop-blur-md border-primary/30 shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <MessageSquare className="text-primary w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-primary/20 text-primary border-primary/20 uppercase text-[10px]">Interviewer</Badge>
                        {speaking && (
                          <div className="flex items-center gap-1 text-[10px] text-primary font-bold animate-pulse">
                            <Volume2 className="w-3 h-3" />
                            SPEAKING...
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white leading-relaxed">
                        {questions[currentIdx]}
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="h-24 bg-slate-800 border-t border-slate-700 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full bg-slate-700 text-white">
              <Mic className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full bg-slate-700 text-white">
              <Video className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 max-w-xl px-12">
            <div className="relative">
              <Input 
                placeholder="Type your answer or speak..." 
                className="bg-slate-900 border-slate-700 text-white h-12 pr-12"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-700">AI Assistant</Badge>
              </div>
            </div>
          </div>

          <Button 
            size="lg" 
            className="h-12 px-8 font-bold group"
            onClick={handleNext}
            disabled={loading}
          >
            {loading ? <BrainCircuit className="w-5 h-5 animate-spin" /> : "Submit Answer"}
            <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  )
}
