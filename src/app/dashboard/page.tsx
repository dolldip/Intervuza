
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
  Loader2
} from "lucide-react"
import Link from "next/link"
import { useAuth, useFirestore, useDoc } from "@/firebase"
import { doc } from "firebase/firestore"
import { MOCK_INTERVIEW_HISTORY } from "@/lib/mock-data"

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const db = useFirestore()
  const userDocRef = user ? doc(db!, "users", user.uid) : null
  const { data: profile, loading: profileLoading } = useDoc(userDocRef)

  if (authLoading) {
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
          <h1 className="text-3xl font-headline font-bold">
            Welcome back, {profile?.fullName?.split(' ')[0] || user?.displayName?.split(' ')[0] || "Scholar"}
          </h1>
          <p className="text-muted-foreground">Ready to sharpen your interview skills today?</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild className="hidden sm:flex">
            <Link href="/profile">
              <UserPen className="mr-2 w-4 h-4" />
              Edit Profile
            </Link>
          </Button>
          <Button asChild>
            <Link href="/interviews/new">
              <Video className="mr-2 w-4 h-4" />
              New Mock Interview
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Daily Streak", value: `5 Days`, icon: Flame, color: "text-orange-500", bg: "bg-orange-100" },
          { label: "Average Score", value: `84%`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-100" },
          { label: "Interviews Done", value: 12, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-100" },
          { label: "Total Badges", value: 3, icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-100" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline">Targeting: {profile?.targetRole || "Set your role"}</CardTitle>
                <CardDescription>Experience Level: <span className="capitalize">{profile?.experienceLevel || "Not set"}</span></CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
                <Link href="/profile">Update Profile</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl bg-muted/50 border border-dashed border-primary/20">
                <p className="text-sm leading-relaxed">
                  <strong>Education Highlight:</strong> {profile?.education || "Please update your profile to help our AI generate more relevant technical questions."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Recent Interview History</CardTitle>
              <CardDescription>Track your session performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {MOCK_INTERVIEW_HISTORY.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${item.score >= 80 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {item.score}
                      </div>
                      <div>
                        <h4 className="font-bold">{item.role}</h4>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/results/${item.id}`}>Review Report</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          <Card className="shadow-sm bg-primary text-white border-none overflow-hidden relative">
            <CardHeader>
              <CardTitle className="font-headline">AI Coach Tip</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-primary-foreground/90 leading-relaxed">
                "We noticed you often use 'like' or 'um' during technical explanations. Try pausing for a second before answering to structure your thoughts."
              </p>
              <Button variant="secondary" className="w-full font-bold" asChild>
                <Link href="/interviews/new">Practice Now</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Daily Preparation Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: "Complete 1 Mock Interview", progress: 100 },
                { label: "Technical Concept Drill", progress: 45 },
                { label: "Voice Tone Practice", progress: 10 },
              ].map((goal, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{goal.label}</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
