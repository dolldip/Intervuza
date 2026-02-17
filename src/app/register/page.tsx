"use client"

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrainCircuit, User, Mail, Lock, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;

    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });
      
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        email: email,
        fullName: name,
        role: "candidate",
        experienceLevel: "mid",
        createdAt: new Date().toISOString(),
        dataDeletionRequested: false
      });

      toast({
        title: "Security Profile Created",
        description: "Welcome to Intervuza. Your professional audit profile is ready.",
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Enrollment Error:", error);
      let message = "Neural enrollment failed. System error.";
      if (error.code === 'auth/email-already-in-use') {
        message = "Identity already exists. Log in to your existing sector.";
      } else if (error.code === 'auth/weak-password') {
        message = "Credential strength insufficient (minimum 6 characters).";
      } else if (error.code === 'auth/invalid-email') {
        message = "Linguistic format error in email address.";
      }
      
      toast({
        variant: "destructive",
        title: "Enrollment Denied",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 relative overflow-hidden">
      <div className="w-full max-w-md space-y-12 animate-fade-in relative z-10">
        <div className="text-center space-y-4">
          <Link className="inline-flex items-center space-x-3 group" href="/">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl transition-all group-hover:scale-110">
              <BrainCircuit className="text-white w-7 h-7" />
            </div>
            <span className="font-headline font-black text-4xl tracking-tighter">Intervuza</span>
          </Link>
          <div className="space-y-1">
            <h2 className="text-2xl font-headline font-black uppercase tracking-widest text-white mt-4">Sign Up</h2>
            <p className="text-slate-500 font-medium">Join 50k+ elite candidates on the neural grid.</p>
          </div>
        </div>

        <Card className="glass-dark border-white/10 shadow-2xl rounded-[3rem] overflow-hidden">
          <CardHeader className="bg-white/5 pb-10 border-b border-white/5">
            <CardTitle className="font-headline text-3xl font-black">Sign Up</CardTitle>
            <CardDescription className="text-lg">Initialize your professional audit profile.</CardDescription>
          </CardHeader>
          <CardContent className="pt-10">
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="font-black text-xs uppercase tracking-widest text-slate-500">Legal Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input 
                    id="name" 
                    placeholder="Alex Rivera" 
                    className="pl-12 h-14 rounded-2xl glass bg-white/5 border-white/10 font-bold" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="email" className="font-black text-xs uppercase tracking-widest text-slate-500">Secure Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="alex@intelligence.com" 
                    className="pl-12 h-14 rounded-2xl glass bg-white/5 border-white/10 font-bold" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="password" title="Password must be at least 6 characters" className="font-black text-xs uppercase tracking-widest text-slate-500">Access Credential</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-12 h-14 rounded-2xl glass bg-white/5 border-white/10 font-bold" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button className="w-full h-16 rounded-[1.5rem] font-black text-xl shadow-2xl shadow-primary/40 transition-all hover:scale-[1.02] active:scale-95" type="submit" disabled={loading}>
                {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "SIGN UP"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t border-white/5 py-8 bg-white/5">
            <p className="text-sm text-slate-500 font-medium">
              Identity already exists? <Link href="/login" className="text-primary font-black uppercase tracking-widest text-xs hover:underline ml-2">Login</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
    </div>
  );
}
