import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Video, 
  BarChart3, 
  BrainCircuit, 
  ShieldCheck, 
  ChevronRight, 
  Zap,
  Globe
} from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center space-x-2" href="/">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight">AssessAI</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-primary transition-colors hidden md:block" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors hidden md:block" href="#how-it-works">
            How it Works
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl">
                <Badge variant="secondary" className="mb-4 py-1 px-4 text-primary font-semibold">
                  The Future of Interview Prep
                </Badge>
                <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                  Master Your Interview with <span className="text-primary">Confidence</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl lg:text-2xl mt-4 font-body leading-relaxed">
                  The first AI-powered platform that analyzes your speech, expressions, and technical depth to give you professional coaching.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20 group" asChild>
                  <Link href="/register">
                    Start Free Mock Interview
                    <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-8 text-base" asChild>
                  <Link href="/login">View Demo</Link>
                </Button>
              </div>
              <div className="pt-12 w-full max-w-5xl">
                <div className="relative rounded-2xl border bg-white shadow-2xl overflow-hidden aspect-video group">
                  <img 
                    src="https://picsum.photos/seed/assessai-hero/1200/675" 
                    alt="AssessAI Dashboard Preview" 
                    className="object-cover w-full h-full opacity-90 transition-transform duration-500 group-hover:scale-105"
                    data-ai-hint="dashboard professional"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-8">
                    <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl flex items-center space-x-4 shadow-xl border border-white/20 animate-fade-in">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <BarChart3 className="text-green-600 w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Interview Score: 87/100</p>
                        <p className="text-xs text-muted-foreground">Confidence increased by 15% this week</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl">AI-Powered Excellence</h2>
              <p className="text-muted-foreground max-w-[800px] mx-auto mt-4">
                We use state-of-the-art computer vision and NLP to provide a truly objective analysis of your performance.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Expression Analysis",
                  description: "Detect micro-expressions and body language to master your visual impact.",
                  icon: Video,
                  color: "bg-blue-100 text-blue-600"
                },
                {
                  title: "Smart Questioning",
                  description: "AI generates unique questions based on the specific Job Description you provide.",
                  icon: BrainCircuit,
                  color: "bg-purple-100 text-purple-600"
                },
                {
                  title: "Speech & Tone",
                  description: "Analyze fillers, speed, and confidence in your voice to sound professional.",
                  icon: Zap,
                  color: "bg-yellow-100 text-yellow-600"
                },
                {
                  title: "Performance Reports",
                  description: "Comprehensive breakdown of your strengths and areas needing improvement.",
                  icon: BarChart3,
                  color: "bg-green-100 text-green-600"
                },
                {
                  title: "Resume Matching",
                  description: "Upload your resume and get questions tailored to your actual experience.",
                  icon: ShieldCheck,
                  color: "bg-indigo-100 text-indigo-600"
                },
                {
                  title: "Global Standards",
                  description: "Preparation for any role across various industries worldwide.",
                  icon: Globe,
                  color: "bg-cyan-100 text-cyan-600"
                }
              ].map((feature, idx) => (
                <Card key={idx} className="border-none shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="font-headline">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="w-full py-24 bg-primary text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl">Ready to land your dream job?</h2>
              <p className="max-w-[600px] text-primary-foreground/90 md:text-xl">
                Join 50,000+ candidates who have boosted their interview success rate with AssessAI.
              </p>
              <Button size="lg" variant="secondary" className="h-12 px-10 text-primary font-bold hover:scale-105 transition-transform" asChild>
                <Link href="/register">Create Your Profile</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t bg-white py-12 px-4 md:px-6">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2">
            <Link className="flex items-center space-x-2" href="/">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <ShieldCheck className="text-white w-4 h-4" />
              </div>
              <span className="font-headline font-bold text-lg tracking-tight">AssessAI</span>
            </Link>
            <p className="text-xs text-muted-foreground">© 2024 AssessAI Inc. All rights reserved.</p>
          </div>
          <div className="flex gap-8">
            <Link className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline" href="#">
              Terms
            </Link>
            <Link className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline" href="#">
              Privacy
            </Link>
            <Link className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline" href="#">
              Cookie Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
