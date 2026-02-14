import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  ChevronRight, 
  Zap,
  Video,
  BrainCircuit,
  BarChart3,
  Globe,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

function AnimatedTitle({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("inline-flex flex-wrap justify-center overflow-hidden", className)}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="inline-block animate-letter-reveal opacity-0"
          style={{ animationDelay: `${i * 30}ms` }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="px-6 h-20 flex items-center glass-dark sticky top-0 z-50">
        <Link className="flex items-center justify-center space-x-2" href="/">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <GraduationCap className="text-white w-6 h-6" />
          </div>
          <span className="font-headline font-bold text-2xl tracking-tighter">
            <AnimatedTitle text="PrepWise" />
          </span>
        </Link>
        <nav className="ml-auto flex gap-8 items-center">
          <Link className="text-sm font-bold text-slate-400 hover:text-white transition-colors hidden md:block" href="#features">
            Capabilities
          </Link>
          <div className="flex gap-4">
            <Button variant="ghost" size="sm" asChild className="font-bold">
              <Link href="/login">Log In</Link>
            </Button>
            <Button size="sm" asChild className="rounded-xl px-6 font-bold shadow-lg shadow-primary/30">
              <Link href="/register">Join Platform</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-24 md:py-32 lg:py-48 relative overflow-hidden">
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="space-y-4 max-w-5xl">
                <Badge variant="secondary" className="glass px-6 py-2 rounded-full text-primary font-black uppercase tracking-[0.2em] text-[10px] animate-sudden">
                  <Sparkles className="w-3 h-3 mr-2" /> Neural Coaching Engine
                </Badge>
                <h1 className="text-5xl font-headline font-black tracking-tighter sm:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 leading-[1.1]">
                  <AnimatedTitle text="Master High-Stakes" /> <br /> 
                  <span className="text-primary"><AnimatedTitle text="Interviews" /></span> <AnimatedTitle text="with PrepWise" />
                </h1>
                <p className="mx-auto max-w-[800px] text-slate-400 text-lg md:text-2xl font-body leading-relaxed animate-entrance [animation-delay:800ms]">
                  The only AI platform that analyzes biometrics, technical logic, and communication structure to deliver professional coaching.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-6 mt-12 animate-entrance [animation-delay:1000ms]">
                <Button size="lg" className="h-16 px-10 text-lg rounded-2xl shadow-2xl shadow-primary/40 group font-black transition-all hover:scale-105" asChild>
                  <Link href="/register">
                    START FREE ASSESSMENT
                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-primary/20 blur-[150px] rounded-full -z-10 opacity-30 animate-pulse-slow" />
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-32 relative">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-24 space-y-4 animate-entrance">
              <h2 className="text-4xl font-headline font-black tracking-tighter sm:text-6xl">Intelligence Architecture</h2>
              <p className="text-slate-400 max-w-[800px] mx-auto text-xl">
                Aria uses state-of-the-art vision and NLP to analyze every micro-expression and technical argument.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[
                {
                  title: "Neural Biometrics",
                  description: "Monitor confidence and focus levels in real-time using advanced computer vision.",
                  icon: Video,
                  color: "bg-blue-500/10 text-blue-400"
                },
                {
                  title: "Adaptive Logic",
                  description: "Aria shifts her reasoning based on your specific job role and experience level.",
                  icon: BrainCircuit,
                  color: "bg-purple-500/10 text-purple-400"
                },
                {
                  title: "Linguistic Audit",
                  description: "Analyze grammar, tone, and fillers to ensure you sound like a high-tier leader.",
                  icon: Zap,
                  color: "bg-amber-500/10 text-amber-400"
                },
                {
                  title: "Critical Feedback",
                  description: "Honest, data-driven audits that highlight exactly where you need to improve.",
                  icon: BarChart3,
                  color: "bg-green-500/10 text-green-400"
                },
                {
                  title: "Resume Sync",
                  description: "Upload your background and get hyper-personalized questioning targeting elite firms.",
                  icon: GraduationCap,
                  color: "bg-indigo-500/10 text-indigo-400"
                },
                {
                  title: "Global Standards",
                  description: "Engineered for excellence across all industries and high-stakes roles.",
                  icon: Globe,
                  color: "bg-cyan-500/10 text-cyan-400"
                }
              ].map((feature, idx) => (
                <Card key={idx} className="glass border-none hover:border-primary/30 transition-all duration-500 rounded-[2.5rem] overflow-hidden group animate-sudden [animation-delay:var(--delay)]" style={{ '--delay': `${idx * 100}ms` } as any}>
                  <CardHeader className="p-10">
                    <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner`}>
                      <feature.icon className="w-7 h-7" />
                    </div>
                    <CardTitle className="font-headline text-2xl mb-4">{feature.title}</CardTitle>
                    <CardDescription className="text-slate-400 text-lg leading-relaxed">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-32 bg-primary relative overflow-hidden group">
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="flex flex-col items-center justify-center space-y-10 text-center">
              <h2 className="text-4xl font-headline font-black tracking-tighter sm:text-7xl text-white animate-sudden">Elevate Your Presence.</h2>
              <p className="max-w-[700px] text-white/80 text-xl md:text-2xl font-medium animate-sudden [animation-delay:200ms]">
                Join 50k+ candidates who have transformed their interview performance with Aria's professional audit.
              </p>
              <Button size="lg" variant="secondary" className="h-18 px-12 text-2xl rounded-2xl font-black bg-white text-primary hover:scale-105 transition-transform shadow-2xl animate-sudden [animation-delay:400ms]" asChild>
                <Link href="/register">Get Started Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-white/5 py-16 px-6 glass-dark">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col gap-4">
            <Link className="flex items-center space-x-2" href="/">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="text-white w-5 h-5" />
              </div>
              <span className="font-headline font-bold text-xl tracking-tight">PrepWise</span>
            </Link>
            <p className="text-sm text-slate-500 font-medium">© 2024 PrepWise Inc. Engineered for the 1%.</p>
          </div>
          <div className="flex gap-10">
            <Link className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors" href="#">Terms</Link>
            <Link className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors" href="#">Privacy</Link>
            <Link className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors" href="#">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
