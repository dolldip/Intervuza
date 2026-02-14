"use client"

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShieldCheck, Mail, Lock, Loader2, Phone, KeyRound } from 'lucide-react';
import { useAuth } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
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
        description: "Successfully signed in.",
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Login error:", error);
      let message = "Invalid email or password.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = "The credentials provided are incorrect. Please verify your email and password.";
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Authenticated", description: "Signed in with Google." });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Auth Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {}
      });
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setLoading(true);
    setupRecaptcha();
    const appVerifier = (window as any).recaptchaVerifier;
    
    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      toast({ title: "OTP Sent", description: "Verification code sent." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "OTP Failed", description: "Check phone format (e.g. +1...)." });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !confirmationResult) return;
    
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Verification Failed", description: "Invalid code." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div id="recaptcha-container"></div>
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <Link className="inline-flex items-center space-x-2" href="/">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <span className="font-headline font-bold text-3xl tracking-tight">AssessAI</span>
          </Link>
          <h2 className="text-2xl font-headline font-bold mt-4">Security Portal</h2>
          <p className="text-muted-foreground">Master your prep with elite AI coaching.</p>
        </div>

        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-muted/30 pb-8">
            <CardTitle className="font-headline">Sign In</CardTitle>
            <CardDescription>Select your preferred authentication method</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl font-bold flex items-center justify-center gap-3" 
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">Or with credentials</span></div>
            </div>

            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-12 rounded-xl">
                <TabsTrigger value="email" className="rounded-lg font-bold">Email</TabsTrigger>
                <TabsTrigger value="phone" className="rounded-lg font-bold">OTP</TabsTrigger>
              </TabsList>
              
              <TabsContent value="email">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="alex@example.com" className="pl-10 h-12 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password">Password</Label>
                      <Link href="/forgot-password" className="text-primary font-bold hover:underline text-sm">Forgot password?</Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="password" type="password" className="pl-10 h-12 rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                  </div>
                  <Button className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20" type="submit" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : "SIGN IN"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="phone">
                {!otpSent ? (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="phone" type="tel" placeholder="+1234567890" className="pl-10 h-12 rounded-xl" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                      </div>
                    </div>
                    <Button className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20" type="submit" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" /> : "SEND OTP CODE"}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp">Verification Code</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="otp" type="text" className="pl-10 h-12 rounded-xl text-center tracking-[0.5em] font-black" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                      </div>
                    </div>
                    <Button className="w-full h-14 rounded-2xl font-black text-lg bg-green-600 hover:bg-green-700 shadow-lg" type="submit" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" /> : "VERIFY & LOGIN"}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="justify-center border-t py-6 bg-muted/10">
            <p className="text-sm text-muted-foreground">
              New to AssessAI? <Link href="/register" className="text-primary font-black hover:underline">SIGN UP</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
