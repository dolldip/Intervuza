
"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  Calendar, 
  Video, 
  Flame,
  CheckCircle2,
  UserPen,
  Loader2,
  Target,
  BrainCircuit,
  Zap,
  History,
  AlertCircle,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { useFirestore, useDoc, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { doc, collection, query, orderBy, limit } from "firebase/firestore"

export default function DashboardPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  
  const userDocRef = useMemoFirebase(() => user ? doc(db!, "users", user.uid) : null, [db, user])
  const { data: profile } = useDoc(userDocRef)

  const sessionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "interviewSessions"),
      orderBy("createdAt", "desc"),
      limit(5)
    )
  }, [db, user])
  const { data: sessions, isLoading: sessionsLoading } = useCollection(sessionsQuery)

  const streaksQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "userStreaks")
  }, [db, user])
  const { data: streaks } = useCollection(streaksQuery)

  const stats = useMemo(() => {
    const total = sessions?.length || 0
    const completed = sessions?.filter(s => s.status === "completed") || []
    const avgScore = completed.length > 0 
      ? Math.round(completed.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / completed.length) 
      : 0
    const currentStreak = streaks?.[0]?.currentStreak || 0

    return {
      total,
      completed: completed.length,
      avgScore,
      currentStreak
    }
  }, [sessions, streaks])

  if (isUserLoading) {
    return (
      <div className="flex h-full items-center justify-center p-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-8 lg:p-12 space-y-12 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Intelligence Portal</span>
          </div>
          <h1 className="text-5xl font-headline font-black tracking-tight leading-tight">
            Welcome back, <br /> <span className="text-primary">{profile?.fullName?.split(' ')[0] || user?.displayName?.split(' ')[0] || "Candidate"}</span>
          </h1>
          <p className="text-slate-400 text-xl mt-2 font-medium">Ready for your professional audit today?</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild className="hidden sm:flex h-14 rounded-2xl px-8 glass font-bold">
            <Link href="/profile">
              <UserPen className="mr-2 w-5 h-5" />
              AI Profile
            </Link>
          </Button>
          <Button asChild className="h-14 rounded-2xl px-8 font-black shadow-2xl shadow-primary/40 transition-all hover:scale-105">
            <Link href="/interviews/new">
              <Video className="mr-2 w-5 h-5" />
              NEW ASSESSMENT
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: "Daily Streak", value: `${stats.currentStreak} Days`, icon: Flame, color: "text-orange-400", bg: "bg-orange-500/10" },
          { label: "Audit Score", value: `${stats.avgScore}%`, icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
          { label: "Total Turns", value: stats.total, icon: BrainCircuit, color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map((stat, i) => (
          <Card key={i} className="glass-card overflow-hidden group hover:border-primary/40 transition-all duration-500">
            <CardContent className="p-8 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">{stat.label}</p>
                <h3 className="text-4xl font-black">{stat.value}</h3>
              </div>
              <div className={`w-16 h-16 rounded-[1.5rem] ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-8 h-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <Card className="glass-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-10 bg-white/5">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                  <Target className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="font-headline text-3xl font-black">Target: {profile?.targetRole || "Set Target Role"}</CardTitle>
                  <CardDescription className="text-lg font-medium">Level: <span className="capitalize text-primary font-bold">{profile?.experienceLevel || "Not set"}</span></CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80 font-black uppercase tracking-widest text-xs">
                <Link href="/profile">Edit Context</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-10">
              <div className="p-8 rounded-[2rem] glass bg-primary/5 border border-primary/10">
                <div className="flex items-start gap-6">
                  <BrainCircuit className="w-8 h-8 text-primary shrink-0 mt-1" />
                  <div className="space-y-3">
                    <p className="font-black text-xs uppercase tracking-[0.2em] text-primary">Aria's Strategic Insight</p>
                    <p className="text-lg leading-relaxed text-slate-300 font-medium italic">
                      {profile?.education ? `Your background from ${profile.education} is being used to calibrate the technical depth of your next session.` : "Update your education details so Aria can tailor the complexity of her questioning."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-white/5">
              <div className="flex items-center justify-between">
                <CardTitle className="font-headline text-3xl font-black flex items-center gap-4">
                  <History className="w-8 h-8 text-primary" />
                  Recent Audits
                </CardTitle>
                <Link href="/dashboard" className="text-xs font-black uppercase tracking-widest text-primary hover:underline">View Full History</Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {sessionsLoading ? (
                <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
              ) : sessions?.length ? (
                <div className="divide-y divide-white/5">
                  {sessions.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-8 hover:bg-white/5 transition-all group">
                      <div className="flex items-center gap-8">
                        <div className={`w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center font-black text-2xl shadow-inner border border-white/10 ${item.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-primary/10 text-primary'}`}>
                          {item.status === 'completed' ? (item.overallScore || "--") : <AlertCircle className="w-8 h-8" />}
                          <span className="text-[9px] uppercase tracking-widest opacity-60 mt-1">{item.status === 'completed' ? 'Score' : 'Active'}</span>
                        </div>
                        <div>
                          <h4 className="font-black text-2xl tracking-tight">{item.jobRole}</h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(item.createdAt).toLocaleDateString()}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                            <span className={item.status === 'completed' ? 'text-green-500/80' : 'text-primary animate-pulse'}>{item.status}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" className="rounded-2xl h-14 px-8 font-black glass hover:bg-primary hover:text-white hover:border-transparent transition-all" asChild>
                        <Link href={item.status === 'completed' ? `/results/${item.id}` : `/interviews/session/${item.id}`}>
                          {item.status === 'completed' ? 'VIEW FEEDBACK' : 'RESUME TURN'}
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 space-y-6">
                  <History className="w-20 h-20 text-slate-800 mx-auto" />
                  <p className="text-slate-500 text-lg font-medium">No previous sessions found. Start your journey with Aria.</p>
                  <Button asChild className="rounded-2xl h-16 px-12 font-black shadow-2xl transition-all hover:scale-105"><Link href="/interviews/new">START NOW</Link></Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-10">
          <Card className="glass bg-slate-900 border-none rounded-[3rem] overflow-hidden relative group">
            <CardHeader className="p-10 pb-4">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Aria Strategy</span>
              </div>
              <CardTitle className="font-headline text-4xl font-black leading-tight">Elite <br /> Preparation</CardTitle>
            </CardHeader>
            <CardContent className="p-10 pt-0 space-y-10">
              <p className="text-xl text-slate-400 leading-relaxed italic font-medium">
                "Technical logic alone isn't enough. Your focus and structural clarity are being monitored by my neural sensors. Practice using the STAR method for every behavioral answer."
              </p>
              <div className="space-y-4">
                <Button className="w-full h-18 rounded-[1.5rem] font-black bg-primary text-xl shadow-2xl transition-all hover:scale-[1.03]" asChild>
                  <Link href="/interviews/new">NEW SESSION</Link>
                </Button>
                <p className="text-[10px] text-center text-slate-600 font-black uppercase tracking-widest">Aria is ready when you are.</p>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          </Card>
        </div>
      </div>
    </div>
  )
}
