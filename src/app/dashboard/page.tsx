
"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Trophy, 
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
  AlertCircle
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
      limit(10)
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
    <div className="p-6 lg:p-10 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold tracking-tight">
            Welcome back, {profile?.fullName?.split(' ')[0] || user?.displayName?.split(' ')[0] || "Candidate"}
          </h1>
          <p className="text-muted-foreground text-lg">Ready for a critical high-stakes session today?</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild className="hidden sm:flex h-11 rounded-xl px-6 font-bold">
            <Link href="/profile">
              <UserPen className="mr-2 w-4 h-4" />
              AI Profile
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Daily Streak", value: `${stats.currentStreak} Days`, icon: Flame, color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Average Score", value: `${stats.avgScore}%`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Interviews Done", value: stats.completed, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
          { label: "History Count", value: stats.total, icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-50" },
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
                    <p className="font-bold text-sm">Sarah's Analysis</p>
                    <p className="text-sm leading-relaxed text-muted-foreground italic">
                      {profile?.education ? `Your background at ${profile.education} helps Sarah calibrate your technical depth.` : "Update your profile education to help Sarah calibrate her logic."}
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
                Session History
              </CardTitle>
              <CardDescription>Track your growth and review Sarah's critical audits.</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
              {sessionsLoading ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>
              ) : sessions?.length ? (
                sessions.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[2rem] border hover:bg-muted/10 transition-all group">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-[1.5rem] flex flex-col items-center justify-center font-black text-xl shadow-inner ${item.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {item.status === 'completed' ? (item.overallScore || "--") : <AlertCircle className="w-6 h-6" />}
                        <span className="text-[8px] uppercase tracking-widest opacity-60">{item.status === 'completed' ? 'Score' : 'Active'}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{item.jobRole}</h4>
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-2 capitalize">
                          <Calendar className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString()} • <span className={item.status === 'completed' ? 'text-green-600 font-bold' : 'text-blue-600 font-bold animate-pulse'}>{item.status}</span>
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" className="rounded-xl px-6 font-bold group-hover:bg-primary group-hover:text-white transition-colors" asChild>
                      <Link href={item.status === 'completed' ? `/results/${item.id}` : `/interviews/session/${item.id}`}>
                        {item.status === 'completed' ? 'View Audit' : 'Resume Session'}
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 space-y-4">
                  <p className="text-muted-foreground">No sessions found. Start your first assessment with Sarah.</p>
                  <Button asChild className="rounded-xl shadow-lg"><Link href="/interviews/new">Start Now</Link></Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="shadow-sm bg-slate-950 text-white border-none rounded-[2.5rem] overflow-hidden relative group">
            <CardHeader className="p-8">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">AI Strategy</span>
              </div>
              <CardTitle className="font-headline text-2xl">Sarah's Insight</CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              <p className="text-base text-slate-300 leading-relaxed italic">
                "Technical roles often fail not on logic, but on communication structure. Practice using the STAR method even for architectural questions."
              </p>
              <Button className="w-full h-14 rounded-2xl font-black bg-primary text-lg shadow-lg shadow-primary/30 hover:scale-105 transition-transform" asChild>
                <Link href="/interviews/new">Practice Now</Link>
              </Button>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          </Card>
        </div>
      </div>
    </div>
  )
}
