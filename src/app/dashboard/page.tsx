import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, 
  TrendingUp, 
  Calendar, 
  Video, 
  ArrowRight,
  Flame,
  Star,
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { MOCK_USER, MOCK_INTERVIEW_HISTORY, MOCK_DRILLS } from "@/lib/mock-data"

export default function DashboardPage() {
  return (
    <div className="p-6 lg:p-10 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Welcome back, {MOCK_USER.name.split(' ')[0]}</h1>
          <p className="text-muted-foreground">Ready to crush your next interview session?</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden sm:flex">
            <Calendar className="mr-2 w-4 h-4" />
            Schedule
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
          { label: "Daily Streak", value: `${MOCK_USER.stats.streak} Days`, icon: Flame, color: "text-orange-500", bg: "bg-orange-100" },
          { label: "Average Score", value: `${MOCK_USER.stats.avgScore}%`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-100" },
          { label: "Interviews Done", value: MOCK_USER.stats.totalInterviews, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-100" },
          { label: "Total Badges", value: MOCK_USER.stats.badges.length, icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-100" },
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
                <CardTitle className="font-headline">Recommended Drills</CardTitle>
                <CardDescription>Based on your last interview analysis</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">View All</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {MOCK_DRILLS.map((drill) => (
                <div key={drill.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{drill.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] h-4 px-1">{drill.category}</Badge>
                        <span className="text-xs text-muted-foreground">{drill.duration} • {drill.difficulty}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Recent Interviews</CardTitle>
              <CardDescription>Track your progress over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {MOCK_INTERVIEW_HISTORY.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border">
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
                        <Link href={`/results/${item.id}`}>Report</Link>
                      </Button>
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={`/replay/${item.id}`}>Replay</Link>
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
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck className="w-24 h-24" />
            </div>
            <CardHeader>
              <CardTitle className="font-headline">Your AI Coach</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-primary-foreground/90 leading-relaxed">
                "Alex, you've been doing great with technical questions. Your next focus should be on <strong>Behavioral Clarity</strong>."
              </p>
              <Button variant="secondary" className="w-full font-bold">Start Coach Session</Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Daily Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Complete 1 Mock", progress: 100 },
                { label: "Voice Tone Practice", progress: 45 },
                { label: "Grammar Drill", progress: 0 },
              ].map((goal, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{goal.label}</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Skill Cloud</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {MOCK_USER.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100">
                  {skill}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}