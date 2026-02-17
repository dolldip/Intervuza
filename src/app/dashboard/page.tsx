
"use client"

import { useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  Calendar, 
  Video, 
  Flame,
  CheckCircle2,
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
import { doc, collection, query, orderBy, limit, setDoc, updateDoc } from "firebase/firestore"
import { cn } from "@/lib/utils"

function AnimatedText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={cn("inline-flex flex-nowrap overflow-hidden", className)}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="inline-block animate-letter-reveal opacity-0"
          style={{ animationDelay: `${delay + i * 25}ms` }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

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

  useEffect(() => {
    if (!user || !db || !streaks) return;

    const syncStreak = async () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const yesterdayDate = new Date(now);
      yesterdayDate.setDate(now.getDate() - 1);
      const yesterday = yesterdayDate.toISOString().split('T')[0];

      const streakId = "dailyPractice";
      const streakRef = doc(db, "users", user.uid, "userStreaks", streakId);
      const currentStreakDoc = streaks.find(s => s.id === streakId);

      if (!currentStreakDoc) {
        await setDoc(streakRef, {
          id: streakId,
          userId: user.uid,
          streakType: 'dailyPractice',
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: today,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        return;
      }

      const { lastActiveDate, currentStreak, longestStreak } = currentStreakDoc;
      if (lastActiveDate === today) return;

      let newStreak = 1;
      if (lastActiveDate === yesterday) {
        newStreak = (currentStreak || 0) + 1;
      }

      const newLongest = Math.max(longestStreak || 0, newStreak);

      await updateDoc(streakRef, {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActiveDate: today,
        updatedAt: new Date().toISOString()
      });
    };

    syncStreak();
  }, [user, db, streaks]);

  const stats = useMemo(() => {
    const total = sessions?.length || 0
    const completed = sessions?.filter(s => s.status === "completed") || []
    const avgScore = completed.length > 0 
      ? Math.round(completed.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / completed.length) 
      : 0
    
    const dailyStreak = streaks?.find(s => s.id === 'dailyPractice');
    return {
      total,
      completed: completed.length,
      avgScore,
      currentStreak: dailyStreak?.currentStreak || 0
    }
  }, [sessions, streaks])

  if (isUserLoading) {
    return (
      <div className="flex h-full items-center justify-center p-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  const welcomeName = profile?.fullName?.split(' ')[0] || user?.displayName?.split(' ')[0] || "Candidate";

  return (
    <div className="p-8 lg:p-12 space-y-12 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2 animate-sudden">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Intelligence Portal | Standard Access</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-headline font-black tracking-tight leading-tight">
            <AnimatedText text="Welcome back," /> <br /> 
            <span className="text-primary"><AnimatedText text={welcomeName} delay={400} /></span>
          </h1>
          <p className="text-slate-400 text-xl mt-4 font-medium animate-entrance [animation-delay:800ms]">Ready for your professional audit today?</p>
        </div>
        <div className="flex items-center gap-6 animate-sudden [animation-delay:1000ms]">
          <Button asChild className="h-16 rounded-[1.5rem] px-10 font-black shadow-[0_20px_50px_rgba(var(--primary),0.3)] transition-all hover:scale-105 active:scale-95">
            <Link href="/interviews/new">
              <Video className="mr-3 w-6 h-6" />
              NEW ASSESSMENT
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: "Daily Streak", value: `${stats.currentStreak} Days`, icon: Flame, color: "text-orange-400", bg: "bg-orange-500/10" },
          { label: "Average Score", value: `${stats.avgScore}%`, icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
          { label: "Total Turns", value: stats.total, icon: BrainCircuit, color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map((stat, i) => (
          <Card key={i} className="glass-card overflow-hidden group hover:border-primary/40 transition-all duration-500 animate-sudden [animation-delay:var(--delay)]" style={{ '--delay': `${i * 100}ms` } as any}>
            <CardContent className="p-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">{stat.label}</p>
                <h3 className="text-5xl font-black">{stat.value}</h3>
              </div>
              <div className={`w-18 h-18 rounded-[2rem] ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-9 h-9" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <Card className="glass-card overflow-hidden animate-entrance [animation-delay:400ms]">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between p-12 bg-white/5 gap-6">
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 bg-primary/20 rounded-[1.5rem] flex items-center justify-center text-primary shadow-inner">
                  <Target className="w-10 h-10" />
                </div>
                <div>
                  <CardTitle className="font-headline text-4xl font-black tracking-tight">Target: {profile?.targetRole || "Set Target Role"}</CardTitle>
                  <CardDescription className="text-xl font-medium mt-1">Tier: <span className="capitalize text-primary font-bold">{profile?.experienceLevel || "Not set"}</span></CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80 font-black uppercase tracking-[0.3em] text-xs h-12 px-8 rounded-xl glass">
                <Link href="/profile">Edit Profile</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-12">
              <div className="p-10 rounded-[2.5rem] glass bg-primary/5 border border-primary/15 relative overflow-hidden group">
                <div className="flex items-start gap-8 relative z-10">
                  <BrainCircuit className="w-10 h-10 text-primary shrink-0 mt-1" />
                  <div className="space-y-4">
                    <p className="font-black text-xs uppercase tracking-[0.3em] text-primary">Intervuza Strategic Context</p>
                    <p className="text-2xl leading-relaxed text-slate-300 font-medium italic">
                      {profile?.education ? `Your background from ${profile.education} is being used to calibrate the technical depth of your next session.` : "Update your education details so Aria can tailor the complexity of her questioning."}
                    </p>
                  </div>
                </div>
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-all pointer-events-none" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden animate-entrance [animation-delay:500ms]">
            <CardHeader className="p-12 border-b border-white/5 bg-white/5">
              <div className="flex items-center justify-between">
                <CardTitle className="font-headline text-4xl font-black flex items-center gap-6">
                  <History className="w-10 h-10 text-primary" />
                  Audit History
                </CardTitle>
                <Link href="/dashboard" className="text-xs font-black uppercase tracking-[0.3em] text-primary hover:underline">Full History</Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {sessionsLoading ? (
                <div className="flex justify-center p-24"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>
              ) : sessions?.length ? (
                <div className="divide-y divide-white/5">
                  {sessions.map((item, idx) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 p-10 hover:bg-white/5 transition-all group animate-sudden" style={{ '--delay': `${idx * 50}ms` } as any}>
                      <div className="flex items-center gap-10">
                        <div className={`w-24 h-24 rounded-[2rem] flex flex-col items-center justify-center font-black text-3xl shadow-inner border border-white/10 ${item.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-primary/10 text-primary'}`}>
                          {item.status === 'completed' ? (item.overallScore || "--") : <AlertCircle className="w-10 h-10" />}
                          <span className="text-[10px] uppercase tracking-[0.2em] opacity-60 mt-2 font-black">{item.status === 'completed' ? 'Score' : 'Active'}</span>
                        </div>
                        <div>
                          <h4 className="font-black text-3xl tracking-tight">{item.jobRole}</h4>
                          <div className="flex items-center gap-6 mt-3 text-sm text-slate-500 font-bold uppercase tracking-[0.2em]">
                            <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(item.createdAt).toLocaleDateString()}</span>
                            <span className="w-2 h-2 rounded-full bg-slate-800" />
                            <span className={item.status === 'completed' ? 'text-green-500/80' : 'text-primary animate-pulse'}>{item.status}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" className="rounded-[1.5rem] h-18 px-10 font-black glass hover:bg-primary hover:text-white hover:border-transparent transition-all text-lg" asChild>
                        <Link href={item.status === 'completed' ? `/results/${item.id}` : `/interviews/session/${item.id}`}>
                          {item.status === 'completed' ? 'VIEW AUDIT' : 'RESUME TURN'}
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-32 space-y-8">
                  <History className="w-24 h-24 text-slate-800 mx-auto opacity-30" />
                  <p className="text-slate-500 text-2xl font-medium">No previous sessions. Start your journey with Aria.</p>
                  <Button asChild className="rounded-[1.5rem] h-20 px-16 font-black shadow-2xl transition-all hover:scale-105 text-xl"><Link href="/interviews/new">START NOW</Link></Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-12">
          <Card className="glass bg-slate-900 border-none rounded-[3.5rem] overflow-hidden relative group animate-entrance [animation-delay:600ms] shadow-2xl">
            <CardHeader className="p-12 pb-6">
              <div className="flex items-center gap-4 mb-6">
                <Zap className="w-6 h-6 text-primary" />
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Aria Strategic Insight</span>
              </div>
              <CardTitle className="font-headline text-5xl font-black leading-tight tracking-tighter">Master Your <br /> Presence</CardTitle>
            </CardHeader>
            <CardContent className="p-12 pt-0 space-y-12">
              <p className="text-2xl text-slate-400 leading-relaxed italic font-medium">
                "Technical logic alone isn't enough. Your focus and structural clarity are being monitored by my neural sensors. Practice using the STAR method for every behavioral answer."
              </p>
              <div className="space-y-6">
                <Button className="w-full h-22 rounded-[2rem] font-black bg-primary text-2xl shadow-[0_20px_50px_rgba(var(--primary),0.3)] transition-all hover:scale-[1.03]" asChild>
                  <Link href="/interviews/new">NEW SESSION</Link>
                </Button>
                <p className="text-[10px] text-center text-slate-600 font-black uppercase tracking-[0.4em]">Biometric sensors standing by.</p>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          </Card>
        </div>
      </div>
    </div>
  )
}
