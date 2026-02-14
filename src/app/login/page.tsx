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
import { signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
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
      } else if (error.code === 'auth/too-many-requests') {
        message = "Too many failed attempts. Please try again later or reset your password.";
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
      toast({
        title: "OTP Sent",
        description: "Verification code sent to your phone.",
      });
    } catch (error: any) {
      console.error("OTP Send Error:", error);
      toast({
        variant: "destructive",
        title: "OTP Failed",
        description: "Could not send OTP. Ensure the format is correct (e.g., +1234567890).",
      });
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
      toast({
        title: "Authenticated",
        description: "Security verification successful.",
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("OTP Verify Error:", error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "Invalid security code. Please try again.",
      });
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

        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/30 pb-8">
            <CardTitle className="font-headline">Sign In</CardTitle>
            <CardDescription>Select your preferred authentication method</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-12 rounded-xl">
                <TabsTrigger value="email" className="rounded-lg font-bold">Email</TabsTrigger>
                <TabsTrigger value="phone" className="rounded-lg font-bold">OTP Verification</TabsTrigger>
              </TabsList>
              
              <TabsContent value="email">
                <form onSubmit={handleEmailLogin} className="space-y-4">
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
                      <Link href="/forgot-password" className="text-primary font-bold hover:underline text-sm">Forgot password?</Link>
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
                        <Input 
                          id="phone" 
                          type="tel" 
                          placeholder="+1234567890" 
                          className="pl-10 h-12 rounded-xl" 
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                        />
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
                        <Input 
                          id="otp" 
                          type="text" 
                          placeholder="6-digit code" 
                          className="pl-10 h-12 rounded-xl text-center tracking-[0.5em] font-black" 
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <Button className="w-full h-14 rounded-2xl font-black text-lg bg-green-600 hover:bg-green-700 shadow-lg" type="submit" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" /> : "VERIFY & LOGIN"}
                    </Button>
                    <button 
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-xs text-muted-foreground w-full text-center hover:underline mt-4"
                    >
                      Change Phone Number
                    </button>
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
