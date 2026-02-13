"use client"

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, User, Mail, Lock, Loader2, Play } from 'lucide-react';
import { auth, db, isMockConfig } from '@/firebase/config';
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // DEMO BYPASS: If API keys are failing, let them in anyway
    if (isMockConfig) {
      sessionStorage.setItem('demo_name', name || "Candidate");
      router.push('/profile');
      return;
    }

    if (!email || !password || !name) return;

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });
      
      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid,
        fullName: name,
        education: "",
        targetRole: "",
        experienceLevel: "mid",
        skills: []
      });

      toast({
        title: "Account Created",
        description: "Welcome to AssessAI!",
      });
      
      router.push('/profile');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Your API key might be invalid. Try clicking 'Enter Demo Dashboard' below.",
      });
      // Fallback: If it fails, enable the demo bypass button visibility if not already
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link className="inline-flex items-center space-x-2" href="/">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <span className="font-headline font-bold text-3xl tracking-tight">AssessAI</span>
          </Link>
          <h2 className="text-2xl font-headline font-bold mt-4">Create your account</h2>
        </div>

        {isMockConfig && (
          <Alert className="border-blue-500 bg-blue-50 text-blue-900">
            <Play className="h-4 w-4 text-blue-600" />
            <AlertTitle className="font-bold">Enter Demo Mode</AlertTitle>
            <AlertDescription className="text-xs">
              Project keys are not yet connected. Click **"Create Demo Account"** to test the camera and AI voice features right now.
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Join 50k+ candidates prepping smarter</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    placeholder="Alex Rivera" 
                    className="pl-10" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isMockConfig}
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
                    className="pl-10" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required={!isMockConfig}
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
                    className="pl-10" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!isMockConfig}
                  />
                </div>
              </div>
              <Button className="w-full h-11 font-bold" type="submit" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isMockConfig ? "Create Demo Account" : "Create Account")}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Log in</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
