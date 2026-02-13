"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Mic, 
  Video, 
  MicOff, 
  VideoOff, 
  Send, 
  StopCircle,
  Clock,
  MessageSquare,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  BrainCircuit
} from "lucide-react"
import { generateInterviewQuestions } from "@/ai/flows/dynamic-interview-question-generation"
import { instantTextualAnswerFeedback } from "@/ai/flows/instant-textual-answer-feedback"

export default function InterviewSessionPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<string[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(120) // 2 minutes per question
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    async function init() {
      try {
        const result = await generateInterviewQuestions({
          jobRole: "Senior Product Manager",
          experienceLevel: "Senior",
          skills: ["Strategy", "Analytics"]
        })
        setQuestions(result.questions)
        setLoading(false)
        
        // Setup camera preview
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (timeLeft > 0 && !loading) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, loading])

  const handleNext = async () => {
    // Generate feedback for current answer
    await instantTextualAnswerFeedback({
      interviewQuestion: questions[currentIdx],
      userAnswer: answer || "I would focus on users first and then look at data."
    })

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1)
      setAnswer("")
      setTimeLeft(120)
    } else {
      router.push("/results/new-report-id")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <BrainCircuit className="w-16 h-16 text-primary animate-pulse mb-4" />
        <h2 className="text-2xl font-headline font-bold">Setting Up Your Session</h2>
        <p className="text-muted-foreground mt-2">AI is generating your tailored questions...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-900 overflow-hidden">
      {/* Sidebar - Controls & Status */}
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
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">Live AI Analysis</div>
          <div className="space-y-2">
            {[
              { label: "Confidence", score: 82, color: "bg-green-500" },
              { label: "Eye Contact", score: 95, color: "bg-green-500" },
              { label: "Fillers Detected", score: 12, color: "bg-yellow-500" },
              { label: "Clarity", score: 78, color: "bg-blue-500" },
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
          <p className="text-[10px] text-center text-slate-500">
            Session is being recorded for feedback analysis.
          </p>
        </div>
      </div>

      {/* Main Content - Video & Question */}
      <div className="flex-1 flex flex-col relative">
        {/* Video Preview */}
        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            className="w-full h-full object-cover opacity-80"
          />
          
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
                      <Badge className="mb-2 bg-primary/20 text-primary border-primary/20 uppercase text-[10px]">Current Question</Badge>
                      <h3 className="text-xl font-bold text-white leading-relaxed">
                        {questions[currentIdx]}
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* AI Detection Visualizer Overlay */}
          <div className="absolute top-6 right-6 space-y-2 pointer-events-none">
            <div className="px-3 py-1 bg-green-500/20 backdrop-blur-md border border-green-500/50 rounded-full flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Face Detected</span>
            </div>
            <div className="px-3 py-1 bg-blue-500/20 backdrop-blur-md border border-blue-500/50 rounded-full flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Audio Processing</span>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="h-24 bg-slate-800 border-t border-slate-700 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full bg-slate-700 text-white hover:bg-slate-600">
              <Mic className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full bg-slate-700 text-white hover:bg-slate-600">
              <Video className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 max-w-xl px-12">
            <div className="relative">
              <Input 
                placeholder="Transcribing your answer..." 
                className="bg-slate-900 border-slate-700 text-white h-12 pr-12"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-700">Live</Badge>
              </div>
            </div>
          </div>

          <Button 
            size="lg" 
            className="h-12 px-8 font-bold group shadow-lg shadow-primary/20"
            onClick={handleNext}
          >
            Submit Answer
            <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  )
}