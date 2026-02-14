
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Trophy, 
  TrendingUp, 
  Calendar, 
  Video, 
  ArrowRight,
  Flame,
  Star,
  CheckCircle2,
  UserPen,
  Loader2,
  Target,
  BrainCircuit,
  Zap
} from "lucide-react"
import Link from "next/link"
import { useAuth, useFirestore, useDoc, useUser } from "@/firebase"
import { doc } from "firebase/firestore"
import { MOCK_INTERVIEW_HISTORY } from "@/lib/mock-data"

export default function DashboardPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const userDocRef = user ? doc(db!, "users", user.uid) : null
  const { data: profile, isLoading: profileLoading } = useDoc(userDocRef)

  if (isUserLoading) {
    return (
      <div className="flex h-full items-center justify-center p-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold tracking-tight">
            Welcome back, {profile?.fullName?.split(' ')[0] || user?.displayName?.split(' ')[0] || "Candidate"}
          </h1>
          <p className="text-muted-foreground text-lg">Ready to sharpen your interview skills with Sarah today?</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild className="hidden sm:flex h-11 rounded-xl px-6 font-bold">
            <Link href="/profile">
              <UserPen className="mr-2 w-4 h-4" />
              Edit Profile
            </Link>
          </Button>
          <Button asChild className="h-11 rounded-xl px-6 font-bold shadow-lg shadow-primary/20">
            <Link href="/interviews/new">
              <Video className="mr-2 w-4 h-4" />
              New Mock Interview
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Daily Streak", value: `5 Days`, icon: Flame, color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Average Score", value: `84%`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Interviews Done", value: 12, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
          { label: "Total Badges", value: 3, icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                <h3 className="text-3xl font-black mt-1">{stat.value}</h3>
              </div>
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner`}>
                <stat.icon className="w-7 h-7" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-sm rounded-[2.5rem] overflow-hidden border-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/20 p-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="font-headline text-2xl">Target: {profile?.targetRole || "Set your role"}</CardTitle>
                  <CardDescription className="text-base">Experience Level: <span className="capitalize font-bold text-primary">{profile?.experienceLevel || "Not set"}</span></CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80 font-bold">
                <Link href="/profile">Update</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-8">
              <div className="p-6 rounded-[2rem] bg-slate-50 border border-dashed border-primary/10">
                <div className="flex items-start gap-4">
                  <BrainCircuit className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div className="space-y-2">
                    <p className="font-bold text-sm">Background Analysis</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {profile?.education ? `Your education at ${profile.education} provides a strong foundation. Sarah will focus on technical concepts and architectural patterns during your next Engineering session.` : "Please update your profile education and target role. This helps Sarah generate more challenging, role-specific questions for your sessions."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm rounded-[2.5rem] border-none bg-white overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="font-headline text-2xl flex items-center gap-3">
                <History className="w-6 h-6 text-primary" />
                Recent Sessions
              </CardTitle>
              <CardDescription>Track your performance and read Sarah's critical feedback.</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
              {MOCK_INTERVIEW_HISTORY.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[2rem] border hover:bg-muted/10 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-[1.5rem] flex flex-col items-center justify-center font-black text-xl shadow-inner ${item.score >= 80 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {item.score}
                      <span className="text-[8px] uppercase tracking-widest opacity-60">Score</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{item.role}</h4>
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> {item.date}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-xl px-6 font-bold group-hover:bg-primary group-hover:text-white transition-colors" asChild>
                    <Link href={`/results/${item.id}`}>Audit Report</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          <Card className="shadow-sm bg-slate-950 text-white border-none rounded-[2.5rem] overflow-hidden relative group">
            <CardHeader className="p-8">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Live Coaching</span>
              </div>
              <CardTitle className="font-headline text-2xl">Sarah's Daily Tip</CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              <p className="text-base text-slate-300 leading-relaxed italic">
                "We noticed you often use fillers like 'um' when discussing technical architecture. Try pausing for two seconds before answering to structure your thoughts."
              </p>
              <Button className="w-full h-14 rounded-2xl font-black bg-primary text-lg shadow-lg shadow-primary/30 hover:scale-105 transition-transform" asChild>
                <Link href="/interviews/new">Practice Now</Link>
              </Button>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          </Card>

          <Card className="shadow-sm rounded-[2.5rem] border-none bg-white p-8">
            <CardHeader className="p-0 mb-8">
              <CardTitle className="font-headline text-xl">Preparation Goals</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-8">
              {[
                { label: "Mock Interviews", progress: 100, count: "1/1" },
                { label: "Technical Drills", progress: 45, count: "3/7" },
                { label: "Voice Tone Clarity", progress: 10, count: "1/10" },
              ].map((goal, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-600">{goal.label}</span>
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest">{goal.count}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000" 
                      style={{ width: `${goal.progress}%` }} 
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
