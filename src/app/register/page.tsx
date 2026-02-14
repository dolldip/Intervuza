
"use client"

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, User, Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  
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
      
      // Send verification email
      try {
        await sendEmailVerification(user);
        console.log("Verification email sent successfully.");
      } catch (emailError) {
        console.warn("Could not send verification email immediately. This might be due to console settings.", emailError);
      }
      
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        email: email,
        fullName: name,
        role: "candidate",
        experienceLevel: "mid",
        createdAt: new Date().toISOString(),
        dataDeletionRequested: false
      });

      setVerificationSent(true);
      toast({
        title: "Account Created",
        description: "Please check your email (and Spam folder) to verify your account.",
      });
    } catch (error: any) {
      console.error("Registration Error:", error);
      let message = "Something went wrong during registration.";
      if (error.code === 'auth/email-already-in-use') {
        message = "This email is already registered. Please log in instead.";
      } else if (error.code === 'auth/weak-password') {
        message = "Password should be at least 6 characters.";
      }
      
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-10 animate-fade-in">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-headline font-bold uppercase tracking-tight">Verify Your Email</h1>
            <p className="text-muted-foreground text-lg">We've sent a verification link to <b>{email}</b>. If you don't see it, please check your <b>Spam folder</b>.</p>
          </div>
          <Button asChild className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">
            <Link href="/login">RETURN TO LOGIN</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <Link className="inline-flex items-center space-x-2" href="/">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <span className="font-headline font-bold text-3xl tracking-tight">AssessAI</span>
          </Link>
          <h2 className="text-2xl font-headline font-bold mt-4">Security Enrollment</h2>
          <p className="text-muted-foreground">Join 50k+ candidates prepping smarter</p>
        </div>

        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/30 pb-8">
            <CardTitle className="font-headline">Sign Up</CardTitle>
            <CardDescription>Start your AI-powered performance audit</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    placeholder="Alex Rivera" 
                    className="pl-10 h-12 rounded-xl" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="alex@example.com" 
                    className="pl-10 h-12 rounded-xl" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 h-12 rounded-xl" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20" type="submit" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "CREATE ACCOUNT"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t py-6 bg-muted/10">
            <p className="text-sm text-muted-foreground">
              Already have an account? <Link href="/login" className="text-primary font-black hover:underline">SIGN IN</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
