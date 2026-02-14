
"use client"

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      let message = "Invalid email or password.";
      if (error.code === 'auth/invalid-credential') {
        message = "The credentials provided are incorrect. Please try again.";
      } else if (error.code === 'auth/user-not-found') {
        message = "No account found with this email.";
      } else if (error.code === 'auth/wrong-password') {
        message = "Incorrect password.";
      }
      
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

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
          <h2 className="text-2xl font-headline font-bold mt-4">Welcome back</h2>
          <p className="text-muted-foreground">Sign in to continue your preparation.</p>
        </div>

        <Card className="border-none shadow-xl rounded-[2rem]">
          <CardHeader>
            <CardTitle className="font-headline">Login</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="text-xs text-primary hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    className="pl-10 h-12 rounded-xl" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button className="w-full h-12 rounded-xl font-bold text-lg" type="submit" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Don't have an account? <Link href="/register" className="text-primary font-bold hover:underline">Sign up</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
