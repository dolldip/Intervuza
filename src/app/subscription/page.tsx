
"use client"

import { useState } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, addDoc, orderBy, doc, updateDoc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Check, 
  Loader2, 
  Zap, 
  ShieldCheck, 
  Crown, 
  Star, 
  CreditCard,
  Lock,
  History,
  Calendar,
  IndianRupee,
  Sparkles,
  Copy,
  Smartphone,
  ExternalLink
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"

export default function SubscriptionPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [processing, setProcessing] = useState(false)
  const [copied, setCopied] = useState(false)

  const subQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "userSubscriptions"),
      where("status", "==", "active")
    )
  }, [db, user])

  const { data: activeSubs, isLoading: subLoading } = useCollection(subQuery)
  
  const txQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "paymentTransactions"),
      orderBy("createdAt", "desc")
    )
  }, [db, user])
  const { data: transactions, isLoading: txLoading } = useCollection(txQuery)

  const currentPlanId = activeSubs?.[0]?.planId || "free"

  const displayPlans = [
    { 
      id: "free", 
      name: "Starter", 
      description: "Standard mock interviews for everyone.", 
      price: 0, 
      features: ["5 Interviews / mo", "Basic Feedback", "Aria Lite Logic"], 
      icon: Star 
    },
    { 
      id: "pro", 
      name: "Professional", 
      description: "Deep technical analysis and biometrics.", 
      price: 49, 
      features: ["Unlimited Interviews", "High-Stakes Biometrics", "Aria Elite Logic", "Coding Task Access"], 
      icon: Crown, 
      popular: true 
    },
    { 
      id: "enterprise", 
      name: "Enterprise", 
      description: "Custom logic for high-tier recruitment.", 
      price: 199, 
      features: ["Custom Roles", "Recruiter Dashboard", "Team Analytics", "Priority AI"], 
      icon: ShieldCheck 
    },
  ]

  const handlePlanSelect = (plan: any) => {
    if (plan.id === "free") {
      toast({ title: "Starter Plan", description: "This is our base intelligence tier." });
      return;
    }
    if (currentPlanId === plan.id) return;
    
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
  }

  const copyUPI = () => {
    navigator.clipboard.writeText("7003799866@ybl");
    setCopied(true);
    toast({ title: "UPI Copied", description: "Neural VPA copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  }

  const handleUPILink = () => {
    const upiLink = `upi://pay?pa=7003799866@ybl&pn=Intervuza&am=${selectedPlan?.price}&cu=INR`;
    window.open(upiLink, '_blank');
  }

  const handleCheckout = async () => {
    if (!user || !db || !selectedPlan) return;
    
    setProcessing(true);
    try {
      const now = new Date().toISOString()
      
      await addDoc(collection(db, "users", user.uid, "paymentTransactions"), {
        userId: user.uid,
        amount: selectedPlan.price,
        currency: "INR",
        transactionDate: now,
        status: "succeeded",
        paymentGatewayReference: `INTV_${Math.random().toString(36).substring(7).toUpperCase()}`,
        description: `${selectedPlan.name} Calibration Payment (UPI)`,
        createdAt: now
      });

      await addDoc(collection(db, "users", user.uid, "userSubscriptions"), {
        userId: user.uid,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        startDate: now,
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        createdAt: now,
        updatedAt: now
      });

      await updateDoc(doc(db, "users", user.uid), {
        subscription: selectedPlan.id,
        updatedAt: now
      });

      toast({
        title: "Calibration Successful",
        description: `Your profile is now running the ${selectedPlan.name} logic engine.`,
      });
      setIsCheckoutOpen(false);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Checkout Denied",
        description: "Could not initialize neural funding. Please retry.",
      });
    } finally {
      setProcessing(false);
    }
  }

  if (isUserLoading || subLoading) {
    return (
      <div className="flex h-full items-center justify-center p-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-12 space-y-16 animate-fade-in max-w-7xl mx-auto pb-32">
      <div className="text-center space-y-6">
        <Badge variant="secondary" className="glass px-8 py-2.5 rounded-full font-black text-primary gap-2 uppercase tracking-[0.3em] text-[10px]">
          <Sparkles className="w-4 h-4" /> Neural Billing Grid
        </Badge>
        <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tight text-white leading-tight">Elite <br /> Access Plans</h1>
        <p className="text-slate-400 text-xl max-w-2xl mx-auto font-medium">Calibrate your neural audit depth. Pay to unlock high-stakes reasoning.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {displayPlans.map((plan: any, i) => (
          <Card key={i} className={`glass-card border-none shadow-2xl overflow-hidden relative group hover:scale-[1.03] transition-all duration-500 ${plan.id === 'pro' || plan.popular ? 'ring-2 ring-primary/40' : ''}`}>
            { (plan.id === 'pro' || plan.popular) && (
              <div className="absolute top-0 right-0 bg-primary text-white px-10 py-3 rounded-bl-[2.5rem] font-black text-[10px] uppercase tracking-[0.2em] z-10 shadow-xl">
                Most Popular
              </div>
            )}
            <CardHeader className="p-12 bg-white/5 border-b border-white/5">
              <div className="w-16 h-16 glass bg-white/10 rounded-[1.5rem] shadow-inner flex items-center justify-center mb-8 text-primary">
                {plan.icon ? <plan.icon className="w-8 h-8" /> : <Star className="w-8 h-8" />}
              </div>
              <CardTitle className="font-headline text-3xl font-black">{plan.name}</CardTitle>
              <CardDescription className="text-slate-400 text-lg font-medium mt-2">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-12 space-y-12">
              <div className="flex items-baseline gap-3">
                <span className="text-6xl font-black text-white">₹{plan.price}</span>
                <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">/ month</span>
              </div>
              <ul className="space-y-6">
                {(plan.features || []).map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-5 text-slate-300 font-medium text-sm">
                    <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center text-primary shadow-inner shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-12 bg-white/5">
              <Button 
                className={`w-full h-18 rounded-[1.5rem] font-black text-xl transition-all ${currentPlanId === plan.id ? 'bg-white/10 text-slate-500 cursor-default pointer-events-none' : 'shadow-[0_20px_50px_rgba(var(--primary),0.3)] hover:scale-105 active:scale-95'}`}
                disabled={currentPlanId === plan.id}
                onClick={() => handlePlanSelect(plan)}
              >
                {currentPlanId === plan.id ? "CALIBRATED" : "ACTIVATE NOW"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="space-y-12 mt-24">
        <div className="flex items-center gap-6 px-4">
          <div className="w-16 h-16 glass bg-primary/15 rounded-[2rem] flex items-center justify-center text-primary shadow-inner">
            <History className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-4xl font-headline font-black text-white">Neural Ledger</h2>
            <p className="text-slate-500 font-medium text-lg">Detailed history of your professional calibrations.</p>
          </div>
        </div>

        <Card className="glass-card overflow-hidden border-none shadow-2xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-white/5 border-b border-white/5">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="font-black uppercase tracking-widest text-[10px] h-20 pl-12 text-slate-500">Trace ID</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] h-20 text-slate-500">Engine Calibration</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] h-20 text-slate-500 text-center">Investment</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] h-20 text-slate-500 text-center">Status</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] h-20 pr-12 text-slate-500 text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <Loader2 className="animate-spin w-10 h-10 mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : transactions && transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-white/5 transition-colors border-white/5">
                      <TableCell className="pl-12 py-10">
                        <p className="font-mono text-xs font-bold text-primary opacity-80">{tx.paymentGatewayReference || 'N/A'}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-black text-white text-base">{tx.description || 'Neural Recalibration'}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 font-black text-xl text-white">
                          <IndianRupee className="w-4 h-4 text-slate-500" />
                          {tx.amount}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="rounded-full px-6 py-2 border-green-500/30 bg-green-500/10 text-green-400 font-black text-[10px] uppercase tracking-widest">
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-12 text-right">
                        <div className="flex items-center justify-end gap-3 text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">
                          <Calendar className="w-4 h-4" />
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-6 text-slate-700">
                        <History className="w-16 h-16 opacity-10" />
                        <p className="font-black uppercase tracking-[0.3em] text-[11px]">No transaction history in the grid.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md glass-dark border-white/10 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(0,0,0,0.9)]">
          <DialogHeader className="space-y-6">
            <div className="w-20 h-20 glass bg-primary/25 rounded-[1.5rem] flex items-center justify-center text-primary mx-auto shadow-inner">
              <Smartphone className="w-10 h-10" />
            </div>
            <DialogTitle className="text-4xl font-headline font-black text-center text-white">UPI Neural Gateway</DialogTitle>
            <DialogDescription className="text-center text-slate-400 font-medium text-lg leading-relaxed">
              Scan or pay via UPI to unlock the <span className="font-black text-primary uppercase">{selectedPlan?.name}</span> engine.
            </DialogDescription>
          </DialogHeader>
          <div className="py-10 space-y-8">
            <div className="p-8 glass bg-white/5 rounded-[2rem] border border-dashed border-white/15 space-y-6 shadow-inner">
              <div className="flex justify-between items-center">
                <span className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500">Neural VPA</span>
                <div className="flex items-center gap-3">
                  <span className="font-black text-white text-base">7003799866@ybl</span>
                  <Button variant="ghost" size="icon" onClick={copyUPI} className="h-8 w-8 text-primary hover:bg-primary/10">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="h-px bg-white/10 w-full" />
              <div className="flex justify-between items-center text-primary font-black">
                <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Total Investment</span>
                <div className="flex items-center gap-1 text-3xl">
                  <IndianRupee className="w-5 h-5" />
                  {selectedPlan?.price}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <Button 
                variant="outline" 
                className="w-full h-14 rounded-2xl font-black glass border-primary/20 text-primary flex items-center justify-center gap-3 hover:bg-primary/10"
                onClick={handleUPILink}
              >
                <ExternalLink className="w-4 h-4" />
                OPEN UPI APP
              </Button>
              
              <div className="flex items-center gap-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 bg-blue-500/5 p-5 rounded-2xl border border-blue-500/15">
                <Lock className="w-5 h-5 text-blue-400 shrink-0" />
                <span>Pay via any UPI app and confirm below to recalibrate Aria instantly.</span>
              </div>
              
              <Button 
                className="w-full h-20 rounded-[2rem] text-xl font-black shadow-[0_20px_50px_rgba(var(--primary),0.4)] hover:scale-[1.02] transition-all bg-primary" 
                onClick={handleCheckout} 
                disabled={processing}
              >
                {processing ? <Loader2 className="animate-spin w-8 h-8" /> : (
                  <>
                    CONFIRM & UPGRADE
                    <CreditCard className="ml-4 w-6 h-6" />
                  </>
                )}
              </Button>
              <p className="text-center text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">Secure simulated hand-shake enabled.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
