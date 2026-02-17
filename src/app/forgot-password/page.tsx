"use client"

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      toast({
        title: "Email Sent",
        description: "A password reset link has been sent to your Gmail. Please check your Spam folder if you don't see it.",
      });
    } catch (error: any) {
      console.error("Reset Error:", error);
      let message = "Could not send reset email. Please check the address.";
      if (error.code === 'auth/user-not-found') {
        message = "No account found with this email address.";
      }
      
      toast({
        variant: "destructive",
        title: "Security Link Failed",
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
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <span className="font-headline font-bold text-3xl tracking-tight">PrepWise</span>
          </Link>
          <h2 className="text-2xl font-headline font-bold mt-4">Security Recovery</h2>
          <p className="text-muted-foreground">Restore access to your performance audit data.</p>
        </div>

        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/30 pb-8">
            <CardTitle className="font-headline">Forgot Password</CardTitle>
            <CardDescription>Enter your email to receive a recovery link</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {sent ? (
              <div className="text-center py-6 space-y-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="font-medium">Recovery instructions sent to your inbox.</p>
                <p className="text-xs text-muted-foreground italic">If you don't see it within 2 minutes, please check your <b>Spam folder</b>.</p>
                <Button className="w-full h-14 rounded-2xl font-black text-lg" asChild>
                  <Link href="/login">RETURN TO LOGIN</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
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
                <Button className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20" type="submit" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : "SEND RECOVERY LINK"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="justify-center border-t py-6 bg-muted/10">
            <Link href="/login" className="text-sm text-primary font-black flex items-center hover:underline gap-2">
              <ArrowLeft className="w-4 h-4" />
              BACK TO LOGIN
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
