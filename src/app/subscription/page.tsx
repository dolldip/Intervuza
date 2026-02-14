"use client"

import { useState } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, addDoc } from "firebase/firestore"
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
  Lock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  
  const plansQuery = useMemoFirebase(() => {
    if (!db) return null
    return collection(db, "subscriptionPlans")
  }, [db])
  const { data: plans, isLoading: plansLoading } = useCollection(plansQuery)

  const currentPlan = activeSubs?.[0]

  const defaultPlans = [
    { id: "free", name: "Free", description: "Standard mock interviews for everyone.", price: 0, features: ["5 Interviews / mo", "Basic Feedback", "Aria Lite Logic"], icon: Star },
    { id: "pro", name: "Pro", description: "Deep technical analysis and biometrics.", price: 29, features: ["Unlimited Interviews", "High-Stakes Biometrics", "Aria Elite Logic", "Coding Task Access"], icon: Crown, popular: true },
    { id: "enterprise", name: "Enterprise", description: "Custom logic for high-tier recruitment.", price: 99, features: ["Custom Roles", "Recruiter Dashboard", "Team Analytics", "Priority AI"], icon: ShieldCheck },
  ]

  const displayPlans = plans?.length ? plans : defaultPlans

  const handlePlanSelect = (plan: any) => {
    if (plan.id === "free" && !currentPlan) {
      toast({ title: "Free Plan Active", description: "You are already using the standard tier." });
      return;
    }
    if (currentPlan?.planId === plan.id) return;
    
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
  }

  const handleCheckout = async () => {
    if (!user || !db || !selectedPlan) return;
    
    setProcessing(true);
    try {
      await addDoc(collection(db, "users", user.uid, "paymentTransactions"), {
        userId: user.uid,
        amount: selectedPlan.price || selectedPlan.priceMonthly,
        currency: "USD",
        transactionDate: new Date().toISOString(),
        status: "succeeded",
        paymentGatewayReference: `sim_${Math.random().toString(36).substring(7)}`,
        description: `${selectedPlan.name} Subscription Payment`,
        createdAt: new Date().toISOString()
      });

      await addDoc(collection(db, "users", user.uid, "userSubscriptions"), {
        userId: user.uid,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        startDate: new Date().toISOString(),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
    <div className="p-6 lg:p-10 space-y-10 animate-fade-in max-w-7xl mx-auto">
      <div className="text-center space-y-4">
        <Badge variant="secondary" className="px-4 py-1.5 rounded-full font-bold text-primary">
          <Zap className="mr-2 w-3 h-3" /> Billing & Tiers
        </Badge>
        <h1 className="text-5xl font-headline font-bold tracking-tight">Manage Your Intelligence Plan</h1>
        <p className="text-muted-foreground text-xl max-w-2xl mx-auto">Select the tier that matches your career ambitions. Aria's logic scales with your choice.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {displayPlans.map((plan: any, i) => (
          <Card key={i} className={`rounded-[2.5rem] border-none shadow-xl overflow-hidden relative group hover:scale-[1.02] transition-transform ${plan.name === 'Pro' || plan.popular ? 'ring-2 ring-primary' : ''}`}>
            { (plan.name === 'Pro' || plan.popular) && (
              <div className="absolute top-0 right-0 bg-primary text-white px-6 py-2 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest z-10">
                Most Popular
              </div>
            )}
            <CardHeader className="p-8 bg-muted/20">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-primary">
                {plan.icon ? <plan.icon className="w-6 h-6" /> : <Star className="w-6 h-6" />}
              </div>
              <CardTitle className="font-headline text-3xl">{plan.name}</CardTitle>
              <CardDescription className="text-base">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8 bg-white">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black">${plan.priceMonthly || plan.price || 0}</span>
                <span className="text-muted-foreground font-bold">/mo</span>
              </div>
              <ul className="space-y-4">
                {(plan.features || []).map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-3 text-sm font-medium">
                    <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Check className="w-3 h-3" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-8 bg-muted/5">
              <Button 
                className={`w-full h-14 rounded-2xl font-black text-lg ${currentPlan?.planId === plan.id || (plan.name === 'Free' && !currentPlan) ? 'bg-muted text-muted-foreground cursor-default' : 'shadow-lg shadow-primary/20'}`}
                disabled={currentPlan?.planId === plan.id || (plan.name === 'Free' && !currentPlan)}
                onClick={() => handlePlanSelect(plan)}
              >
                {currentPlan?.planId === plan.id || (plan.name === 'Free' && !currentPlan) ? "CURRENT PLAN" : "UPGRADE NOW"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline">Secure Checkout</DialogTitle>
            <DialogDescription>
              Complete your upgrade to the <span className="font-bold text-primary">{selectedPlan?.name}</span> plan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="p-6 bg-muted/20 rounded-2xl border border-dashed border-primary/20 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">{selectedPlan?.name} Subscription</span>
                <span className="font-black text-xl">${selectedPlan?.price || selectedPlan?.priceMonthly}/mo</span>
              </div>
              <div className="h-px bg-border w-full" />
              <div className="flex justify-between items-center text-primary font-black">
                <span>Total Due Today</span>
                <span>${selectedPlan?.price || selectedPlan?.priceMonthly}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs text-muted-foreground bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>Secure 256-bit encrypted transaction. This is a payment simulation.</span>
              </div>
              <Button className="w-full h-16 rounded-2xl text-xl font-black shadow-xl" onClick={handleCheckout} disabled={processing}>
                {processing ? <Loader2 className="animate-spin" /> : (
                  <>
                    PAY & ACTIVATE
                    <CreditCard className="ml-2 w-5 h-5" />
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
