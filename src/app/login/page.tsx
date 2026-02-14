"use client"

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function AnimatedTitle({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("inline-flex overflow-hidden", className)}>
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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome back!",
        description: "Successfully authenticated to the intelligence portal.",
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Auth error:", error);
      let message = "Invalid credentials provided.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = "Verify your email and password. Neural access denied.";
      }
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Authenticated", description: "Successfully signed in via Google." });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Auth Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 relative overflow-hidden">
      <div className="w-full max-w-md space-y-12 animate-fade-in relative z-10">
        <div className="text-center space-y-4">
          <Link className="inline-flex items-center space-x-3 group" href="/">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30 transition-transform group-hover:scale-110">
              <GraduationCap className="text-white w-7 h-7" />
            </div>
            <span className="font-headline font-black text-4xl tracking-tighter">
              <AnimatedTitle text="PrepWise" />
            </span>
          </Link>
          <div className="space-y-1">
            <h2 className="text-2xl font-headline font-black uppercase tracking-widest text-white mt-4 animate-entrance [animation-delay:400ms]">Security Portal</h2>
            <p className="text-slate-500 font-medium animate-entrance [animation-delay:600ms]">Authentication required for intelligence access.</p>
          </div>
        </div>

        <Card className="glass-dark border-white/10 shadow-2xl rounded-[3rem] overflow-hidden">
          <CardHeader className="bg-white/5 pb-10 border-b border-white/5">
            <CardTitle className="font-headline text-3xl font-black">Sign In</CardTitle>
            <CardDescription className="text-lg">Access your PrepWise professional audit.</CardDescription>
          </CardHeader>
          <CardContent className="pt-10 space-y-8">
            <Button 
              variant="outline" 
              className="w-full h-14 rounded-2xl font-black glass hover:bg-white/10 flex items-center justify-center gap-4 transition-all" 
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google Authentication
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.3em]"><span className="bg-slate-900 px-4 text-slate-500">Email Gateway</span></div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="font-black text-xs uppercase tracking-widest text-slate-500">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input id="email" type="email" placeholder="alex@prepwise.com" className="pl-12 h-14 rounded-2xl glass bg-white/5 border-white/10 font-bold" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <Label htmlFor="password" className="font-black text-xs uppercase tracking-widest text-slate-500">Secure Password</Label>
                  <Link href="/forgot-password" disabled={loading} className="text-primary font-black uppercase tracking-widest text-[9px] hover:underline">Reset Recovery</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input id="password" type="password" className="pl-12 h-14 rounded-2xl glass bg-white/5 border-white/10 font-bold" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>
              <Button className="w-full h-16 rounded-[1.5rem] font-black text-xl shadow-2xl shadow-primary/40 transition-all hover:scale-[1.02] active:scale-95" type="submit" disabled={loading}>
                {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "AUTHENTICATE"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t border-white/5 py-8 bg-white/5">
            <p className="text-sm text-slate-500 font-medium">
              New to the platform? <Link href="/register" className="text-primary font-black uppercase tracking-widest text-xs hover:underline ml-2">Secure Enrollment</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
    </div>
  );
}
