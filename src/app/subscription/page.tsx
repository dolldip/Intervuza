
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
  IndianRupee
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

  const plansQuery = useMemoFirebase(() => {
    if (!db) return null
    return collection(db, "subscriptionPlans")
  }, [db])
  const { data: plans, isLoading: plansLoading } = useCollection(plansQuery)

  const currentPlanId = activeSubs?.[0]?.planId || "free"

  const defaultPlans = [
    { id: "free", name: "Free", description: "Standard mock interviews for everyone.", price: 0, features: ["5 Interviews / mo", "Basic Feedback", "Aria Lite Logic"], icon: Star },
    { id: "pro", name: "Pro", description: "Deep technical analysis and biometrics.", price: 49, features: ["Unlimited Interviews", "High-Stakes Biometrics", "Aria Elite Logic", "Coding Task Access"], icon: Crown, popular: true },
    { id: "enterprise", name: "Enterprise", description: "Custom logic for high-tier recruitment.", price: 199, features: ["Custom Roles", "Recruiter Dashboard", "Team Analytics", "Priority AI"], icon: ShieldCheck },
  ]

  const displayPlans = plans?.length ? plans : defaultPlans

  const handlePlanSelect = (plan: any) => {
    if (plan.id === "free" && currentPlanId === "free") {
      toast({ title: "Free Plan Active", description: "You are already using the standard tier." });
      return;
    }
    if (currentPlanId === plan.id) return;
    
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
  }

  const handleCheckout = async () => {
    if (!user || !db || !selectedPlan) return;
    
    setProcessing(true);
    try {
      const now = new Date().toISOString()
      
      // 1. Record Transaction
      await addDoc(collection(db, "users", user.uid, "paymentTransactions"), {
        userId: user.uid,
        amount: selectedPlan.price || selectedPlan.priceMonthly,
        currency: "INR",
        transactionDate: now,
        status: "succeeded",
        paymentGatewayReference: `sim_${Math.random().toString(36).substring(7)}`,
        description: `${selectedPlan.name} Subscription Payment`,
        createdAt: now
      });

      // 2. Create Subscription Record
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

      // 3. Update User Profile for Global Visibility
      await updateDoc(doc(db, "users", user.uid), {
        subscription: selectedPlan.id,
        updatedAt: now
      });

      toast({
        title: "Upgrade Successful",
        description: `Welcome to the ${selectedPlan.name} tier! Aria's logic has been upgraded.`,
      });
      setIsCheckoutOpen(false);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Checkout Failed",
        description: "Could not process payment. Please try again.",
      });
    } finally {
      setProcessing(false);
    }
  }

  if (isUserLoading || subLoading || plansLoading) {
    return (
      <div className="flex h-full items-center justify-center p-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 space-y-12 animate-fade-in max-w-7xl mx-auto pb-24">
      <div className="text-center space-y-4">
        <Badge variant="secondary" className="glass px-6 py-2 rounded-full font-black text-primary gap-2 uppercase tracking-[0.2em] text-[10px]">
          <Zap className="w-4 h-4" /> Billing & Tiers
        </Badge>
        <h1 className="text-5xl md:text-6xl font-headline font-black tracking-tight text-white">Neural Intelligence Plans</h1>
        <p className="text-slate-400 text-xl max-w-2xl mx-auto font-medium">Calibrate Aria's reasoning depth to your career ambitions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {displayPlans.map((plan: any, i) => (
          <Card key={i} className={`glass-card border-none shadow-2xl overflow-hidden relative group hover:scale-[1.03] transition-all duration-500 ${plan.id === 'pro' || plan.popular ? 'ring-2 ring-primary/50' : ''}`}>
            { (plan.id === 'pro' || plan.popular) && (
              <div className="absolute top-0 right-0 bg-primary text-white px-8 py-2.5 rounded-bl-[2rem] font-black text-[10px] uppercase tracking-widest z-10 shadow-xl">
                Most Popular
              </div>
            )}
            <CardHeader className="p-10 bg-white/5 border-b border-white/5">
              <div className="w-14 h-14 glass bg-white/10 rounded-2xl shadow-inner flex items-center justify-center mb-6 text-primary">
                {plan.icon ? <plan.icon className="w-7 h-7" /> : <Star className="w-7 h-7" />}
              </div>
              <CardTitle className="font-headline text-3xl font-black">{plan.name}</CardTitle>
              <CardDescription className="text-slate-400 text-lg font-medium">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white">₹{plan.priceMonthly || plan.price || 0}</span>
                <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">/ month</span>
              </div>
              <ul className="space-y-5">
                {(plan.features || []).map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-4 text-slate-300 font-medium text-sm">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary shadow-inner">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-10 bg-white/5">
              <Button 
                className={`w-full h-16 rounded-2xl font-black text-lg transition-all ${currentPlanId === plan.id ? 'bg-white/10 text-slate-500 cursor-default pointer-events-none' : 'shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95'}`}
                disabled={currentPlanId === plan.id}
                onClick={() => handlePlanSelect(plan)}
              >
                {currentPlanId === plan.id ? "CURRENT CALIBRATION" : "UPGRADE Master"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="space-y-8 mt-16">
        <div className="flex items-center gap-4 px-2">
          <div className="w-12 h-12 glass bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-headline font-black text-white">Transaction Logs</h2>
            <p className="text-slate-500 font-medium">Your historical neural access investments.</p>
          </div>
        </div>

        <Card className="glass-card overflow-hidden border-none shadow-2xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-white/5 border-b border-white/5">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="font-black uppercase tracking-widest text-[10px] h-16 pl-10 text-slate-500">Transaction ID</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] h-16 text-slate-500">Plan / Service</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] h-16 text-slate-500 text-center">Amount</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] h-16 text-slate-500 text-center">Status</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] h-16 pr-10 text-slate-500 text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-slate-500 font-black uppercase tracking-widest text-xs">
                      <Loader2 className="animate-spin w-6 h-6 mx-auto mb-4" /> Syncing Neural Ledger...
                    </TableCell>
                  </TableRow>
                ) : transactions && transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-white/5 transition-colors border-white/5">
                      <TableCell className="pl-10 py-8">
                        <p className="font-mono text-xs font-bold text-primary">{tx.paymentGatewayReference || 'N/A'}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-black text-white text-sm">{tx.description || 'Neural Upgrade'}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 font-black text-lg text-white">
                          <IndianRupee className="w-3 h-3 text-slate-500" />
                          {tx.amount}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="rounded-lg px-4 py-1.5 border-green-500/30 bg-green-500/10 text-green-400 font-black text-[10px] uppercase tracking-widest">
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-10 text-right">
                        <div className="flex items-center justify-end gap-3 text-slate-500 font-bold text-xs uppercase tracking-widest">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-4 text-slate-700">
                        <History className="w-12 h-12 opacity-20" />
                        <p className="font-black uppercase tracking-widest text-[10px]">No transaction data found in the grid.</p>
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
        <DialogContent className="max-w-md glass-dark border-white/10 rounded-[3rem] p-10 shadow-2xl">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 glass bg-primary/20 rounded-2xl flex items-center justify-center text-primary mx-auto shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <DialogTitle className="text-3xl font-headline font-black text-center text-white">Secure Neural Link</DialogTitle>
            <DialogDescription className="text-center text-slate-400 font-medium">
              Complete your calibration to the <span className="font-black text-primary uppercase">{selectedPlan?.name}</span> plan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 space-y-8">
            <div className="p-8 glass bg-white/5 rounded-3xl border border-dashed border-white/10 space-y-6 shadow-inner">
              <div className="flex justify-between items-center">
                <span className="font-black text-[10px] uppercase tracking-widest text-slate-500">Subscription Tier</span>
                <span className="font-black text-white">{selectedPlan?.name} Access</span>
              </div>
              <div className="h-px bg-white/5 w-full" />
              <div className="flex justify-between items-center text-primary font-black text-2xl">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Total Due Today</span>
                <div className="flex items-center gap-1">
                  <IndianRupee className="w-4 h-4" />
                  {selectedPlan?.price || selectedPlan?.priceMonthly}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-blue-500/5 p-5 rounded-2xl border border-blue-500/10">
                <Lock className="w-5 h-5 text-blue-400 shrink-0" />
                <span>Simulated Secure Gateway Active. Performance audit funding initialized.</span>
              </div>
              <Button className="w-full h-20 rounded-[1.5rem] text-xl font-black shadow-[0_20px_50px_rgba(var(--primary),0.3)] hover:scale-[1.02] transition-all" onClick={handleCheckout} disabled={processing}>
                {processing ? <Loader2 className="animate-spin w-8 h-8" /> : (
                  <>
                    CONFIRM & CALIBRATE
                    <CreditCard className="ml-3 w-6 h-6" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
