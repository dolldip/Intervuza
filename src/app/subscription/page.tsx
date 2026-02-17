"use client"

import { Badge } from "@/components/ui/badge"
import { Sparkles, Star, Zap } from "lucide-react"

export default function SubscriptionPage() {
  return (
    <div className="p-6 lg:p-12 space-y-16 animate-fade-in max-w-7xl mx-auto pb-32">
      <div className="text-center space-y-6">
        <Badge variant="secondary" className="glass px-8 py-2.5 rounded-full font-black text-primary gap-2 uppercase tracking-[0.3em] text-[10px]">
          <Sparkles className="w-4 h-4" /> Feature Grid
        </Badge>
        <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tight text-white leading-tight">All Features <br /> Unlocked</h1>
        <p className="text-slate-400 text-xl max-w-2xl mx-auto font-medium">During our beta phase, all elite logic engines and biometric sensors are available for all candidates.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
        <div className="glass-card p-12 text-center space-y-6 border-primary/20 bg-primary/5">
          <div className="w-16 h-16 glass bg-primary/15 rounded-[2rem] flex items-center justify-center text-primary mx-auto">
            <Zap className="w-8 h-8" />
          </div>
          <h3 className="text-3xl font-black">Beta Access</h3>
          <p className="text-slate-400">Full access to technical logic mastery, behavioral depth audits, and real-time biometric tracking is enabled.</p>
        </div>
        <div className="glass-card p-12 text-center space-y-6 opacity-60">
          <div className="w-16 h-16 glass bg-white/10 rounded-[2rem] flex items-center justify-center text-slate-500 mx-auto">
            <Star className="w-8 h-8" />
          </div>
          <h3 className="text-3xl font-black">Future Elite</h3>
          <p className="text-slate-400">Enterprise-grade role customization and advanced team analytics are currently in neural development.</p>
        </div>
      </div>
    </div>
  )
}