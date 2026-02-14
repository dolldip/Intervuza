"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldAlert, ArrowLeft, Home } from "lucide-react"

export default function NotAuthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        <div className="w-24 h-24 bg-red-100 text-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-tight">Access Denied</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Your credentials do not hold the required <span className="text-red-600 font-bold italic">Administrator</span> privileges for this neural sector.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" asChild className="flex-1 h-14 rounded-2xl font-bold">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 w-4 h-4" />
              BACK TO DASHBOARD
            </Link>
          </Button>
          <Button asChild className="flex-1 h-14 rounded-2xl font-bold shadow-lg shadow-primary/20">
            <Link href="/">
              <Home className="mr-2 w-4 h-4" />
              SYSTEM HOME
            </Link>
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Security Audit: Logged and Monitored</p>
      </div>
    </div>
  )
}