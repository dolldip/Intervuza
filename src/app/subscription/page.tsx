
"use client"

import { useMemo } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, Zap, ShieldCheck, Crown, Star } from "lucide-react"

export default function SubscriptionPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()

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

  if (isUserLoading || subLoading || plansLoading) {
    return (
      <div className="flex h-full items-center justify-center p-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  const defaultPlans = [
    { name: "Free", description: "Standard mock interviews for everyone.", price: 0, features: ["5 Interviews / mo", "Basic Feedback", "SARAH Lite Logic"], icon: Star },
    { name: "Pro", description: "Deep technical analysis and biometrics.", price: 29, features: ["Unlimited Interviews", "High-Stakes Biometrics", "SARAH Elite Logic", "Coding Task Access"], icon: Crown, popular: true },
    { name: "Enterprise", description: "Custom logic for high-tier recruitment.", price: 99, features: ["Custom Roles", "Recruiter Dashboard", "Team Analytics", "Priority AI"], icon: ShieldCheck },
  ]

  const displayPlans = plans?.length ? plans : defaultPlans

  return (
    <div className="p-6 lg:p-10 space-y-10 animate-fade-in max-w-7xl mx-auto">
      <div className="text-center space-y-4">
        <Badge variant="secondary" className="px-4 py-1.5 rounded-full font-bold text-primary">
          <Zap className="mr-2 w-3 h-3" /> Billing & Tiers
        </Badge>
        <h1 className="text-5xl font-headline font-bold tracking-tight">Manage Your Intelligence Plan</h1>
        <p className="text-muted-foreground text-xl max-w-2xl mx-auto">Select the tier that matches your career ambitions. Sarah's logic scales with your choice.</p>
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
                <span className="text-5xl font-black">${plan.priceMonthly || plan.price}</span>
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
              >
                {currentPlan?.planId === plan.id || (plan.name === 'Free' && !currentPlan) ? "CURRENT PLAN" : "UPGRADE NOW"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {currentPlan && (
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-950 text-white p-10 overflow-hidden relative">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Active Subscription</p>
              <h3 className="text-3xl font-headline font-bold">You are on the {currentPlan.planName || "Pro"} Tier</h3>
              <p className="text-slate-400">Next payment due on {new Date(currentPlan.nextPaymentDate).toLocaleDateString()}</p>
            </div>
            <Button variant="outline" className="h-14 rounded-2xl px-10 font-bold border-white/10 hover:bg-white/10 hover:text-white">
              Manage Billing
            </Button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        </Card>
      )}
    </div>
  )
}
